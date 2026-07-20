export default function PagamentoSucesso() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-[#d4f5e2] flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
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

          <h1 className="text-3xl font-bold text-[#003366] mb-2">Pagamento realizado com sucesso!</h1>
          <p className="text-base text-[#43474f] mb-1">Obrigado pela sua compra.</p>
          <p className="text-sm text-[#737780]">
            Seu pagamento foi confirmado e nossa equipe já foi notificada automaticamente.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 mb-6">
          <h2 className="text-lg font-bold text-[#003366] mb-4">Próximos passos</h2>
          <ul className="space-y-3 text-sm">
            <li className="text-[#1a6b3c] font-medium">✓ Pedido recebido</li>
            <li className="text-[#1a6b3c] font-medium">✓ Pagamento aprovado</li>
            <li className="text-[#7a4f00] font-medium">⏳ Preparando pedido</li>
            <li className="text-[#737780]">○ Enviado</li>
            <li className="text-[#737780]">○ Entregue</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 mb-6">
          <h2 className="text-lg font-bold text-[#003366] mb-4">Resumo do pedido</h2>
          <div className="space-y-2 text-sm text-[#43474f]">
            <p>
              <span className="font-semibold text-[#003366]">Pedido:</span> #00000
            </p>
            <p>
              <span className="font-semibold text-[#003366]">Cliente:</span> João da Silva
            </p>
            <p>
              <span className="font-semibold text-[#003366]">Valor:</span> R$ 0,00
            </p>
            <p>
              <span className="font-semibold text-[#003366]">Pagamento:</span> Aprovado
            </p>
            <p>
              <span className="font-semibold text-[#003366]">Data:</span> 17/07/2026
            </p>
          </div>
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
  )
}
