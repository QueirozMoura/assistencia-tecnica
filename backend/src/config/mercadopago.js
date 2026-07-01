import { MercadoPagoConfig } from "mercadopago";
import logger from "./logger.js";

const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

if (!accessToken) {
  logger.warn("[mercadopago] Access token não configurado. Defina MP_ACCESS_TOKEN ou MERCADO_PAGO_ACCESS_TOKEN.");
}

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
});

export default mercadoPagoClient;
