import { z } from "zod";

export const clientRegisterSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido.")
    .toLowerCase()
    .trim(),
  telefone: z
    .string({ required_error: "Telefone é obrigatório." })
    .min(10, "Telefone inválido.")
    .trim(),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(6, "Senha deve ter no mínimo 6 caracteres."),
  confirmarSenha: z.string({ required_error: "Confirmação de senha é obrigatória." }),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

export const clientLoginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido.")
    .toLowerCase()
    .trim(),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(1, "Senha é obrigatória."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido.")
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Token é obrigatório." }),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(6, "Senha deve ter no mínimo 6 caracteres."),
  confirmarSenha: z.string({ required_error: "Confirmação de senha é obrigatória." }),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().min(1, "ID token do Google é obrigatório.").optional(),
    code: z.string().min(1, "Código de autorização é obrigatório.").optional(),
  })
  .refine((d) => !!d.idToken || !!d.code, {
    message: "Envie idToken ou code para autenticação Google.",
    path: ["idToken"],
  });

export const createPasswordSchema = z.object({
  novaSenha: z
    .string({ required_error: "Nova senha é obrigatória." })
    .min(6, "Senha deve ter no mínimo 6 caracteres."),
});
