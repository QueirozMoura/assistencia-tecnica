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

/**
 * Separa o valor de um pedido em subtotal de produtos, frete e total.
 * `valorTotal` já inclui o frete; pedidos antigos (sem `valorFrete`) têm frete 0.
 */
export function resumoValoresPedido(pedido) {
  const total = centavos(pedido?.valorTotal ?? 0)
  const frete = centavos(pedido?.valorFrete ?? 0)
  const totalValido = Number.isFinite(total) ? total : 0
  const freteValido = Number.isFinite(frete) && frete > 0 && frete <= totalValido ? frete : 0
  return {
    subtotal: (totalValido - freteValido) / 100,
    frete: freteValido / 100,
    total: totalValido / 100,
  }
}

/** Normaliza nomes para comparação: sem acentos, minúsculas, sem pontuação ("São Paulo" = "sao paulo"). */
export function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
