import mariaAvatar from '../assets/images/avatars/maria.svg'
import joaoAvatar from '../assets/images/avatars/joao.svg'
import anaAvatar from '../assets/images/avatars/ana.svg'
import carlosAvatar from '../assets/images/avatars/carlos.svg'
import fernandaAvatar from '../assets/images/avatars/fernanda.svg'
import robertoAvatar from '../assets/images/avatars/roberto.svg'

export const testimonials = [
  {
    id: 1,
    name: 'Maria Silva',
    city: 'São Paulo, SP',
    rating: 5,
    text: 'Excelente atendimento! O técnico chegou no horário marcado, identificou o problema rapidamente e minha máquina de lavar voltou a funcionar perfeitamente. Super recomendo!',
    service: 'Conserto de Máquina de Lavar',
    avatar: mariaAvatar,
    date: 'Novembro 2024',
  },
  {
    id: 2,
    name: 'João Oliveira',
    city: 'Guarulhos, SP',
    rating: 5,
    text: 'Comprei uma máquina de lavar Samsung e a instalação foi feita no mesmo dia. Profissionais muito competentes e educados. Preço justo e serviço de qualidade.',
    service: 'Instalação de Equipamento',
    avatar: joaoAvatar,
    date: 'Outubro 2024',
  },
  {
    id: 3,
    name: 'Ana Costa',
    city: 'Santo André, SP',
    rating: 5,
    text: 'Meu lava e seca parou de funcionar numa sexta à noite. Liguei para o atendimento emergencial e no sábado de manhã o técnico já estava aqui. Problema resolvido em 2 horas!',
    service: 'Atendimento Emergencial',
    avatar: anaAvatar,
    date: 'Dezembro 2024',
  },
  {
    id: 4,
    name: 'Carlos Mendes',
    city: 'São Bernardo do Campo, SP',
    rating: 5,
    text: 'Fiz a manutenção preventiva da minha máquina de lavar e o resultado foi incrível. Ficou silenciosa e lavando muito melhor. Vale muito a pena investir na manutenção.',
    service: 'Manutenção Preventiva',
    avatar: carlosAvatar,
    date: 'Janeiro 2025',
  },
  {
    id: 5,
    name: 'Fernanda Lima',
    city: 'Osasco, SP',
    rating: 4,
    text: 'Ótimo atendimento e preço competitivo. A centrífuga foi consertada rapidamente e com garantia. Já indiquei para vários amigos e todos ficaram satisfeitos.',
    service: 'Conserto de Centrífuga',
    avatar: fernandaAvatar,
    date: 'Fevereiro 2025',
  },
  {
    id: 6,
    name: 'Roberto Santos',
    city: 'Mauá, SP',
    rating: 5,
    text: 'Comprei um lava e seca LG pelo site e recebi em 3 dias. A entrega foi cuidadosa e a instalação foi feita pelos técnicos da empresa. Tudo perfeito!',
    service: 'Compra e Instalação',
    avatar: robertoAvatar,
    date: 'Março 2025',
  },
]

export const stats = [
  { value: '+10', label: 'Anos de Mercado', suffix: '' },
  { value: '+5.000', label: 'Atendimentos Realizados', suffix: '' },
  { value: '98%', label: 'Clientes Satisfeitos', suffix: '' },
  { value: '4.9', label: 'Avaliação Média', suffix: '/5' },
]
