import { z } from "zod";

export const produtoSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens.")
    .optional(),
  descricao: z.string().trim().optional(),
  preco: z
    .number({ required_error: "Preço é obrigatório." })
    .positive("Preço deve ser positivo.")
    .multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais."),
  precoPromocional: z
    .number()
    .positive("Preço promocional deve ser positivo.")
    .multipleOf(0.01)
    .optional()
    .nullable(),
  estoque: z
    .number()
    .int("Estoque deve ser um número inteiro.")
    .min(0, "Estoque não pode ser negativo.")
    .optional()
    .default(0),
  sku: z.string().trim().optional().nullable(),
  imagemPrincipal: z.string().url("URL de imagem inválida.").optional().nullable().or(z.literal("")),
  imagens: z.array(z.string().url("URL de imagem inválida.")).optional().default([]),
  destaque: z.boolean().optional().default(false),
  ativo: z.boolean().optional().default(true),
  categoriaId: z
    .number({ required_error: "Categoria é obrigatória." })
    .int("ID de categoria inválido.")
    .positive("ID de categoria inválido."),
});

export const produtoUpdateSchema = produtoSchema.partial().omit({ categoriaId: true }).extend({
  categoriaId: z.number().int().positive().optional(),
});

export const produtoQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
  categoriaId: z.coerce.number().int().positive().optional(),
  categoriaSlug: z.string().optional(),
  busca: z.string().trim().optional(),
  precoMin: z.coerce.number().positive().optional(),
  precoMax: z.coerce.number().positive().optional(),
  destaque: z.coerce.boolean().optional(),
  ativo: z.coerce.boolean().optional().default(true),
  orderBy: z.enum(["nome", "preco", "createdAt", "estoque"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
