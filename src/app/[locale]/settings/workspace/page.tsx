'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload } from 'lucide-react'

export default function WorkspacePage() {
  const t = useTranslations('settings.workspace')

  const [workspaceName, setWorkspaceName] = useState('SYNCO Demo')
  const [emailDomain, setEmailDomain] = useState('synco.com')
  const [autoApprove, setAutoApprove] = useState(false)
  const [taskCapacity, setTaskCapacity] = useState(6)
  const [brainstormDefault, setBrainstormDefault] = useState(15)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7385' }}>{t('subtitle')}</p>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #ECEEF5',
          padding: '28px',
          maxWidth: 560,
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
        }}
      >
        <form onSubmit={handleSave}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #00C896, #00936E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              R
            </div>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 14px',
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
              Upload logo
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
              {t('workspaceName')}
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F1B2D', marginBottom: 6 }}>
              {t('emailDomain')}
            </label>
            <input
              type="text"
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              placeholder="company.com"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
            />
          </div>

          {/* Auto-approve toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: '#FAFBFF',
              border: '1.5px solid #ECEEF5',
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F1B2D', marginBottom: 2 }}>
                {t('autoApprove')}
              </p>
              <p style={{ fontSize: 12, color: '#9CA3B5' }}>@{emailDomain}</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoApprove(!autoApprove)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 99,
                border: 'none',
                backgroundColor: autoApprove ? '#5B4FE8' : '#E5E7F0',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: autoApprove ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
            </button>
          </div>

          {/* Task capacity */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>
                {t('taskCapacity')}
              </label>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#5B4FE8',
                  backgroundColor: '#EEEDFB',
                  padding: '2px 10px',
                  borderRadius: 99,
                }}
              >
                {taskCapacity}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={15}
              value={taskCapacity}
              onChange={(e) => setTaskCapacity(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#5B4FE8' }}
            />
            <p style={{ fontSize: 12, color: '#9CA3B5', marginTop: 4 }}>{t('taskCapacityHelp')}</p>
          </div>

          {/* Brainstorm duration */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>
                {t('brainstormDefault')}
              </label>
              <span style={{ fontSize: 13, color: '#9CA3B5' }}>{t('brainstormDefaultHelp')}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[10, 15, 30].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setBrainstormDefault(min)}
                  style={{
                    flex: 1,
                    height: 40,
                    border: `1.5px solid ${brainstormDefault === min ? '#5B4FE8' : '#E5E7F0'}`,
                    borderRadius: 10,
                    backgroundColor: brainstormDefault === min ? '#EEEDFB' : '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                    color: brainstormDefault === min ? '#5B4FE8' : '#6B7385',
                    cursor: 'pointer',
                  }}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              height: 44,
              padding: '0 24px',
              backgroundColor: saved ? '#00C896' : '#5B4FE8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: saved ? 'none' : '0 6px 16px rgba(91,79,232,0.25)',
              transition: 'all 0.2s',
            }}
          >
            {saved ? 'Saved!' : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}
