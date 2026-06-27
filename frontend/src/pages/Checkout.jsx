import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useClientAuth } from '../hooks/useClientAuth'
import { getItemPrice } from '../hooks/useCart'
import { clientCreatePedidoComPagamento } from '../services/clientApi'
import { formatPrice } from '../utils/formatPrice'

function OrderSummary({ items, subtotal }) {
  const total = subtotal

  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
      <h2 className="text-lg font-bold text-[#003366] mb-4">Resumo do pedido</h2>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c3c6d1] bg-[#f7f9ff] p-4 text-sm text-[#737780]">
          Seu carrinho está vazio
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const unitPrice = getItemPrice(item)
            const quantity = Number(item.quantity || 0)
            const lineSubtotal = unitPrice * quantity

            return (
              <div key={item.id} className="flex gap-3 rounded-xl bg-[#f7f9ff] p-3 border border-[#e5e8ee]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#181c20] line-clamp-2">{item.name}</p>
                  <p className="text-xs text-[#737780] mt-0.5">Qtd: {quantity}</p>
                  <p className="text-xs text-[#737780]">Unitário: {formatPrice(unitPrice)}</p>
                  <p className="text-sm font-bold text-[#003366] mt-1">Subtotal: {formatPrice(lineSubtotal)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="border-t border-[#e5e8ee] mt-4 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#43474f]">Subtotal</span>
          <span className="font-semibold text-[#181c20]">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#43474f]">Frete</span>
          <span className="text-[#737780]">Calculado no próximo passo</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#e5e8ee]">
          <span className="text-base font-bold text-[#003366]">Total Geral</span>
          <span className="text-xl font-bold text-[#003366]">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}

function CustomerForm({ customer, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
      <h2 className="text-lg font-bold text-[#003366] mb-4">Dados do cliente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-[#43474f]">Nome</span>
          <input
            type="text"
            value={customer.nome}
            onChange={(e) => onChange('nome', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="Seu nome completo"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Email</span>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="seuemail@exemplo.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Telefone</span>
          <input
            type="text"
            value={customer.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="(00) 00000-0000"
          />
        </label>
      </div>
    </div>
  )
}

function AddressForm({ address, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
      <h2 className="text-lg font-bold text-[#003366] mb-4">Endereço de entrega</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">CEP</span>
          <input
            type="text"
            value={address.cep}
            onChange={(e) => onChange('cep', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="00000-000"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Rua</span>
          <input
            type="text"
            value={address.rua}
            onChange={(e) => onChange('rua', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="Nome da rua"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Número</span>
          <input
            type="text"
            value={address.numero}
            onChange={(e) => onChange('numero', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="123"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Complemento</span>
          <input
            type="text"
            value={address.complemento}
            onChange={(e) => onChange('complemento', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="Apto, bloco, referência..."
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Bairro</span>
          <input
            type="text"
            value={address.bairro}
            onChange={(e) => onChange('bairro', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="Seu bairro"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#43474f]">Cidade</span>
          <input
            type="text"
            value={address.cidade}
            onChange={(e) => onChange('cidade', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="Sua cidade"
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-[#43474f]">Estado</span>
          <input
            type="text"
            value={address.estado}
            onChange={(e) => onChange('estado', e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea]"
            placeholder="UF"
          />
        </label>
      </div>
    </div>
  )
}

function PaymentCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
      <h2 className="text-lg font-bold text-[#003366] mb-4">Forma de pagamento</h2>
      <div className="rounded-xl border border-[#cce0ff] bg-[#f1f7ff] p-4">
        <p className="text-sm font-semibold text-[#003366]">Mercado Pago</p>
        <p className="text-sm text-[#43474f] mt-1">
          Após clicar em Finalizar Compra você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento.
        </p>
      </div>
    </div>
  )
}

export default function Checkout() {
  const { cart } = useOutletContext()
  const { cliente } = useClientAuth()

  const [customer, setCustomer] = useState({
    nome: cliente?.nome ?? '',
    email: cliente?.email ?? '',
    telefone: cliente?.telefone ?? '',
  })

  const [address, setAddress] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  const [observacoes, setObservacoes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const items = cart?.items ?? []
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + getItemPrice(item) * Number(item.quantity || 0), 0),
    [items]
  )

  const cartIsEmpty = items.length === 0

  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleProceed = async () => {
    if (isSubmitting) return

    setErrorMessage('')

    if (!cliente?.id) {
      setErrorMessage('Você precisa estar autenticado para continuar o pagamento.')
      return
    }

    if (cartIsEmpty) {
      setErrorMessage('Seu carrinho está vazio. Adicione produtos para continuar.')
      return
    }

    const itens = items.map((item) => ({
      produtoId: Number(item.id),
      quantidade: Number(item.quantity || 0),
    }))

    const hasInvalidItem = itens.some((item) => !item.produtoId || item.quantidade <= 0)
    if (hasInvalidItem) {
      setErrorMessage('Há itens inválidos no carrinho. Revise e tente novamente.')
      return
    }

    const payload = {
      clienteId: Number(cliente.id),
      itens,
      observacoes: observacoes?.trim() || null,
    }

    setIsSubmitting(true)

    try {
      const response = await clientCreatePedidoComPagamento(payload)

      const hasRequiredFields = Boolean(response?.pedido && response?.preference_id && response?.init_point)

      if (!hasRequiredFields) {
        setErrorMessage('Não foi possível iniciar o pagamento agora. Tente novamente em instantes.')
        return
      }

      window.location.href = response.init_point
    } catch (error) {
      setErrorMessage(error?.message || 'Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-7xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#003366]">Checkout</h1>
          <nav className="mt-2 text-sm text-[#737780]">
            <span>Home</span>
            <span className="mx-2">{'>'}</span>
            <span>Carrinho</span>
            <span className="mx-2">{'>'}</span>
            <span className="font-semibold text-[#43474f]">Checkout</span>
          </nav>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 space-y-6">
            <CustomerForm customer={customer} onChange={handleCustomerChange} />
            <AddressForm address={address} onChange={handleAddressChange} />

            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
              <h2 className="text-lg font-bold text-[#003366] mb-4">Observações</h2>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#43474f]">Observações do pedido</span>
                <textarea
                  rows={4}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#c3c6d1] bg-white outline-none focus:border-[#0070ea] resize-y"
                  placeholder="Adicione informações importantes para a entrega, se necessário."
                />
              </label>
            </div>
          </section>

          <aside className="xl:col-span-1 space-y-6">
            <OrderSummary items={items} subtotal={subtotal} />
            <PaymentCard />

            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5 space-y-3">
              {errorMessage ? (
                <div className="rounded-xl border border-[#ffd2d2] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
                  {errorMessage}
                </div>
              ) : null}

              <Link
                to="/catalogo"
                className="w-full h-11 inline-flex items-center justify-center rounded-xl border border-[#c3c6d1] text-[#43474f] font-semibold hover:bg-gray-50 transition-colors"
              >
                Voltar ao Carrinho
              </Link>

              <button
                type="button"
                onClick={handleProceed}
                disabled={cartIsEmpty || isSubmitting}
                className={`w-full h-11 rounded-xl text-white font-semibold transition-colors ${
                  cartIsEmpty || isSubmitting ? 'bg-[#9aa0a9] cursor-not-allowed' : 'bg-[#0070ea] hover:bg-[#0059bb]'
                }`}
              >
                {isSubmitting ? 'Processando...' : 'Ir para Pagamento'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
