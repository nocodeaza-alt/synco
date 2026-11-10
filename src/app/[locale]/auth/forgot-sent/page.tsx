'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Mail } from 'lucide-react'

export default function ForgotSentPage() {
  const t = useTranslations('auth.forgotSent')
  const router = useRouter()
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'rgba(91,79,232,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Mail size={36} color="#5B4FE8" />
        </div>

        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0F1B2D',
            letterSpacing: '-0.8px',
            marginBottom: 8,
          }}
        >
          {t('title')}
        </h2>
        <p style={{ fontSize: 15, color: '#6B7385', marginBottom: 12 }}>
          {t('subtitle')}
        </p>

        <p style={{ fontSize: 14, color: '#9CA3B5', marginBottom: 32 }}>
          {t('description')}{' '}
          {canResend ? (
            <button
              onClick={() => {
                setCountdown(30)
                setCanResend(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#5B4FE8',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                padding: 0,
              }}
            >
              {t('resend')}
            </button>
          ) : (
            <span style={{ color: '#9CA3B5' }}>
              {t('resendIn', { seconds: countdown })}
            </span>
          )}
        </p>

        <button
          onClick={() => router.push('/auth/login')}
          style={{
            width: '100%',
            height: 48,
            backgroundColor: '#F2F3F9',
            color: '#5B4FE8',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('backToLogin')}
        </button>
      </div>
    </AuthLayout>
  )
}
