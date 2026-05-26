import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AxiosError } from 'axios';

interface HealthData {
  status: string;
  [key: string]: unknown;
}

interface BackendTestState {
  loading: boolean;
  data: HealthData | null;
  error: string | null;
  refetch: () => void;
}

export function useBackendTest(): BackendTestState {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get<HealthData>('/health')
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
        }
      })
      .catch((err: AxiosError) => {
        if (!cancelled) {
          if (err.response) {
            setError(`Erro ${err.response.status}: ${JSON.stringify(err.response.data)}`);
          } else if (err.request) {
            setError('Backend não está respondendo. Verifique se o servidor está rodando em http://localhost:3000');
          } else {
            setError(err.message);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trigger]);

  const refetch = () => setTrigger((t) => t + 1);

  return { loading, data, error, refetch };
}
