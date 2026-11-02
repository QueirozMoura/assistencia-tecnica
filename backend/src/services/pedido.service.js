import { creationIdentity, creationFields, findCreation, lockCreation, replayCheckout } from "./orderCreation.service.js";
import { reserveOrderStock, releaseOrderStock } from "./stockLedger.service.js";
import { assertOrderTransition, assertOrderPayable, assertOrderCancellable } from "./orderState.js";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { createMercadoPagoPreference } from "./pagamento.service.js";
import { createCheckoutAccessToken, validateCheckoutAccessToken } from "./checkoutAccessToken.service.js";
import {
  toPedidoAdminDetailDto,
  toPedidoAdminListDto,
  toPedidoCheckoutDto,
  toPedidoClienteDto,
  toPedidoSucessoDto,
} from "../dtos/pedido.dto.js";

function normalizeClienteId(clienteId) {
  const parsed = Number(clienteId);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw Object.assign(new Error("Cliente não autenticado para este recurso."), { statusCode: 401 });
  }

  return parsed;
}

function validateOrderItems(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw Object.assign(new Error("Carrinho vazio."), { statusCode: 400 });
  }
  const ids = new Set();
  for (const item of itens) {
    if (!Number.isSafeInteger(item?.produtoId) || item.produtoId <= 0 ||
        !Number.isSafeInteger(item?.quantidade) || item.quantidade <= 0 || ids.has(item.produtoId)) {
      throw Object.assign(new Error("Itens do carrinho inválidos ou duplicados."), { statusCode: 400 });
    }
    ids.add(item.produtoId);
  }
}

export async function listarPedidos(query) {
  const { page = 1, limit = 20, status, clienteId } = query;
  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (clienteId) where.clienteId = clienteId;

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, nome: true, email: true, telefone: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true, slug: true, imagemPrincipal: true } },
          },
        },
      },
    }),
  ]);

  return {
    data: pedidos.map(toPedidoAdminListDto),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function buscarPedidoPorId(id) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true, email: true, telefone: true } },
      itens: {
        include: {
          produto: {
            select: { id: true, nome: true, slug: true, imagemPrincipal: true, preco: true },
          },
        },
      },
    },
  });

  if (!pedido) {
    throw Object.assign(new Error("Pedido não encontrado."), { statusCode: 404 });
  }

  return toPedidoAdminDetailDto(pedido);
}

export async function buscarPedidoPorIdDoCliente(id, clienteId) {
  const pedido = await prisma.pedido.findFirst({
    where: {
      id,
      clienteId: normalizeClienteId(clienteId),
    },
    include: {
      cliente: { select: { id: true, nome: true, email: true, telefone: true } },
      itens: {
        include: {
          produto: {
            select: { id: true, nome: true, slug: true, imagemPrincipal: true, preco: true },
          },
        },
      },
    },
  });

  if (!pedido) {
    throw Object.assign(new Error("Pedido não encontrado."), { statusCode: 404 });
  }

  return toPedidoAdminDetailDto(pedido);
}

