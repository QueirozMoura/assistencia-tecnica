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

        const response = await fetch(`/api/pedidos/sucesso/${id}`);

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

    const numero = pedido.numero ?? pedido.id ?? id ?? "00000";
    const cliente =
      pedido.cliente?.nome ?? pedido.nomeCliente ?? pedido.cliente ?? "—";
    const valorBruto = pedido.valorTotal ?? pedido.valor ?? pedido.total;
    const valor =
      typeof valorBruto === "number"
        ? valorBruto.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : (valorBruto ?? "R$ 0,00");
    const pagamento = pedido.statusPagamento ?? pedido.pagamento ?? "Aprovado";

    let dataFormatada = "—";
    const dataRaw = pedido.criadoEm ?? pedido.dataCriacao ?? pedido.data;
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
          <ul className="space-y-3 text-sm">
            <li className="text-[#1a6b3c] font-medium">✓ Pedido recebido</li>
            <li className="text-[#1a6b3c] font-medium">✓ Pagamento aprovado</li>
            <li className="text-[#7a4f00] font-medium">⏳ Preparando pedido</li>
            <li className="text-[#737780]">○ Enviado</li>
            <li className="text-[#737780]">○ Entregue</li>
          </ul>
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
