import { MercadoPagoConfig } from "mercadopago";

const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

if (!accessToken) {
  console.warn("[mercadopago] Access token não configurado (MP_ACCESS_TOKEN).");
}

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
});

export default mercadoPagoClient;
