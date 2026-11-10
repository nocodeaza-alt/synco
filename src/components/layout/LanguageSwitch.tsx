'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitch() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(newLocale: string) {
    router.push(pathname, { locale: newLocale })
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#ffffff',
        border: '1.5px solid #ECEEF5',
        borderRadius: 99,
        padding: '4px',
        boxShadow: '0 4px 16px rgba(15,27,45,0.08)',
        zIndex: 1000,
      }}
    >
      {(['en', 'ru'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLocale(lang)}
          style={{
            width: 34,
            height: 28,
            borderRadius: 99,
            border: 'none',
            backgroundColor: locale === lang ? '#5B4FE8' : 'transparent',
            color: locale === lang ? '#ffffff' : '#6B7385',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            textTransform: 'uppercase',
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
