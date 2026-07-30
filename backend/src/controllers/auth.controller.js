import * as authService from "../services/auth.service.js";
import { validateRefreshToken } from "../services/refreshToken.service.js";

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

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token não informado." });
    }

    const validation = await validateRefreshToken(token);

    if (!validation.valid) {
      if (validation.reason === "TOKEN_EXPIRED") {
        return res.status(401).json({ success: false, message: "Refresh token expirado." });
      }

      if (validation.reason === "TOKEN_REVOKED") {
        return res.status(401).json({ success: false, message: "Refresh token revogado." });
      }

      return res.status(401).json({ success: false, message: "Refresh token inválido." });
    }

    const usuario = validation.usuario;

    if (!usuario) {
      return res.status(401).json({ success: false, message: "Usuário do refresh token não encontrado." });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ success: false, message: "Conta desativada." });
    }

    const newJwt = authService.issueAuthToken(usuario);

    return res.status(200).json({
      success: true,
      token: newJwt,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
      },
    });
  } catch (error) {
    next(error);
  }
}
