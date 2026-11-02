import { useCallback, useEffect, useState } from 'react'
import { observeRequest } from '../utils/asyncRequest'

// A changed loader or explicit reload is pending immediately during render.
// Effects commit only settled results; no synchronous loading reset is needed.
export function useAsyncData(load, initialData) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(() => ({ load: null, revision: -1, data: initialData, error: null }))
  const loading = result.load !== load || result.revision !== revision

  useEffect(() => {
    const request = observeRequest(load,
      data => setResult({ load, revision, data, error: null }),
      error => setResult(previous => ({ ...previous, load, revision, error: error?.message || 'Erro ao carregar dados.' })),
    )
    return request.cancel
  }, [load, revision])

  const reload = useCallback(() => setRevision(value => value + 1), [])
  const setError = useCallback(error => setResult(previous => ({ ...previous, error })), [])
  return { data: result.data, loading, error: loading ? null : result.error, reload, setError }
}
