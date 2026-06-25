import { z } from "zod";

export const usuarioCreateSchema = z.object({
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
  ativo: z.boolean().optional().default(true),
});

export const usuarioUpdateSchema = z.object({
  nome: z.string().min(2).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  role: z.enum(["ADMIN", "TECNICO"]).optional(),
  ativo: z.boolean().optional(),
});

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string({ required_error: "Senha atual é obrigatória." }),
  novaSenha: z
    .string({ required_error: "Nova senha é obrigatória." })
    .min(8, "Nova senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Nova senha deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Nova senha deve conter ao menos um número."),
});
