/**
 * Middleware de validação com Zod.
 * Uso: validate(schema) — valida req.body
 * Uso: validate(schema, 'params') — valida req.params
 * Uso: validate(schema, 'query') — valida req.query
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues || [];
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.",
        errors: issues.map((e) => ({
          campo: e.path.join("."),
          mensagem: e.message,
        })),
      });
    }

    req[source] = result.data;
    next();
  };
}
