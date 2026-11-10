'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { UserPlus, MoreHorizontal, Mail } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

const MEMBERS = [
  { id: '1', name: 'Olga White', email: 'olga@synco.com', role: 'owner', department: '-', status: 'active' },
  { id: '2', name: 'Vera Kova', email: 'vera@synco.com', role: 'c_level', department: '-', status: 'active' },
  { id: '3', name: 'Jane Smith', email: 'jane@synco.com', role: 'team_lead', department: 'Marketing', status: 'active' },
  { id: '4', name: 'Alex Kim', email: 'alex@synco.com', role: 'team_lead', department: 'Development', status: 'active' },
  { id: '5', name: 'Omar Diaz', email: 'omar@synco.com', role: 'team_lead', department: 'Sales', status: 'active' },
  { id: '6', name: 'Tom Reyes', email: 'tom@synco.com', role: 'member', department: 'Marketing', status: 'active' },
  { id: '7', name: 'Mia Cole', email: 'mia@synco.com', role: 'member', department: 'Marketing', status: 'active' },
  { id: '8', name: 'Ana Silva', email: 'ana@synco.com', role: 'member', department: 'Marketing', status: 'invited' },
  { id: '9', name: 'Sam Park', email: 'sam@synco.com', role: 'member', department: 'Development', status: 'active' },
  { id: '10', name: 'Lena Vu', email: 'lena@synco.com', role: 'member', department: 'Development', status: 'active' },
  { id: '11', name: 'Ria Nair', email: 'ria@synco.com', role: 'member', department: 'Sales', status: 'active' },
]

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: 'Owner', color: '#0F1B2D', bg: 'rgba(15,27,45,0.08)' },
  c_level: { label: 'C-Level', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  team_lead: { label: 'Team Lead', color: '#5B4FE8', bg: 'rgba(91,79,232,0.10)' },
  member: { label: 'Member', color: '#00936E', bg: 'rgba(0,200,150,0.10)' },
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#00936E', bg: 'rgba(0,200,150,0.10)' },
  invited: { label: 'Invited', color: '#C77E0A', bg: 'rgba(245,166,35,0.12)' },
  removed: { label: 'Removed', color: '#E5484D', bg: 'rgba(229,72,77,0.10)' },
}

export default function MembersPage() {
  const t = useTranslations('settings.members')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

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
          style={{
            height: 40,
            padding: '0 16px',
            backgroundColor: '#5B4FE8',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 6px 16px rgba(91,79,232,0.25)',
          }}
        >
          <UserPlus size={15} />
          {t('invite')}
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #ECEEF5',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 48px',
            padding: '12px 20px',
            borderBottom: '1px solid #ECEEF5',
            backgroundColor: '#FAFBFF',
          }}
        >
          {['name', 'email', 'role', 'department', 'status'].map((col) => (
            <span
              key={col}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#9CA3B5',
                textTransform: 'uppercase',
                letterSpacing: '0.45px',
              }}
            >
              {t(col as 'name' | 'email' | 'role' | 'department' | 'status')}
            </span>
          ))}
          <span />
        </div>

        {/* Rows */}
        {MEMBERS.map((member) => {
          const roleInfo = ROLE_LABELS[member.role]
          const statusInfo = STATUS_LABELS[member.status]
          const avatarGrad = getAvatarColor(member.name)

          return (
            <div
              key={member.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 48px',
                padding: '14px 20px',
                borderBottom: '1px solid #F7F8FC',
                alignItems: 'center',
              }}
            >
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className={`bg-gradient-to-br ${avatarGrad}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(member.name)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F1B2D' }}>
                  {member.name}
                </span>
              </div>

              {/* Email */}
              <span style={{ fontSize: 13, color: '#6B7385' }}>{member.email}</span>

              {/* Role */}
              <span
                style={{
                  display: 'inline-flex',
                  alignSelf: 'center',
                  padding: '3px 9px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  color: roleInfo.color,
                  backgroundColor: roleInfo.bg,
                  width: 'fit-content',
                }}
              >
                {roleInfo.label}
              </span>

              {/* Department */}
              <span style={{ fontSize: 13, color: '#6B7385' }}>{member.department}</span>

              {/* Status */}
              <span
                style={{
                  display: 'inline-flex',
                  alignSelf: 'center',
                  padding: '3px 9px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  color: statusInfo.color,
                  backgroundColor: statusInfo.bg,
                  width: 'fit-content',
                }}
              >
                {statusInfo.label}
              </span>

              {/* Actions */}
              <div style={{ position: 'relative' }}>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                    style={{
                      width: 30,
                      height: 30,
                      border: 'none',
                      borderRadius: 8,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9CA3B5',
                    }}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                )}

                {openMenu === member.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      width: 180,
                      backgroundColor: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #ECEEF5',
                      boxShadow: '0 8px 24px rgba(15,27,45,0.10)',
                      padding: '4px',
                      zIndex: 100,
                    }}
                  >
                    {member.status === 'invited' && (
                      <button
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          color: '#6B7385',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: 7,
                          textAlign: 'left',
                        }}
                        onClick={() => setOpenMenu(null)}
                      >
                        <Mail size={13} />
                        {t('resendInvite')}
                      </button>
                    )}
                    <button
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#E5484D',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 7,
                        textAlign: 'left',
                      }}
                      onClick={() => setOpenMenu(null)}
                    >
                      {t('removeMember')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
