'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { SyncoWordmark } from '@/components/layout/SyncoLogo'
import { Plus, X, Sparkles, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 'done'

const DEPT_COLORS = ['#5B4FE8', '#00C896', '#F5A623', '#E5484D', '#8B5CF6', '#2E9BE6']

interface Department {
  name: string
  leadEmail: string
  color: string
}

interface InviteMember {
  email: string
  department: string
  role: string
}

export default function OwnerOnboardingPage() {
  const t = useTranslations('onboarding.owner')
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [workspaceName, setWorkspaceName] = useState('')
  const [role, setRole] = useState('')
  const [companySize, setCompanySize] = useState('')

  // Step 2
  const [departments, setDepartments] = useState<Department[]>([
    { name: 'Marketing', leadEmail: '', color: '#5B4FE8' },
    { name: 'Development', leadEmail: '', color: '#00C896' },
    { name: 'Sales', leadEmail: '', color: '#F5A623' },
  ])

  // Step 3
  const [invites, setInvites] = useState<InviteMember[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newDept, setNewDept] = useState('')
  const [newRole, setNewRole] = useState('member')

  function addDepartment() {
    setDepartments([
      ...departments,
      { name: '', leadEmail: '', color: DEPT_COLORS[departments.length % DEPT_COLORS.length] },
    ])
  }

  function removeDept(i: number) {
    setDepartments(departments.filter((_, idx) => idx !== i))
  }

  function updateDept(i: number, field: keyof Department, value: string) {
    const updated = [...departments]
    updated[i] = { ...updated[i], [field]: value }
    setDepartments(updated)
  }

  function addInvite() {
    if (!newEmail) return
    setInvites([...invites, { email: newEmail, department: newDept, role: newRole }])
    setNewEmail('')
    setNewDept('')
    setNewRole('member')
  }

  const inputStyle = {
    height: 44,
    padding: '0 14px',
    backgroundColor: '#F7F8FC',
    border: '1.5px solid #E5E7F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F1B2D',
    outline: 'none' as const,
    width: '100%',
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
      {/* Logo */}
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
              backgroundColor:
                s < (step === 'done' ? 4 : (step as number))
                  ? '#5B4FE8'
                  : s === (step as number)
                  ? '#5B4FE8'
                  : 'rgba(255,255,255,0.18)',
              opacity: s === (step as number) ? 1 : s < (step as number) ? 0.6 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: '36px 40px',
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        {step === 1 && (
          <>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#0F1B2D',
                letterSpacing: '-0.6px',
                marginBottom: 6,
              }}
            >
              {t('step1.title')}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7385', marginBottom: 24 }}>
              {t('step1.subtitle')}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('step1.workspaceName')}
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={t('step1.workspaceNamePlaceholder')}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
                {t('step1.yourRole')}
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={t('step1.yourRolePlaceholder')}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 8 }}>
                {t('step1.companySize')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['small', 'medium', 'large', 'enterprise'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setCompanySize(size)}
                    style={{
                      padding: '10px 14px',
                      border: `1.5px solid ${companySize === size ? '#5B4FE8' : '#E5E7F0'}`,
                      borderRadius: 10,
                      backgroundColor: companySize === size ? '#EEEDFB' : '#ffffff',
                      fontSize: 13,
                      fontWeight: 500,
                      color: companySize === size ? '#5B4FE8' : '#6B7385',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {t(`step1.sizes.${size}`)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!workspaceName}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: !workspaceName ? '#8B83F0' : '#5B4FE8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: !workspaceName ? 'not-allowed' : 'pointer',
                boxShadow: workspaceName ? '0 8px 20px rgba(91,79,232,0.30)' : 'none',
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

            {/* AI suggest + CSV */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                style={{
                  flex: 1,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: '1.5px solid #E5E7F0',
                  borderRadius: 9,
                  backgroundColor: '#FBFAFF',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#5B4FE8',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={13} />
                {t('step2.aiSuggest')}
              </button>
              <button
                style={{
                  flex: 1,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: '1.5px solid #E5E7F0',
                  borderRadius: 9,
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6B7385',
                  cursor: 'pointer',
                }}
              >
                <Upload size={13} />
                {t('step2.csvImport')}
              </button>
            </div>

            {/* Departments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {departments.map((dept, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px',
                    border: '1.5px solid #ECEEF5',
                    borderRadius: 12,
                    backgroundColor: '#FAFBFF',
                  }}
                >
                  {/* Color dot */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: dept.color,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={dept.name}
                    onChange={(e) => updateDept(i, 'name', e.target.value)}
                    placeholder={t('step2.departmentName')}
                    style={{
                      flex: 1,
                      height: 32,
                      padding: '0 10px',
                      border: '1px solid #E5E7F0',
                      borderRadius: 8,
                      fontSize: 13,
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <input
                    type="email"
                    value={dept.leadEmail}
                    onChange={(e) => updateDept(i, 'leadEmail', e.target.value)}
                    placeholder={t('step2.leadEmail')}
                    style={{
                      flex: 1,
                      height: 32,
                      padding: '0 10px',
                      border: '1px solid #E5E7F0',
                      borderRadius: 8,
                      fontSize: 13,
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <button
                    onClick={() => removeDept(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B7BCCB' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addDepartment}
              style={{
                width: '100%',
                height: 38,
                border: '1.5px dashed #D0D5E8',
                borderRadius: 10,
                backgroundColor: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: '#6B7385',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginBottom: 24,
              }}
            >
              <Plus size={14} />
              {t('step2.addDepartment')}
            </button>

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

            {/* Add invite form */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('step3.emailPlaceholder')}
                style={{ ...inputStyle, flex: 2 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
              />
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
              >
                <option value="">{t('step3.department')}</option>
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={addInvite}
                style={{
                  height: 44,
                  padding: '0 16px',
                  backgroundColor: '#5B4FE8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {t('step3.addMember')}
              </button>
            </div>

            {/* Invite list */}
            {invites.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invites.map((inv, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      backgroundColor: '#F7F8FC',
                      borderRadius: 9,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#EEEDFB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#5B4FE8',
                      }}
                    >
                      {inv.email[0].toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: '#0F1B2D' }}>{inv.email}</span>
                    <span style={{ fontSize: 12, color: '#9CA3B5' }}>{inv.department}</span>
                    <button
                      onClick={() => setInvites(invites.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B7BCCB' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Shareable link */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F7F8FC',
                border: '1.5px dashed #D0D5E8',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 24,
              }}
            >
              <span style={{ flex: 1, fontSize: 12, color: '#9CA3B5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                https://synco.app/invite/synco-abc123
              </span>
              <button
                style={{
                  flexShrink: 0,
                  height: 30,
                  padding: '0 12px',
                  border: 'none',
                  borderRadius: 8,
                  backgroundColor: '#EEEDFB',
                  color: '#5B4FE8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('step3.copyLink')}
              </button>
            </div>

            <button
              onClick={() => setStep('done')}
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
              {t('step3.finish')}
            </button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5B4FE8, #3B33B0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
              }}
            >
              🎉
            </div>
            <h2
              style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.6px', marginBottom: 8 }}
            >
              {t('done.title')}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7385', marginBottom: 32 }}>{t('done.subtitle')}</p>

            <button
              onClick={() => router.push('/goals')}
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
                marginBottom: 10,
              }}
            >
              {t('done.setFirstGoal')}
            </button>
            <button
              onClick={() => router.push('/flow')}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#F2F3F9',
                color: '#6B7385',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('done.goToDashboard')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
