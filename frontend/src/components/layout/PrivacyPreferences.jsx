import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  COOKIE_DEFAULT_PREFERENCES,
  normalizeCookiePreferences,
} from '../../constants/cookies'

function CookieSettingsModal({
  open,
  draftPreferences,
  onChange,
  onClose,
  onSave,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações de Cookies"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Configurações de Cookies</h2>
            <p className="text-sm text-slate-600 mt-1">
              Escolha quais cookies deseja permitir. Você pode alterar essas preferências a qualquer momento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Cookies Essenciais</h3>
                <p className="text-sm text-slate-600">
                  Necessários para o funcionamento básico da plataforma.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Sempre ativo
              </span>
            </div>
          </div>

          <label className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <h3 className="font-semibold text-slate-900">Cookies de Estatísticas</h3>
              <p className="text-sm text-slate-600">
                Ajudam a entender como o site é utilizado para melhorar a experiência.
              </p>
            </div>
            <input
              type="checkbox"
              checked={draftPreferences.statistics}
              onChange={(e) => onChange({ statistics: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 accent-[#0070ea]"
            />
          </label>

          <label className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <h3 className="font-semibold text-slate-900">Cookies de Marketing</h3>
              <p className="text-sm text-slate-600">
                Usados para personalizar campanhas e exibir conteúdos relevantes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={draftPreferences.marketing}
              onChange={(e) => onChange({ marketing: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 accent-[#0070ea]"
            />
          </label>

          <p className="text-xs text-slate-500">
            Consulte nossa{' '}
            <Link to="/politica-de-privacidade" className="text-[#0070ea] hover:underline">
              Política de Privacidade
            </Link>{' '}
            para mais detalhes.
          </p>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-[#0070ea] text-white font-semibold hover:bg-[#0059bb] transition-colors"
          >
            Salvar preferências
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CookieConsent({
  shouldShowBanner,
  openSettings,
  currentPreferences,
  onAcceptAll,
  onAcceptEssential,
  onSavePreferences,
  onOpenSettings,
  onCloseSettings,
}) {
  const [draftPreferences, setDraftPreferences] = useState(() => normalizeCookiePreferences(currentPreferences || COOKIE_DEFAULT_PREFERENCES))
  const [previous, setPrevious] = useState({ currentPreferences, openSettings })
  if (previous.currentPreferences !== currentPreferences || previous.openSettings !== openSettings) {
    setPrevious({ currentPreferences, openSettings })
    setDraftPreferences(normalizeCookiePreferences(currentPreferences || COOKIE_DEFAULT_PREFERENCES))
  }

  const handleChange = (patch) => {
    setDraftPreferences((prev) => normalizeCookiePreferences({ ...prev, ...patch }))
  }

  return (
    <>
      {shouldShowBanner && (
        <div
          role="region"
          aria-label="Aviso de cookies"
          className="fixed bottom-3 left-3 right-3 z-[60] sm:bottom-5 sm:left-5 sm:right-auto sm:w-[380px]"
        >
          <div className="rounded-2xl bg-white border border-[#e5e8ee] shadow-[0_16px_40px_-12px_rgba(0,51,102,0.3)] p-4 sm:p-5">
            <h2 className="text-sm font-bold text-[#003366]">Nós usamos cookies</h2>
            <p className="text-[13px] text-[#43474f] mt-1.5 leading-relaxed">
              Usamos cookies essenciais para o site funcionar e, com seu consentimento, cookies de
              estatísticas e marketing. Veja a{' '}
              <Link to="/politica-de-privacidade" className="text-[#0070ea] hover:underline font-medium focus-visible:outline-2 focus-visible:outline-[#0070ea] rounded">
                Política de Privacidade
              </Link>
              .
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onAcceptAll}
                className="h-10 rounded-lg bg-[#0070ea] text-white text-sm font-semibold hover:bg-[#0059bb] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={onAcceptEssential}
                className="h-10 rounded-lg border border-[#c3d4ea] text-[#003366] text-sm font-semibold hover:border-[#0070ea] hover:bg-[#f5f9ff] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
              >
                Só essenciais
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftPreferences(normalizeCookiePreferences(currentPreferences || COOKIE_DEFAULT_PREFERENCES))
                  onOpenSettings?.()
                }}
                className="col-span-2 h-8 rounded-lg text-[13px] font-semibold text-[#0070ea] hover:bg-[#e9f3ff] transition-colors focus-visible:outline-2 focus-visible:outline-[#0070ea]"
              >
                Configurar cookies
              </button>
            </div>
          </div>
        </div>
      )}

      <CookieSettingsModal
        open={openSettings}
        draftPreferences={draftPreferences}
        onChange={handleChange}
        onClose={onCloseSettings}
        onSave={() => onSavePreferences(draftPreferences)}
      />
    </>
  )
}
