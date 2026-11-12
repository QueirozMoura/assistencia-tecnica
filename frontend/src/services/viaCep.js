// Consulta pública de CEP (ViaCEP) usada só para PREENCHER o endereço no checkout.
// Ela nunca autoriza entrega: a cobertura é decidida pelo backend (cotação e criação do pedido).

const VIACEP_URL = 'https://viacep.com.br/ws'
export const VIACEP_TIMEOUT_MS = 5000

/**
 * Consulta um CEP (8 dígitos) no ViaCEP.
 * Retorna sempre um objeto, sem lançar erro:
 *  - { status: 'found', endereco: { rua, bairro, cidade, estado } } (campos podem vir vazios)
 *  - { status: 'notfound' }  CEP inexistente
 *  - { status: 'error' }     timeout, falha de rede, HTTP != 2xx ou resposta inválida
 */
export async function consultarCep(cep, { fetchImpl = globalThis.fetch, timeoutMs = VIACEP_TIMEOUT_MS } = {}) {
  const digitos = String(cep ?? '').replace(/\D/g, '')
  if (digitos.length !== 8 || typeof fetchImpl !== 'function') return { status: 'error' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${VIACEP_URL}/${digitos}/json/`, { signal: controller.signal })
    if (!response.ok) return { status: response.status === 400 ? 'notfound' : 'error' }

    const data = await response.json()
    if (!data || typeof data !== 'object') return { status: 'error' }
    if (data.erro === true || data.erro === 'true') return { status: 'notfound' }

    const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '')
    const endereco = {
      rua: texto(data.logradouro),
      bairro: texto(data.bairro),
      cidade: texto(data.localidade),
      estado: texto(data.uf).toUpperCase().slice(0, 2),
    }
    // Resposta sem nenhum dado útil é tratada como falha da consulta, não como CEP encontrado.
    if (!endereco.cidade && !endereco.estado) return { status: 'error' }
    return { status: 'found', endereco }
  } catch {
    return { status: 'error' }
  } finally {
    clearTimeout(timer)
  }
}
