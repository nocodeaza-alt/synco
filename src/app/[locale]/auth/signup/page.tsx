'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

type Tab = 'create' | 'join'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Create workspace fields
  const [workspaceName, setWorkspaceName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Join team fields
  const [joinEmail, setJoinEmail] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinNote, setJoinNote] = useState('')

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          workspace_name: workspaceName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding/owner')
  }

  async function handleJoinRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // In real app: insert into join_requests table
    router.push('/auth/sent')
  }

  const inputStyle = {
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
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#0F1B2D',
    marginBottom: 6,
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            backgroundColor: '#F2F3F9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
          }}
        >
          {(['create', 'join'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              style={{
                flex: 1,
                height: 36,
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: tab === tabKey ? '#ffffff' : 'transparent',
                color: tab === tabKey ? '#0F1B2D' : '#6B7385',
                boxShadow: tab === tabKey ? '0 1px 4px rgba(15,27,45,0.08)' : 'none',
              }}
            >
              {tabKey === 'create' ? t('createWorkspace') : t('joinTeam')}
            </button>
          ))}
        </div>

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

        {tab === 'create' ? (
          <form onSubmit={handleCreateWorkspace}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('workspaceName')}</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={t('workspaceNamePlaceholder')}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
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
              {loading ? 'Creating…' : t('createWorkspaceBtn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRequest}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('fullName')}</label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('email')}</label>
              <input
                type="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t('note')}</label>
              <textarea
                value={joinNote}
                onChange={(e) => setJoinNote(e.target.value)}
                placeholder={t('notePlaceholder')}
                rows={3}
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '12px 16px',
                  resize: 'none' as const,
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
              {loading ? 'Sending…' : t('requestAccess')}
            </button>
          </form>
        )}

        <p style={{ fontSize: 14, color: '#6B7385', textAlign: 'center', marginTop: 24 }}>
          {t('alreadyHaveAccount')}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              router.push('/auth/login')
            }}
            style={{ color: '#5B4FE8', fontWeight: 600, textDecoration: 'none' }}
          >
            {t('signIn')}
          </a>
        </p>
      </div>
    </AuthLayout>
  )
}
