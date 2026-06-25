import { z } from "zod";

function validarCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

export const clienteSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  email: z
    .string()
    .email("E-mail inválido.")
    .toLowerCase()
    .trim()
    .optional()
    .nullable(),
  telefone: z
    .string({ required_error: "Telefone é obrigatório." })
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/,
      "Telefone inválido. Use o formato (11) 99999-9999."
    )
    .trim(),
  cpf: z
    .string()
    .refine(validarCPF, "CPF inválido.")
    .optional()
    .nullable(),
});

export const clienteUpdateSchema = clienteSchema.partial();
