import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { es } from './es'
import { en } from './en'
import { STORAGE_KEYS } from '../config'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type Lang = 'es' | 'en'
export type TranslationKey = keyof typeof es

const dicts: Record<Lang, Record<TranslationKey, string>> = { es, en }

function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')
    ? 'en'
    : 'es'
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nValue>({ lang: 'es', setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useLocalStorage<Lang>(STORAGE_KEYS.lang, detectLang())
  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>
}

export function useLang(): I18nValue {
  return useContext(I18nContext)
}

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

export function useT(): Translate {
  const { lang } = useContext(I18nContext)
  return useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let text: string = dicts[lang][key] ?? key
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [lang],
  )
}
