'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { SyncoWordmark } from '@/components/layout/SyncoLogo'
import { Upload, CheckCircle2, Users, GitBranch } from 'lucide-react'
import { getInitials } from '@/lib/utils'

type Step = 1 | 2 | 3

const colleagues = ['Jane Smith', 'Tom Reyes', 'Mia Cole', 'Ana Silva']

const howItWorks = [
  {
    icon: GitBranch,
    key: 'feature1',
    color: '#5B4FE8',
    bg: 'rgba(91,79,232,0.08)',
  },
  {
    icon: CheckCircle2,
    key: 'feature2',
    color: '#00C896',
    bg: 'rgba(0,200,150,0.08)',
  },
  {
    icon: Users,
    key: 'feature3',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
  },
]

export default function MemberOnboardingPage() {
  const t = useTranslations('onboarding.member')
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('')
  const [timezone, setTimezone] = useState('UTC')

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F1B2D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <SyncoWordmark size={36} variant="white" />
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width: 28,
              height: 4,
              borderRadius: 99,
              backgroundColor: s <= step ? '#5B4FE8' : 'rgba(255,255,255,0.18)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: '36px 40px',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        {step === 1 && (
          <>
            <h2
              style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.6px', marginBottom: 6 }}
            >
              {t('step1.title', { workspace: 'SYNCO Demo' })}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7385', marginBottom: 24 }}>
              {t('step1.subtitle', { department: 'Marketing' })}
            </p>

            {/* Team Lead */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.45px', marginBottom: 10 }}>
                {t('step1.teamLead')}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  backgroundColor: '#F7F8FC',
                  borderRadius: 12,
                  border: '1.5px solid #ECEEF5',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5B4FE8, #3B33B0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  JS
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1B2D' }}>Jane Smith</div>
                  <div style={{ fontSize: 12, color: '#9CA3B5' }}>Marketing Lead</div>
                </div>
              </div>
            </div>

            {/* Colleagues */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.45px', marginBottom: 10 }}>
                {t('step1.colleagues')}
              </p>
              <div style={{ display: 'flex', gap: -8 }}>
                {colleagues.map((name, i) => (
                  <div
                    key={name}
                    title={name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, hsl(${i * 60}, 60%, 55%), hsl(${i * 60 + 20}, 70%, 40%))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#ffffff',
                      border: '2px solid #ffffff',
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  >
                    {getInitials(name)}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#5B4FE8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(91,79,232,0.30)',
              }}
            >
              {t('step1.continue')}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2
              style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.6px', marginBottom: 6 }}
            >
              {t('step2.title')}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7385', marginBottom: 24 }}>{t('step2.subtitle')}</p>

            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5B4FE8, #3B33B0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {fullName ? getInitials(fullName) : '?'}
              </div>
              <button
                style={{
                  height: 34,
                  padding: '0 14px',
                  border: '1.5px solid #E5E7F0',
                  borderRadius: 9,
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6B7385',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Upload size={13} />
                {t('step2.uploadPhoto')}
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('step2.fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('step2.position')}
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Content Manager"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('step2.timeZone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (UTC-5)</option>
                <option value="America/Los_Angeles">Pacific (UTC-8)</option>
                <option value="Europe/London">London (UTC+0)</option>
                <option value="Europe/Moscow">Moscow (UTC+3)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
              </select>
            </div>

            <button
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#5B4FE8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(91,79,232,0.30)',
              }}
            >
              {t('step2.continue')}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2
              style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.6px', marginBottom: 6 }}
            >
              {t('step3.title')}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7385', marginBottom: 24 }}>{t('step3.subtitle')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {howItWorks.map(({ icon: Icon, key, color, bg }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '14px 16px',
                    backgroundColor: bg,
                    borderRadius: 12,
                    border: `1px solid ${color}22`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: color + '18',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>
                      {t(`step3.${key === 'feature1' ? 'feature1Title' : key === 'feature2' ? 'feature2Title' : 'feature3Title'}`)}
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7385', lineHeight: 1.5 }}>
                      {t(`step3.${key === 'feature1' ? 'feature1Desc' : key === 'feature2' ? 'feature2Desc' : 'feature3Desc'}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/workspace')}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#5B4FE8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(91,79,232,0.30)',
              }}
            >
              {t('step3.goToWorkspace')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
