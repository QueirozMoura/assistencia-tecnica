import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("pedidoId");
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarPedido() {
      if (!id) {
        if (!ativo) return;
        setErro("Pedido não informado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro("");

        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api";

        const response = await fetch(`${API_URL}/pedidos/sucesso/${id}`);

        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do pedido.");
        }

        const data = await response.json();

        if (!ativo) return;
        setPedido(data.data);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar os dados do pedido.");
      } finally {
        if (!ativo) return;
        setLoading(false);
      }
    }

    carregarPedido();

    return () => {
      ativo = false;
    };
  }, [id]);

  const resumo = useMemo(() => {
    if (!pedido) {
      return {
        numero: "#00000",
        cliente: "João da Silva",
        valor: "R$ 0,00",
        pagamento: "Aprovado",
        data: "17/07/2026",
      };
    }

    const numero = pedido.id ?? id ?? "00000";
    const cliente =
      pedido.cliente?.nome ?? pedido.nomeCliente ?? pedido.cliente ?? "—";
    const valorBruto = pedido.valorTotal ?? pedido.valor ?? pedido.total;
    const valor = valorBruto
      ? Number(valorBruto).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "R$ 0,00";
    const pagamento = pedido.statusPagamento ?? pedido.pagamento ?? "Aprovado";

    let dataFormatada = "—";
    const dataRaw = pedido.paidAt ?? pedido.createdAt ?? pedido.updatedAt;
    if (dataRaw) {
      const dataObj = new Date(dataRaw);
      dataFormatada = Number.isNaN(dataObj.getTime())
        ? String(dataRaw)
        : dataObj.toLocaleDateString("pt-BR");
    }

    return {
      numero: `#${String(numero).replace(/^#/, "")}`,
      cliente,
      valor,
      pagamento,
      data: dataFormatada,
    };
  }, [pedido, id]);

  const timeline = useMemo(() => {
    const etapas = [
      "Pedido recebido",
      "Pagamento aprovado",
      "Preparando pedido",
      "Enviado",
      "Entregue",
    ];

    const statusPedido = String(pedido?.status ?? "").toUpperCase();
    const statusPagamento = String(pedido?.paymentStatus ?? "").toUpperCase();

    const statusRaw =
      statusPedido ||
      (statusPagamento === "PAID"
        ? "PAGO"
        : statusPagamento === "PENDING"
          ? "PENDENTE"
          : statusPagamento === "CANCELLED"
            ? "CANCELADO"
            : "");

    if (statusRaw === "CANCELADO") {
      return { etapas, etapaAtual: 0, cancelado: true, concluidoAte: -1 };
    }

    const mapaStatus = {
      PENDENTE: 1,
      PAGO: 2,
      PREPARANDO: 3,
      ENVIADO: 4,
      ENTREGUE: 5,
    };

    const etapaAtual = mapaStatus[statusRaw] ?? 1;

    return {
      etapas,
      etapaAtual,
      cancelado: false,
      concluidoAte: etapaAtual === 5 ? etapas.length - 1 : etapaAtual - 1,
    };
  }, [pedido]);

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-[#d4f5e2] flex items-center justify-center">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="28" cy="28" r="26" fill="#22c55e" />
              <path
                d="M17 28.5L24.5 36L39 21.5"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[#003366] mb-2">
            Pagamento realizado com sucesso!
          </h1>
          <p className="text-base text-[#43474f] mb-1">
            Obrigado pela sua compra.
          </p>
          <p className="text-sm text-[#737780]">
            Seu pagamento foi confirmado e nossa equipe já foi notificada
            automaticamente.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 mb-6">
          <h2 className="text-lg font-bold text-[#003366] mb-4">
            Próximos passos
          </h2>

          {timeline.cancelado ? (
            <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4">
              <p className="text-sm font-semibold text-[#b42318]">
                Pedido cancelado
              </p>
              <p className="text-sm text-[#7f1d1d] mt-1">
                Este pedido foi cancelado. Se precisar, entre em contato com o
                suporte.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-5 items-center">
                  {timeline.etapas.map((etapa, index) => {
                    const concluido = index <= timeline.concluidoAte;
                    const atual = !concluido && timeline.etapaAtual === index;

                    return (
                      <div key={etapa} className="relative flex justify-center">
                        {index < timeline.etapas.length - 1 && (
                          <span
                            className={`absolute top-4 left-1/2 w-full h-[3px] ${
                              index < timeline.concluidoAte
                                ? "bg-[#22c55e]"
                                : "bg-[#d1d5db]"
                            }`}
                            aria-hidden="true"
                          />
                        )}

                        <span
                          className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${
                            concluido
                              ? "bg-[#22c55e] border-[#22c55e] text-white"
                              : atual
                                ? "bg-[#0070ea] border-[#0070ea] text-white shadow-[0_0_0_4px_rgba(0,112,234,0.18)]"
                                : "bg-[#f3f4f6] border-[#d1d5db] text-[#9ca3af]"
                          }`}
                        >
                          {concluido ? "✓" : index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-5 mt-3 text-xs sm:text-sm">
                  {timeline.etapas.map((etapa, index) => {
                    const concluido = index <= timeline.concluidoAte;
                    const atual = !concluido && timeline.etapaAtual === index;

                    return (
                      <p
                        key={`${etapa}-label`}
                        className={`text-center px-2 leading-tight ${
                          concluido
                            ? "text-[#1a6b3c] font-semibold"
                            : atual
                              ? "text-[#003366] font-semibold"
                              : "text-[#737780]"
                        }`}
                      >
                        {etapa}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 mb-6">
          <h2 className="text-lg font-bold text-[#003366] mb-4">
            Resumo do pedido
          </h2>

          {loading ? (
            <p className="text-sm text-[#43474f]">
              Carregando dados do pedido...
            </p>
          ) : erro ? (
            <p className="text-sm text-[#b42318]">{erro}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-[#43474f]">
              <div className="sm:col-span-2 rounded-xl border border-[#d9e6fb] bg-[#f4f8ff] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[#0059bb] mb-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 7.5h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Número do pedido
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#003366]">
                  {resumo.numero}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                <div className="flex items-center gap-2 text-[#5b6475] mb-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Cliente
                  </span>
                </div>
                <p className="text-base font-semibold text-[#003366] break-words">
                  {resumo.cliente}
                </p>
              </div>

              <div className="rounded-xl border border-[#d6eedd] bg-[#f4fcf6] p-4">
                <div className="flex items-center gap-2 text-[#1a6b3c] mb-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7.5h18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 14h6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Valor total
                  </span>
                </div>
                <p className="text-2xl font-extrabold tracking-tight text-[#1a6b3c]">
                  {resumo.valor}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                <div className="flex items-center gap-2 text-[#5b6475] mb-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 7 9 18l-5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Pagamento
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-3 py-1 text-sm font-semibold text-[#166534]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"
                    aria-hidden="true"
                  />
                  {resumo.pagamento}
                </span>
              </div>

              <div className="rounded-xl border border-[#e5e8ee] bg-white p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-[#5b6475] mb-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 2v3M16 2v3M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Data
                  </span>
                </div>
                <p className="text-base font-semibold text-[#003366]">
                  {resumo.data}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate("/meus-pedidos")}
            className="w-full sm:w-auto flex-1 h-11 rounded-xl border border-[#c3c6d1] text-[#43474f] font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver meus pedidos
          </button>
          <button
            type="button"
            onClick={() => navigate("/produtos")}
            className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-[#0070ea] text-white font-semibold hover:bg-[#0059bb] transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
