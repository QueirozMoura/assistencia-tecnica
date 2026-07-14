import logger from "../config/logger.js";
import { sendAdminPaymentApprovedEmail } from "./email.service.js";

/**
 * Camada intermediária de notificação.
 * Mantém o webhook desacoplado do provedor de e-mail e facilita evolução futura.
 */
export async function notifyAdminPaymentApproved({ pedido, payment }) {
  if (!pedido || !pedido.id) {
    logger.warn("Notificação de pagamento aprovada ignorada: pedido inválido.");
    return { notified: false, reason: "INVALID_PEDIDO" };
  }

  try {
    const result = await sendAdminPaymentApprovedEmail({ pedido, payment });

    logger.info("Notificação de pagamento aprovado processada.", {
      pedidoId: pedido.id,
      sent: Boolean(result?.sent),
      skipped: Boolean(result?.skipped),
      reason: result?.reason || null,
    });

    return { notified: true, result };
  } catch (error) {
    logger.error("Falha ao notificar administrador sobre pagamento aprovado.", {
      pedidoId: pedido.id,
      message: error?.message || "UNKNOWN_ERROR",
    });

    return { notified: false, reason: "NOTIFICATION_ERROR" };
  }
}
