'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPage() {
  const t = useTranslations('auth.forgot')
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    router.push('/auth/forgot-sent')
  }

  return (
    <AuthLayout>
      <div>
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B7385',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 28,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          {t('backToLogin')}
        </button>

        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0F1B2D',
            letterSpacing: '-0.8px',
            marginBottom: 6,
          }}
        >
          {t('title')}
        </h2>
        <p style={{ fontSize: 15, color: '#6B7385', marginBottom: 28 }}>
          {t('subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(229,72,77,0.08)',
                border: '1px solid rgba(229,72,77,0.20)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: '#E5484D',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F1B2D',
                marginBottom: 6,
              }}
            >
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                backgroundColor: '#F7F8FC',
                border: '1.5px solid #E5E7F0',
                borderRadius: 12,
                fontSize: 15,
                color: '#0F1B2D',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 52,
              backgroundColor: loading ? '#8B83F0' : '#5B4FE8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(91,79,232,0.30)',
            }}
          >
            {loading ? 'Sending…' : t('sendLink')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
