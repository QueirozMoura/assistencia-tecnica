import prisma from "../config/prisma.js";
import { createMercadoPagoPreference } from "./pagamento.service.js";

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
    data: pedidos,
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

  return pedido;
}

export async function criarPedido(dados) {
  const {
    clienteId,
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
  } = dados;

  if (!Array.isArray(itens) || itens.length === 0) {
    throw Object.assign(new Error("Carrinho vazio."), { statusCode: 400 });
  }

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

    if (produto.estoque < item.quantidade) {
      throw Object.assign(
        new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}.`),
        { statusCode: 400 }
      );
    }

    const precoUnitario = Number(produto.precoPromocional || produto.preco);
    valorTotal += precoUnitario * item.quantidade;

    return {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario,
    };
  });

  // Criar pedido e atualizar estoque em transação
  const pedido = await prisma.$transaction(async (tx) => {
    const novoPedido = await tx.pedido.create({
      data: {
        clienteId,
        valorTotal,
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

    // Decrementar estoque
    for (const item of itensComPreco) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoque: { decrement: item.quantidade } },
      });
    }

    return novoPedido;
  });

  return pedido;
}

export async function criarPedidoComPagamento(dados) {
  const {
    clienteId,
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
  } = dados;

  if (!Array.isArray(itens) || itens.length === 0) {
    throw Object.assign(new Error("Carrinho vazio."), { statusCode: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  const produtoIds = itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
  });

  if (produtos.length !== produtoIds.length) {
    throw Object.assign(new Error("Produto inexistente no carrinho."), { statusCode: 400 });
  }

  let valorTotal = 0;
  const itensComPreco = itens.map((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);

    if (!produto.ativo) {
      throw Object.assign(new Error(`Produto inativo: "${produto.nome}".`), { statusCode: 400 });
    }

    if (produto.estoque < item.quantidade) {
      throw Object.assign(
        new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}.`),
        { statusCode: 400 }
      );
    }

    const precoUnitario = Number(produto.precoPromocional || produto.preco);
    valorTotal += precoUnitario * item.quantidade;

    return {
      produtoId: item.produtoId,
      nome: produto.nome,
      quantidade: item.quantidade,
      precoUnitario,
    };
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const pedidoInicial = await tx.pedido.create({
      data: {
        clienteId,
        valorTotal,
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

    const preferencia = await createMercadoPagoPreference({
      pedido: pedidoInicial,
      itens: itensComPreco,
      payer: cliente,
    });

    const pedidoAtualizado = await tx.pedido.update({
      where: { id: pedidoInicial.id },
      data: {
        preferenceId: preferencia.preferenceId,
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

    return {
      pedido: pedidoAtualizado,
      preference_id: preferencia.preferenceId,
      init_point: preferencia.initPoint,
      sandbox_init_point: preferencia.sandboxInitPoint,
    };
  });

  return resultado;
}

export async function listarMeusPedidos(clienteId) {
  return prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      valorTotal: true,
      paymentStatus: true,
    },
  });
}

export async function atualizarStatusPedido(id, status) {
  await buscarPedidoPorId(id);

  // Se cancelado, devolver estoque
  if (status === "CANCELADO") {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.pedido.update({ where: { id }, data: { status } });

      for (const item of pedido.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        });
      }
    });

    return prisma.pedido.findUnique({ where: { id } });
  }

  return prisma.pedido.update({ where: { id }, data: { status } });
}

export async function deletarPedido(id) {
  await buscarPedidoPorId(id);
  return prisma.pedido.delete({ where: { id } });
}
