// Regras de apresentação do frete (a regra definitiva é SEMPRE calculada pelo backend).
export const FRETE_FIXO = 50
export const LIMITE_FRETE_GRATIS = 799 // frete grátis apenas ACIMA deste subtotal, em CEPs atendidos

const centavos = (valor) => Math.round(Number(valor) * 100)

/** Mantém só os dígitos do CEP (máximo 8). */
export function somenteDigitosCep(valor) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, 8)
}

/** Aplica a máscara 00000-000 enquanto o cliente digita. */
export function formatCep(valor) {
  const digitos = somenteDigitosCep(valor)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

export function isCepValido(valor) {
  return String(valor ?? '').replace(/\D/g, '').length === 8
}

/** Quanto falta (em reais) para o subtotal ficar ACIMA de R$ 799,00; 0 se já estiver acima; null se inválido. */
export function faltaParaFreteGratis(subtotal) {
  const atual = centavos(subtotal)
  if (!Number.isFinite(atual) || atual < 0) return null
  const limite = LIMITE_FRETE_GRATIS * 100
  return atual > limite ? 0 : (limite - atual + 1) / 100
}

export function subtotalGaranteFreteGratis(subtotal) {
  return faltaParaFreteGratis(subtotal) === 0
}
