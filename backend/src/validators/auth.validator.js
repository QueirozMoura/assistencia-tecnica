import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido.")
    .toLowerCase()
    .trim(),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(6, "Senha deve ter no mínimo 6 caracteres."),
});

export const registerSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido.")
    .toLowerCase()
    .trim(),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(8, "Senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Senha deve conter ao menos um número."),
  role: z.enum(["ADMIN", "TECNICO"]).optional().default("TECNICO"),
});
