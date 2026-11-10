'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TaskRow, MemberRow } from '@/types/app'
import { PRIORITY_COLORS } from '@/lib/utils/stages'
import { gradFor } from '@/lib/utils/avatar'
import { assignTask } from '@/app/actions/tasks'
import { Zap, ChevronDown, X } from 'lucide-react'

interface DeptInfo {
  id: string
  name: string
  color: string
  lead_membership_id: string | null
}

interface GoalInfo {
  id: string
  title: string
  color: string
  label: string
}

interface Props {
  tasks: TaskRow[]
  members: MemberRow[]
  departments: DeptInfo[]
  goals: GoalInfo[]
  workspaceId: string
}

interface Suggestion {
  taskId: string
  memberId: string
  memberName: string
  memberInitials: string
  reason: string
  overload: boolean
}

function BatteryBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <div
        style={{
          width: 48,
          height: 5,
          borderRadius: 3,
          backgroundColor: '#ECEEF5',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color }}>{pct}%</span>
    </div>
  )
}

function batColor(openLoad: number, capacity: number): string {
  const pct = Math.max(0, (capacity - openLoad) / capacity)
  if (openLoad >= capacity) return '#E5484D'
  if (pct >= 0.5) return '#00C896'
  if (pct >= 0.25) return '#F5A623'
  return '#E5484D'
}

function effColor(pct: number): string {
  if (pct >= 85) return '#00C896'
  if (pct >= 70) return '#F5A623'
  return '#E5484D'
}

