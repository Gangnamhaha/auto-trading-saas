'use client'

import { useState } from 'react'
import { useI18n, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from '@/lib/i18n'

export function LanguageSelector() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)

  const locales: Locale[] = ['ko', 'en', 'ja', 'zh']

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        <span className="text-xs text-gray-400">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border bg-white py-1 shadow-lg">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLocale(l)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${locale === l ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                <span>{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_NAMES[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
