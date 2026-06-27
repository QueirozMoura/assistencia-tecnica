import * as clientAuthService from "../services/clientAuth.service.js";
import * as pedidoService from "../services/pedido.service.js";

export async function register(req, res, next) {
  try {
    const result = await clientAuthService.register(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    const result = await clientAuthService.login(email, senha);
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function googleAuth(req, res, next) {
  try {
    const { idToken, code } = req.body;
    const result = await clientAuthService.googleAuth({ idToken, code });
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Token não fornecido." });
    const result = await clientAuthService.verifyEmail(token);
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await clientAuthService.forgotPassword(email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, senha } = req.body;
    const result = await clientAuthService.resetPassword(token, senha);
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getMe(req, res, next) {
  try {
    const cliente = await clientAuthService.getMe(req.cliente.id);
    return res.status(200).json({ success: true, data: cliente });
  } catch (error) { next(error); }
}

export async function getMeusPedidos(req, res, next) {
  try {
    const pedidos = await pedidoService.listarMeusPedidos(req.cliente.id);
    return res.status(200).json({ success: true, data: pedidos });
  } catch (error) { next(error); }
}
