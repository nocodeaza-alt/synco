'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DeptColumn, TaskRow, RequestRow } from '@/types/app'
import { STAGE_COLORS, STAGE_NODE_COLOR, PRIORITY_COLORS } from '@/lib/utils/stages'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import { advanceTaskStage, returnTask, addComment, respondToRequest } from '@/app/actions/tasks'
import { X, Flag, Zap, ChevronDown, Send } from 'lucide-react'

interface Props {
  deptColumns: DeptColumn[]
  requests: RequestRow[]
  workspaceId: string
}

interface PanelState {
  mode: 'task' | 'reviewer' | 'requests' | 'sage' | null
  taskId: string | null
  deptIdx: number | null
}

function formatTimeSince(dateStr: string | null): string {
  if (!dateStr) return '—'
  const ms = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d`
  if (h > 0) return `${h}h`
  return '<1h'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function FlowClient({ deptColumns: initialDeptColumns, requests: initialRequests, workspaceId: _workspaceId }: Props) {
  const t = useTranslations('flow')
  const searchParams = useSearchParams()
  const [deptColumns, setDeptColumns] = useState(initialDeptColumns)
  const [requests] = useState(initialRequests)
  const [panel, setPanel] = useState<PanelState>({ mode: null, taskId: null, deptIdx: null })
  const [returnNote, setReturnNote] = useState('')
  const [commentText, setCommentText] = useState('')
  const [goalFilter, setGoalFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReturnInput, setShowReturnInput] = useState(false)

  // Deep-link: ?open=task&id=<id> or ?open=request
  useEffect(() => {
    const open = searchParams.get('open')
    const id = searchParams.get('id')
    if (open === 'task' && id) {
      setPanel({ mode: 'task', taskId: id, deptIdx: null })
    } else if (open === 'request') {
      setPanel({ mode: 'requests', taskId: null, deptIdx: null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('flow-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setDeptColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === payload.new.id
                  ? { ...task, stage: payload.new.stage as string }
                  : task
              ),
            }))
          )
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const allTasks = deptColumns.flatMap((c) => c.tasks)
  const selectedTask = panel.taskId ? allTasks.find((t) => t.id === panel.taskId) ?? null : null
  const pendingRequests = requests.filter((r) => r.status === 'pending')

  // Collect unique goals for filter pills, sorted by label (G1, G2, G3...)
  const allGoals = Array.from(
    new Map(
      allTasks
        .filter((t) => t.goal_id && t.goal_label)
        .map((t) => [t.goal_id!, { id: t.goal_id!, label: t.goal_label!, color: t.goal_color! }])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))

  async function handleAdvance(taskId: string) {
    setLoading(true)
    await advanceTaskStage(taskId)
    setLoading(false)
  }

  async function handleReturn(taskId: string) {
    if (!returnNote.trim()) return
    setLoading(true)
    await returnTask(taskId, returnNote)
    setReturnNote('')
    setShowReturnInput(false)
    setLoading(false)
  }

  async function handleComment(taskId: string) {
    if (!commentText.trim()) return
    setLoading(true)
    await addComment(taskId, commentText)
    setCommentText('')
    setLoading(false)
  }

  async function handleRespondRequest(requestId: string, action: 'accept' | 'decline') {
    await respondToRequest(requestId, action)
  }

  function filteredTasks(tasks: TaskRow[]): TaskRow[] {
    if (!goalFilter) return tasks
    return tasks.filter((t) => t.goal_id === goalFilter)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F7F8FC' }}>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #ECEEF5',
            padding: '22px 30px 14px',
            flexShrink: 0,
          }}
        >
          {/* Row 1: breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#9CA3B5', fontWeight: 500 }}>SYNCO</span>
            <span style={{ color: '#ECEEF5' }}>·</span>
            <span style={{ fontSize: 12, color: '#5B4FE8', fontWeight: 600 }}>Work Flow</span>
          </div>

          {/* Row 2: title + requests button */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', margin: 0 }}>
                {t('title')}
              </h1>
              <p style={{ fontSize: 13, color: '#9CA3B5', margin: '3px 0 0' }}>{t('subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setPanel({ mode: 'sage', taskId: null, deptIdx: null })}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: '#EEEDFB',
                  color: '#5B4FE8',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={14} />
                Sync Mind
              </button>
              <button
                onClick={() => setPanel({ mode: 'requests', taskId: null, deptIdx: null })}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 9,
                  border: '1.5px solid #ECEEF5',
                  backgroundColor: '#fff',
                  color: '#0F1B2D',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                }}
              >
                {t('requests')}
                {pendingRequests.length > 0 && (
                  <span
                    style={{
                      backgroundColor: '#F5A623',
                      color: '#fff',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                    }}
                  >
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 3: goal pills filter */}
          {allGoals.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="goals"
                style={{ height: 26, padding: '0 10px', borderRadius: 99, border: '1.5px solid #ECEEF5', backgroundColor: 'transparent', color: '#6B7385', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                ← Goals
              </a>
              <div style={{ width: 1, height: 16, background: '#ECEEF5' }} />
              <button
                onClick={() => setGoalFilter(null)}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 99,
                  border: '1.5px solid',
                  borderColor: !goalFilter ? '#5B4FE8' : '#ECEEF5',
                  backgroundColor: !goalFilter ? '#EEEDFB' : 'transparent',
                  color: !goalFilter ? '#5B4FE8' : '#6B7385',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              {allGoals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoalFilter(g.id)}
                  style={{
                    height: 26,
                    padding: '0 10px',
                    borderRadius: 99,
                    border: '1.5px solid',
                    borderColor: goalFilter === g.id ? g.color : '#ECEEF5',
                    backgroundColor: goalFilter === g.id ? `${g.color}18` : 'transparent',
                    color: goalFilter === g.id ? g.color : '#6B7385',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '30px 0 40px' }}>
          <div style={{ position: 'relative', width: 1000, margin: '0 auto' }}>
            {/* Dept columns */}
            {deptColumns.map((col, colIdx) => {
              const left = colIdx * 345
              const tasks = filteredTasks(col.tasks)
              return (
                <div
                  key={col.id}
                  style={{
                    position: 'absolute',
                    left,
                    top: 0,
                    width: 310,
                  }}
                >
                  {/* Dept header */}
                  <div
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: 0,
                      borderLeft: `4px solid ${col.color}`,
                      boxShadow: '0 1px 4px rgba(15,27,45,0.06)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{col.name}</span>
                    <span style={{ fontSize: 12, color: '#9CA3B5', marginLeft: 8 }}>{tasks.length} tasks</span>
                  </div>

                  {/* Timeline line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 22,
                      top: 48,
                      bottom: col.reviewer ? 44 : 8,
                      width: 2,
                      backgroundColor: '#ECEEF5',
                      borderRadius: 1,
                    }}
                  />

                  {/* Tasks */}
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tasks.map((task) => {
                      const nodeColor = STAGE_NODE_COLOR[task.stage] ?? '#aaa'
                      const stageInfo = STAGE_COLORS[task.stage]
                      const isSelected = panel.taskId === task.id
                      return (
                        <div
                          key={task.id}
                          onClick={() => setPanel({ mode: 'task', taskId: task.id, deptIdx: colIdx })}
                          style={{
                            position: 'relative',
                            paddingLeft: 38,
                            cursor: 'pointer',
                          }}
                        >
                          {/* Node */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 14,
                              top: 22,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: nodeColor,
                              border: '2px solid #fff',
                              boxShadow: `0 0 0 2px ${nodeColor}40`,
                              zIndex: 1,
                            }}
                          />
                          {/* Card */}
                          <div
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: 12,
                              padding: '11px 13px',
                              boxShadow: isSelected
                                ? `0 0 0 2px ${col.color}, 0 4px 14px rgba(15,27,45,0.1)`
                                : '0 1px 4px rgba(15,27,45,0.06)',
                              transition: 'box-shadow 0.14s',
                            }}
                          >
                            {/* Top row: goal + source */}
                            <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                              {task.goal_label && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: task.goal_color ?? '#5B4FE8',
                                    backgroundColor: `${task.goal_color ?? '#5B4FE8'}18`,
                                    borderRadius: 5,
                                    padding: '1px 6px',
                                  }}
                                >
                                  {task.goal_label}
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 500,
                                  color: '#9CA3B5',
                                  backgroundColor: '#F2F3F9',
                                  borderRadius: 5,
                                  padding: '1px 6px',
                                }}
                              >
                                {task.source}
                              </span>
                            </div>
                            {/* Title */}
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#0F1B2D',
                                margin: '0 0 8px',
                                lineHeight: 1.4,
                              }}
                            >
                              {task.title}
                            </p>
                            {/* Bottom row */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                {stageInfo && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: stageInfo.color,
                                      backgroundColor: stageInfo.bg,
                                      borderRadius: 5,
                                      padding: '2px 6px',
                                    }}
                                  >
                                    {stageInfo.label}
                                  </span>
                                )}
                                {task.priority && task.priority !== 'low' && PRIORITY_COLORS[task.priority] && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: PRIORITY_COLORS[task.priority].color,
                                      backgroundColor: PRIORITY_COLORS[task.priority].bg,
                                      borderRadius: 5,
                                      padding: '2px 6px',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                                {task.deadline && (
                                  <span style={{ fontSize: 10, color: '#9CA3B5' }}>
                                    {formatDate(task.deadline)}
                                  </span>
                                )}
                              </div>
                              {task.assignee_initials && (
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: gradFor(task.assignee_name ?? ''),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                  }}
                                >
                                  {task.assignee_initials}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reviewer card */}
                  {col.reviewer && (
                    <div
                      style={{
                        position: 'relative',
                        paddingLeft: 38,
                        marginTop: 16,
                        cursor: 'pointer',
                      }}
                      onClick={() => setPanel({ mode: 'reviewer', taskId: null, deptIdx: colIdx })}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          backgroundColor: '#0F1B2D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Flag size={13} color="#fff" />
                      </div>
                      <div
                        style={{
                          backgroundColor: '#0F1B2D',
                          borderRadius: 10,
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>
                            {col.reviewer.name}
                          </p>
                          <p style={{ fontSize: 11, color: '#9CA3B5', margin: '2px 0 0' }}>
                            {col.reviewer.doc_count} {t('inReview')}
                          </p>
                        </div>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: gradFor(col.reviewer.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {col.reviewer.initials}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Convergence SVG + Sync Mind */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: Math.max(...deptColumns.map((c) => {
                  const baseTop = 48 + filteredTasks(c.tasks).length * 120
                  return baseTop
                })) + 60,
                width: 1000,
                height: 280,
              }}
            >
              <svg
                width="1000"
                height="260"
                style={{ position: 'absolute', inset: 0 }}
              >
                <style>{`@keyframes dash{to{stroke-dashoffset:-16}}`}</style>
                <path
                  d="M155 0 C 155 90, 500 70, 500 150"
                  stroke={deptColumns[0]?.color ?? '#5B4FE8'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="8 8"
                  style={{ animation: 'dash 1.1s linear infinite' }}
                />
                <path
                  d="M500 0 C 500 90, 500 80, 500 150"
                  stroke={deptColumns[1]?.color ?? '#00C896'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="8 8"
                  style={{ animation: 'dash 1.1s linear infinite', animationDelay: '0.2s' }}
                />
                <path
                  d="M845 0 C 845 90, 500 70, 500 150"
                  stroke={deptColumns[2]?.color ?? '#F5A623'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="8 8"
                  style={{ animation: 'dash 1.1s linear infinite', animationDelay: '0.4s' }}
                />
              </svg>

              {/* Sync Mind card */}
              <div
                style={{
                  position: 'absolute',
                  left: 280,
                  top: 140,
                  width: 440,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 4px 24px rgba(91,79,232,0.12)',
                  border: '1.5px solid #EEEDFB',
                  cursor: 'pointer',
                }}
                onClick={() => setPanel({ mode: 'sage', taskId: null, deptIdx: null })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>Sync Mind</p>
                    <p style={{ fontSize: 12, color: '#9CA3B5', margin: 0 }}>AI Knowledge Base · Click to ask</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#6B7385', margin: 0 }}>
                  Approved work from all departments flows here. Ask anything about your team&apos;s output.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      {panel.mode !== null && (
        <div
          style={{
            width: 388,
            backgroundColor: '#fff',
            borderLeft: '1px solid #ECEEF5',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid #ECEEF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>
              {panel.mode === 'task' && selectedTask
                ? STAGE_COLORS[selectedTask.stage]?.label ?? selectedTask.stage
                : panel.mode === 'reviewer'
                ? t('reviewerQueue')
                : panel.mode === 'requests'
                ? t('requests')
                : 'Sync Mind'}
            </span>
            <button
              onClick={() => setPanel({ mode: null, taskId: null, deptIdx: null })}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#9CA3B5',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
            {/* TASK PANEL */}
            {panel.mode === 'task' && selectedTask && (
              <TaskPanel
                task={selectedTask}
                loading={loading}
                returnNote={returnNote}
                setReturnNote={setReturnNote}
                commentText={commentText}
                setCommentText={setCommentText}
                showReturnInput={showReturnInput}
                setShowReturnInput={setShowReturnInput}
                onAdvance={handleAdvance}
                onReturn={handleReturn}
                onComment={handleComment}
              />
            )}

            {/* REVIEWER PANEL */}
            {panel.mode === 'reviewer' && panel.deptIdx !== null && deptColumns[panel.deptIdx] && (
              <ReviewerPanel
                col={deptColumns[panel.deptIdx]}
                loading={loading}
                onAdvance={handleAdvance}
                returnNote={returnNote}
                setReturnNote={setReturnNote}
                showReturnInput={showReturnInput}
                setShowReturnInput={setShowReturnInput}
                onReturn={handleReturn}
              />
            )}

            {/* REQUESTS PANEL */}
            {panel.mode === 'requests' && (
              <RequestsPanel
                requests={requests}
                onRespond={handleRespondRequest}
              />
            )}

            {/* SAGE PANEL */}
            {panel.mode === 'sage' && <SagePanel />}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Sub-panels ---- */

function TaskPanel({
  task,
  loading,
  returnNote,
  setReturnNote,
  commentText,
  setCommentText,
  showReturnInput,
  setShowReturnInput,
  onAdvance,
  onReturn,
  onComment,
}: {
  task: TaskRow
  loading: boolean
  returnNote: string
  setReturnNote: (v: string) => void
  commentText: string
  setCommentText: (v: string) => void
  showReturnInput: boolean
  setShowReturnInput: (v: boolean) => void
  onAdvance: (id: string) => void
  onReturn: (id: string) => void
  onComment: (id: string) => void
}) {
  const stageInfo = STAGE_COLORS[task.stage]
  const priorityInfo = PRIORITY_COLORS[task.priority]
  const canReview = ['in_review', 'final_review'].includes(task.stage)

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Stage + priority pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {stageInfo && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: stageInfo.color,
              backgroundColor: stageInfo.bg,
              borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            {stageInfo.label}
          </span>
        )}
        {priorityInfo && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: priorityInfo.color,
              backgroundColor: priorityInfo.bg,
              borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            {task.priority}
          </span>
        )}
        {task.tag && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#5B4FE8',
              backgroundColor: '#EEEDFB',
              borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            {task.tag}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', margin: '0 0 8px', lineHeight: 1.35 }}>
        {task.title}
      </h2>
      {task.description && (
        <p style={{ fontSize: 13, color: '#6B7385', lineHeight: 1.55, margin: '0 0 16px' }}>
          {task.description}
        </p>
      )}

      {/* Meta grid */}
      <div
        style={{
          backgroundColor: '#F7F8FC',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px 16px',
        }}
      >
        {[
          ['Responsible', task.assignee_name ?? '—'],
          ['Priority', task.priority],
          ['Goal', task.goal_label ?? '—'],
          ['Source', task.source],
          ['Deadline', formatDate(task.deadline)],
          ['Time in progress', formatTimeSince(task.started_at)],
        ].map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3B5', margin: '0 0 2px', textTransform: 'uppercase' }}>
              {label}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Review chain */}
      {task.results.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Results
          </p>
          {task.results.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '8px 10px',
                backgroundColor: '#F7F8FC',
                borderRadius: 8,
                marginBottom: 4,
                fontSize: 12,
                color: '#5B4FE8',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {r.file_name ?? r.url}
            </a>
          ))}
        </div>
      )}

      {/* Comments */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Comments
        </p>
        {task.comments.length === 0 && (
          <p style={{ fontSize: 12, color: '#9CA3B5' }}>No comments yet.</p>
        )}
        {task.comments.map((c) => (
          <div key={c.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: gradFor(c.author_name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {initialsFor(c.author_name)}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#0F1B2D' }}>{c.author_name}</span>
              <span style={{ fontSize: 10, color: '#9CA3B5' }}>{formatDate(c.created_at)}</span>
            </div>
            <p style={{ fontSize: 12, color: '#6B7385', margin: 0, paddingLeft: 26, lineHeight: 1.5 }}>{c.body}</p>
          </div>
        ))}

        {/* Comment input */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            style={{
              flex: 1,
              borderRadius: 8,
              border: '1.5px solid #ECEEF5',
              padding: '8px 10px',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => onComment(task.id)}
            disabled={!commentText.trim() || loading}
            style={{
              alignSelf: 'flex-end',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#5B4FE8',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !commentText.trim() ? 0.5 : 1,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      {canReview && (
        <div style={{ borderTop: '1px solid #ECEEF5', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => onAdvance(task.id)}
            disabled={loading}
            style={{
              height: 40,
              borderRadius: 10,
              border: 'none',
              backgroundColor: '#5B4FE8',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {task.stage === 'final_review' ? 'Approve → Done' : 'Approve → Sync Mind'}
          </button>

          {!showReturnInput ? (
            <button
              onClick={() => setShowReturnInput(true)}
              style={{
                height: 40,
                borderRadius: 10,
                border: '1.5px solid #ECEEF5',
                backgroundColor: 'transparent',
                color: '#E5484D',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t_requestChanges()}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Describe what needs to be changed..."
                rows={3}
                style={{
                  borderRadius: 8,
                  border: '1.5px solid #E5484D',
                  padding: '8px 10px',
                  fontSize: 12,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowReturnInput(false); setReturnNote('') }}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 8,
                    border: '1.5px solid #ECEEF5',
                    background: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#6B7385',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReturn(task.id)}
                  disabled={!returnNote.trim() || loading}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#E5484D',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: !returnNote.trim() ? 0.5 : 1,
                  }}
                >
                  Send back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to avoid hooks-in-loop issues
function t_requestChanges() { return 'Request changes' }

function ReviewerPanel({
  col,
  loading,
  onAdvance,
  returnNote,
  setReturnNote,
  showReturnInput,
  setShowReturnInput,
  onReturn,
}: {
  col: DeptColumn
  loading: boolean
  onAdvance: (id: string) => void
  returnNote: string
  setReturnNote: (v: string) => void
  showReturnInput: boolean
  setShowReturnInput: (v: boolean) => void
  onReturn: (id: string) => void
}) {
  const reviewTasks = col.tasks.filter((t) => ['in_review', 'final_review'].includes(t.stage))
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  return (
    <div style={{ paddingTop: 16 }}>
      {col.reviewer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: gradFor(col.reviewer.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {col.reviewer.initials}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>{col.reviewer.name}</p>
            <p style={{ fontSize: 12, color: '#9CA3B5', margin: 0 }}>
              {reviewTasks.length} tasks awaiting review
            </p>
          </div>
        </div>
      )}

      {reviewTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#9CA3B5', fontSize: 14 }}>No tasks in review</p>
        </div>
      )}

      {reviewTasks.map((task) => {
        const isOpen = activeTaskId === task.id
        return (
          <div
            key={task.id}
            style={{
              backgroundColor: '#F7F8FC',
              borderRadius: 10,
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setActiveTaskId(isOpen ? null : task.id)}
              style={{
                width: '100%',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D', margin: 0 }}>{task.title}</p>
                <p style={{ fontSize: 11, color: '#9CA3B5', margin: '2px 0 0' }}>
                  {task.results.length} result(s) · {STAGE_COLORS[task.stage]?.label}
                </p>
              </div>
              <ChevronDown
                size={14}
                color="#9CA3B5"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.15s' }}
              />
            </button>

            {isOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                {task.results.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '7px 10px',
                      backgroundColor: '#fff',
                      borderRadius: 7,
                      marginBottom: 4,
                      fontSize: 12,
                      color: '#5B4FE8',
                      textDecoration: 'none',
                    }}
                  >
                    {r.file_name ?? r.url}
                  </a>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => onAdvance(task.id)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: '#5B4FE8',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowReturnInput(!showReturnInput)}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 8,
                      border: '1.5px solid #E5484D',
                      backgroundColor: 'transparent',
                      color: '#E5484D',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Request changes
                  </button>
                </div>
                {showReturnInput && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      placeholder="What needs to change?"
                      rows={2}
                      style={{
                        width: '100%',
                        borderRadius: 7,
                        border: '1.5px solid #E5484D',
                        padding: '7px 9px',
                        fontSize: 12,
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => onReturn(task.id)}
                      disabled={!returnNote.trim() || loading}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        height: 34,
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: '#E5484D',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: !returnNote.trim() ? 0.5 : 1,
                      }}
                    >
                      Send back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RequestsPanel({
  requests,
  onRespond,
}: {
  requests: RequestRow[]
  onRespond: (id: string, action: 'accept' | 'decline') => void
}) {
  const pending = requests.filter((r) => r.status === 'pending')
  const history = requests.filter((r) => r.status !== 'pending')

  return (
    <div style={{ paddingTop: 16 }}>
      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
          <p style={{ fontSize: 13, color: '#9CA3B5' }}>No pending requests</p>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', marginBottom: 10 }}>
            Pending · {pending.length}
          </p>
          {pending.map((r) => (
            <div
              key={r.id}
              style={{
                backgroundColor: '#F7F8FC',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 8,
                borderLeft: r.is_priority ? '3px solid #E5484D' : '3px solid transparent',
                border: r.is_priority ? undefined : '1px solid #ECEEF5',
              }}
            >
              {/* Badges row */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 7, flexWrap: 'wrap' }}>
                {r.is_priority && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#E5484D', backgroundColor: 'rgba(229,72,77,0.1)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
                    Priority
                  </span>
                )}
                {r.from_dept_name && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#5B4FE8', backgroundColor: '#EEEDFB', borderRadius: 4, padding: '2px 6px' }}>
                    {r.from_dept_name}
                  </span>
                )}
                {r.to_dept_name && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#6B7385', backgroundColor: '#F0F1F6', borderRadius: 4, padding: '2px 6px' }}>
                    → {r.to_dept_name}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D', margin: '0 0 4px', lineHeight: 1.4 }}>{r.title}</p>

              {r.description && (
                <p style={{ fontSize: 11, color: '#6B7385', margin: '0 0 6px', lineHeight: 1.5 }}>{r.description}</p>
              )}

              {/* From + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {r.from_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: gradFor(r.from_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initialsFor(r.from_name)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0F1B2D' }}>{r.from_name}</span>
                  </div>
                )}
                <span style={{ fontSize: 11, color: '#B7BCCB' }}>·</span>
                <span style={{ fontSize: 11, color: '#9CA3B5' }}>{formatDate(r.created_at)}</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onRespond(r.id, 'accept')}
                  style={{ flex: 1, height: 32, borderRadius: 7, border: 'none', backgroundColor: '#5B4FE8', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => onRespond(r.id, 'decline')}
                  style={{ flex: 1, height: 32, borderRadius: 7, border: '1.5px solid #ECEEF5', background: 'none', color: '#E5484D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', marginBottom: 10 }}>
            History
          </p>
          {history.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 6,
                backgroundColor: '#F7F8FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p style={{ fontSize: 12, color: '#6B7385', margin: 0, flex: 1 }}>{r.title}</p>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: r.status === 'accepted' ? '#00936E' : '#E5484D',
                  backgroundColor: r.status === 'accepted' ? 'rgba(0,200,150,0.12)' : 'rgba(229,72,77,0.1)',
                  borderRadius: 5,
                  padding: '2px 7px',
                  marginLeft: 8,
                  flexShrink: 0,
                }}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SagePanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi! I\'m Sync Mind, your team\'s AI knowledge base. Ask me anything about your team\'s work and approved results.' },
  ])

  function handleSend() {
    if (!input.trim()) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: input },
      { role: 'ai', text: 'I\'m currently in demo mode. AI responses will be available once connected to the knowledge base.' },
    ])
    setInput('')
  }

  return (
    <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                backgroundColor: msg.role === 'user' ? '#5B4FE8' : '#F7F8FC',
                color: msg.role === 'user' ? '#fff' : '#0F1B2D',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #ECEEF5', marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Sync Mind..."
          style={{
            flex: 1,
            height: 38,
            borderRadius: 9,
            border: '1.5px solid #ECEEF5',
            padding: '0 12px',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            border: 'none',
            backgroundColor: '#5B4FE8',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
