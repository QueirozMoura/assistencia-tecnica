import { FAIXAS_CEP_ATENDIDAS } from "../config/freteCobertura.js";

// Regras comerciais (valores em centavos para evitar erros de ponto flutuante).
export const FRETE_FIXO_CENTAVOS = 5000; // R$ 50,00
export const LIMITE_FRETE_GRATIS_CENTAVOS = 79900; // R$ 799,00 (grátis apenas ACIMA deste valor)

export const MOTIVO_CEP_INVALIDO = "CEP_INVALIDO";
export const MOTIVO_SUBTOTAL_INVALIDO = "SUBTOTAL_INVALIDO";
export const MOTIVO_ENTREGA_INDISPONIVEL = "ENTREGA_INDISPONIVEL";

/** Retorna o CEP com 8 dígitos ("01310100") ou null se o formato for inválido. */
export function normalizarCep(cep) {
  if (typeof cep !== "string") return null;
  const match = /^(\d{5})-?(\d{3})$/.exec(cep.trim());
  return match ? `${match[1]}${match[2]}` : null;
}

/** Converte um valor em reais (number ou string decimal) para centavos inteiros, ou null se inválido. */
export function reaisParaCentavos(valor) {
  if (typeof valor === "string" && !/^\d+(\.\d{1,2})?$/.test(valor.trim())) return null;
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return null;
  const centavos = Math.round(numero * 100);
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/** Retorna a faixa de cobertura que contém o CEP (8 dígitos), ou null se não houver. */
export function buscarFaixaCoberta(cepNormalizado, faixas = FAIXAS_CEP_ATENDIDAS) {
  return faixas.find(({ inicio, fim }) => cepNormalizado >= inicio && cepNormalizado <= fim) ?? null;
}

/** Indica se o CEP (8 dígitos) está em alguma faixa de cobertura configurada. */
export function cepEstaCoberto(cepNormalizado, faixas = FAIXAS_CEP_ATENDIDAS) {
  return buscarFaixaCoberta(cepNormalizado, faixas) !== null;
}

/**
 * Calcula o frete da entrega própria da JFQ.
 *
 * @param {{ cep: string, subtotal: number|string, faixas?: Array<{inicio:string, fim:string}> }} params
 *   subtotal: soma dos produtos em reais (ex.: 799.99). `faixas` permite injetar cobertura (testes).
 * @returns {{ ok: true, valorCentavos: number, valor: number, gratis: boolean, faltaParaGratisCentavos: number, cep: string, municipio: string|null }
 *          | { ok: false, motivo: string }}
 */
export function calcularFrete({ cep, subtotal, faixas = FAIXAS_CEP_ATENDIDAS } = {}) {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) return { ok: false, motivo: MOTIVO_CEP_INVALIDO };

  const subtotalCentavos = reaisParaCentavos(subtotal);
  if (subtotalCentavos === null) return { ok: false, motivo: MOTIVO_SUBTOTAL_INVALIDO };

  const faixa = buscarFaixaCoberta(cepNormalizado, faixas);
  if (!faixa) return { ok: false, motivo: MOTIVO_ENTREGA_INDISPONIVEL };

  const gratis = subtotalCentavos > LIMITE_FRETE_GRATIS_CENTAVOS;
  const valorCentavos = gratis ? 0 : FRETE_FIXO_CENTAVOS;

  return {
    ok: true,
    cep: cepNormalizado,
    municipio: faixa.municipio ?? null,
    valorCentavos,
    valor: valorCentavos / 100,
    gratis,
    // Quanto falta para ficar ACIMA do limite (1 centavo a mais que R$ 799,00).
    faltaParaGratisCentavos: gratis ? 0 : LIMITE_FRETE_GRATIS_CENTAVOS - subtotalCentavos + 1,
  };
}
