'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Trash2 } from 'lucide-react'

interface Dept {
  id: string
  name: string
  color: string
  lead: string
}

interface DeptPanelProps {
  dept: Dept
  leads: string[]
  onClose: () => void
  onSave: (updated: Dept) => void
  onDelete: (id: string) => void
  memberCount: number
}

const COLORS = [
  '#5B4FE8', '#00C896', '#F5A623', '#E5484D', '#8B5CF6',
  '#2E9BE6', '#E5487F', '#0F1B2D', '#F59E0B', '#10B981',
]

export function DeptPanel({ dept, leads, onClose, onSave, onDelete, memberCount }: DeptPanelProps) {
  const t = useTranslations('org')
  const [draft, setDraft] = useState({ ...dept })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    onSave(draft)
    onClose()
  }

  return (
    <div
      className="panel-enter"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 300,
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
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: dept.color,
            flexShrink: 0,
          }}
        />
        <p style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>{dept.name}</p>
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
            {t('departmentName')}
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
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('departmentColor')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setDraft({ ...draft, color })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: `2px solid ${draft.color === color ? '#0F1B2D' : 'transparent'}`,
                  cursor: 'pointer',
                  outline: draft.color === color ? '2px solid rgba(91,79,232,0.3)' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3B5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t('leadLabel')}
          </label>
          <select
            value={draft.lead}
            onChange={(e) => setDraft({ ...draft, lead: e.target.value })}
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
            <option value="">No lead</option>
            {leads.map((lead) => (
              <option key={lead} value={lead}>{lead}</option>
            ))}
          </select>
        </div>

        {/* Delete */}
        {memberCount === 0 ? (
          !confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
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
              {t('deleteDepartment')}
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
                {t('deleteDeptConfirm')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { onDelete(dept.id); onClose() }}
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
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
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
          )
        ) : (
          <p style={{ fontSize: 12, color: '#B7BCCB' }}>
            Remove all {memberCount} members before deleting this department.
          </p>
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
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
