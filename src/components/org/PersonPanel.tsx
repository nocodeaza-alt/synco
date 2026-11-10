'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Mail, Trash2 } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface Person {
  id: string
  name: string
  position: string
  department: string
  role: string
  email: string
}

interface PersonPanelProps {
  person: Person
  departments: string[]
  onClose: () => void
  onSave: (updated: Person) => void
  onRemove: (id: string) => void
}

const ROLES = ['member', 'team_lead', 'c_level']
const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  team_lead: 'Team Lead',
  c_level: 'C-Level',
}

export function PersonPanel({ person, departments, onClose, onSave, onRemove }: PersonPanelProps) {
  const t = useTranslations('org')
  const [draft, setDraft] = useState({ ...person })
  const [confirmRemove, setConfirmRemove] = useState(false)

  function handleSave() {
    onSave(draft)
    onClose()
  }

  const avatarGrad = getAvatarColor(person.name)

  return (
    <div
      className="panel-enter"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 320,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #ECEEF5',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(15,27,45,0.06)',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid #ECEEF5',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          className={`bg-gradient-to-br ${avatarGrad}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          {getInitials(person.name)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>{person.name}</p>
          <p style={{ fontSize: 12, color: '#9CA3B5' }}>{person.department}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3B5' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('nameLabel')}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              backgroundColor: '#F7F8FC',
              border: '1.5px solid #E5E7F0',
              borderRadius: 9,
              fontSize: 14,
              color: '#0F1B2D',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('positionLabel')}
          </label>
          <input
            type="text"
            value={draft.position}
            onChange={(e) => setDraft({ ...draft, position: e.target.value })}
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              backgroundColor: '#F7F8FC',
              border: '1.5px solid #E5E7F0',
              borderRadius: 9,
              fontSize: 14,
              color: '#0F1B2D',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#5B4FE8')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E7F0')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('leadLabel')} / Department
          </label>
          <select
            value={draft.department}
            onChange={(e) => setDraft({ ...draft, department: e.target.value })}
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              backgroundColor: '#F7F8FC',
              border: '1.5px solid #E5E7F0',
              borderRadius: 9,
              fontSize: 14,
              color: '#0F1B2D',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('accessLevel')}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setDraft({ ...draft, role: r })}
                style={{
                  flex: 1,
                  height: 34,
                  border: `1.5px solid ${draft.role === r ? '#5B4FE8' : '#E5E7F0'}`,
                  borderRadius: 8,
                  backgroundColor: draft.role === r ? '#EEEDFB' : '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  color: draft.role === r ? '#5B4FE8' : '#9CA3B5',
                  cursor: 'pointer',
                }}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Resend invite */}
        <button
          style={{
            width: '100%',
            height: 36,
            border: '1.5px solid #E5E7F0',
            borderRadius: 9,
            backgroundColor: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            color: '#6B7385',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 20,
          }}
        >
          <Mail size={13} />
          {t('resendInvite')}
        </button>

        {/* Remove */}
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            style={{
              width: '100%',
              height: 36,
              border: '1.5px solid rgba(229,72,77,0.25)',
              borderRadius: 9,
              backgroundColor: 'rgba(229,72,77,0.06)',
              fontSize: 13,
              fontWeight: 600,
              color: '#E5484D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={13} />
            {t('removePerson')}
          </button>
        ) : (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(229,72,77,0.06)',
              border: '1.5px solid rgba(229,72,77,0.20)',
              borderRadius: 10,
            }}
          >
            <p style={{ fontSize: 13, color: '#E5484D', marginBottom: 10, fontWeight: 500 }}>
              {t('removeConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onRemove(person.id); onClose() }}
                style={{
                  flex: 1,
                  height: 32,
                  backgroundColor: '#E5484D',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                style={{
                  flex: 1,
                  height: 32,
                  backgroundColor: '#F7F8FC',
                  color: '#6B7385',
                  border: '1px solid #E5E7F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #ECEEF5', display: 'flex', gap: 8 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            height: 38,
            border: '1.5px solid #E5E7F0',
            borderRadius: 9,
            backgroundColor: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            color: '#6B7385',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 2,
            height: 38,
            border: 'none',
            borderRadius: 9,
            backgroundColor: '#5B4FE8',
            fontSize: 13,
            fontWeight: 600,
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(91,79,232,0.25)',
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
