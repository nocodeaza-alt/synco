'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Check, X } from 'lucide-react'

interface Rule {
  key: string
  check: (p: string, c: string) => boolean
}

const rules: Rule[] = [
  { key: 'length', check: (p) => p.length >= 8 },
  { key: 'number', check: (p) => /\d/.test(p) },
  { key: 'upper', check: (p) => /[A-Z]/.test(p) },
  { key: 'lower', check: (p) => /[a-z]/.test(p) },
  { key: 'match', check: (p, c) => p === c && p.length > 0 },
]

export default function ResetPage() {
  const t = useTranslations('auth.reset')
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allValid = rules.every((r) => r.check(password, confirm))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) return
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/flow')
  }

  const inputStyle = {
    width: '100%',
    height: 48,
    padding: '0 44px 0 16px',
    backgroundColor: '#F7F8FC',
    border: '1.5px solid #E5E7F0',
    borderRadius: 12,
    fontSize: 15,
    color: '#0F1B2D',
    outline: 'none',
  }

  return (
    <AuthLayout>
      <div>
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

          {/* New password */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F1B2D',
                marginBottom: 6,
              }}
            >
              {t('newPassword')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3B5',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
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
              {t('confirmPassword')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3B5',
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password rules */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginBottom: 24,
              padding: '14px 16px',
              backgroundColor: '#F7F8FC',
              borderRadius: 10,
            }}
          >
            {rules.map((rule) => {
              const valid = rule.check(password, confirm)
              return (
                <div
                  key={rule.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: valid ? 'rgba(0,200,150,0.12)' : '#ECEEF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {valid ? (
                      <Check size={10} color="#00936E" strokeWidth={3} />
                    ) : (
                      <X size={10} color="#B7BCCB" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: valid ? '#00936E' : '#9CA3B5',
                    }}
                  >
                    {t(`rules.${rule.key as 'length' | 'number' | 'upper' | 'lower' | 'match'}`)}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            type="submit"
            disabled={loading || !allValid}
            style={{
              width: '100%',
              height: 52,
              backgroundColor: !allValid || loading ? '#8B83F0' : '#5B4FE8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: !allValid || loading ? 'not-allowed' : 'pointer',
              boxShadow: allValid ? '0 8px 20px rgba(91,79,232,0.30)' : 'none',
            }}
          >
            {loading ? 'Setting…' : t('setPassword')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
