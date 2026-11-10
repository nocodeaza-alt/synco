'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

const demoRoles = [
  { key: 'owner', email: 'olga@synco.com', color: '#0F1B2D', bg: 'rgba(15,27,45,0.06)' },
  { key: 'cLevel', email: 'vera@synco.com', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'teamLead', email: 'jane@synco.com', color: '#5B4FE8', bg: 'rgba(91,79,232,0.08)' },
  { key: 'member', email: 'tom@synco.com', color: '#00936E', bg: 'rgba(0,200,150,0.08)' },
]

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/flow')
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  function handleDemoLogin(email: string) {
    setEmail(email)
    setPassword('demo1234')
  }

  return (
    <AuthLayout>
      <div>
        {/* Title */}
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

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            border: '1.5px solid #E5E7F0',
            borderRadius: 12,
            backgroundColor: '#ffffff',
            fontSize: 15,
            fontWeight: 600,
            color: '#0F1B2D',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {t('continueWithGoogle')}
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#ECEEF5' }} />
          <span style={{ fontSize: 13, color: '#9CA3B5' }}>{t('orSignInWithEmail')}</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#ECEEF5' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn}>
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

          {/* Email */}
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
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}
              >
                {t('password')}
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/auth/forgot')
                }}
                style={{
                  fontSize: 13,
                  color: '#5B4FE8',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {t('forgotPassword')}
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 44px 0 16px',
                  backgroundColor: '#F7F8FC',
                  border: '1.5px solid #E5E7F0',
                  borderRadius: 12,
                  fontSize: 15,
                  color: '#0F1B2D',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
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
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign in button */}
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
              transition: 'all 0.15s',
              marginTop: 20,
              marginBottom: 24,
            }}
          >
            {loading ? 'Signing in…' : t('signIn')}
          </button>
        </form>

        {/* Demo panel */}
        <div
          style={{
            border: '1.5px dashed #D9D5F7',
            borderRadius: 14,
            backgroundColor: '#FBFAFF',
            padding: '16px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#5B4FE8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 4,
            }}
          >
            {t('demoPanel.title')}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3B5', marginBottom: 12 }}>
            {t('demoPanel.subtitle')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {demoRoles.map((role) => (
              <button
                key={role.key}
                onClick={() => handleDemoLogin(role.email)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: role.bg,
                  border: `1px solid ${role.color}22`,
                  borderRadius: 9,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = role.color + '14')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = role.bg)
                }
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: role.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  {t(`demoPanel.${role.key as 'owner' | 'cLevel' | 'teamLead' | 'member'}`)}
                </div>
                <div style={{ fontSize: 12, color: '#6B7385', marginTop: 1 }}>
                  {t(`demoPanel.${role.key === 'owner' ? 'ownerName' : role.key === 'cLevel' ? 'cLevelName' : role.key === 'teamLead' ? 'teamLeadName' : 'memberName'}` as 'demoPanel.ownerName')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: '#6B7385' }}>
            {t('noAccount')}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                router.push('/auth/signup')
              }}
              style={{ color: '#5B4FE8', fontWeight: 600, textDecoration: 'none' }}
            >
              {t('requestAccess')}
            </a>
          </p>
          <p style={{ fontSize: 14, color: '#6B7385' }}>
            {t('gotInvite')}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                router.push('/auth/invite')
              }}
              style={{ color: '#5B4FE8', fontWeight: 600, textDecoration: 'none' }}
            >
              {t('acceptInvite')}
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
