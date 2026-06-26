import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Clock,
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
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dcecff_0%,_#f5f9ff_40%,_#ffffff_100%)] pt-14 pb-16 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-24">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#0070ea]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#003366]/10 blur-3xl" />

        <div className="container-max relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Left */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cce0ff] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#003366] shadow-sm">
                <Wrench size={14} className="text-[#0070ea]" />
                Assistência Técnica Especializada
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#003366] sm:text-[2.7rem] lg:text-5xl">
                Seu e-commerce de
                <span className="block text-[#0070ea]">
                  Eletrodomésticos e Assistência
                </span>
                com padrão premium
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#43474f] sm:text-lg lg:mx-0">
                Compre com segurança, agende assistência com rapidez e conte com
                atendimento especializado para manter seus equipamentos sempre
                em alta performance.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/catalogo"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0070ea] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#0070ea]/25 transition-all hover:-translate-y-0.5 hover:bg-[#0059bb] sm:w-auto"
                >
                  Comprar Agora
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/agendamento"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7d2f8] bg-white px-6 py-3.5 font-semibold text-[#003366] shadow-sm transition-all hover:border-[#0070ea] hover:text-[#0070ea] sm:w-auto"
                >
                  <Phone size={16} />
                  Agendar Assistência
                </Link>
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
                {[
                  "Atendimento especializado",
                  "Garantia nos serviços",
                  "Produtos originais",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#e5e8ee] bg-white px-3 py-2 text-sm text-[#43474f] shadow-sm lg:justify-start"
                  >
                    <CheckCircle size={15} className="text-[#0070ea]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white p-2 shadow-[0_20px_60px_-25px_rgba(0,51,102,0.35)]">
                <div className="relative overflow-hidden rounded-[1.35rem]">
                  <img
                    src={heroImg}
                    alt="Assistência técnica premium em eletrodomésticos"
                    className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[450px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#003366]/35 via-transparent to-[#0070ea]/10" />
                </div>
              </div>

              <div className="absolute -left-3 top-5 rounded-2xl border border-[#dbe9ff] bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:-left-5 sm:px-5">
                <p className="text-xl font-bold leading-none text-[#003366] sm:text-2xl">
                  +1000
                </p>
                <p className="mt-1 text-xs font-medium text-[#5d6672]">
                  clientes atendidos
                </p>
              </div>

              <div className="absolute -right-3 top-1/2 rounded-2xl border border-[#dbe9ff] bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:-right-5 sm:px-5">
                <p className="text-sm font-bold text-[#003366] sm:text-base">
                  Garantia de 90 dias
                </p>
                <p className="text-xs text-[#5d6672]">em serviços prestados</p>
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-[#dbe9ff] bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:bottom-5 sm:px-5">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#0070ea]" />
                  <p className="text-sm font-semibold text-[#003366]">
                    Atendimento rápido
                  </p>
                </div>
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
