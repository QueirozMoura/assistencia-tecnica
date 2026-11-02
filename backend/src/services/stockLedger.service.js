// All calls must use the SAME interactive transaction as the order mutation.
// PostgreSQL triggers, not application read/modify/write, apply inventory changes.
function translateStockError(error) {
  const detail = `${error?.message || ''} ${error?.meta?.message || ''}`;
  if (detail.includes('JFQ_STOCK_')) {
    return Object.assign(new Error(detail.includes('JFQ_STOCK_INSUFFICIENT')
      ? 'Estoque insuficiente. Atualize o carrinho.' : 'Movimentação de estoque recusada. O pedido exige revisão.'),
    { statusCode: detail.includes('JFQ_STOCK_INSUFFICIENT') ? 400 : 409, cause: error });
  }
  return error;
}
export async function reserveOrderStock(tx, pedidoId, payment = false) {
  const source = payment ? 'CRIACAO_MERCADO_PAGO' : 'CRIACAO_LEGADO';
  try {
    const [result] = await tx.$queryRaw`SELECT "public".jfq_reserve_order_stock(${pedidoId}::integer, ${source}::text) AS count`;
    return result.count;
  } catch (error) { throw translateStockError(error); }
}
export async function releaseOrderStock(tx, pedidoId, source) {
  try {
    const [result] = await tx.$queryRaw`SELECT "public".jfq_release_order_stock(${pedidoId}::integer, ${source}::text) AS count`;
    return result.count; // Zero is legitimate for ambiguous historical orders; never infer a debit.
  } catch (error) { throw translateStockError(error); }
}
