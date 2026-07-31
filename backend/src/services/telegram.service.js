import logger from "../config/logger.js";

export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram não configurado.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  const data = await response.json();

  if (!data.ok) {
    logger.warn("Falha ao enviar mensagem para Telegram.", {
      status: response.status,
      ok: data?.ok,
      description: data?.description,
    });
    throw new Error("Falha ao enviar notificação Telegram.");
  }

  return data;
}
