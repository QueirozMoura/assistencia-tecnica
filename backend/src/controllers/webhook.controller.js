import * as pagamentoService from "../services/pagamento.service.js";

export async function mercadoPagoWebhook(req, res, next) {
  try {
    const signatureHeader = req.headers["x-signature"] || req.headers["x-signature".toLowerCase()];
    const rawBody = JSON.stringify(req.body ?? {});
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";

    const signatureResult = pagamentoService.validateMercadoPagoWebhookSignature({
      rawBody,
      signatureHeader,
      secret,
    });

    if (!signatureResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Assinatura de webhook inválida.",
        reason: signatureResult.reason,
      });
    }

    const normalized = await pagamentoService.processMercadoPagoWebhook(req.body);

    return res.status(200).json({
      success: true,
      message: "Webhook recebido com sucesso.",
      data: {
        provider: "mercadopago",
        notificationId: normalized.id,
        notificationType: normalized.type,
        action: normalized.action,
      },
    });
  } catch (error) {
    next(error);
  }
}
