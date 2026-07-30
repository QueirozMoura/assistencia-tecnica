import { useEffect, useState } from 'react'
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
  const [draftPreferences, setDraftPreferences] = useState(COOKIE_DEFAULT_PREFERENCES)

  useEffect(() => {
    setDraftPreferences(normalizeCookiePreferences(currentPreferences || COOKIE_DEFAULT_PREFERENCES))
  }, [currentPreferences, openSettings])

  const handleChange = (patch) => {
    setDraftPreferences((prev) => normalizeCookiePreferences({ ...prev, ...patch }))
  }

  return (
    <>
      {shouldShowBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-5 md:px-6 md:py-6 flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex-1">
                <h2 className="text-base md:text-lg font-bold text-slate-900">Nós usamos cookies</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Utilizamos cookies essenciais para funcionamento do site e, com seu consentimento,
                  cookies de estatísticas e marketing. Você pode gerenciar suas preferências quando quiser.
                  Veja nossa{' '}
                  <Link to="/politica-de-privacidade" className="text-[#0070ea] hover:underline font-medium">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>

              <div className="w-full lg:w-auto grid sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={onAcceptAll}
                  className="px-4 py-2.5 rounded-lg bg-[#0070ea] text-white font-semibold hover:bg-[#0059bb] transition-colors"
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  onClick={onAcceptEssential}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Apenas essenciais
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftPreferences(normalizeCookiePreferences(currentPreferences || COOKIE_DEFAULT_PREFERENCES))
                    onOpenSettings?.()
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[#0070ea] text-[#0070ea] font-semibold hover:bg-[#e9f3ff] transition-colors"
                >
                  Configurar cookies
                </button>
              </div>
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
