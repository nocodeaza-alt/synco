'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Upload, Globe } from 'lucide-react'

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Tokyo', 'Australia/Sydney',
]

export default function ProfilePage() {
  const t = useTranslations('settings.profile')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [fullName, setFullName] = useState('Olga White')
  const [position, setPosition] = useState('Owner')
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [saved, setSaved] = useState(false)

  function switchLocale(newLocale: string) {
    router.push(pathname, { locale: newLocale })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: '100%',
    height: 44,
    padding: '0 14px',
    backgroundColor: '#F7F8FC',
    border: '1.5px solid #E5E7F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F1B2D',
    outline: 'none',
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7385' }}>{t('subtitle')}</p>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #ECEEF5',
          padding: '28px',
          maxWidth: 560,
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
        }}
      >
        <form onSubmit={handleSave}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5B4FE8, #3B33B0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              OW
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0F1B2D', marginBottom: 4 }}>
                {fullName}
              </p>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  border: '1.5px solid #E5E7F0',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6B7385',
                  cursor: 'pointer',
                }}
              >
                <Upload size={13} />
                {t('uploadPhoto')}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('position')}
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
              {t('email')}
            </label>
            <input
              type="email"
              defaultValue="olga@synco.com"
              disabled
              style={{ ...inputStyle, backgroundColor: '#F2F3F9', color: '#9CA3B5', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
              {t('timeZone')}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 8 }}>
              {t('language')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => switchLocale(lang)}
                  style={{
                    height: 36,
                    padding: '0 16px',
                    border: `1.5px solid ${locale === lang ? '#5B4FE8' : '#E5E7F0'}`,
                    borderRadius: 9,
                    backgroundColor: locale === lang ? '#F0EEFF' : '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    color: locale === lang ? '#5B4FE8' : '#6B7385',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Globe size={13} />
                  {lang === 'en' ? 'English' : 'Русский'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              height: 44,
              padding: '0 24px',
              backgroundColor: saved ? '#00C896' : '#5B4FE8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: saved ? 'none' : '0 6px 16px rgba(91,79,232,0.25)',
              transition: 'all 0.2s',
            }}
          >
            {saved ? 'Saved!' : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}