export async function criarPedido(dados) {
  const {
    itens,
    observacoes,
    nomeDestinatario,
    telefoneEntrega,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    clienteAutenticadoId,
  } = dados;

  const clienteId = normalizeClienteId(clienteAutenticadoId);

  validateOrderItems(itens);
  const identity = creationIdentity(dados, false);
  const previous = await findCreation(prisma, clienteId, identity);
  if (previous) return previous;


  // Verificar cliente
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  // Buscar produtos e calcular total
  const produtoIds = itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, ativo: true },
  });

  if (produtos.length !== produtoIds.length) {
    throw Object.assign(
      new Error("Um ou mais produtos não foram encontrados ou estão inativos."),
      { statusCode: 400 }
    );
  }

  // Verificar estoque e calcular total
  let valorTotal = 0;
  const itensComPreco = itens.map((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);

    if (!identity && produto.estoque < item.quantidade) {
      throw Object.assign(
        new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}.`),
        { statusCode: 400 }
      );
    }

    const precoUnitario = Number(produto.precoPromocional || produto.preco);
    valorTotal = (Math.round(valorTotal * 100) + Math.round(precoUnitario * 100) * item.quantidade) / 100;

    return {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario,
    };
  });

  // Criar pedido e atualizar estoque em transação
  const pedido = await prisma.$transaction(async (tx) => {
    await lockCreation(tx, clienteId, identity);
    const previous = await findCreation(tx, clienteId, identity);
    if (previous) return previous;
    const novoPedido = await tx.pedido.create({
      data: {
        clienteId,
        valorTotal,
        stockLedgerVersion: 1,
        ...creationFields(identity),
        observacoes,
        nomeDestinatario,
        telefoneEntrega,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        itens: { create: itensComPreco },
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
          },
        },
      },
    });

    await reserveOrderStock(tx, novoPedido.id);

    return novoPedido;
  });

  return pedido;
}

export async function criarPedidoComPagamento(dados) {
  const {
    itens,
    observacoes,
    nomeDestinatario,
    telefoneEntrega,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    clienteAutenticadoId,
  } = dados;

  const clienteId = normalizeClienteId(clienteAutenticadoId);

  validateOrderItems(itens);
  const identity = creationIdentity(dados, true);
  const previous = await findCreation(prisma, clienteId, identity);
  if (previous) return prisma.$transaction(tx => replayCheckout(tx, previous));


  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  const produtoIds = itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
  });

  logger.info("CRIAR PEDIDO COM PAGAMENTO - DADOS INICIAIS", {
    clienteId,
    quantidadeItens: itens.length,
    produtosEncontrados: produtos.length,
  });

  if (produtos.length !== produtoIds.length) {
    throw Object.assign(new Error("Produto inexistente no carrinho."), { statusCode: 400 });
  }

  logger.info("CRIAR PEDIDO COM PAGAMENTO - INICIO VALIDACAO ESTOQUE");

  let valorTotal = 0;
  const itensComPreco = itens.map((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);

    if (!produto.ativo) {
      throw Object.assign(new Error(`Produto inativo: "${produto.nome}".`), { statusCode: 400 });
    }

    if (!identity && produto.estoque < item.quantidade) {
      throw Object.assign(
        new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}.`),
        { statusCode: 400 }
      );
    }

    const precoUnitario = Number(produto.precoPromocional || produto.preco);
    valorTotal = (Math.round(valorTotal * 100) + Math.round(precoUnitario * 100) * item.quantidade) / 100;

    return {
      produtoId: item.produtoId,
      nome: produto.nome,
      quantidade: item.quantidade,
      precoUnitario,
    };
  });

  logger.info("CRIAR PEDIDO COM PAGAMENTO - FIM VALIDACAO ESTOQUE", {
    valorTotal,
    itensValidados: itensComPreco.length,
  });

  const resultado = await prisma.$transaction(async (tx) => {
    await lockCreation(tx, clienteId, identity);
    const previous = await findCreation(tx, clienteId, identity);
    if (previous) return { replay: await replayCheckout(tx, previous) };
    let etapaAtual = "INICIO_TRANSACAO";

    try {
      // OBS: chamada externa (Mercado Pago) dentro de transação pode ampliar tempo de lock/rollback.
      // Mantido por compatibilidade do fluxo atual; recomendação futura: criar preferência fora da transação
      // e usar estado intermediário + compensação para falhas externas.
      etapaAtual = "CRIACAO_PEDIDO";
      logger.info("CRIAR PEDIDO COM PAGAMENTO - ANTES CRIAR PEDIDO", { clienteId, valorTotal });

      const pedidoInicial = await tx.pedido.create({
      data: {
        clienteId,
        valorTotal,
        stockLedgerVersion: 1,
        ...creationFields(identity),
        observacoes,
        nomeDestinatario,
        telefoneEntrega,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        status: "PENDENTE",
        paymentStatus: "PENDING",
        itens: {
          create: itensComPreco.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          })),
        },
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
          },
        },
      },
    });

      logger.info("CRIAR PEDIDO COM PAGAMENTO - DEPOIS CRIAR PEDIDO", {
        pedidoId: pedidoInicial.id,
      });

      await reserveOrderStock(tx, pedidoInicial.id, true);

      etapaAtual = "MERCADO_PAGO_PREFERENCE";
      logger.info("ANTES MERCADO PAGO", {
        pedidoId: pedidoInicial.id,
        itensEnviados: itensComPreco.map((item) => ({
          produtoId: item.produtoId,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
        emailCliente: cliente.email,
      });

      const preferencia = await createMercadoPagoPreference({
        pedido: pedidoInicial,
        itens: itensComPreco,
        payer: cliente,
      });

      logger.info("CRIAR PEDIDO COM PAGAMENTO - DEPOIS MERCADO PAGO", {
        pedidoId: pedidoInicial.id,
        preferenceId: preferencia.preferenceId,
      });

      etapaAtual = "ATUALIZAR_PREFERENCE_ID";
      logger.info("CRIAR PEDIDO COM PAGAMENTO - ANTES ATUALIZAR PREFERENCE", {
        pedidoId: pedidoInicial.id,
        preferenceId: preferencia.preferenceId,
      });

      const pedidoAtualizado = await tx.pedido.update({
      where: { id: pedidoInicial.id },
      data: {
        preferenceId: preferencia.preferenceId,
        checkoutInitPoint: preferencia.initPoint,
        externalReference: preferencia.externalReference,
        paymentStatus: "PENDING",
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
          },
        },
      },
    });

      logger.info("CRIAR PEDIDO COM PAGAMENTO - DEPOIS ATUALIZAR PREFERENCE", {
        pedidoId: pedidoAtualizado.id,
      });

      etapaAtual = "CRIAR_CHECKOUT_ACCESS_TOKEN";
      const checkoutAccess = await createCheckoutAccessToken({
        pedidoId: pedidoAtualizado.id,
        tx,
      });

      return {
        pedido: pedidoAtualizado,
        preference_id: preferencia.preferenceId,
        init_point: preferencia.initPoint,
        sandbox_init_point: preferencia.sandboxInitPoint,
        checkoutAccessToken: checkoutAccess.token,
        checkoutAccessTokenExpiresAt: checkoutAccess.expiresAt,
      };
    } catch (error) {
      logger.error("CRIAR PEDIDO COM PAGAMENTO - ERRO NA TRANSACAO", {
        etapa: etapaAtual,
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
      });
      throw error;
    }
  });

  return resultado.replay || toPedidoCheckoutDto(resultado);
}

