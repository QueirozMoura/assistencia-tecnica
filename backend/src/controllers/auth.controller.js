import * as authService from "../services/auth.service.js";

export async function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    const result = await authService.login(email, senha);
    return res.status(200).json({ success: true, ...result });
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
