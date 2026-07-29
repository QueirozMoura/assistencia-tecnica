import crypto from "crypto";
import prisma from "../config/prisma.js";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_MINUTES = Number(process.env.CHECKOUT_TOKEN_TTL_MINUTES || 15);

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function computeExpirationDate() {
  const ttl = Number.isFinite(DEFAULT_TTL_MINUTES) && DEFAULT_TTL_MINUTES > 0 ? DEFAULT_TTL_MINUTES : 30;
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttl);
  return expiresAt;
}

export async function createCheckoutAccessToken({ pedidoId, tx = prisma }) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = computeExpirationDate();

  await tx.checkoutAccessToken.updateMany({
    where: {
      pedidoId,
      revokedAt: null,
      usedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  await tx.checkoutAccessToken.create({
    data: {
      pedidoId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}

export async function validateCheckoutAccessToken({ token, pedidoId = null, consume = false, tx = prisma }) {
  if (!token || typeof token !== "string" || token.length < 32) {
    return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
  }

  const tokenHash = hashToken(token);

  const accessToken = await tx.checkoutAccessToken.findUnique({
    where: { tokenHash },
    include: {
      pedido: {
        include: {
          itens: {
            include: {
              produto: {
                select: { id: true, nome: true, slug: true, imagemPrincipal: true, preco: true },
              },
            },
          },
          cliente: { select: { id: true, nome: true, email: true, telefone: true } },
        },
      },
    },
  });

  if (!accessToken) {
    return { valid: false, reason: "TOKEN_NOT_FOUND" };
  }

  if (pedidoId && accessToken.pedidoId !== pedidoId) {
    return { valid: false, reason: "TOKEN_PEDIDO_MISMATCH" };
  }

  if (accessToken.revokedAt) {
    return { valid: false, reason: "TOKEN_REVOKED" };
  }

  if (accessToken.usedAt) {
    return { valid: false, reason: "TOKEN_ALREADY_USED" };
  }

  if (new Date(accessToken.expiresAt).getTime() <= Date.now()) {
    return { valid: false, reason: "TOKEN_EXPIRED" };
  }

  if (consume) {
    await tx.checkoutAccessToken.update({
      where: { id: accessToken.id },
      data: { usedAt: new Date() },
    });
  }

  return {
    valid: true,
    tokenId: accessToken.id,
    pedidoId: accessToken.pedidoId,
    pedido: accessToken.pedido,
    expiresAt: accessToken.expiresAt,
  };
}

export async function revokeCheckoutTokensByPedidoId({ pedidoId, tx = prisma }) {
  await tx.checkoutAccessToken.updateMany({
    where: {
      pedidoId,
      revokedAt: null,
      usedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
