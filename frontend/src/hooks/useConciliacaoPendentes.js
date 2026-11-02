import { useCallback, useEffect } from 'react'
import { adminGetConciliacoesResumo } from '../services/adminApi'
import { useAsyncData } from './useAsyncData'

export const CONCILIACAO_CHANGED_EVENT = 'jfq:conciliacao-changed'
const REFRESH_MS = 60000

// Internal admin-panel indicator of open reconciliation items. Failures (e.g. a non-ADMIN role or a network
// error) simply hide it: it must never break the layout, and it never contacts anything outside the API.
export function useConciliacaoPendentes() {
  const load = useCallback(async () => {
    try {
      return (await adminGetConciliacoesResumo())?.data || null
    } catch {
      return null
    }
  }, [])
  const { data, reload } = useAsyncData(load, null)

  useEffect(() => {
    const timer = setInterval(reload, REFRESH_MS)
    window.addEventListener(CONCILIACAO_CHANGED_EVENT, reload)
    return () => {
      clearInterval(timer)
      window.removeEventListener(CONCILIACAO_CHANGED_EVENT, reload)
    }
  }, [reload])

  return data
}
