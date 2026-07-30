export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent-preferences-v1'

export const COOKIE_DEFAULT_PREFERENCES = {
  essentials: true,
  statistics: false,
  marketing: false,
}

export function normalizeCookiePreferences(input) {
  return {
    essentials: true,
    statistics: Boolean(input?.statistics),
    marketing: Boolean(input?.marketing),
  }
}

export function createCookieConsentPayload(preferences) {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    preferences: normalizeCookiePreferences(preferences),
  }
}
