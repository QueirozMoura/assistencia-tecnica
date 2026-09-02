/*
 * Logos das marcas: ao adicionar um SVG em src/assets/brands/, importe-o aqui
 * e atribua ao campo `logo` da marca correspondente. Enquanto `logo` for
 * undefined, a Home exibe o fallback com a inicial da marca.
 *
 * Ex.: import logoBrastemp from '../assets/brands/brastemp.svg'
 */
import logoBrastemp from '../assets/brands/brastemp.png'
import logoConsul from '../assets/brands/consul.png'
import logoElectrolux from '../assets/brands/electrolux.svg'
import logoLG from '../assets/brands/lg.svg'
import logoSamsung from '../assets/brands/samsung.svg'
import logoPanasonic from '../assets/brands/panasonic.svg'
import logoMidea from '../assets/brands/midea.svg'
export const brands = [
  {
    id: 1,
    name: 'Brastemp',
    logo: logoBrastemp,
    color: '#003087',
    bgColor: '#EEF2FF',
    initial: 'B',
  },
  {
    id: 2,
    name: 'Consul',
    logo: logoConsul,
    color: '#E31837',
    bgColor: '#FFF0F2',
    initial: 'C',
  },
  {
    id: 3,
    name: 'Electrolux',
    logo: logoElectrolux,
    color: '#0066CC',
    bgColor: '#EEF5FF',
    initial: 'E',
  },
  {
    id: 4,
    name: 'LG',
    logo: logoLG,
    color: '#A50034',
    bgColor: '#FFF0F4',
    initial: 'LG',
  },
  {
    id: 5,
    name: 'Samsung',
    logo: logoSamsung,
    color: '#1428A0',
    bgColor: '#EEF0FF',
    initial: 'S',
  },
  {
    id: 6,
    name: 'Panasonic',
    logo: logoPanasonic,
    color: '#003087',
    bgColor: '#EEF2FF',
    initial: 'P',
  },
  {
    id: 7,
    name: 'Midea',
    logo: logoMidea,
    color: '#E31837',
    bgColor: '#FFF0F2',
    initial: 'M',
  },
  {
    id: 8,
    name: 'Philco',
    logo: undefined,
    color: '#0066CC',
    bgColor: '#EEF5FF',
    initial: 'Ph',
  },
]

export const faqs = [
  {
    id: 1,
    question: 'Qual o prazo para o técnico chegar após o agendamento?',
    answer: 'Nosso prazo padrão é de até 24 horas úteis após o agendamento. Para atendimentos emergenciais, chegamos em até 4 horas. Trabalhamos de segunda a sábado, das 8h às 18h.',
  },
  {
    id: 2,
    question: 'O diagnóstico tem algum custo?',
    answer: 'O diagnóstico é gratuito! Nosso técnico avalia o equipamento sem custo e apresenta o orçamento detalhado. Você só paga se aprovar o serviço.',
  },
  {
    id: 3,
    question: 'Quais marcas vocês atendem?',
    answer: 'Atendemos todas as principais marcas do mercado: Brastemp, Consul, Electrolux, LG, Samsung, Panasonic, Midea, Philco, Whirlpool e outras. Se tiver dúvida sobre sua marca, entre em contato.',
  },
  {
    id: 4,
    question: 'As peças utilizadas são originais?',
    answer: 'Sim! Utilizamos exclusivamente peças originais ou de primeira linha compatíveis com o fabricante. Isso garante a durabilidade do reparo e mantém a garantia do equipamento.',
  },
  {
    id: 5,
    question: 'Qual a garantia dos serviços prestados?',
    answer: 'Todos os nossos serviços têm garantia mínima de 90 dias. Peças instaladas têm garantia do fabricante. Em caso de qualquer problema dentro do prazo, retornamos sem custo adicional.',
  },
  {
    id: 6,
    question: 'Vocês atendem em qual região?',
    answer: 'Atendemos toda a Grande São Paulo, incluindo São Paulo capital, ABC Paulista, Guarulhos, Osasco e região. Para outras cidades, entre em contato para verificar disponibilidade.',
  },
]
