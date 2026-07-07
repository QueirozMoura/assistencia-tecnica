import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Shield,
  Phone,
  MessageSquare,
  User,
  MapPin,
  Wrench,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useClientAuth } from "../hooks/useClientAuth";
import { clientCreateAgendamento } from "../services/clientApi";

const equipmentTypes = [
  "Máquina de Lavar",
  "Lava e Seca",
  "Centrífuga",
  "Geladeira",
  "Microondas",
  "Outro",
];

const brandsList = [
  "Brastemp",
  "Consul",
  "Electrolux",
  "LG",
  "Samsung",
  "Panasonic",
  "Midea",
  "Philco",
  "Whirlpool",
  "Outra",
];

const timeSlots = [
  "Manhã (8h às 12h)",
  "Tarde (12h às 18h)",
  "Qualquer horário",
];

const initialForm = {
  nomeContato: "",
  telefoneContato: "",
  whatsapp: "",
  email: "",
  endereco: "",
  cidade: "",
  cep: "",
  equipamento: "",
  marca: "",
  modelo: "",
  problema: "",
  melhorHorario: "",
  observacoes: "",
};

export default function Scheduling() {
  const { cliente } = useClientAuth();
  const prefilled = useMemo(
    () => ({
      ...initialForm,
      nomeContato: cliente?.nome || "",
      email: cliente?.email || "",
      telefoneContato: cliente?.telefone || "",
      whatsapp: cliente?.telefone || "",
    }),
    [cliente],
  );

  const [form, setForm] = useState(prefilled);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.nomeContato.trim()) e.nomeContato = "Nome obrigatório";
    if (!form.telefoneContato.trim())
      e.telefoneContato = "Telefone obrigatório";
    if (!form.email.trim()) e.email = "E-mail obrigatório";
    if (!form.endereco.trim()) e.endereco = "Endereço obrigatório";
    if (!form.cidade.trim()) e.cidade = "Cidade obrigatória";
    if (!form.equipamento) e.equipamento = "Selecione o equipamento";
    if (!form.problema.trim()) e.problema = "Descreva o problema";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }

    try {
      setIsSubmitting(true);
      await clientCreateAgendamento(form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err?.message || "Não foi possível enviar sua solicitação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-sm text-[#181c20] placeholder-[#737780] outline-none transition-colors ${
      errors[field]
        ? "border-[#ba1a1a] focus:border-[#ba1a1a]"
        : "border-[#c3c6d1] focus:border-[#0070ea]"
    }`;

  if (submitted) {
    return (
      <div className="bg-[#f7f9ff] min-h-screen flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl p-10 shadow-xl text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[#1a6b3c]" />
          </div>
          <h2 className="text-2xl font-bold text-[#003366] mb-3">
            Solicitação Enviada!
          </h2>
          <p className="text-[#43474f] mb-2">
            Recebemos sua solicitação de atendimento. Nossa equipe entrará em
            contato em até <strong>2 horas</strong> para confirmar o
            agendamento.
          </p>
          <p className="text-sm text-[#737780] mb-8">
            Você também pode nos contatar pelo WhatsApp para agilizar o
            atendimento.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/5511965602135"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageSquare size={16} />
              Falar no WhatsApp
            </a>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 border border-[#e5e8ee] text-[#43474f] px-6 py-3 rounded-xl font-medium hover:bg-[#f7f9ff] transition-colors text-sm"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001e40] to-[#003366] py-10 sm:py-12">
        <div className="container-max">
          <nav className="text-xs text-[#8fa8c8] mb-3 flex items-center gap-1">
            <Link to="/" className="hover:text-white transition-colors">
              Início
            </Link>
            <ChevronRight size={12} />
            <span className="text-white">Agendamento</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Agendar Visita Técnica
          </h1>
          <p className="text-[#8fa8c8]">
            Preencha o formulário e nossa equipe entrará em contato em até 2
            horas.
          </p>
        </div>
      </section>

      <div className="container-max py-6 sm:py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#e5e8ee] space-y-6"
            >
              {/* Dados Pessoais */}
              <div>
                <h2 className="font-bold text-[#003366] text-lg mb-4 flex items-center gap-2">
                  <User size={18} className="text-[#0070ea]" />
                  Dados Pessoais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      name="nomeContato"
                      value={form.nomeContato}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className={inputClass("nomeContato")}
                    />
                    {errors.nomeContato && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.nomeContato}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Telefone *
                    </label>
                    <input
                      name="telefoneContato"
                      value={form.telefoneContato}
                      onChange={handleChange}
                      placeholder="(11) 9999-9999"
                      className={inputClass("telefoneContato")}
                    />
                    {errors.telefoneContato && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.telefoneContato}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      WhatsApp
                    </label>
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="(11) 9999-9999"
                      className={inputClass("whatsapp")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className={inputClass("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h2 className="font-bold text-[#003366] text-lg mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-[#0070ea]" />
                  Endereço para Atendimento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Endereço completo *
                    </label>
                    <input
                      name="endereco"
                      value={form.endereco}
                      onChange={handleChange}
                      placeholder="Rua, número, complemento"
                      className={inputClass("endereco")}
                    />
                    {errors.endereco && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.endereco}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      CEP
                    </label>
                    <input
                      name="cep"
                      value={form.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      className={inputClass("cep")}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Cidade *
                    </label>
                    <input
                      name="cidade"
                      value={form.cidade}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                      className={inputClass("cidade")}
                    />
                    {errors.cidade && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.cidade}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Equipamento */}
              <div>
                <h2 className="font-bold text-[#003366] text-lg mb-4 flex items-center gap-2">
                  <Wrench size={18} className="text-[#0070ea]" />
                  Dados do Equipamento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Tipo de equipamento *
                    </label>
                    <select
                      name="equipamento"
                      value={form.equipamento}
                      onChange={handleChange}
                      className={inputClass("equipamento")}
                    >
                      <option value="">Selecione...</option>
                      {equipmentTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.equipamento && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.equipamento}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Marca
                    </label>
                    <select
                      name="marca"
                      value={form.marca}
                      onChange={handleChange}
                      className={inputClass("marca")}
                    >
                      <option value="">Selecione...</option>
                      {brandsList.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Modelo
                    </label>
                    <input
                      name="modelo"
                      value={form.modelo}
                      onChange={handleChange}
                      placeholder="Ex: BWK12AB"
                      className={inputClass("modelo")}
                    />
                  </div>
                </div>
              </div>

              {/* Problema */}
              <div>
                <h2 className="font-bold text-[#003366] text-lg mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-[#0070ea]" />
                  Descrição do Problema
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Descreva o problema *
                    </label>
                    <textarea
                      name="problema"
                      value={form.problema}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Descreva o problema com o máximo de detalhes possível..."
                      className={`${inputClass("problema")} resize-none`}
                    />
                    {errors.problema && (
                      <p className="text-xs text-[#ba1a1a] mt-1">
                        {errors.problema}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-2">
                      Melhor horário para atendimento
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, melhorHorario: slot }))
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            form.melhorHorario === slot
                              ? "bg-[#0070ea] text-white border-[#0070ea]"
                              : "bg-white text-[#43474f] border-[#c3c6d1] hover:border-[#0070ea]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">
                      Observações adicionais
                    </label>
                    <textarea
                      name="observacoes"
                      value={form.observacoes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Informações adicionais que possam ajudar o técnico..."
                      className={`${inputClass("observacoes")} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-[#ba1a1a] text-center">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0070ea] text-white py-4 rounded-xl font-bold text-base hover:bg-[#0059bb] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                {isSubmitting ? "Enviando..." : "Solicitar Atendimento"}
              </button>
              <p className="text-xs text-[#737780] text-center">
                Ao enviar, você concorda com nossa política de privacidade.
                Retornaremos em até 2 horas.
              </p>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Info card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8ee]">
              <h3 className="font-bold text-[#003366] mb-4">
                Informações de Contato
              </h3>
              <div className="space-y-3">
                <a
                  href="tel:+5511965602135"
                  className="flex items-center gap-3 text-sm text-[#43474f] hover:text-[#0070ea] transition-colors"
                >
                  <div className="w-9 h-9 bg-[#cce0ff] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={15} className="text-[#003366]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#181c20]">(11) 96560-2135</p>
                    <p className="text-xs text-[#737780]">Seg–Sáb: 8h às 18h</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/5511965602135"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-[#43474f] hover:text-[#25D366] transition-colors"
                >
                  <div className="w-9 h-9 bg-[#d4f5e2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={15} className="text-[#1a6b3c]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#181c20]">WhatsApp</p>
                    <p className="text-xs text-[#737780]">Resposta rápida</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Guarantees */}
            <div className="bg-[#003366] rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-4">Nossas Garantias</h3>
              <div className="space-y-3">
                {[
                  { icon: Clock, text: "Técnico em até 24h úteis" },
                  { icon: Shield, text: "90 dias de garantia no serviço" },
                  { icon: CheckCircle, text: "Diagnóstico 100% gratuito" },
                  { icon: Wrench, text: "Peças originais certificadas" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5 text-sm text-[#a7c8ff]"
                  >
                    <Icon size={15} className="text-[#0070ea] flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Area */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8ee]">
              <h3 className="font-bold text-[#003366] mb-3">
                Área de Atendimento
              </h3>
              <div className="space-y-1.5">
                {[
                  "Santo Amaro",
                  "Campo Limpo",
                  "Capão Redondo",
                  "Interlagos",
                  "Morumbi",
                ].map((city) => (
                  <div
                    key={city}
                    className="flex items-center gap-2 text-sm text-[#43474f]"
                  >
                    <CheckCircle size={13} className="text-[#0070ea]" />
                    {city}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
