import { createHash } from 'node:crypto';
import { createCheckoutAccessToken } from './checkoutAccessToken.service.js';
import { toPedidoCheckoutDto } from '../dtos/pedido.dto.js';

export function creationIdentity(dados, payment) {
  const key = dados.creationKey;
  if (key == null) return null; // Existing API consumers remain compatible; opt in with a stable intent key.
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) {
    throw Object.assign(new Error('Chave de criação inválida.'), { statusCode: 400 });
  }
  const fields = ['observacoes', 'nomeDestinatario', 'telefoneEntrega', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado'];
  const intent = Object.fromEntries(fields.map(field => [field, dados[field] ?? null]));
  intent.payment = payment;
  intent.itens = dados.itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })).sort((a, b) => a.produtoId - b.produtoId);
  return { key, hash: createHash('sha256').update(JSON.stringify(intent)).digest('hex') };
}
export function creationFields(identity) {
  return identity ? { creationKey: identity.key, creationHash: identity.hash } : {};
}
export async function findCreation(tx, clienteId, identity) {
  if (!identity) return null;
  const order = await tx.pedido.findFirst({ where: { clienteId, creationKey: identity.key }, include: { cliente: { select: { id: true, nome: true, email: true } }, itens: { include: { produto: { select: { id: true, nome: true } } } } } });
  if (order && order.creationHash !== identity.hash) {
    throw Object.assign(new Error('Chave já utilizada para outro pedido.'), { statusCode: 409 });
  }
  return order;
}
export async function lockCreation(tx, clienteId, identity) {
  if (!identity) return;
  // A hash collision only serializes unrelated requests; the unique constraint remains authoritative.
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(${clienteId}::integer, hashtext(${identity.key}::text))`;
}
export async function replayCheckout(tx, previous) {
  await tx.$queryRaw`SELECT id FROM "public".pedidos WHERE id = ${previous.id}::integer FOR UPDATE`;
  const order = await tx.pedido.findUnique({ where: { id: previous.id } });
  if (!order) throw Object.assign(new Error('Pedido não encontrado.'), { statusCode: 404 });
  if (order.status !== 'PENDENTE' || order.paymentStatus !== 'PENDING' || !order.checkoutInitPoint || order.paidAt) {
    throw Object.assign(new Error('Pedido já processado. Consulte seus pedidos antes de iniciar outra compra.'), { statusCode: 409 });
  }
  const access = await createCheckoutAccessToken({ pedidoId: order.id, tx });
  return toPedidoCheckoutDto({ pedido: order, init_point: order.checkoutInitPoint,
    checkoutAccessToken: access.token, checkoutAccessTokenExpiresAt: access.expiresAt });
}
