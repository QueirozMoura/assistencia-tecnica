import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Zap,
  Wrench,
  Phone,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { getProdutosDestaque } from "../services/api";
import heroImg from "../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47.jpeg";
import catMaquinas from "../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47 (1).jpeg";
import catLavaSeca from "../assets/images/Lava e Seca/WhatsApp Image 2026-05-22 at 23.43.31.jpeg";
import catMicroondas from "../assets/images/Microondas/WhatsApp Image 2026-05-22 at 23.46.57.jpeg";
import catCentrifuga from "../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47 (2).jpeg";
import ProductCard from "../components/ui/ProductCard";
import ServiceCard from "../components/ui/ServiceCard";
import SectionHeader from "../components/ui/SectionHeader";
import { services } from "../data/services";
import { testimonials, stats } from "../data/testimonials";
import { brands, faqs } from "../data/brands";

const benefits = [
  {
    icon: Clock,
    title: "Atendimento em 24h",
    desc: "Técnico na sua casa em até 24 horas úteis após o agendamento.",
  },
  {
    icon: Shield,
    title: "Garantia de 90 Dias",
    desc: "Todos os serviços e peças com garantia mínima de 90 dias.",
  },
  {
    icon: Award,
    title: "Técnicos Certificados",
    desc: "Equipe treinada e certificada pelas principais marcas do mercado.",
  },
  {
    icon: Wrench,
    title: "Peças Originais",
    desc: "Utilizamos apenas peças originais ou de primeira linha.",
  },
  {
    icon: ThumbsUp,
    title: "Diagnóstico Gratuito",
    desc: "Avaliação sem custo. Você só paga se aprovar o orçamento.",
  },
  {
    icon: TrendingUp,
    title: "Pagamento Facilitado",
    desc: "Parcelamos em até 12x sem juros no cartão de crédito.",
  },
];

const categoryCards = [
  {
    title: "Máquinas de Lavar",
    subtitle: "Top Load e Frontal",
    to: "/catalogo?categoria=maquina-de-lavar",
    image: catMaquinas,
    span: "lg:col-span-2 lg:row-span-2",
    textSize: "text-2xl",
  },
  {
    title: "Lava e Seca",
    subtitle: "Praticidade em um só equipamento",
    to: "/catalogo?categoria=lava-e-seca",
    image: catLavaSeca,
    span: "",
    textSize: "text-lg",
  },
  {
    title: "Micro-ondas",
    subtitle: "Praticidade e tecnologia na cozinha",
    to: "/catalogo?categoria=microondas",
    image: catMicroondas,
    span: "",
    textSize: "text-lg",
  },
  {
    title: "Centrífugas",
    subtitle: "Secagem rápida e eficiente",
    to: "/catalogo?categoria=centrifuga",
    image: catCentrifuga,
    span: "lg:col-span-2",
    textSize: "text-lg",
  },
];

const statIcons = [Users, TrendingUp, ThumbsUp, Star];

