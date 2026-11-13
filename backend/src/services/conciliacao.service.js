// Persistent, auditable reconciliation queue for financial facts that the order flow cannot apply.
// It records for a human; it NEVER issues a refund, never changes an order and never touches stock.
// Only identifiers, statuses, amounts and a payload hash are stored (no payer data, no raw payload).
// Raw SQL is schema-qualified like the stock ledger: Prisma qualifies only its own generated queries, never $queryRaw.
import prisma from "../config/prisma.js";

export const TIPOS = Object.freeze({
  PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO: "PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO",
  DIVERGENCIA_VALOR: "DIVERGENCIA_VALOR",
  DIVERGENCIA_PREFERENCIA: "DIVERGENCIA_PREFERENCIA",
  PEDIDO_NAO_ENCONTRADO: "PEDIDO_NAO_ENCONTRADO",
  REFERENCIA_NAO_MAPEAVEL: "REFERENCIA_NAO_MAPEAVEL",
  ESTORNO_OU_CHARGEBACK: "ESTORNO_OU_CHARGEBACK",
  VENDEDOR_OU_AMBIENTE_DIVERGENTE: "VENDEDOR_OU_AMBIENTE_DIVERGENTE",
  // Pedido já pago por um pagamento; outro pagamento aprovado (outro paymentId) chegou para o mesmo pedido.
  PAGAMENTO_DUPLICADO: "PAGAMENTO_DUPLICADO",
});
export const STATUS =Object.freeze(["PENDENTE", "EM_ANALISE", "REEMBOLSADO_MANUALMENTE", "RESOLVIDO_SEM_REEMBOLSO", "FALSO_POSITIVO"]);
export const STATUS_FINAIS = Object.freeze(["REEMBOLSADO_MANUALMENTE", "RESOLVIDO_SEM_REEMBOLSO", "FALSO_POSITIVO"]);
export const VERIFICACOES = Object.freeze(["CONFIRMADO_PELO_PROVEDOR", "NAO_VERIFICADO", "SUSPEITO"]);

// Only a payment read back from the provider API and attributed to the order is "confirmed".
// Every divergence is "not verified": it must NOT be assumed to be money received.
const VERIFICACAO_POR_TIPO = Object.freeze({
  PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO: "CONFIRMADO_PELO_PROVEDOR",
  ESTORNO_OU_CHARGEBACK: "CONFIRMADO_PELO_PROVEDOR",
  PAGAMENTO_DUPLICADO: "CONFIRMADO_PELO_PROVEDOR",
  DIVERGENCIA_VALOR: "NAO_VERIFICADO",
  DIVERGENCIA_PREFERENCIA: "NAO_VERIFICADO",
  PEDIDO_NAO_ENCONTRADO: "NAO_VERIFICADO",
  REFERENCIA_NAO_MAPEAVEL: "NAO_VERIFICADO",
  VENDEDOR_OU_AMBIENTE_DIVERGENTE: "SUSPEITO",
});

const TRANSICOES = Object.freeze({
  PENDENTE: ["EM_ANALISE", ...STATUS_FINAIS],
  EM_ANALISE: [...STATUS_FINAIS],
});

const digits = value => (value != null && /^[0-9]{1,20}$/.test(String(value)) ? String(value) : null);
const text = (value, max) => (value == null || value === "" ? null : String(value).slice(0, max));
const money = value => (value != null && Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : null);

// `paymentId` must come from the provider API response. A payload-declared id is only `paymentIdInformado`.
export function buildIdempotencyKey({ paymentId, notificationId, rawPayloadHash }) {
  const verified = digits(paymentId);
  if (verified) return { chave: `pid:${verified}`, paymentId: verified };
  const notification = text(notificationId, 128);
  if (notification) return { chave: `nid:${notification}`, paymentId: null };
  if (!/^[0-9a-f]{64}$/.test(String(rawPayloadHash))) throw new Error("Hash do payload obrigatório para eventos sem identificador confiável.");
  return { chave: `hash:${rawPayloadHash}`, paymentId: null };
}

export function verificacaoDoTipo(tipo) {
  const verificacao = VERIFICACAO_POR_TIPO[tipo];
  if (!verificacao) throw new Error("Tipo de conciliação inválido.");
  return verificacao;
}

export function isMoneyConfirmed(item) {
  return item?.verificacao === "CONFIRMADO_PELO_PROVEDOR" && String(item?.statusProvedor).toLowerCase() === "approved";
}

export function assertStatusTransition(current, next) {
  if (!(TRANSICOES[current] || []).includes(next)) {
    throw Object.assign(new Error(
      STATUS_FINAIS.includes(current) ? "Pendência já resolvida; o histórico é definitivo." : "Transição de status inválida para esta pendência."), { statusCode: 409 });
  }
}

/**
 * Registers (or counts a repetition of) a pending item INSIDE the caller's transaction, so the queue entry commits
 * or rolls back together with the order/stock decision that produced it. Atomic and idempotent by
 * (provider, paymentId | notificationId | payload hash, tipo): concurrent duplicates serialize on the unique index.
 */
