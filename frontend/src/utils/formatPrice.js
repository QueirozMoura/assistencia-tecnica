/**
 * Formata um número como moeda brasileira (BRL)
 */
export function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Calcula o valor da parcela
 */
export function calcInstallment(price, installments = 12) {
  return formatPrice(price / installments)
}

/**
 * Calcula desconto percentual
 */
export function calcDiscount(original, sale) {
  return Math.round(((original - sale) / original) * 100)
}

/**
 * Gera slug a partir de string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
