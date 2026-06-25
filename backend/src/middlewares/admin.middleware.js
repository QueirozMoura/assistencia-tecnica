export function adminMiddleware(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: "Não autenticado.",
    });
  }

  if (req.usuario.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Acesso restrito a administradores.",
    });
  }

  next();
}
