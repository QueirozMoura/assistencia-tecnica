import React from 'react';
import { CheckCircle, XCircle, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { useBackendTest } from '../hooks/useBackendTest';

export function TesteBackend() {
  const { loading, data, error, refetch } = useBackendTest();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Server size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Teste de Integração</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Verificando conexão com o backend em{' '}
            <span className="font-mono text-blue-600">http://localhost:3000</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">GET /health</span>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Verificando...' : 'Testar novamente'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center gap-4 py-8 text-gray-400">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm">Conectando ao backend...</span>
              </div>
            )}

            {!loading && data && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <CheckCircle size={24} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Backend conectado!</p>
                    <p className="text-sm text-green-600 mt-0.5">O servidor está respondendo corretamente.</p>
                  </div>
                  <Wifi size={20} className="text-green-500 ml-auto shrink-0" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resposta do servidor</p>
                  <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-sm font-mono overflow-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <XCircle size={24} className="text-red-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Falha na conexão</p>
                    <p className="text-sm text-red-600 mt-0.5">Não foi possível alcançar o backend.</p>
                  </div>
                  <WifiOff size={20} className="text-red-400 ml-auto shrink-0" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detalhes do erro</p>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-sm text-red-700 font-mono">{error}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Checklist de diagnóstico</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• O servidor Node.js está rodando? (<span className="font-mono">node server.js</span>)</li>
                    <li>• A porta <span className="font-mono">3000</span> está disponível?</li>
                    <li>• O CORS está configurado para aceitar <span className="font-mono">http://localhost:5173</span>?</li>
                    <li>• O endpoint <span className="font-mono">GET /health</span> existe no backend?</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint map */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rotas disponíveis no backend</p>
          <div className="grid grid-cols-2 gap-2">
            {['/auth', '/clients', '/devices', '/orders', '/stock', '/technicians', '/dashboard', '/payments', '/users'].map((route) => (
              <span
                key={route}
                className="font-mono text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg"
              >
                {route}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
