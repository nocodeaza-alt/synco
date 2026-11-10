'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

// Workspace ID for OAuth redirect — in real app comes from session
const WORKSPACE_ID = '20000000-0000-0000-0000-000000000001'

const integrations = [
  {
    key: 'googleDrive',
    descKey: 'googleDriveDesc',
    oauthPath: `/api/auth/google?workspaceId=${WORKSPACE_ID}`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M6.28 15.28L2 21h8l4.28-5.72z"/>
        <path fill="#34A853" d="M14 21h8l-4-6.93L14 21z"/>
        <path fill="#FBBC04" d="M8 3L2 21l4.28-5.72L12 8l-4-5z"/>
        <path fill="#EA4335" d="M12 8l4 6.07L22 21l-4-6.93L12 8z"/>
        <path fill="#4285F4" d="M8 3l8 0 6 9.07-4 0z" opacity="0.5"/>
      </svg>
    ),
    connected: false,
  },
  {
    key: 'googleCalendar',
    descKey: 'googleCalendarDesc',
    oauthPath: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" fill="#4285F4" opacity="0.15"/>
        <rect x="3" y="4" width="18" height="4" rx="2" fill="#4285F4"/>
        <path d="M8 2v4M16 2v4" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 13h4v3H7z" fill="#EA4335"/>
        <path d="M13 12h4M13 15h4" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    connected: false,
  },
  {
    key: 'slack',
    descKey: 'slackDesc',
    oauthPath: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M9.5 15.5a1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5V9.5A1.5 1.5 0 0 1 8 8a1.5 1.5 0 0 1 1.5 1.5" fill="#E01E5A"/>
        <path d="M15.5 9.5a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5" fill="#36C5F0"/>
        <path d="M9.5 8a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5H15.5A1.5 1.5 0 0 1 17 8a1.5 1.5 0 0 1-1.5 1.5" fill="#2EB67D"/>
        <path d="M15.5 15.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5H9.5A1.5 1.5 0 0 1 8 17a1.5 1.5 0 0 1 1.5-1.5" fill="#ECB22E"/>
      </svg>
    ),
    connected: false,
  },
  {
    key: 'notion',
    descKey: 'notionDesc',
    oauthPath: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="#ffffff" stroke="#e5e7f0" strokeWidth="1"/>
        <path d="M7 7h6M7 11h8M7 15h5" stroke="#0F1B2D" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    connected: false,
  },
]

export default function IntegrationsPage() {
  const t = useTranslations('settings.integrations')
  const searchParams = useSearchParams()
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected === 'google_drive') {
      setConnectedMap(prev => ({ ...prev, googleDrive: true }))
      setToast('Google Drive connected successfully')
      setTimeout(() => setToast(''), 3000)
    }
    if (error) {
      setToast('Connection failed. Check your Google OAuth credentials.')
      setTimeout(() => setToast(''), 4000)
    }
  }, [searchParams])

  function handleConnect(key: string, oauthPath: string | null) {
    if (oauthPath) { window.location.href = oauthPath; return }
    setConnectedMap(prev => ({ ...prev, [key]: true }))
    setToast(`${key} connected`)
    setTimeout(() => setToast(''), 2000)
  }

  function handleDisconnect(key: string) {
    setConnectedMap(prev => ({ ...prev, [key]: false }))
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7385' }}>{t('subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        {integrations.map(({ key, descKey, icon, oauthPath }) => {
          const isConnected = connectedMap[key] ?? false

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                backgroundColor: '#ffffff',
                borderRadius: 14,
                border: '1px solid #ECEEF5',
                boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#F7F8FC',
                  border: '1px solid #ECEEF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>
                  {t(key as 'googleDrive')}
                </p>
                <p style={{ fontSize: 13, color: '#9CA3B5' }}>
                  {t(descKey as 'googleDriveDesc')}
                </p>
              </div>

              {/* Status + button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {isConnected && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#00936E',
                      backgroundColor: 'rgba(0,200,150,0.10)',
                      padding: '3px 9px',
                      borderRadius: 99,
                    }}
                  >
                    {t('connected')}
                  </span>
                )}
                <button
                  onClick={() => isConnected ? handleDisconnect(key) : handleConnect(key, oauthPath ?? null)}
                  style={{
                    height: 34,
                    padding: '0 14px',
                    border: `1.5px solid ${isConnected ? '#ECEEF5' : '#5B4FE8'}`,
                    borderRadius: 9,
                    backgroundColor: isConnected ? '#ffffff' : '#5B4FE8',
                    color: isConnected ? '#6B7385' : '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isConnected ? t('disconnect') : t('connect')}
                  {!isConnected && <ExternalLink size={12} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Google Drive auto-save note */}
      <div style={{ marginTop: 24, maxWidth: 560, padding: '14px 16px', borderRadius: 12, background: 'rgba(91,79,232,.06)', border: '1px solid rgba(91,79,232,.15)', fontSize: 13, color: '#5B4FE8' }}>
        <strong>Google Drive auto-save</strong> — when connected, completed task results are automatically saved to <code>SYNCO / Department / Task</code> in your Drive.
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 18px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,27,45,.3)', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
