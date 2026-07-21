import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function PagamentoSucesso() {
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

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pedidos/sucesso/${id}`,
        );

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
    const dataRaw =
      pedido.createdAt ?? pedido.criadoEm ?? pedido.dataCriacao ?? pedido.data;
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

    const statusRaw = String(
      pedido?.status ?? pedido?.paymentStatus ?? "",
    ).toUpperCase();

    if (statusRaw === "CANCELADO") {
      return { etapas, etapaAtual: 0, cancelado: true };
    }

    if (statusRaw === "ENTREGUE") {
      return { etapas, etapaAtual: etapas.length, cancelado: false };
    }

    const mapaStatus = {
      PENDENTE: 1,
      PAGO: 2,
      PREPARANDO: 2,
      ENVIADO: 3,
    };

    return {
      etapas,
      etapaAtual: mapaStatus[statusRaw] ?? 1,
      cancelado: false,
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
                    const concluido = timeline.etapaAtual > index;
                    const atual = timeline.etapaAtual === index;

                    return (
                      <div key={etapa} className="relative flex justify-center">
                        {index < timeline.etapas.length - 1 && (
                          <span
                            className={`absolute top-4 left-1/2 w-full h-[3px] ${
                              timeline.etapaAtual > index + 1
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
                    const concluido = timeline.etapaAtual > index;
                    const atual = timeline.etapaAtual === index;

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
            <div className="space-y-2 text-sm text-[#43474f]">
              <p>
                <span className="font-semibold text-[#003366]">Pedido:</span>{" "}
                {resumo.numero}
              </p>
              <p>
                <span className="font-semibold text-[#003366]">Cliente:</span>{" "}
                {resumo.cliente}
              </p>
              <p>
                <span className="font-semibold text-[#003366]">Valor:</span>{" "}
                {resumo.valor}
              </p>
              <p>
                <span className="font-semibold text-[#003366]">Pagamento:</span>{" "}
                {resumo.pagamento}
              </p>
              <p>
                <span className="font-semibold text-[#003366]">Data:</span>{" "}
                {resumo.data}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="w-full sm:w-auto flex-1 h-11 rounded-xl border border-[#c3c6d1] text-[#43474f] font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver meus pedidos
          </button>
          <button
            type="button"
            className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-[#0070ea] text-white font-semibold hover:bg-[#0059bb] transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