export async function buscarPedidoSucessoPorToken(token) {
  try {
    const validated = await validateCheckoutAccessToken({ token, consume: false, tx: prisma });

    logger.info("PEDIDO SUCESSO - [4] Resultado retornado pelo Prisma", {
      valid: validated?.valid,
      pedidoId: validated?.pedido?.id,
      tokenRecordId: validated?.tokenRecord?.id,
    });

    if (!validated.valid || !validated.pedido) {
      throw Object.assign(new Error("Não foi possível consultar o pedido."), { statusCode: 404 });
    }

    logger.info("PEDIDO SUCESSO - [5] Antes de montar o DTO", {
      pedidoId: validated.pedido.id,
    });

    const dto = toPedidoSucessoDto(validated.pedido);

    logger.info("PEDIDO SUCESSO - [6] DTO final", {
      pedidoId: dto?.id,
      status: dto?.status,
      paymentStatus: dto?.paymentStatus,
    });

    logger.info("PEDIDO SUCESSO - [7] Antes do res.json()", {
      pedidoId: dto?.id,
    });

    return dto;
  } catch (error) {
    logger.error("PEDIDO SUCESSO - [8] Erro no service", {
      message: error?.message,
      stack: error?.stack,
      statusCode: error?.statusCode,
    });
    throw error;
  }
}

