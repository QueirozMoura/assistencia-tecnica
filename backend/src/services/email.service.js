import logger from "../config/logger.js";
import { Resend } from "resend";
import { sendTelegramMessage } from "./telegram.service.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "noreply@assistencia.com";

const APP = "EletroCenter";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Envia email de verificação de conta.
 */
export async function sendVerificationEmail(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || "https://example.com";
  const url = `${frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;
  const safeNome = escapeHtml(nome);
  const safeApp = escapeHtml(APP);

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${APP} — Verifique seu e-mail`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f7f9ff;border-radius:16px;">
          <h2 style="color:#003366;margin-bottom:8px;">Olá, ${safeNome}!</h2>
          <p style="color:#43474f;line-height:1.6;">
            Obrigado por se cadastrar na <strong>${safeApp}</strong>.<br>
            Clique no botão abaixo para verificar seu e-mail e ativar sua conta.
          </p>
          <a href="${url}" style="display:inline-block;margin:24px 0;background:#0070ea;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;">
            Verificar E-mail
          </a>
          <p style="color:#737780;font-size:12px;">
            Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("RESEND ERROR:", err);

    logger.error("Erro ao enviar email de verificação", {
      message: err?.message,
      name: err?.name,
      statusCode: err?.statusCode,
      response: err?.response,
      cause: err?.cause,
      stack: err?.stack,
    });
    // Não lança — não bloqueia o cadastro
  }
}

/**
 * Envia email de recuperação de senha.
 */
export async function sendPasswordResetEmail(email, nome, token) {
  console.log("Entrou em sendPasswordResetEmail");

  const frontendUrl = process.env.FRONTEND_URL || "https://example.com";
  const url = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const safeNome = escapeHtml(nome);
  const safeApp = escapeHtml(APP);

  try {
    console.log("Enviando email via Resend...");
    const response = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${APP} — Redefinição de senha`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f7f9ff;border-radius:16px;">
          <h2 style="color:#003366;margin-bottom:8px;">Redefinir senha</h2>
          <p style="color:#43474f;line-height:1.6;">
            Olá, ${safeNome}! Recebemos uma solicitação para redefinir a senha da sua conta na <strong>${safeApp}</strong>.
          </p>
          <a href="${url}" style="display:inline-block;margin:24px 0;background:#0070ea;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;">
            Redefinir Senha
          </a>
          <p style="color:#737780;font-size:12px;">
            Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
          </p>
        </div>
      `,
    });
    console.log("Resposta do Resend:", response);
  } catch (err) {
    console.error("RESEND ERROR:", err);

    logger.error("Erro ao enviar email de reset", {
      message: err?.message,
      name: err?.name,
      statusCode: err?.statusCode,
      response: err?.response,
      cause: err?.cause,
      stack: err?.stack,
    });
  }
}

/**
 * Envia e-mail para administrador quando pagamento de pedido for aprovado.
 * Retorna objeto com status para facilitar uso por camadas intermediárias.
 */
export async function sendAdminPaymentApprovedEmail({ pedido, payment }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!adminEmail) {
    logger.warn(
      "ADMIN_NOTIFICATION_EMAIL não configurado. Notificação de pagamento não enviada.",
      {
        pedidoId: pedido?.id ?? null,
      },
    );
    return { skipped: true, reason: "ADMIN_NOTIFICATION_EMAIL_NOT_CONFIGURED" };
  }

  const pedidoId = pedido?.id ?? "-";
  const clienteNome = pedido?.cliente?.nome
    ? escapeHtml(pedido.cliente.nome)
    : "Não informado";
  const valorTotal = Number(pedido?.valorTotal ?? 0);
  const valorTotalFmt = Number.isFinite(valorTotal)
    ? valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Não informado";

  const paymentMethod =
    payment?.payment_method_id || pedido?.paymentMethod || "Não informado";
  const paidAt =
    pedido?.paidAt instanceof Date
      ? pedido.paidAt.toLocaleString("pt-BR")
      : pedido?.paidAt
        ? new Date(pedido.paidAt).toLocaleString("pt-BR")
        : "Não informado";

  const safeApp = escapeHtml(APP);

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `${APP} — Pagamento aprovado (Pedido #${pedidoId})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:28px 22px;background:#f7f9ff;border-radius:16px;">
          <h2 style="color:#003366;margin:0 0 8px 0;">Pagamento aprovado</h2>
          <p style="color:#43474f;line-height:1.6;margin:0 0 16px 0;">
            Um pedido foi confirmado como pago na <strong>${safeApp}</strong>.
          </p>

          <div style="background:#fff;border:1px solid #e3e8f4;border-radius:12px;padding:14px 16px;">
            <p style="margin:0 0 8px 0;color:#222;"><strong>Pedido:</strong> #${pedidoId}</p>
            <p style="margin:0 0 8px 0;color:#222;"><strong>Cliente:</strong> ${clienteNome}</p>
            <p style="margin:0 0 8px 0;color:#222;"><strong>Valor:</strong> ${valorTotalFmt}</p>
            <p style="margin:0 0 8px 0;color:#222;"><strong>Status:</strong> Pago</p>
            <p style="margin:0 0 8px 0;color:#222;"><strong>Método:</strong> ${escapeHtml(paymentMethod)}</p>
            <p style="margin:0;color:#222;"><strong>Pago em:</strong> ${escapeHtml(paidAt)}</p>
          </div>

          <p style="color:#737780;font-size:12px;margin-top:14px;">
            Este e-mail foi enviado automaticamente pelo sistema.
          </p>
        </div>
      `,
    });

    logger.info(
      "E-mail de notificação de pagamento aprovado enviado ao administrador.",
      {
        pedidoId,
      },
    );

    try {
      await sendTelegramMessage(
        `💰 PAGAMENTO APROVADO!\n\n` +
          `🧾 Pedido: #${pedidoId}\n` +
          `👤 Cliente: ${clienteNome}\n` +
          `💵 Valor: ${valorTotalFmt}\n` +
          `💳 Método: ${paymentMethod}\n` +
          `🕒 ${paidAt}`,
      );
    } catch (telegramError) {
      logger.error("Erro ao enviar notificação Telegram:", telegramError);
    }

    return { sent: true };
  } catch (err) {
    console.error("RESEND ERROR:", err);

    logger.error("Erro ao enviar e-mail de pagamento aprovado para administrador.", {
      pedidoId,
      message: err?.message,
      name: err?.name,
      statusCode: err?.statusCode,
      response: err?.response,
      cause: err?.cause,
      stack: err?.stack,
    });
    return { sent: false, reason: "EMAIL_SEND_FAILED" };
  }
}
