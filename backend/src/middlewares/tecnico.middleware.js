export function tecnicoMiddleware(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: "Não autenticado.",
    });
  }

  const rolesPermitidas = ["ADMIN", "TECNICO"];

  if (!rolesPermitidas.includes(req.usuario.role)) {
    return res.status(403).json({
      success: false,
      message: "Acesso restrito a técnicos e administradores.",
    });
  }

  next();
}