export async function validarAcessoPagamentoPedido({ pedidoId, clienteId = null, checkoutToken = null }) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: { select: { id: true, nome: true, email: true } },
      itens: {
        include: {
          produto: { select: { id: true, nome: true } },
        },
      },
    },
  });

  if (!pedido) {
    throw Object.assign(new Error("Não foi possível iniciar o pagamento."), { statusCode: 404 });
  }

  if (clienteId && pedido.clienteId === clienteId) {
    assertOrderPayable(pedido);
    return { pedido, authorizedBy: "OWNER" };
  }

  if (checkoutToken) {
    const validated = await validateCheckoutAccessToken({ token: checkoutToken, pedidoId, consume: false, tx: prisma });

    if (validated.valid) {
      assertOrderPayable(pedido);
      return { pedido, authorizedBy: "TOKEN" };
    }
  }

  throw Object.assign(new Error("Não autorizado para este pedido."), { statusCode: 403 });
}

export async function listarMeusPedidos(clienteId) {
  const pedidos = await prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      valorTotal: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      paidAt: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          precoUnitario: true,
          produto: {
            select: {
              nome: true,
              imagemPrincipal: true,
              categoria: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return pedidos.map(toPedidoClienteDto);
}

export async function atualizarStatusPedido(id, status) {
  const pedidoAtualizado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({ where: { id }, include: { itens: true } });
    if (!pedido) throw Object.assign(new Error("Pedido não encontrado."), { statusCode: 404 });
    assertOrderTransition(pedido.status, status);
    const cancelling = status === "CANCELADO" && pedido.status !== "CANCELADO";
    if (cancelling) assertOrderCancellable(pedido);

    if (pedido.status !== status) {
      // A cancellation also compares the observed payment state, so a payment confirmed between the
      // read and this write makes the compare fail instead of cancelling a paid order.
      const changed = await tx.pedido.updateMany({
        where: { id, status: pedido.status, ...(cancelling ? { paymentStatus: pedido.paymentStatus } : {}) }, data: { status } });
      if (changed.count !== 1) {
        const latest = await tx.pedido.findUnique({ where: { id } });
        if (cancelling && latest && latest.status !== "CANCELADO") assertOrderCancellable(latest);
        if (latest?.status !== status) {
          throw Object.assign(new Error("Pedido alterado por outra solicitação. Atualize os dados e tente novamente."), { statusCode: 409 });
        }
      } else if (status === "CANCELADO") {
        await releaseOrderStock(tx, id, "ADMIN_CANCELAMENTO");
      }
    }
    return tx.pedido.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true, email: true, telefone: true } },
        itens: { include: { produto: { select: { id: true, nome: true, slug: true, imagemPrincipal: true, preco: true } } } },
      },
    });
  });
  return toPedidoAdminDetailDto(pedidoAtualizado);
}

export async function deletarPedido(id) {
  const pedido = await buscarPedidoPorId(id);
  if (pedido.status !== "CANCELADO") {
    throw Object.assign(new Error("Cancele o pedido antes de solicitar exclusão."), { statusCode: 409 });
  }
  if (await prisma.estoqueMovimento.count({ where: { pedidoId: id } })) {
    throw Object.assign(new Error("Pedido com histórico de estoque deve ser preservado para auditoria."), { statusCode: 409 });
  }
  if (await prisma.pagamentoConciliacao.count({ where: { pedidoId: id } })) {
    throw Object.assign(new Error("Pedido com pendência de conciliação financeira deve ser preservado para auditoria."), { statusCode: 409 });
  }
  return prisma.pedido.delete({ where: { id } });
}
