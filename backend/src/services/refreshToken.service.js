import crypto from "crypto";
import prisma from "../config/prisma.js";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function computeExpirationDate() {
  const ttlDays = Number.isFinite(DEFAULT_TTL_DAYS) && DEFAULT_TTL_DAYS > 0 ? DEFAULT_TTL_DAYS : 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);
  return expiresAt;
}

export async function createRefreshToken(usuarioId) {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new Error("INVALID_USER_ID");
  }

  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = computeExpirationDate();

  await prisma.refreshToken.create({
    data: {
      usuarioId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function validateRefreshToken(token) {
  if (!token || typeof token !== "string" || token.length < 32) {
    return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
  }

  const tokenHash = hashToken(token);

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      usuario: true,
    },
  });

  if (!refreshToken) {
    return { valid: false, reason: "TOKEN_NOT_FOUND" };
  }

  if (refreshToken.revokedAt) {
    return { valid: false, reason: "TOKEN_REVOKED" };
  }

  if (new Date(refreshToken.expiresAt).getTime() <= Date.now()) {
    return { valid: false, reason: "TOKEN_EXPIRED" };
  }

  return {
    valid: true,
    tokenId: refreshToken.id,
    usuarioId: refreshToken.usuarioId,
    usuario: refreshToken.usuario,
    expiresAt: refreshToken.expiresAt,
    createdAt: refreshToken.createdAt,
    revokedAt: refreshToken.revokedAt,
  };
}

export async function revokeRefreshToken(token) {
  if (!token || typeof token !== "string" || token.length < 32) {
    return { revoked: false, reason: "INVALID_TOKEN_FORMAT" };
  }

  const tokenHash = hashToken(token);

  const result = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    revoked: result.count > 0,
  };
}