export function AssignClient({ tasks: initialTasks, members, departments, goals, workspaceId: _workspaceId }: Props) {
  const t = useTranslations('assign')
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals[0]?.id ?? null)
  const [suggestions, setSuggestions] = useState<Map<string, Suggestion>>(new Map())
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [openDropdownTaskId, setOpenDropdownTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const unassigned = tasks.filter((t) => !t.assigned_to)
  const currentGoal = goals.find((g) => g.id === selectedGoalId)

  const goalTasks = selectedGoalId
    ? tasks.filter((t) => t.goal_id === selectedGoalId)
    : tasks
  const assignedCount = goalTasks.filter((t) => t.assigned_to).length

  function buildSuggestions() {
    const newSugs = new Map<string, Suggestion>()
    for (const task of unassigned) {
      const deptMembers = members.filter(
        (m) => m.department_id === task.department_id && m.role === 'member'
      )
      if (deptMembers.length === 0) continue
      const sorted = [...deptMembers].sort((a, b) => a.open_load - b.open_load)
      const pick = sorted[0]
      newSugs.set(task.id, {
        taskId: task.id,
        memberId: pick.user_id,
        memberName: pick.name,
        memberInitials: pick.initials,
        reason: `Lowest load in ${task.department_name} (${pick.open_load} open tasks)`,
        overload: pick.open_load + 1 >= pick.capacity,
      })
    }
    setSuggestions(newSugs)
    setShowSuggestions(true)
  }

  async function approveSuggestion(taskId: string, memberId: string) {
    setLoading(true)
    const result = await assignTask(taskId, memberId, memberId)
    if (!('error' in result)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, assigned_to: memberId, stage: 'todo' } : t
        )
      )
      setSuggestions((prev) => {
        const next = new Map(prev)
        next.delete(taskId)
        return next
      })
    }
    setLoading(false)
  }

  async function approveAll() {
    setLoading(true)
    for (const [taskId, sug] of suggestions) {
      await assignTask(taskId, sug.memberId, sug.memberId)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, assigned_to: sug.memberId, stage: 'todo' } : t
        )
      )
    }
    setSuggestions(new Map())
    setLoading(false)
  }

  async function handleDirectAssign(taskId: string, targetUserId: string, currentUserId: string) {
    setLoading(true)
    const result = await assignTask(taskId, targetUserId, currentUserId)
    if (!('error' in result)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, assigned_to: targetUserId, stage: 'todo' } : t
        )
      )
    }
    setOpenDropdownTaskId(null)
    setLoading(false)
  }

  async function handleDrop(targetUserId: string) {
    if (!draggedTaskId) return
    setLoading(true)
    const result = await assignTask(draggedTaskId, targetUserId, targetUserId)
    if (!('error' in result)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTaskId ? { ...t, assigned_to: targetUserId, stage: 'todo' } : t
        )
      )
    }
    setDraggedTaskId(null)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F7F8FC' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #ECEEF5',
          padding: '16px 30px 14px',
          flexShrink: 0,
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#9CA3B5', fontWeight: 500 }}>SYNCO</span>
          <span style={{ color: '#ECEEF5' }}>·</span>
          <span style={{ fontSize: 12, color: '#5B4FE8', fontWeight: 600 }}>Owner view</span>
        </div>

        {/* Goal bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Goal selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: selectedGoalId === g.id ? g.color : '#ECEEF5',
                    backgroundColor: selectedGoalId === g.id ? `${g.color}18` : 'transparent',
                    color: selectedGoalId === g.id ? g.color : '#6B7385',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {currentGoal && (
              <>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#5B4FE8',
                    backgroundColor: '#EEEDFB',
                    borderRadius: 6,
                    padding: '2px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Zap size={11} />
                  AI decomposed
                </span>
                <span style={{ fontSize: 13, color: '#6B7385' }}>
                  {assignedCount} / {goalTasks.length} assigned
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {showSuggestions && suggestions.size > 0 && (
              <button
                onClick={approveAll}
                disabled={loading}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: '#5B4FE8',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('approveAllBtn')} ({suggestions.size})
              </button>
            )}
            <button
              onClick={buildSuggestions}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 9,
                border: '1.5px solid #ECEEF5',
                backgroundColor: '#fff',
                color: '#5B4FE8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Zap size={13} />
              {t('suggestBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left lane — Unassigned */}
        <div
          style={{
            width: 336,
            backgroundColor: '#FBFBFE',
            borderRight: '1px solid #ECEEF5',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '18px 20px 10px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', margin: '0 0 2px' }}>{t('unassigned')}</h2>
            <p style={{ fontSize: 12, color: '#9CA3B5', margin: 0 }}>{unassigned.length} tasks need assignment</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
            {unassigned.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <p style={{ fontSize: 14, color: '#9CA3B5' }}>All tasks are assigned!</p>
              </div>
            )}
            {unassigned.map((task) => {
              const sug = suggestions.get(task.id)
              const priorityInfo = PRIORITY_COLORS[task.priority]
              const isDropdownOpen = openDropdownTaskId === task.id

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 10,
                    boxShadow: '0 1px 4px rgba(15,27,45,0.06)',
                    border: draggedTaskId === task.id ? '2px solid #5B4FE8' : '1.5px solid #ECEEF5',
                    cursor: 'grab',
                    transition: 'border-color 0.14s',
                  }}
                >
                  {/* Task header */}
                  <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                    {priorityInfo && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: priorityInfo.color,
                          backgroundColor: priorityInfo.bg,
                          borderRadius: 5,
                          padding: '1px 6px',
                        }}
                      >
                        {task.priority}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: task.department_color,
                        backgroundColor: `${task.department_color}18`,
                        borderRadius: 5,
                        padding: '1px 6px',
                      }}
                    >
                      {task.department_name}
                    </span>
                    {task.deadline && (
                      <span style={{ fontSize: 10, color: '#9CA3B5' }}>
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D', margin: '0 0 10px', lineHeight: 1.35 }}>
                    {task.title}
                  </p>

                  {/* AI suggestion box */}
                  {showSuggestions && sug && (
                    <div
                      style={{
                        backgroundColor: '#EEEDFB',
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 10,
                        border: '1px solid #D4D0F8',
                        boxShadow: '0 0 10px rgba(91,79,232,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Zap size={11} color="#5B4FE8" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#5B4FE8', textTransform: 'uppercase' }}>
                          {t('aiSuggests')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: gradFor(sug.memberName),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {sug.memberInitials}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>{sug.memberName}</p>
                          <p style={{ fontSize: 10, color: '#6B7385', margin: 0 }}>{sug.reason}</p>
                        </div>
                      </div>
                      {sug.overload && (
                        <p style={{ fontSize: 10, color: '#E5484D', fontWeight: 600, margin: '0 0 6px' }}>
                          ⚠ Will be at capacity
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => approveSuggestion(task.id, sug.memberId)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            height: 28,
                            borderRadius: 7,
                            border: 'none',
                            backgroundColor: '#5B4FE8',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {t('approve')}
                        </button>
                        <button
                          onClick={() => setOpenDropdownTaskId(task.id)}
                          style={{
                            flex: 1,
                            height: 28,
                            borderRadius: 7,
                            border: '1.5px solid #ECEEF5',
                            backgroundColor: '#fff',
                            color: '#5B4FE8',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {t('change')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual assign button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenDropdownTaskId(isDropdownOpen ? null : task.id)}
                      style={{
                        width: '100%',
                        height: 30,
                        borderRadius: 7,
                        border: '1.5px solid #ECEEF5',
                        backgroundColor: 'transparent',
                        color: '#6B7385',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      {t('assign')}
                      <ChevronDown size={12} />
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          right: 0,
                          backgroundColor: '#fff',
                          borderRadius: 10,
                          border: '1.5px solid #ECEEF5',
                          boxShadow: '0 8px 24px rgba(15,27,45,0.12)',
                          zIndex: 200,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderBottom: '1px solid #ECEEF5',
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase' }}>
                            Assign to
                          </span>
                          <button
                            onClick={() => setOpenDropdownTaskId(null)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3B5', padding: 2 }}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Leads */}
                        <div style={{ padding: '6px 0' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', padding: '4px 12px', margin: 0 }}>
                            {t('onDeskTitle').split('·')[0].trim()}
                          </p>
                          {members
                            .filter((m) => m.department_id === task.department_id && (m.role === 'team_lead' || m.role === 'owner'))
                            .map((m) => (
                              <button
                                key={m.user_id}
                                onClick={() => handleDirectAssign(task.id, m.user_id, m.user_id)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F8FC')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: gradFor(m.name),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                  }}
                                >
                                  {m.initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: 0 }}>{m.name}</p>
                                  <BatteryBar pct={m.battery_pct} color={batColor(m.open_load, m.capacity)} />
                                </div>
                              </button>
                            ))}
                        </div>

                        {/* Members */}
                        <div style={{ padding: '0 0 6px' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', padding: '4px 12px', margin: 0 }}>
                            Members
                          </p>
                          {members
                            .filter((m) => m.department_id === task.department_id && m.role === 'member')
                            .map((m) => (
                              <button
                                key={m.user_id}
                                onClick={() => handleDirectAssign(task.id, m.user_id, m.user_id)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F8FC')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: gradFor(m.name),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                  }}
                                >
                                  {m.initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: 0 }}>{m.name}</p>
                                  <BatteryBar pct={m.battery_pct} color={batColor(m.open_load, m.capacity)} />
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — Teams cascade */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '20px 24px 40px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', margin: '0 0 16px' }}>{t('teams')}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {departments.map((dept) => {
              const deptMembers = members.filter((m) => m.department_id === dept.id)
              const lead = deptMembers.find(
                (m) => m.membership_id === dept.lead_membership_id
              )
              const teamMembers = deptMembers.filter(
                (m) => m.membership_id !== dept.lead_membership_id
              )
              const leadTasks = lead
                ? tasks.filter(
                    (t) => t.assigned_to === lead.user_id && !['done', 'in_review', 'final_review'].includes(t.stage)
                  )
                : []

              return (
                <div
                  key={dept.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    border: '1.5px solid #ECEEF5',
                    overflow: 'hidden',
                  }}
                >
                  {/* Dept header */}
                  <div
                    style={{
                      borderLeft: `4px solid ${dept.color}`,
                      padding: '14px 18px',
                      borderBottom: '1px solid #ECEEF5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>{dept.name}</h3>
                      <p style={{ fontSize: 12, color: '#9CA3B5', margin: '2px 0 0' }}>
                        {deptMembers.length} members
                      </p>
                    </div>

                    {lead && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: gradFor(lead.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {lead.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: '0 0 4px' }}>{lead.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <span style={{ fontSize: 9, color: '#9CA3B5', fontWeight: 600, width: 20, flexShrink: 0 }}>BAT</span>
                            <BatteryBar pct={lead.battery_pct} color={batColor(lead.open_load, lead.capacity)} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: '#9CA3B5', fontWeight: 600, width: 20, flexShrink: 0 }}>EFF</span>
                            <BatteryBar pct={lead.efficiency_pct} color={effColor(lead.efficiency_pct)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body: lead desk + members */}
                  <div style={{ display: 'flex', padding: '16px 18px', gap: 20 }}>
                    {/* Lead's desk */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#9CA3B5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          marginBottom: 10,
                        }}
                      >
                        {t('onDeskTitle')}
                      </p>
                      {leadTasks.length === 0 && (
                        <p style={{ fontSize: 12, color: '#C3C9D6' }}>No tasks on desk</p>
                      )}
                      {leadTasks.map((task) => {
                        const priorityInfo = PRIORITY_COLORS[task.priority]
                        return (
                          <div
                            key={task.id}
                            style={{
                              backgroundColor: '#F7F8FC',
                              borderRadius: 8,
                              padding: '9px 11px',
                              marginBottom: 6,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              {priorityInfo && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: priorityInfo.color,
                                    backgroundColor: priorityInfo.bg,
                                    borderRadius: 4,
                                    padding: '1px 5px',
                                    display: 'inline-block',
                                    marginBottom: 3,
                                  }}
                                >
                                  {task.priority}
                                </span>
                              )}
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: 0, lineHeight: 1.3 }}>
                                {task.title}
                              </p>
                            </div>
                            {/* Delegate dropdown */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <button
                                onClick={() => setOpenDropdownTaskId(openDropdownTaskId === task.id ? null : task.id)}
                                style={{
                                  height: 24,
                                  padding: '0 8px',
                                  borderRadius: 6,
                                  border: '1.5px solid #ECEEF5',
                                  backgroundColor: '#fff',
                                  color: '#6B7385',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                {t('delegate')} <ChevronDown size={9} />
                              </button>
                              {openDropdownTaskId === task.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    right: 0,
                                    width: 180,
                                    backgroundColor: '#fff',
                                    borderRadius: 8,
                                    border: '1.5px solid #ECEEF5',
                                    boxShadow: '0 6px 20px rgba(15,27,45,0.1)',
                                    zIndex: 200,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {teamMembers.map((m) => (
                                    <button
                                      key={m.user_id}
                                      onClick={() => handleDirectAssign(task.id, m.user_id, lead?.user_id ?? m.user_id)}
                                      style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 7,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F8FC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <div
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: '50%',
                                          background: gradFor(m.name),
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 8,
                                          fontWeight: 700,
                                          color: '#fff',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {m.initials}
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#0F1B2D' }}>{m.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Members drop targets */}
                    <div style={{ width: 218, flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#9CA3B5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          marginBottom: 10,
                        }}
                      >
                        {t('membersTitle')}
                      </p>
                      {teamMembers.map((member) => {
                        const memberTasks = tasks.filter(
                          (t) =>
                            t.assigned_to === member.user_id &&
                            !['done', 'in_review', 'final_review'].includes(t.stage)
                        )
                        const bc = batColor(member.open_load, member.capacity)

                        return (
                          <div
                            key={member.user_id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(member.user_id)}
                            style={{
                              backgroundColor: '#F7F8FC',
                              borderRadius: 10,
                              padding: '10px 12px',
                              marginBottom: 8,
                              border: '2px dashed transparent',
                              transition: 'border-color 0.14s',
                            }}
                            onDragEnter={(e) => (e.currentTarget.style.borderColor = dept.color)}
                            onDragLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                          >
                            {/* Member header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  background: gradFor(member.name),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: '#fff',
                                  flexShrink: 0,
                                }}
                              >
                                {member.initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: '0 0 4px' }}>{member.name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                  <span style={{ fontSize: 9, color: '#9CA3B5', fontWeight: 600, width: 20, flexShrink: 0 }}>BAT</span>
                                  <BatteryBar pct={member.battery_pct} color={bc} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 9, color: '#9CA3B5', fontWeight: 600, width: 20, flexShrink: 0 }}>EFF</span>
                                  <BatteryBar pct={member.efficiency_pct} color={effColor(member.efficiency_pct)} />
                                </div>
                              </div>
                            </div>

                            {/* Member tasks */}
                            {memberTasks.map((task) => (
                              <div
                                key={task.id}
                                style={{
                                  backgroundColor: '#fff',
                                  borderRadius: 6,
                                  padding: '6px 8px',
                                  marginBottom: 4,
                                  fontSize: 11,
                                  color: '#0F1B2D',
                                  fontWeight: 500,
                                }}
                              >
                                {task.title}
                              </div>
                            ))}

                            {memberTasks.length === 0 && (
                              <div
                                style={{
                                  borderRadius: 6,
                                  padding: '8px',
                                  textAlign: 'center',
                                  fontSize: 11,
                                  color: '#C3C9D6',
                                }}
                              >
                                Drop task here
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
