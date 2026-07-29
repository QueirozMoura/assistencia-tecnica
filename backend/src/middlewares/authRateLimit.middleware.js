import rateLimit from "express-rate-limit";

const genericMessage = "Muitas tentativas. Tente novamente em instantes.";

function createAuthLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: genericMessage },
  });
}

export const adminLoginLimiter = createAuthLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

export const clientLoginLimiter = createAuthLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

export const forgotPasswordLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

export const resetPasswordLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

export const verifyEmailLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});
