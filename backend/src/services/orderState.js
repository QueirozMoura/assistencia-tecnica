const transitions = {
  PENDENTE: ["PAGO", "CANCELADO"],
  PAGO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGUE"],
  ENTREGUE: [],
  CANCELADO: [],
};

export function assertOrderTransition(current, next) {
  if (!transitions[current] || !transitions[next] ||
      (current !== next && !transitions[current].includes(next))) {
    throw Object.assign(new Error("Transição de pedido inválida. Pedidos cancelados ou entregues não podem ser reabertos."), { statusCode: 409 });
  }
}

// Confirmed money is never reversed by the order flow: refunds are a manual, audited reconciliation.
export function isPaymentConfirmed(pedido) {
  return pedido.paymentStatus === "PAID" || Boolean(pedido.paidAt);
}

export function assertOrderCancellable(pedido) {
  if (isPaymentConfirmed(pedido)) {
    throw Object.assign(new Error("Pedido com pagamento confirmado não pode ser cancelado automaticamente. Trate como reembolso/conciliação manual."), { statusCode: 409 });
  }
}

export function assertOrderPayable(pedido) {
  if (pedido.status !== "PENDENTE" || pedido.paymentStatus === "PAID" || pedido.paidAt) {
    throw Object.assign(new Error("Este pedido não está disponível para iniciar pagamento."), { statusCode: 409 });
  }
}

export function paymentOrderTransition(pedido, mapped, paymentId = null) {
  if (pedido.status === "CANCELADO") return { ignoredReason: "ORDER_CANCELLED_REQUIRES_RECONCILIATION" };
  // The first payment that confirmed the order is the order's payment. A different approved payment is extra money: it is
  // queued for manual reconciliation and must not overwrite paymentId/paymentMethod/paidAt. Only provider-confirmed orders count
  // (PAID or paidAt) and only when the recorded payment is known; a repeated notification of the SAME payment is not a duplicate.
  if (mapped.paymentStatus === "PAID" && isPaymentConfirmed(pedido) && pedido.paymentId && paymentId && String(pedido.paymentId) !== String(paymentId)) {
    return { ignoredReason: "DUPLICATE_APPROVED_PAYMENT" };
  }
  // An approved payment must not rewind preparation/shipping/delivery.
  const advanced = ["PREPARANDO", "ENVIADO", "ENTREGUE"].includes(pedido.status);
  const paid = pedido.paymentStatus === "PAID" || pedido.paidAt || pedido.status === "PAGO" || advanced;
  if (paid && mapped.paymentStatus !== "PAID") return { ignoredReason: "PAYMENT_STATE_REGRESSION" };
  return { status: advanced ? pedido.status : mapped.pedidoStatus };
}
