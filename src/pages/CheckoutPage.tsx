import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, CreditCard, Smartphone, FileText, Lock, Shield } from 'lucide-react';
import { useCartStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { generateOrderNumber } from '../utils/formatters';

type Step = 1 | 2 | 3;
type PaymentMethod = 'credit' | 'pix' | 'boleto';

const steps = [
  { id: 1, label: 'Identificação' },
  { id: 2, label: 'Endereço' },
  { id: 3, label: 'Pagamento' },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalPrice, discount, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [loading, setLoading] = useState(false);

  const [personalData, setPersonalData] = useState({
    name: '', email: '', phone: '', cpf: '',
  });
  const [addressData, setAddressData] = useState({
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });
  const [cardData, setCardData] = useState({
    number: '', name: '', expiry: '', cvv: '', installments: '12',
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const shipping = subtotal >= 2000 ? 0 : 199.90;
  const total = getTotalPrice() + shipping;

  const handleNextStep = () => {
    if (step < 3) setStep((prev) => (prev + 1) as Step);
  };

  const handleFinishOrder = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const orderNumber = generateOrderNumber();
    clearCart();
    navigate(`/sucesso?pedido=${orderNumber}`);
  };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900">Finalizar Compra</h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: step === s.id ? 1.1 : 1,
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step > s.id
                      ? 'bg-emerald-500 text-white'
                      : step === s.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-300'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step > s.id ? <Check size={16} /> : s.id}
                </motion.div>
                <span className={`text-xs mt-1.5 font-medium ${step === s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-20 mx-3 mb-5 transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Personal data */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-card"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Dados Pessoais</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nome Completo', key: 'name', placeholder: 'Seu nome completo', type: 'text', full: true },
                      { label: 'E-mail', key: 'email', placeholder: 'seu@email.com', type: 'email' },
                      { label: 'Telefone', key: 'phone', placeholder: '(11) 99999-9999', type: 'tel' },
                      { label: 'CPF', key: 'cpf', placeholder: '000.000.000-00', type: 'text' },
                    ].map(({ label, key, placeholder, type, full }) => (
                      <div key={key} className={full ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={personalData[key as keyof typeof personalData]}
                          onChange={(e) => setPersonalData(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button size="lg" icon={<ChevronRight size={18} />} iconPosition="right" onClick={handleNextStep}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-card"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Endereço de Entrega</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'CEP', key: 'cep', placeholder: '00000-000', col: 1 },
                      { label: 'Logradouro', key: 'street', placeholder: 'Rua, Avenida...', col: 2 },
                      { label: 'Número', key: 'number', placeholder: '123', col: 1 },
                      { label: 'Complemento', key: 'complement', placeholder: 'Apto, Bloco...', col: 1 },
                      { label: 'Bairro', key: 'neighborhood', placeholder: 'Bairro', col: 1 },
                      { label: 'Cidade', key: 'city', placeholder: 'Cidade', col: 1 },
                      { label: 'Estado', key: 'state', placeholder: 'SP', col: 1 },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={addressData[key as keyof typeof addressData]}
                          onChange={(e) => setAddressData(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>← Voltar</Button>
                    <Button size="lg" icon={<ChevronRight size={18} />} iconPosition="right" onClick={handleNextStep}>
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-card"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Forma de Pagamento</h2>

                  {/* Payment method tabs */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { id: 'credit', icon: CreditCard, label: 'Cartão' },
                      { id: 'pix', icon: Smartphone, label: 'Pix' },
                      { id: 'boleto', icon: FileText, label: 'Boleto' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setPaymentMethod(id as PaymentMethod)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          paymentMethod === id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon size={22} />
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Credit card form */}
                  <AnimatePresence mode="wait">
                    {paymentMethod === 'credit' && (
                      <motion.div
                        key="credit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Card visual */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-3xl p-6 text-white mb-6 shadow-lg shadow-blue-500/30">
                          <div className="flex justify-between items-start mb-8">
                            <div className="text-xs font-semibold tracking-widest opacity-70">CARTÃO DE CRÉDITO</div>
                            <div className="text-2xl font-black">VISA</div>
                          </div>
                          <div className="text-lg font-mono tracking-widest mb-4">
                            {cardData.number || '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-70">{cardData.name || 'NOME DO TITULAR'}</span>
                            <span className="opacity-70">{cardData.expiry || 'MM/AA'}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Número do Cartão</label>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardData.number}
                            onChange={(e) => setCardData(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome no Cartão</label>
                          <input
                            type="text"
                            placeholder="Igual ao impresso no cartão"
                            value={cardData.name}
                            onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Validade</label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={cardData.expiry}
                              onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              placeholder="•••"
                              maxLength={4}
                              value={cardData.cvv}
                              onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Parcelas</label>
                          <select
                            value={cardData.installments}
                            onChange={(e) => setCardData(prev => ({ ...prev, installments: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n}x de {formatCurrency(total / n)}{n === 1 ? ' à vista' : ' sem juros'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'pix' && (
                      <motion.div
                        key="pix"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center py-6"
                      >
                        <div className="w-48 h-48 bg-gray-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                          <div className="text-5xl">📱</div>
                        </div>
                        <p className="font-bold text-gray-900 text-lg mb-2">QR Code Pix</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Pague com Pix e ganhe 5% de desconto adicional
                        </p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 inline-block">
                          <p className="text-emerald-700 font-bold text-xl">
                            {formatCurrency(total * 0.95)}
                          </p>
                          <p className="text-emerald-600 text-xs mt-0.5">Com desconto Pix (5%)</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          O QR Code será gerado após confirmar o pedido
                        </p>
                      </motion.div>
                    )}

                    {paymentMethod === 'boleto' && (
                      <motion.div
                        key="boleto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center py-6"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <FileText size={28} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg mb-2">Boleto Bancário</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Vencimento em até 3 dias úteis
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                          <p className="text-amber-700 text-sm font-semibold mb-1">⚠️ Atenção</p>
                          <p className="text-amber-600 text-xs leading-relaxed">
                            O pagamento via boleto pode levar até 3 dias úteis para ser confirmado.
                            Seu pedido só será processado após a confirmação do pagamento.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Security badge */}
                  <div className="flex items-center gap-2 mt-6 text-xs text-gray-400 justify-center">
                    <Lock size={12} className="text-blue-400" />
                    Ambiente seguro com criptografia SSL
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)}>← Voltar</Button>
                    <Button
                      size="lg"
                      loading={loading}
                      icon={<Lock size={18} />}
                      onClick={handleFinishOrder}
                    >
                      Confirmar Pedido
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-card">
              <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-xl"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-400">{item.product.brand}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Frete</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-blue-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-3xl p-4">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-2">
                <Shield size={16} />
                Compra Protegida
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Sua compra está protegida pela nossa garantia de satisfação.
                Se não estiver satisfeito, devolvemos seu dinheiro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