export default function Home() {
  const { cart, wishlist } = useOutletContext();
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  const featuredServices = services.slice(0, 3);

  useEffect(() => {
    setLoadingProducts(true);
    setErrorProducts(null);
    getProdutosDestaque(4)
      .then((res) => setFeaturedProducts(res.data))
      .catch((err) => setErrorProducts(err.message))
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) {
      setNewsletterSent(true);
      setEmail("");
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#001e40] via-[#003366] to-[#0059bb] overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0070ea]/20 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="container-max relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-[#0070ea]/20 text-[#a7c8ff] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider border border-[#0070ea]/30">
                Especialistas em Eletrodomésticos
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                Assistência Técnica{" "}
                <span className="text-[#a7c8ff]">Especializada</span> em
                Máquinas de Lavar
              </h1>
              <p className="text-[#8fa8c8] text-lg leading-relaxed mb-8 max-w-lg">
                Conserto, manutenção e venda de equipamentos com atendimento
                rápido e garantia. Técnicos certificados na sua casa em até 24
                horas.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/agendamento"
                  className="flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#0059bb] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#0070ea]/30"
                >
                  <Wrench size={18} />
                  Solicitar Orçamento
                </Link>
                <Link
                  to="/agendamento"
                  className="flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
                >
                  <Phone size={18} />
                  Agendar Visita Técnica
                </Link>
                <Link
                  to="/catalogo"
                  className="flex items-center gap-2 text-[#a7c8ff] px-4 py-3.5 font-medium hover:text-white transition-colors"
                >
                  Ver Produtos
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: CheckCircle, text: "Diagnóstico Gratuito" },
                  { icon: Shield, text: "90 dias de Garantia" },
                  { icon: Clock, text: "Atendimento em 24h" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-sm text-[#8fa8c8]"
                  >
                    <Icon size={15} className="text-[#0070ea]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Image + floating card */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[480px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroImg}
                  alt="Máquina de lavar moderna"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/40 to-transparent" />
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#cce0ff] rounded-xl flex items-center justify-center">
                    <Star
                      size={18}
                      className="text-[#003366]"
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[#003366] text-lg leading-none">
                      4.9/5
                    </p>
                    <p className="text-xs text-[#737780]">Avaliação média</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className="text-amber-400"
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="text-xs text-[#737780] mt-1">
                  +5.000 clientes satisfeitos
                </p>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-[#0070ea] text-white rounded-2xl p-4 shadow-xl">
                <p className="font-bold text-2xl leading-none">+10</p>
                <p className="text-xs text-[#a7c8ff]">anos de mercado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-[#e5e8ee]">
        <div className="container-max py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = statIcons[i];
              return (
                <div key={stat.label} className="text-center">
                  <div className="w-10 h-10 bg-[#cce0ff] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={18} className="text-[#003366]" />
                  </div>
                  <p className="text-2xl font-bold text-[#003366]">
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="text-sm text-[#737780] mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section className="py-16 bg-[#f7f9ff]">
        <div className="container-max">
          <SectionHeader
            badge="Por que nos escolher"
            title="Diferenciais que fazem a diferença"
            subtitle="Oferecemos muito mais do que um simples conserto. Conheça os benefícios de escolher a EletroCenter."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 card-hover border border-[#e5e8ee]"
              >
                <div className="w-11 h-11 bg-[#cce0ff] rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#003366]" />
                </div>
                <h3 className="font-semibold text-[#003366] mb-2">{title}</h3>
                <p className="text-sm text-[#43474f] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS ── */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Nosso Catálogo"
            title="Compre por Categoria"
            subtitle="Encontre o equipamento ideal para a sua necessidade com os melhores preços e condições."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:h-[520px]">
            {categoryCards.map((cat) => (
              <Link
                key={cat.title}
                to={cat.to}
                className={`relative overflow-hidden rounded-2xl group ${cat.span}`}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 min-h-[200px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/80 via-[#001e40]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3
                    className={`font-bold text-white ${cat.textSize} leading-tight`}
                  >
                    {cat.title}
                  </h3>
                  <p className="text-[#a7c8ff] text-sm mt-1">{cat.subtitle}</p>
                  <div className="flex items-center gap-1 text-white text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver produtos <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUTOS EM DESTAQUE ── */}
      <section className="py-16 bg-[#f7f9ff]">
        <div className="container-max">
          <div className="flex items-end justify-between mb-10">
            <SectionHeader
              badge="Destaques"
              title="Produtos em Destaque"
              subtitle="Os mais vendidos com os melhores preços e condições de parcelamento."
              center={false}
            />
            <Link
              to="/catalogo"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#0070ea] hover:text-[#003366] transition-colors flex-shrink-0 mb-10"
            >
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          {/* Loading skeleton */}
          {loadingProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-[#e5e8ee] animate-pulse"
                >
                  <div className="h-52 bg-[#e5e8ee]" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-[#e5e8ee] rounded w-1/3" />
                    <div className="h-4 bg-[#e5e8ee] rounded w-3/4" />
                    <div className="h-4 bg-[#e5e8ee] rounded w-1/2" />
                    <div className="h-8 bg-[#e5e8ee] rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {errorProducts && !loadingProducts && (
            <div className="text-center py-12">
              <p className="text-[#ba1a1a] font-medium mb-3">
                Não foi possível carregar os produtos.
              </p>
              <button
                onClick={() => {
                  setLoadingProducts(true);
                  setErrorProducts(null);
                  getProdutosDestaque(4)
                    .then((res) => setFeaturedProducts(res.data))
                    .catch((err) => setErrorProducts(err.message))
                    .finally(() => setLoadingProducts(false));
                }}
                className="text-sm text-[#0070ea] hover:underline font-medium"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Products grid */}
          {!loadingProducts && !errorProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={cart.addItem}
                  onToggleWishlist={wishlist.toggle}
                  isWishlisted={wishlist.isWishlisted(product.id)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 border-2 border-[#003366] text-[#003366] px-8 py-3 rounded-xl font-semibold hover:bg-[#003366] hover:text-white transition-all"
            >
              Ver Catálogo Completo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ASSISTÊNCIA TÉCNICA ── */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Assistência Técnica"
            title="Serviços Especializados"
            subtitle="Consertamos, instalamos e fazemos manutenção de todos os tipos de equipamentos de lavanderia."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/assistencia"
              className="inline-flex items-center gap-2 bg-[#003366] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#001e40] transition-all"
            >
              Ver Todos os Serviços <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARCAS ── */}
      <section className="py-14 bg-[#f7f9ff] border-y border-[#e5e8ee]">
        <div className="container-max">
          <SectionHeader
            badge="Marcas Atendidas"
            title="Atendemos Todas as Principais Marcas"
            subtitle="Nossos técnicos são treinados e certificados para atender os equipamentos das maiores marcas do mercado."
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 card-hover border border-[#e5e8ee] cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: brand.bgColor, color: brand.color }}
                >
                  {brand.initial}
                </div>
                <span className="text-xs font-medium text-[#43474f] text-center">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-16 bg-[#001e40]" id="depoimentos">
        <div className="container-max">
          <SectionHeader
            badge="Depoimentos"
            title="O que nossos clientes dizem"
            subtitle="Mais de 5.000 clientes satisfeitos em toda a Grande São Paulo."
            light
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= t.rating ? "text-amber-400" : "text-white/20"
                      }
                      fill={s <= t.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p className="text-[#a7c8ff] text-sm leading-relaxed mb-5 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#0070ea]"
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-[#8fa8c8]">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Dúvidas Frequentes"
            title="Perguntas Frequentes"
            subtitle="Tire suas principais dúvidas sobre nossos serviços e produtos."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-[#e5e8ee] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f7f9ff] transition-colors"
                >
                  <span className="font-medium text-[#181c20] text-sm pr-4">
                    {faq.question}
                  </span>
                  {openFaq === faq.id ? (
                    <ChevronUp
                      size={18}
                      className="text-[#0070ea] flex-shrink-0"
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className="text-[#737780] flex-shrink-0"
                    />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-4 text-sm text-[#43474f] leading-relaxed border-t border-[#e5e8ee] pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-16 bg-gradient-to-r from-[#003366] to-[#0070ea]">
        <div className="container-max text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Newsletter
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Receba Ofertas Exclusivas
          </h2>
          <p className="text-[#a7c8ff] mb-8 max-w-md mx-auto">
            Cadastre-se e receba promoções, dicas de manutenção e novidades
            diretamente no seu e-mail.
          </p>
          {newsletterSent ? (
            <div className="flex items-center justify-center gap-2 text-white font-semibold">
              <CheckCircle size={20} />
              Obrigado! Você receberá nossas novidades em breve.
            </div>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                aria-label="Seu e-mail para receber ofertas"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-[#a7c8ff] outline-none focus:border-white transition-colors text-sm"
              />
              <button
                type="submit"
                className="bg-white text-[#003366] px-6 py-3 rounded-xl font-semibold hover:bg-[#f1f4f9] transition-colors text-sm flex-shrink-0"
              >
                Cadastrar
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-12 bg-[#f7f9ff] border-t border-[#e5e8ee]">
        <div className="container-max text-center">
          <h2 className="text-xl font-bold text-[#003366] mb-2">
            Precisa de assistência técnica agora?
          </h2>
          <p className="text-[#43474f] mb-6 text-sm">
            Ligue ou mande mensagem. Atendemos de segunda a sábado.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:+5511999999999"
              className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#001e40] transition-all"
            >
              <Phone size={16} />
              (11) 9999-9999
            </a>
            <Link
              to="/agendamento"
              className="flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0059bb] transition-all"
            >
              <Wrench size={16} />
              Agendar Online
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
