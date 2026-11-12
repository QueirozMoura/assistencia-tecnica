import { useEffect, useMemo, useState } from 'react'
import { cotarFrete } from '../services/api'
import { isCepValido, somenteDigitosCep } from '../utils/frete'

const IDLE = { status: 'idle', data: null, error: '' }

/**
 * Consulta a cotação de frete no servidor (preços do banco) quando o CEP é válido.
 * status: 'idle' | 'loading' | 'ok' | 'unavailable' | 'error'
 * O valor retornado é apenas informativo: o backend recalcula tudo ao criar o pedido.
 */
export function useFreteQuote(cep, items) {
  const [result, setResult] = useState({ key: null, status: 'idle', data: null, error: '' })

  const itens = useMemo(
    () => items.map((item) => ({ produtoId: Number(item.id), quantidade: Number(item.quantity || 0) })),
    [items],
  )
  const active = isCepValido(cep) && itens.length > 0 && itens.every((i) => i.produtoId > 0 && i.quantidade > 0)
  const key = active ? `${somenteDigitosCep(cep)}|${JSON.stringify(itens)}` : null

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await cotarFrete({ cep: somenteDigitosCep(cep), itens })
        if (cancelled) return
        const data = response?.data ?? null
        setResult({ key, status: data?.entregaDisponivel ? 'ok' : 'unavailable', data, error: '' })
      } catch (error) {
        if (!cancelled) setResult({ key, status: 'error', data: null, error: error?.message || 'Não foi possível calcular o frete.' })
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // cep/itens já estão representados em `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!key) return IDLE
  if (result.key !== key) return { status: 'loading', data: null, error: '' }
  return { status: result.status, data: result.data, error: result.error }
}
