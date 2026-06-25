import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens.")
    .optional(),
  descricao: z.string().trim().optional(),
  imagem: z.string().url("URL de imagem inválida.").optional().or(z.literal("")),
  ativo: z.boolean().optional().default(true),
});

export const categoriaUpdateSchema = categoriaSchema.partial();