export async function registrarPendencia(tx, dados) {
  const verificacao = verificacaoDoTipo(dados.tipo);
  const provider = "mercadopago";
  const { chave, paymentId } = buildIdempotencyKey(dados);
  const notificationId = text(dados.notificationId, 128);
  const [row] = await tx.$queryRaw`
    INSERT INTO "public".pagamento_conciliacoes (provider, "chaveIdempotencia", tipo, verificacao, status, "pedidoId", "paymentId",
      "paymentIdInformado", "notificationId", "rawPayloadHash", "referenciaExterna", "statusProvedor", "statusPedido",
      "valorProvedor", "valorPedido", "preferenciaProvedor", "preferenciaPedido", ocorrencias, "primeiraVezEm", "ultimaVezEm", "updatedAt")
    VALUES (${provider}::text, ${chave}::text, ${dados.tipo}::text, ${verificacao}::text, 'PENDENTE', ${dados.pedidoId ?? null}::integer,
      ${paymentId}::text, ${digits(dados.paymentIdInformado)}::text, ${notificationId}::text, ${dados.rawPayloadHash}::text,
      ${text(dados.referenciaExterna, 128)}::text, ${text(dados.statusProvedor, 40)}::text, ${text(dados.statusPedido, 40)}::text,
      ${money(dados.valorProvedor)}::numeric, ${money(dados.valorPedido)}::numeric, ${text(dados.preferenciaProvedor, 128)}::text,
      ${text(dados.preferenciaPedido, 128)}::text, 1, now(), now(), now())
    ON CONFLICT (provider, "chaveIdempotencia", tipo) DO UPDATE
      SET ocorrencias = pagamento_conciliacoes.ocorrencias + 1, "ultimaVezEm" = now(), "updatedAt" = now()
    RETURNING id, status, (xmax = 0) AS inserted`;
  await tx.pagamentoConciliacaoHistorico.create({ data: {
    conciliacaoId: row.id, acao: row.inserted ? "REGISTRADA" : "REOCORRENCIA", statusNovo: row.status, notificationId,
  } });
  return { id: row.id, status: row.status, inserted: row.inserted, tipo: dados.tipo, verificacao };
}

export const registrarPendenciaIsolada = dados => prisma.$transaction(tx => registrarPendencia(tx, dados));

const PUBLIC_SELECT = {
  id: true, tipo: true, verificacao: true, status: true, pedidoId: true, paymentId: true, paymentIdInformado: true, notificationId: true,
  referenciaExterna: true, statusProvedor: true, statusPedido: true, valorProvedor: true, valorPedido: true, preferenciaProvedor: true,
  preferenciaPedido: true, ocorrencias: true, primeiraVezEm: true, ultimaVezEm: true, resolvidoEm: true, observacao: true,
  resolvidoPor: { select: { id: true, nome: true } },
};
const toDto = row => row && ({
  ...row,
  valorProvedor: row.valorProvedor == null ? null : Number(row.valorProvedor),
  valorPedido: row.valorPedido == null ? null : Number(row.valorPedido),
  dinheiroConfirmadoPeloProvedor: isMoneyConfirmed(row),
});

export async function listarPendencias(query = {}) {
  const { page = 1, limit = 20, status, tipo, verificacao, pedidoId } = query;
  const where = { ...(status && { status }), ...(tipo && { tipo }), ...(verificacao && { verificacao }), ...(pedidoId && { pedidoId }) };
  const [total, rows] = await Promise.all([
    prisma.pagamentoConciliacao.count({ where }),
    prisma.pagamentoConciliacao.findMany({ where, select: PUBLIC_SELECT, orderBy: [{ ultimaVezEm: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: rows.map(toDto), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function resumoPendencias() {
  const grouped = await prisma.pagamentoConciliacao.groupBy({ by: ["status", "verificacao"], _count: { _all: true } });
  const porStatus = Object.fromEntries(STATUS.map(status => [status, 0]));
  let abertasConfirmadas = 0;
  for (const row of grouped) {
    porStatus[row.status] += row._count._all;
    if (!STATUS_FINAIS.includes(row.status) && row.verificacao === "CONFIRMADO_PELO_PROVEDOR") abertasConfirmadas += row._count._all;
  }
  return { porStatus, abertas: porStatus.PENDENTE + porStatus.EM_ANALISE, abertasConfirmadasPeloProvedor: abertasConfirmadas };
}

export async function buscarPendencia(id, client = prisma) {
  const row = await client.pagamentoConciliacao.findUnique({ where: { id }, select: {
    ...PUBLIC_SELECT,
    historico: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: {
      id: true, acao: true, statusAnterior: true, statusNovo: true, observacao: true, notificationId: true, createdAt: true, usuario: { select: { id: true, nome: true } } } },
  } });
  if (!row) throw Object.assign(new Error("Pendência de conciliação não encontrada."), { statusCode: 404 });
  return toDto(row);
}

/** Manual status change. Compare-and-swap on the observed status plus an immutable history row, in one transaction. */
export async function atualizarStatusPendencia(id, { status, observacao }, usuarioId) {
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) throw Object.assign(new Error("Responsável obrigatório."), { statusCode: 401 });
  await prisma.$transaction(async tx => {
    const atual = await tx.pagamentoConciliacao.findUnique({ where: { id }, select: { id: true, status: true, observacao: true } });
    if (!atual) throw Object.assign(new Error("Pendência de conciliação não encontrada."), { statusCode: 404 });
    assertStatusTransition(atual.status, status);
    const final = STATUS_FINAIS.includes(status);
    const nota = observacao?.trim() || null;
    const changed = await tx.pagamentoConciliacao.updateMany({
      where: { id, status: atual.status },
      data: { status, observacao: nota ?? atual.observacao, updatedAt: new Date(), ...(final ? { resolvidoEm: new Date(), resolvidoPorId: usuarioId } : {}) },
    });
    if (changed.count !== 1) throw Object.assign(new Error("Pendência alterada por outra solicitação. Atualize e tente novamente."), { statusCode: 409 });
    await tx.pagamentoConciliacaoHistorico.create({ data: { conciliacaoId: id, acao: "STATUS_ALTERADO", statusAnterior: atual.status, statusNovo: status, usuarioId, observacao: nota } });
  });
  return buscarPendencia(id);
}
