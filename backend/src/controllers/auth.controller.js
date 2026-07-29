import * as authService from "../services/auth.service.js";

export async function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    const { token, usuario, refreshToken, refreshTokenExpiresAt } = await authService.login(email, senha);

    const expiresAtMs = refreshTokenExpiresAt instanceof Date
      ? refreshTokenExpiresAt.getTime()
      : new Date(refreshTokenExpiresAt).getTime();
    const maxAge = Number.isFinite(expiresAtMs) ? Math.max(0, expiresAtMs - Date.now()) : 0;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
    });

    return res.status(200).json({ success: true, token, usuario });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const usuario = await authService.getMe(req.usuario.id);
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}
