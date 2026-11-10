'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { CheckCircle2 } from 'lucide-react'

export default function SentPage() {
  const t = useTranslations('auth.sent')
  const router = useRouter()

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,200,150,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircle2 size={36} color="#00C896" />
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
        <p
          style={{
            fontSize: 14,
            color: '#9CA3B5',
            lineHeight: 1.6,
            marginBottom: 36,
          }}
        >
          {t('description')}
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
