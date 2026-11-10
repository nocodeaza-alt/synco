'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { MemberRow, TaskRow } from '@/types/app'
import { STAGE_COLORS, PRIORITY_COLORS } from '@/lib/utils/stages'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import {
  advanceTaskStage,
  addComment,
  uploadTaskResult,
} from '@/app/actions/tasks'
import { ArrowLeft, Bell, X, Send, Link2, FileText, ImageIcon, ChevronRight } from 'lucide-react'

interface Props {
  members: MemberRow[]
  tasks: TaskRow[]
  workspaceId: string
  workspaceName: string
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimeSince(d: string | null) {
  if (!d) return '—'
  const ms = Date.now() - new Date(d).getTime()
  const h = Math.floor(ms / 3600000)
  const dy = Math.floor(h / 24)
  if (dy > 0) return `${dy}d`
  if (h > 0) return `${h}h`
  return '<1h'
}

const PRIORITY_STRIPE: Record<string, string> = {
  high: '#E5484D',
  medium: '#F5A623',
  low: '#C3C9D6',
}

export function WorkspaceClient({ members, tasks: initialTasks, workspaceName: _workspaceName }: Props) {
  const t = useTranslations('workspace')
  const [pickedUserId, setPickedUserId] = useState<string | null>(null)
  const [tasks, setTasks] = useState(initialTasks)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultTab, setResultTab] = useState<'document' | 'link' | 'image'>('link')
  const [linkInput, setLinkInput] = useState('')
  const [resultError, setResultError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('workspace-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setTasks((prev) =>
            prev.map((t) => (t.id === payload.new.id ? { ...t, stage: payload.new.stage as string } : t))
          )
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const myTasks = pickedUserId
    ? tasks.filter((t) => t.assigned_to === pickedUserId)
    : []

  const assigned = myTasks.filter((t) => t.stage === 'todo')
  const inFocus = myTasks.filter((t) => ['in_progress', 'needs_revision'].includes(t.stage))
  const done = myTasks.filter((t) => t.stage === 'ready')
  const withManager = myTasks.filter((t) => ['in_review', 'final_review'].includes(t.stage))
  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null

  const pickedMember = members.find((m) => m.user_id === pickedUserId)

  async function handleAdvance(taskId: string) {
    setLoading(true)
    const result = await advanceTaskStage(taskId)
    if ('error' in result && result.error) setResultError(result.error)
    setLoading(false)
  }

  async function handleComment(taskId: string) {
    if (!commentText.trim()) return
    setLoading(true)
    await addComment(taskId, commentText)
    setCommentText('')
    setLoading(false)
  }

  async function handleAddLink(taskId: string) {
    if (!linkInput.trim()) return
    setLoading(true)
    await uploadTaskResult(taskId, 'link', linkInput)
    setLinkInput('')
    setLoading(false)
  }

  async function handleFileUpload(taskId: string, file: File) {
    setLoading(true)
    const supabase = createClient()
    const path = `${taskId}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('task-results')
      .upload(path, file)
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('task-results').getPublicUrl(data.path)
      await uploadTaskResult(taskId, 'document', urlData.publicUrl, file.name)
    } else if (error) {
      // Fallback: store a placeholder URL if bucket doesn't exist yet
      await uploadTaskResult(taskId, 'document', `upload://${file.name}`, file.name)
    }
    setLoading(false)
  }

  async function handleSendAll() {
    setLoading(true)
    for (const t of done) {
      await advanceTaskStage(t.id)
    }
    setLoading(false)
  }

