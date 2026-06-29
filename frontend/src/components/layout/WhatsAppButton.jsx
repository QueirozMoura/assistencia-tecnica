import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
  const phone = '5511965602135'
  const message = encodeURIComponent(
    'Olá! Gostaria de solicitar um orçamento para assistência técnica.'
  )
  const href = `https://wa.me/${phone}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-all hover:scale-105 active:scale-95 group"
    >
      <MessageCircle size={22} className="flex-shrink-0" />
      <span className="text-sm font-semibold hidden sm:block">WhatsApp</span>
    </a>
  )
}
