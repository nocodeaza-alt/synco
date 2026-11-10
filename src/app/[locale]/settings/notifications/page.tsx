'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { sendTestDigest } from '@/app/actions/digest'

const EVENT_KEYS = [
  'taskAssigned', 'taskReview', 'taskApproved', 'taskRevision',
  'requestReceived', 'requestAccepted', 'requestDeclined',
  'memberJoined', 'goalUpdated', 'brainstormStarted', 'mention',
] as const

type EventKey = typeof EVENT_KEYS[number]
type Channel = 'inApp' | 'email' | 'slack'

type NotifState = Record<EventKey, Record<Channel, boolean>>

function getDefaults(): NotifState {
  const defaults: Partial<NotifState> = {}
  EVENT_KEYS.forEach((key) => {
    defaults[key] = { inApp: true, email: key === 'mention' || key === 'taskAssigned', slack: false }
  })
  return defaults as NotifState
}

export default function NotificationsPage() {
  const t = useTranslations('settings.notifications')
  const [state, setState] = useState<NotifState>(getDefaults())
  const [dailyDigest, setDailyDigest] = useState(true)
  const [saved, setSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const [digestResult, setDigestResult] = useState<string | null>(null)
  const slackConnected = false

  async function handleSendTestDigest() {
    setSending(true)
    setDigestResult(null)
    const data = await sendTestDigest()
    if (data.sent !== undefined) {
      setDigestResult(`✓ Sent to ${data.sent} member${data.sent !== 1 ? 's' : ''}${data.errors?.length ? ` (${data.errors.length} error${data.errors.length !== 1 ? 's' : ''})` : ''}`)
    } else {
      setDigestResult('Error: ' + (data.error ?? 'Unknown'))
    }
    setSending(false)
  }

  function toggle(event: EventKey, channel: Channel) {
    if (channel === 'slack' && !slackConnected) return
    setState((prev) => ({
      ...prev,
      [event]: {
        ...prev[event],
        [channel]: !prev[event][channel],
      },
    }))
  }

  async function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const channels: { key: Channel; label: string; disabled?: boolean }[] = [
    { key: 'inApp', label: t('inApp') },
    { key: 'email', label: t('email') },
    { key: 'slack', label: t('slack'), disabled: !slackConnected },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', marginBottom: 4 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7385' }}>{t('subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            height: 40,
            padding: '0 20px',
            backgroundColor: saved ? '#00C896' : '#5B4FE8',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Daily digest */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          border: '1px solid #ECEEF5',
          marginBottom: 16,
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>
              {t('dailyDigest')}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3B5' }}>{t('dailyDigestDesc')}</p>
          </div>
          <button
            onClick={() => setDailyDigest(!dailyDigest)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 99,
              border: 'none',
              backgroundColor: dailyDigest ? '#5B4FE8' : '#E5E7F0',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
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
                left: dailyDigest ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          </button>
        </div>
        {dailyDigest && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F1F6', background: '#FAFBFF', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSendTestDigest}
              disabled={sending}
              style={{ height: 34, padding: '0 16px', borderRadius: 9, border: '1px solid #C8C4F5', background: '#fff', color: '#5B4FE8', fontSize: 13, fontWeight: 700, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}
            >
              {sending ? 'Sending…' : '✦ Send test digest now'}
            </button>
            {digestResult && (
              <span style={{ fontSize: 13, color: digestResult.startsWith('✓') ? '#00936E' : '#E5484D', fontWeight: 600 }}>
                {digestResult}
              </span>
            )}
            <span style={{ fontSize: 12, color: '#B7BCCB', marginLeft: 'auto' }}>Sent weekdays at 8:00 AM</span>
          </div>
        )}
      </div>

      {/* Matrix */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #ECEEF5',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
            padding: '12px 20px',
            borderBottom: '1px solid #ECEEF5',
            backgroundColor: '#FAFBFF',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.45px' }}>
            {t('event')}
          </span>
          {channels.map(({ key, label, disabled }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: disabled ? '#B7BCCB' : '#9CA3B5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.45px',
                }}
              >
                {label}
                {disabled && ' (not connected)'}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {EVENT_KEYS.map((eventKey) => (
          <div
            key={eventKey}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
              padding: '12px 20px',
              borderBottom: '1px solid #F7F8FC',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, color: '#0F1B2D' }}>
              {t(`events.${eventKey}`)}
            </span>
            {channels.map(({ key, disabled }) => {
              const on = state[eventKey][key]
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => toggle(eventKey, key)}
                    disabled={disabled}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `1.5px solid ${disabled ? '#E5E7F0' : on ? '#5B4FE8' : '#E5E7F0'}`,
                      backgroundColor: disabled ? '#F7F8FC' : on ? '#5B4FE8' : '#ffffff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    {on && !disabled && (
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
