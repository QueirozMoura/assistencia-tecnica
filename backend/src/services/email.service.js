import { Resend } from "resend";
import logger from "../config/logger.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL || "noreply@assistencia.com";
const APP    = "EletroCenter";

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
      from:    FROM,
      to:      email,
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
    logger.error("Erro ao enviar email de verificação:", err);
    // Não lança — não bloqueia o cadastro
  }
}

/**
 * Envia email de recuperação de senha.
 */
export async function sendPasswordResetEmail(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || "https://example.com";
  const url = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const safeNome = escapeHtml(nome);
  const safeApp = escapeHtml(APP);

  try {
    await resend.emails.send({
      from:    FROM,
      to:      email,
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
  } catch (err) {
    logger.error("Erro ao enviar email de reset:", err);
  }
}