  // Select screen
  if (!pickedUserId) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 16%,#ECEAFB,#F7F8FC 56%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 64,
          paddingBottom: 64,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>S</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px' }}>SYNCO</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F1B2D', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          {t('selectWho')}
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3B5', margin: '0 0 40px' }}>{t('selectSubtitle')}</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 188px)',
            gap: 14,
            maxWidth: 900,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {members.map((m) => {
            const memberTaskCount = tasks.filter(
              (t) => t.assigned_to === m.user_id && t.stage !== 'done'
            ).length
            return (
              <button
                key={m.user_id}
                onClick={() => setPickedUserId(m.user_id)}
                style={{
                  width: 188,
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: '20px 16px',
                  border: '1.5px solid #ECEEF5',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.14s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,79,232,0.12)'
                  e.currentTarget.style.borderColor = '#5B4FE8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#ECEEF5'
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: gradFor(m.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {m.initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', margin: '0 0 2px' }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: '#9CA3B5', margin: 0 }}>
                    {m.role} · {memberTaskCount} tasks
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ChevronRight size={14} color="#9CA3B5" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Workspace view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#F7F8FC' }}>
      {/* Header */}
      <div
        style={{
          height: 62,
          flexShrink: 0,
          backgroundColor: '#fff',
          borderBottom: '1px solid #ECEEF5',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setPickedUserId(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#6B7385',
            fontSize: 13,
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 7,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, justifyContent: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.4px' }}>SYNCO</span>
          <span style={{ color: '#ECEEF5', fontSize: 16 }}>·</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#6B7385' }}>{t('title')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#9CA3B5' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7385',
            }}
          >
            <Bell size={16} />
          </button>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: gradFor(pickedMember?.name ?? ''),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {pickedMember?.initials ?? '?'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Thread rail */}
        <div
          style={{
            width: 258,
            backgroundColor: '#fff',
            borderRight: '1px solid #ECEEF5',
            padding: '28px 24px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: '#0F1B2D', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>
            The Thread
          </p>
          <p style={{ fontSize: 12, color: '#9CA3B5', marginBottom: 32 }}>
            Your daily work flow
          </p>

          {/* Gradient vertical line — center = left(24) + radius(7) = 31px → left: 30 */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 100,
              bottom: 60,
              width: 2,
              background: 'linear-gradient(#5B4FE8,#7B6FF0 34%,#F5A623 58%,#00C896)',
              borderRadius: 1,
            }}
          />

          {/* Nodes */}
          {[
            { label: 'Assigned', top: 34, color: '#5B4FE8', count: assigned.length },
            { label: 'In Focus', top: 222, color: '#F5A623', count: inFocus.length, pulse: true },
            { label: 'Done', top: 410, color: '#00C896', count: done.length },
            { label: 'For Review', top: 566, color: '#7B6FF0', count: withManager.length },
          ].map((node) => (
            <div
              key={node.label}
              style={{
                position: 'absolute',
                left: 24,
                top: 100 + node.top,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {node.pulse && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: '50%',
                      backgroundColor: `${node.color}30`,
                      animation: 'pulse 1.8s ease-in-out infinite',
                    }}
                  />
                )}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: node.color,
                    border: '2px solid #fff',
                    boxShadow: `0 0 0 2px ${node.color}40`,
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>{node.label}</p>
                <p style={{ fontSize: 11, color: '#9CA3B5', margin: 0 }}>{node.count} tasks</p>
              </div>
            </div>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.8;transform:scale(1.2)}}`}</style>
        </div>

        {/* Content bands */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 30px 70px' }}>
          {/* Greeting */}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', margin: '0 0 28px', letterSpacing: '-0.5px' }}>
            {t('goodMorning')}, {pickedMember?.name.split(' ')[0] ?? ''}
          </h1>

          {/* Assigned band */}
          {assigned.length > 0 && (
            <Band title={t('assigned')} color="#5B4FE8">
              {assigned.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setOpenTaskId(task.id)}
                  isSelected={openTaskId === task.id}
                  action={{
                    label: t('takeToday') + ' ↓',
                    color: '#5B4FE8',
                    onClick: () => handleAdvance(task.id),
                  }}
                />
              ))}
            </Band>
          )}

          {/* In focus band */}
          {inFocus.length > 0 && (
            <Band title={t('inFocus')} color="#F5A623" pulsing>
              {inFocus.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setOpenTaskId(task.id)}
                  isSelected={openTaskId === task.id}
                  variant="amber"
                  action={{
                    label: t('markDone') + ' ✓',
                    color: '#00936E',
                    onClick: () => handleAdvance(task.id),
                  }}
                />
              ))}
            </Band>
          )}

          {/* Done band */}
          {done.length > 0 && (
            <Band
              title={t('done')}
              color="#00C896"
              headerExtra={
                done.length > 1 ? (
                  <button
                    onClick={handleSendAll}
                    disabled={loading}
                    style={{
                      height: 28,
                      padding: '0 12px',
                      borderRadius: 7,
                      border: 'none',
                      backgroundColor: '#00936E',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t('sendAll')}
                  </button>
                ) : null
              }
            >
              {done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setOpenTaskId(task.id)}
                  isSelected={openTaskId === task.id}
                  strikethrough
                  action={{
                    label: t('sendForReview') + ' ⚑',
                    color: '#7B6FF0',
                    onClick: () => handleAdvance(task.id),
                  }}
                />
              ))}
            </Band>
          )}

          {/* With manager band */}
          {withManager.length > 0 && (
            <Band title={t('withManager')} color="#7B6FF0">
              {withManager.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setOpenTaskId(task.id)}
                  isSelected={openTaskId === task.id}
                  variant="dark"
                />
              ))}
            </Band>
          )}

          {myTasks.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <p style={{ fontSize: 16, color: '#9CA3B5' }}>No tasks assigned yet.</p>
            </div>
          )}
        </div>

        {/* Task panel */}
        {openTask && (
          <div
            style={{
              width: 404,
              backgroundColor: '#fff',
              borderLeft: '1px solid #ECEEF5',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: '16px 18px 12px',
                borderBottom: '1px solid #ECEEF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {(() => {
                  const sc = STAGE_COLORS[openTask.stage]
                  const pc = PRIORITY_COLORS[openTask.priority]
                  return (
                    <>
                      {sc && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, backgroundColor: sc.bg, borderRadius: 6, padding: '2px 7px' }}>
                          {sc.label}
                        </span>
                      )}
                      {pc && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: pc.color, backgroundColor: pc.bg, borderRadius: 6, padding: '2px 7px' }}>
                          {openTask.priority}
                        </span>
                      )}
                      {openTask.tag && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#5B4FE8', backgroundColor: '#EEEDFB', borderRadius: 6, padding: '2px 7px' }}>
                          {openTask.tag}
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
              <button
                onClick={() => setOpenTaskId(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3B5', padding: 4 }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 20px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D', margin: '0 0 8px', lineHeight: 1.35 }}>
                {openTask.title}
              </h2>
              {openTask.description && (
                <p style={{ fontSize: 13, color: '#6B7385', lineHeight: 1.55, margin: '0 0 16px' }}>
                  {openTask.description}
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
                  ['Assignee', openTask.assignee_name ?? '—'],
                  ['Assigned by', openTask.assigner_name ?? '—'],
                  ['Deadline', formatDate(openTask.deadline)],
                  ['Time in progress', formatTimeSince(openTask.started_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3B5', margin: '0 0 2px', textTransform: 'uppercase' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Result section */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  {t('resultRequired')}
                </p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {(['link', 'document', 'image'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResultTab(tab === 'document' ? 'document' : tab === 'image' ? 'image' : 'link')}
                      style={{
                        height: 28,
                        padding: '0 10px',
                        borderRadius: 7,
                        border: 'none',
                        backgroundColor: resultTab === tab ? '#EEEDFB' : 'transparent',
                        color: resultTab === tab ? '#5B4FE8' : '#6B7385',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {tab === 'link' && <Link2 size={12} />}
                      {tab === 'document' && <FileText size={12} />}
                      {tab === 'image' && <ImageIcon size={12} />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {resultTab === 'link' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://..."
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 8,
                        border: '1.5px solid #ECEEF5',
                        padding: '0 10px',
                        fontSize: 12,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      onClick={() => handleAddLink(openTask.id)}
                      disabled={!linkInput.trim() || loading}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: '#5B4FE8',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: !linkInput.trim() ? 0.5 : 1,
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}

                {(resultTab === 'document' || resultTab === 'image') && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept={resultTab === 'image' ? 'image/*' : undefined}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(openTask.id, file)
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%',
                        height: 80,
                        borderRadius: 10,
                        border: '2px dashed #ECEEF5',
                        backgroundColor: '#F7F8FC',
                        color: '#9CA3B5',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <FileText size={20} color="#C3C9D6" />
                      Drop file or click to upload
                    </button>
                  </div>
                )}

                {/* Existing results */}
                {openTask.results.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {openTask.results.map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '7px 10px',
                          backgroundColor: '#F7F8FC',
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
                  </div>
                )}

                {/* Warning */}
                {openTask.results.length === 0 && ['in_progress', 'needs_revision', 'ready'].includes(openTask.stage) && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 10px',
                      backgroundColor: 'rgba(245,166,35,0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(245,166,35,0.3)',
                    }}
                  >
                    <p style={{ fontSize: 12, color: '#C77E0A', margin: 0 }}>{t('attachFirst')}</p>
                  </div>
                )}

                {resultError && (
                  <p style={{ fontSize: 12, color: '#E5484D', marginTop: 6 }}>{resultError}</p>
                )}
              </div>

              {/* Comments */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3B5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Comments
                </p>
                {openTask.comments.map((c) => (
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
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7385', margin: 0, paddingLeft: 26 }}>{c.body}</p>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: '1.5px solid #ECEEF5',
                      padding: '7px 9px',
                      fontSize: 12,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => handleComment(openTask.id)}
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
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom action */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #ECEEF5', flexShrink: 0 }}>
              {openTask.stage === 'todo' && (
                <button
                  onClick={() => handleAdvance(openTask.id)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#5B4FE8',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('takeToday')} ↓
                </button>
              )}
              {['in_progress', 'needs_revision'].includes(openTask.stage) && (
                <button
                  onClick={() => handleAdvance(openTask.id)}
                  disabled={loading || openTask.results.length === 0}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: openTask.results.length === 0 ? '#ECEEF5' : '#00936E',
                    color: openTask.results.length === 0 ? '#9CA3B5' : '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: openTask.results.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t('markDone')} ✓
                </button>
              )}
              {openTask.stage === 'ready' && (
                <button
                  onClick={() => handleAdvance(openTask.id)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#7B6FF0',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('sendForReview')} ⚑
                </button>
              )}
              {['in_review', 'final_review'].includes(openTask.stage) && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '8px 0',
                    fontSize: 13,
                    color: '#9CA3B5',
                    fontWeight: 500,
                  }}
                >
                  {t('awaitingReview')}...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Band component ---- */
function Band({
  title,
  color,
  children,
  pulsing,
  headerExtra,
}: {
  title: string
  color: string
  children: React.ReactNode
  pulsing?: boolean
  headerExtra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            position: 'relative',
          }}
        >
          {pulsing && (
            <div
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                backgroundColor: `${color}40`,
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />
          )}
        </div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', margin: 0 }}>{title}</h2>
        {headerExtra}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

/* ---- TaskCard component ---- */
function TaskCard({
  task,
  onClick,
  isSelected,
  variant,
  strikethrough,
  action,
}: {
  task: TaskRow
  onClick: () => void
  isSelected: boolean
  variant?: 'amber' | 'dark'
  strikethrough?: boolean
  action?: { label: string; color: string; onClick: () => void }
}) {
  const stripeColor = PRIORITY_STRIPE[task.priority] ?? '#C3C9D6'
  const isDark = variant === 'dark'
  const isAmber = variant === 'amber'

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isDark ? '#0F1B2D' : isAmber ? 'rgba(245,166,35,0.06)' : '#fff',
        borderRadius: 12,
        padding: '13px 14px',
        borderLeft: `4px solid ${stripeColor}`,
        boxShadow: isSelected
          ? '0 0 0 2px #5B4FE8, 0 4px 14px rgba(15,27,45,0.1)'
          : '0 1px 4px rgba(15,27,45,0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.14s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
            {task.priority && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isDark ? '#F5A623' : PRIORITY_COLORS[task.priority]?.color ?? '#6B7385',
                  backgroundColor: isDark ? 'rgba(245,166,35,0.15)' : PRIORITY_COLORS[task.priority]?.bg ?? '#EEF0F6',
                  borderRadius: 5,
                  padding: '1px 6px',
                }}
              >
                {task.priority}
              </span>
            )}
            {task.tag && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: isDark ? '#7B6FF0' : '#5B4FE8',
                  backgroundColor: isDark ? 'rgba(123,111,240,0.2)' : '#EEEDFB',
                  borderRadius: 5,
                  padding: '1px 6px',
                }}
              >
                {task.tag}
              </span>
            )}
            {task.deadline && (
              <span style={{ fontSize: 10, color: isDark ? '#6B7385' : '#9CA3B5' }}>
                {formatDate(task.deadline)}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? '#fff' : '#0F1B2D',
              margin: 0,
              lineHeight: 1.4,
              textDecoration: strikethrough ? 'line-through' : 'none',
              opacity: strikethrough ? 0.65 : 1,
            }}
          >
            {task.title}
          </p>
          {isAmber && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 10,
                fontWeight: 600,
                color: '#C77E0A',
                backgroundColor: 'rgba(245,166,35,0.16)',
                borderRadius: 5,
                padding: '2px 7px',
              }}
            >
              Working now
            </span>
          )}
          {isDark && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 10,
                fontWeight: 600,
                color: '#7B6FF0',
                backgroundColor: 'rgba(123,111,240,0.2)',
                borderRadius: 5,
                padding: '2px 7px',
              }}
            >
              Awaiting review
            </span>
          )}
        </div>
        {action && (
          <button
            onClick={(e) => { e.stopPropagation(); action.onClick() }}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 7,
              border: 'none',
              backgroundColor: `${action.color}18`,
              color: action.color,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
