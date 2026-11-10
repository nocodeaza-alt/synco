'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Lock } from 'lucide-react'

const PERMISSIONS = [
  { action: 'create_goal', label: 'Create goals' },
  { action: 'edit_goal', label: 'Edit goals' },
  { action: 'delete_goal', label: 'Delete goals' },
  { action: 'create_task', label: 'Create tasks' },
  { action: 'assign_task', label: 'Assign tasks' },
  { action: 'advance_stage', label: 'Advance task stage' },
  { action: 'send_priority_request', label: 'Send priority requests' },
  { action: 'send_request', label: 'Send regular requests' },
  { action: 'accept_request', label: 'Accept/decline requests' },
  { action: 'review_task', label: 'Review tasks (stage 1)' },
  { action: 'final_review', label: 'Final review (stage 2)' },
  { action: 'approve_member', label: 'Approve member requests' },
  { action: 'invite_member', label: 'Invite members' },
  { action: 'edit_permissions', label: 'Edit permissions' },
  { action: 'manage_integrations', label: 'Manage integrations' },
  { action: 'query_sync_mind', label: 'Query Sync Mind' },
  { action: 'start_brainstorm', label: 'Start brainstorm' },
  { action: 'view_all_tasks', label: 'View all tasks' },
]

type Role = 'owner' | 'c_level' | 'team_lead' | 'member'

const DEFAULT_PERMISSIONS: Record<string, Record<Role, boolean>> = {
  create_goal: { owner: true, c_level: false, team_lead: false, member: false },
  edit_goal: { owner: true, c_level: true, team_lead: false, member: false },
  delete_goal: { owner: true, c_level: false, team_lead: false, member: false },
  create_task: { owner: true, c_level: true, team_lead: true, member: false },
  assign_task: { owner: true, c_level: true, team_lead: true, member: false },
  advance_stage: { owner: true, c_level: true, team_lead: true, member: true },
  send_priority_request: { owner: true, c_level: true, team_lead: false, member: false },
  send_request: { owner: true, c_level: true, team_lead: true, member: false },
  accept_request: { owner: true, c_level: false, team_lead: true, member: false },
  review_task: { owner: true, c_level: true, team_lead: true, member: false },
  final_review: { owner: true, c_level: true, team_lead: false, member: false },
  approve_member: { owner: true, c_level: false, team_lead: false, member: false },
  invite_member: { owner: true, c_level: true, team_lead: false, member: false },
  edit_permissions: { owner: true, c_level: false, team_lead: false, member: false },
  manage_integrations: { owner: true, c_level: false, team_lead: false, member: false },
  query_sync_mind: { owner: true, c_level: true, team_lead: true, member: true },
  start_brainstorm: { owner: true, c_level: true, team_lead: true, member: false },
  view_all_tasks: { owner: true, c_level: true, team_lead: true, member: false },
}

export default function PermissionsPage() {
  const t = useTranslations('settings.permissions')
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const [saved, setSaved] = useState(false)

  function togglePermission(action: string, role: Role) {
    if (role === 'owner') return // Owner permissions are locked
    setPermissions((prev) => ({
      ...prev,
      [action]: {
        ...prev[action],
        [role]: !prev[action][role],
      },
    }))
  }

  async function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const roles: { key: Role; label: string; color: string }[] = [
    { key: 'owner', label: t('owner'), color: '#0F1B2D' },
    { key: 'c_level', label: t('cLevel'), color: '#8B5CF6' },
    { key: 'team_lead', label: t('teamLead'), color: '#5B4FE8' },
    { key: 'member', label: t('member'), color: '#00936E' },
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
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            padding: '12px 20px',
            borderBottom: '1px solid #ECEEF5',
            backgroundColor: '#FAFBFF',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.45px' }}>
            {t('action')}
          </span>
          {roles.map(({ key, label, color }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {key === 'owner' && <Lock size={10} />}
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {PERMISSIONS.map(({ action, label }) => (
          <div
            key={action}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '12px 20px',
              borderBottom: '1px solid #F7F8FC',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, color: '#0F1B2D' }}>{label}</span>
            {roles.map(({ key }) => {
              const allowed = permissions[action]?.[key] ?? false
              const isOwner = key === 'owner'

              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => togglePermission(action, key)}
                    disabled={isOwner}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `1.5px solid ${allowed ? (isOwner ? '#B7BCCB' : '#5B4FE8') : '#E5E7F0'}`,
                      backgroundColor: allowed ? (isOwner ? '#B7BCCB' : '#5B4FE8') : '#ffffff',
                      cursor: isOwner ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    {allowed && <Check size={13} color="#ffffff" strokeWidth={3} />}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3B5', marginTop: 12 }}>
        {t('lockedForOwner')}
      </p>
    </div>
  )
}
