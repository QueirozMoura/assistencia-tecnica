import prisma from "../config/prisma.js";
import {
  calcularFrete,
  buscarFaixaCoberta,
  normalizarCep,
  normalizarTexto,
  reaisParaCentavos,
  LIMITE_FRETE_GRATIS_CENTAVOS,
  MOTIVO_CEP_INVALIDO,
  MOTIVO_SUBTOTAL_INVALIDO,
  MOTIVO_ENTREGA_INDISPONIVEL,
} from "./frete.service.js";
import { FAIXAS_CEP_ATENDIDAS } from "../config/freteCobertura.js";

/** Regra de preço única (usada na cotação e na criação do pedido): promocional, se houver, senão o preço normal. */
export function precoUnitarioDoProduto(produto) {
  return Number(produto.precoPromocional || produto.preco);
}

function municipiosAtendidos() {
  return [...new Set(FAIXAS_CEP_ATENDIDAS.map((f) => f.municipio).filter(Boolean))];
}

const MENSAGENS_FRETE = {
  [MOTIVO_CEP_INVALIDO]: "CEP inválido. Use o formato 00000-000.",
  [MOTIVO_SUBTOTAL_INVALIDO]: "Não foi possível calcular o subtotal do pedido.",
  [MOTIVO_ENTREGA_INDISPONIVEL]: () =>
    `Entrega indisponível para o CEP informado. Atendemos: ${municipiosAtendidos().join(", ")}.`,
};

export function mensagemFrete(motivo) {
  const mensagem = MENSAGENS_FRETE[motivo];
  return typeof mensagem === "function" ? mensagem() : mensagem || "Não foi possível calcular o frete.";
}

const NOMES_ESTADO = { SP: ["sp", "sao paulo"] };

/**
 * Confere se cidade e estado informados correspondem ao município do CEP, segundo a cobertura configurada
 * no backend (nunca uma consulta externa). Lança 400 quando o CEP não é atendido ou há divergência, para
 * que um CEP coberto não seja usado para entregar em endereço de outro município.
 * @returns {{ cidade: string, uf: string }} município canônico do CEP
 */
export function validarEnderecoDeEntrega({ cep, cidade, estado }) {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) {
    throw Object.assign(new Error(mensagemFrete(MOTIVO_CEP_INVALIDO)), { statusCode: 400, code: MOTIVO_CEP_INVALIDO });
  }
  const faixa = buscarFaixaCoberta(cepNormalizado);
  if (!faixa) {
    throw Object.assign(new Error(mensagemFrete(MOTIVO_ENTREGA_INDISPONIVEL)), {
      statusCode: 400,
      code: MOTIVO_ENTREGA_INDISPONIVEL,
    });
  }

  const cidadeInformada = normalizarTexto(cidade);
  const estadoInformado = normalizarTexto(estado);
  const nomesCidade = [faixa.cidade, ...(faixa.aliases ?? [])].map(normalizarTexto);
  const nomesEstado = NOMES_ESTADO[faixa.uf] ?? [normalizarTexto(faixa.uf)];

  if (!cidadeInformada || !estadoInformado || !nomesCidade.includes(cidadeInformada) || !nomesEstado.includes(estadoInformado)) {
    throw Object.assign(
      new Error(
        `Cidade ou estado não correspondem ao CEP informado. O CEP ${cepNormalizado.slice(0, 5)}-${cepNormalizado.slice(5)} pertence a ${faixa.cidade}/${faixa.uf}.`,
      ),
      { statusCode: 400, code: "ENDERECO_DIVERGENTE" },
    );
  }

  return { cidade: faixa.cidade, uf: faixa.uf };
}

/**
 * Calcula o frete a partir do CEP e do subtotal (em reais) e lança erro 400 quando a entrega não é possível.
 * Retorna o resultado de calcularFrete (ok) e os valores em reais já somados em centavos.
 */
export function exigirFrete({ cep, subtotal }) {
  const frete = calcularFrete({ cep, subtotal });
  if (!frete.ok) {
    throw Object.assign(new Error(mensagemFrete(frete.motivo)), { statusCode: 400, code: frete.motivo });
  }
  const subtotalCentavos = reaisParaCentavos(subtotal);
  const totalCentavos = subtotalCentavos + frete.valorCentavos;
  return {
    frete,
    valorFrete: frete.valor,
    valorTotal: totalCentavos / 100,
    subtotalCentavos,
    totalCentavos,
  };
}

/**
 * Cotação de frete para o carrinho: consulta os preços atuais no banco (nunca usa preços do cliente).
 * `itens`: [{ produtoId, quantidade }]. Retorna sempre valores em reais.
 */
export async function cotarFrete({ cep, itens }, db = prisma) {
  const ids = [...new Set(itens.map((i) => i.produtoId))];
  const produtos = await db.produto.findMany({ where: { id: { in: ids } } });

  // Endpoint público: mensagem única e genérica para produto inexistente, inativo ou sem estoque,
  // sem revelar nomes de produtos inativos nem quantidades exatas de estoque.
  const indisponivel = () =>
    Object.assign(new Error("Um ou mais produtos do carrinho estão indisponíveis. Revise o carrinho."), {
      statusCode: 400,
      code: "PRODUTO_INDISPONIVEL",
    });

  if (produtos.length !== ids.length) throw indisponivel();

  let subtotalCentavos = 0;
  for (const item of itens) {
    const produto = produtos.find((p) => p.id === item.produtoId);
    if (!produto.ativo || produto.estoque < item.quantidade) throw indisponivel();
    subtotalCentavos += Math.round(precoUnitarioDoProduto(produto) * 100) * item.quantidade;
  }

  const subtotal = subtotalCentavos / 100;
  const base = {
    cep,
    subtotal,
    limiteFreteGratis: LIMITE_FRETE_GRATIS_CENTAVOS / 100,
  };

  const frete = calcularFrete({ cep, subtotal });
  if (!frete.ok) {
    if (frete.motivo === MOTIVO_CEP_INVALIDO) {
      throw Object.assign(new Error(mensagemFrete(frete.motivo)), { statusCode: 400, code: frete.motivo });
    }
    return {
      ...base,
      entregaDisponivel: false,
      motivo: frete.motivo,
      mensagem: mensagemFrete(frete.motivo),
      frete: null,
      total: null,
      freteGratis: false,
      faltaParaFreteGratis: null,
    };
  }

  return {
    ...base,
    cep: frete.cep,
    entregaDisponivel: true,
    municipio: frete.municipio,
    cidade: frete.cidade,
    uf: frete.uf,
    frete: frete.valor,
    total: (subtotalCentavos + frete.valorCentavos) / 100,
    freteGratis: frete.gratis,
    faltaParaFreteGratis: frete.faltaParaGratisCentavos / 100,
  };
}
