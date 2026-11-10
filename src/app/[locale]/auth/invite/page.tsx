'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Building2, Users, User, Briefcase, ShieldCheck } from 'lucide-react'

export default function InvitePage() {
  const t = useTranslations('auth.invite')
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Demo invite data (would come from URL token in real app)
  const inviteData = {
    workspace: 'SYNCO Demo',
    department: 'Marketing',
    teamLead: 'Jane Smith',
    position: 'Content Manager',
    accessLevel: 'Member',
    inviterName: 'Jane Smith',
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // In real app: exchange invite token for session
    router.push('/onboarding/member')
  }

  async function handleGoogleAccept() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/member`,
      },
    })
  }

  const detailRows = [
    { icon: Building2, label: t('workspace'), value: inviteData.workspace },
    { icon: Users, label: t('department'), value: inviteData.department },
    { icon: User, label: t('teamLead'), value: inviteData.teamLead },
    { icon: Briefcase, label: t('position'), value: inviteData.position },
    { icon: ShieldCheck, label: t('accessLevel'), value: inviteData.accessLevel },
  ]

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
        <p style={{ fontSize: 15, color: '#6B7385', marginBottom: 24 }}>
          {t('subtitle')} <strong style={{ color: '#0F1B2D' }}>{inviteData.workspace}</strong>
        </p>

        {/* Invite card */}
        <div
          style={{
            border: '1.5px solid #ECEEF5',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 24,
            backgroundColor: '#FAFBFF',
          }}
        >
          {detailRows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #ECEEF5',
              }}
            >
              <Icon size={14} color="#9CA3B5" />
              <span style={{ fontSize: 13, color: '#9CA3B5', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F1B2D' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleAccept}
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
            marginBottom: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {t('continueWithGoogle')}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#ECEEF5' }} />
          <span style={{ fontSize: 13, color: '#9CA3B5' }}>{t('setPassword')}</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#ECEEF5' }} />
        </div>

        <form onSubmit={handleAccept}>
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
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
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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
            {loading ? 'Accepting…' : t('acceptInvite')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
