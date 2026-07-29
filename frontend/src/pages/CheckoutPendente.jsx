import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const POLLING_INTERVAL_MS = 3000;

function normalizarTexto(valor) {
  return String(valor ?? "").trim().toUpperCase();
}

function extrairIdDoExternalReference(externalReference) {
  if (!externalReference) return null;

  const match = String(externalReference).match(/pedido_(\d+)/i);
  if (match?.[1]) return Number(match[1]);

  return null;
}

export default function CheckoutPendente() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [erroComunicacao, setErroComunicacao] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isCheckingRef = useRef(false);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    []
  );

  const externalReference = searchParams.get("external_reference");
  const paymentId = searchParams.get("payment_id");
  const pedidoIdParam = searchParams.get("pedidoId") || searchParams.get("pedido_id");

  const pedidoIdFromReference = extrairIdDoExternalReference(externalReference);
  const pedidoIdInicial =
    Number(pedidoIdParam) || pedidoIdFromReference || null;

  useEffect(() => {
    isMountedRef.current = true;

    async function verificarPagamento() {
      if (isCheckingRef.current) return;

      if (!pedidoIdInicial) {
        if (isMountedRef.current) {
          setErroComunicacao(true);
          setMensagemErro("Não foi possível identificar o pedido para acompanhar o pagamento.");
        }
        return;
      }

      isCheckingRef.current = true;

      try {
        const response = await fetch(`${apiBaseUrl}/pedidos/sucesso/${pedidoIdInicial}`);

        if (!response.ok) {
          throw new Error("Falha ao consultar o status do pedido.");
        }

        const payload = await response.json();
        const pedido = payload?.data;

        const statusPedido = normalizarTexto(pedido?.status);
        const paymentStatus = normalizarTexto(pedido?.paymentStatus);

        const pagamentoConfirmado =
          statusPedido === "PAGO" || paymentStatus === "PAID";

        if (pagamentoConfirmado) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (isMountedRef.current) {
            const pedidoId = pedido?.id || pedidoIdInicial;
            navigate(`/pagamento/sucesso?pedidoId=${pedidoId}`, { replace: true });
          }
          return;
        }

        if (isMountedRef.current) {
          setErroComunicacao(false);
          setMensagemErro("");
        }
      } catch {
        if (isMountedRef.current) {
          setErroComunicacao(true);
          setMensagemErro("Não foi possível verificar o pagamento automaticamente.");
        }
      } finally {
        isCheckingRef.current = false;
      }
    }

    verificarPagamento();

    if (!intervalRef.current) {
      intervalRef.current = setInterval(verificarPagamento, POLLING_INTERVAL_MS);
    }

    return () => {
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [apiBaseUrl, navigate, pedidoIdInicial]);

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mb-3">
            Estamos aguardando a confirmação do seu pagamento via Pix.
          </h1>

          <p className="text-sm sm:text-base text-[#5b6475] mb-8">
            A confirmação costuma acontecer em poucos segundos.
          </p>

          {!erroComunicacao ? (
            <div className="flex flex-col items-center gap-4">
              <span
                className="w-12 h-12 rounded-full border-4 border-[#c7daf8] border-t-[#0070ea] animate-spin"
                aria-hidden="true"
              />

              <p className="text-sm text-[#737780]">
                {paymentId
                  ? `Acompanhando pagamento #${paymentId}`
                  : externalReference
                  ? `Acompanhando referência ${externalReference}`
                  : "Verificando status do pagamento..."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-5 text-left">
              <p className="text-sm font-semibold text-[#b42318] mb-1">
                Não foi possível verificar o pagamento automaticamente.
              </p>
              {mensagemErro ? (
                <p className="text-sm text-[#7f1d1d] mb-4">{mensagemErro}</p>
              ) : null}

              <button
                type="button"
                onClick={() => navigate("/meus-pedidos")}
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#0070ea] text-white font-semibold hover:bg-[#0059bb] transition-colors"
              >
                Ver meus pedidos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
