'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createGoalWithTasks, deleteGoal } from '@/app/actions/tasks'
import type { TaskRow, MemberRow } from '@/types/app'
import { STAGE_COLORS } from '@/lib/utils/stages'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import { X, Play, Square, RotateCcw } from 'lucide-react'

interface GoalRow {
  id: string
  label: string
  color: string
  title: string
  target_date: string | null
  tasks: TaskRow[]
}

interface DeptInfo {
  id: string
  name: string
  color: string
}

interface Props {
  goals: GoalRow[]
  departments: DeptInfo[]
  members: MemberRow[]
  workspaceId: string
  role?: 'owner' | 'c_level' | 'team_lead' | 'member'
}

interface DecompTask {
  title: string
  description: string
  department_id: string
  priority: 'high' | 'medium' | 'low'
  tag?: string
  due_date: string
  expected_result: 'document' | 'link' | 'image'
}

const HEX_W = 87
const HEX_H = 100
// Pointy-top hex: flat-to-flat width = 79, vertex-to-vertex height = 92
// Edge-to-edge tessellation: same row step = 79, row-to-row step = 69 (92*3/4), odd rows offset +39.5
const H_STEP = 79   // horizontal distance between adjacent hex top-left in same row
const V_STEP = 69   // vertical distance between row top-lefts (92 * 0.75)
const ODD_OFFSET = 39.5 // odd rows shift right by half H_STEP

function hexPos(idx: number, numCols: number) {
  const col = idx % numCols
  const row = Math.floor(idx / numCols)
  return {
    x: col * H_STEP + (row % 2 === 1 ? ODD_OFFSET : 0),
    y: row * V_STEP,
  }
}

function boardSize(count: number, numCols: number) {
  const numRows = Math.ceil(count / numCols)
  return {
    w: (numCols - 1) * H_STEP + ODD_OFFSET + HEX_W,
    h: (numRows - 1) * V_STEP + HEX_H,
  }
}

function hexFill(stage: string, color: string): { fill: string; fillOpacity: number; stroke: string; strokeWidth: number; dashed: boolean } {
  switch (stage) {
    case 'todo': return { fill: 'transparent', fillOpacity: 0, stroke: '#C9CEDB', strokeWidth: 2, dashed: true }
    case 'in_progress': return { fill: color, fillOpacity: 0.12, stroke: color, strokeWidth: 2, dashed: false }
    case 'needs_revision': return { fill: '#F5A623', fillOpacity: 0.12, stroke: '#F5A623', strokeWidth: 2, dashed: false }
    case 'in_review': return { fill: color, fillOpacity: 0.45, stroke: color, strokeWidth: 2, dashed: false }
    case 'ready':
    case 'done': return { fill: color, fillOpacity: 1, stroke: color, strokeWidth: 2, dashed: false }
    default: return { fill: 'transparent', fillOpacity: 0, stroke: '#C9CEDB', strokeWidth: 2, dashed: true }
  }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function pctComplete(tasks: TaskRow[]) {
  if (tasks.length === 0) return 0
  const done = tasks.filter(t => t.stage === 'done' || t.stage === 'ready').length
  return Math.round((done / tasks.length) * 100)
}

export function GoalsClient({ goals: initialGoals, departments, workspaceId, role = 'owner' }: Props) {
  const t = useTranslations('goals')
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialGoals[0]?.id ?? null)
  const [selectedPieceIdx, setSelectedPieceIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<'view' | 'new'>('view')
  const [goalText, setGoalText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [decompTasks, setDecompTasks] = useState<DecompTask[]>([])
  const [autoPlay, setAutoPlay] = useState(false)
  const [localStages, setLocalStages] = useState<Map<string, string>>(new Map())
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync local goals state when server data refreshes
  useEffect(() => { setGoals(initialGoals) }, [initialGoals])

  const deptMap = new Map(departments.map(d => [d.id, d]))

  const selectedGoal = goals.find(g => g.id === selectedGoalId) ?? null

  // Merged tasks with local stage overrides
  const displayTasks = (selectedGoal?.tasks ?? []).map(task => ({
    ...task,
    stage: localStages.get(task.id) ?? task.stage,
  }))

  const isComplete = displayTasks.length > 0 && displayTasks.every(t => t.stage === 'done' || t.stage === 'ready')

  function advanceStage(stage: string): string {
    const order = ['todo', 'in_progress', 'in_review', 'done']
    const idx = order.indexOf(stage)
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'done'
  }

  function simulateStep() {
    const open = displayTasks.filter(t => t.stage !== 'done' && t.stage !== 'ready')
    if (open.length === 0) { stopAuto(); return }
    const pick = open[Math.floor(Math.random() * open.length)]
    setLocalStages(prev => new Map(prev).set(pick.id, advanceStage(pick.stage)))
  }

  function stopAuto() {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null }
    setAutoPlay(false)
  }

  function toggleAuto() {
    if (autoPlay) {
      stopAuto()
    } else {
      autoRef.current = setInterval(simulateStep, 1000)
      setAutoPlay(true)
    }
  }

  function resetStages() {
    stopAuto()
    setLocalStages(new Map())
    setSelectedPieceIdx(null)
  }

  useEffect(() => {
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [])

  useEffect(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null }
    setAutoPlay(false)
    setLocalStages(new Map())
    setSelectedPieceIdx(null)
  }, [selectedGoalId])

  async function handleDecompose() {
    if (!goalText.trim()) return
    setPhase('loading')
    setDecompTasks([])
    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText, workspaceId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDecompTasks(data.tasks ?? [])
      setPhase('done')
    } catch {
      setPhase('idle')
      alert('Decomposition failed. Please try again.')
    }
  }

  async function handleCreate() {
    if (decompTasks.length === 0) return
    const colorOptions = ['#E5487F', '#2E9BE6', '#8B5CF6', '#F5A623', '#00C896']
    const goalColor = colorOptions[goals.length % colorOptions.length]
    const goalLabel = `G${goals.length + 1}`

    const result = await createGoalWithTasks(
      workspaceId,
      { title: goalText, label: goalLabel, color: goalColor },
      decompTasks.map((dt, i) => ({
        department_id: dt.department_id,
        title: dt.title,
        description: dt.description,
        priority: dt.priority,
        tag: dt.tag ?? null,
        deadline: dt.due_date || null,
        sort: i + 1,
      }))
    )

    if ('error' in result) { alert('Failed to create goal: ' + result.error); return }

    setMode('view')
    setGoalText('')
    setDecompTasks([])
    setPhase('idle')
    // Refresh server data so new goal+tasks appear; selectedGoalId will be set after re-render
    setSelectedGoalId(result.goalId)
    router.refresh()
  }

  const numCols = (selectedGoal?.tasks.length ?? 0) > 12 ? 5 : 4
  const board = boardSize(displayTasks.length, numCols)
  const selectedPiece = selectedPieceIdx !== null ? displayTasks[selectedPieceIdx] : null
  const selectedPieceDept = selectedPiece ? deptMap.get(selectedPiece.department_id) : null

  // Unique depts in this goal
  const goalDeptsMap = new Map<string, DeptInfo>()
  for (const t of displayTasks) {
    const d = deptMap.get(t.department_id)
    if (d && !goalDeptsMap.has(t.department_id)) goalDeptsMap.set(t.department_id, d)
  }
  const goalDepts = Array.from(goalDeptsMap.values())

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F7F8FC', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left rail */}
      <div style={{ width: 300, flexShrink: 0, backgroundColor: '#fff', borderRight: '1px solid #ECEEF5', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 18px 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ECEEF5' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: '#0F1B2D' }}>{t('title')}</span>
          {(role === 'owner' || role === 'c_level') && (
            <button
              onClick={() => { setMode('new'); setPhase('idle'); setDecompTasks([]); setGoalText('') }}
              style={{ marginLeft: 'auto', height: 34, padding: '0 12px', borderRadius: 10, border: 'none', background: '#5B4FE8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              + {t('newGoal')}
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {goals.map(g => {
            const pct = pctComplete(g.tasks)
            const isSelected = g.id === selectedGoalId
            const doneCount = g.tasks.filter(t => t.stage === 'done' || t.stage === 'ready').length
            const shortName = g.title.length > 24 ? g.title.slice(0, 22) + '…' : g.title
            return (
              <div
                key={g.id}
                onClick={() => { setSelectedGoalId(g.id); setMode('view') }}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${g.color}` : '1.5px solid #ECEEF5',
                  background: isSelected ? `${g.color}10` : '#fff',
                  borderRadius: 14,
                  padding: '13px 14px',
                  transition: 'all 0.14s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: g.color, padding: '3px 8px', borderRadius: 99 }}>{g.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: g.color }}>{g.title.split(' ').slice(0, 2).join(' ')}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: '#0F1B2D' }}>{pct}%</span>
                  <button
                    onClick={async e => {
                      e.stopPropagation()
                      if (!confirm(`Delete goal "${g.title}"?`)) return
                      await deleteGoal(g.id)
                      if (selectedGoalId === g.id) setSelectedGoalId(null)
                      router.refresh()
                    }}
                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', color: '#C9CEDB', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                    title="Delete goal"
                  >×</button>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: '#0F1B2D' }}>{shortName}</div>
                <div style={{ marginTop: 10, height: 6, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: g.color, transition: 'width 0.5s' }} />
                </div>
                <div style={{ marginTop: 7, fontSize: 11, color: '#9CA3B5' }}>
                  {g.tasks.length} {t('pieces')} · {doneCount} {t('done')} · {t('dueDate')} {g.target_date ? formatDate(g.target_date) : '—'}
                </div>
              </div>
            )
          })}
          {goals.length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3B5', textAlign: 'center', marginTop: 32 }}>{t('selectGoal')}</p>
          )}
        </div>
      </div>

      {/* Main area */}
      {mode === 'new' ? (
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 32px 40px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: '#0F1B2D' }}>{t('newGoal')}</div>
          <div style={{ marginTop: 6, fontSize: 14, color: '#6B7385' }}>
            Describe the outcome. The AI splits it across departments using your org tree, roles and current workload.
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, maxWidth: 900 }}>
            <input
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDecompose()}
              placeholder={t('inputPlaceholder')}
              disabled={phase === 'loading'}
              style={{ flex: 1, minWidth: 0, height: 50, borderRadius: 12, border: '1.5px solid #E5E7F0', background: '#fff', padding: '0 16px', fontSize: 15, fontWeight: 600, color: '#0F1B2D', outline: 'none' }}
            />
            <button
              onClick={handleDecompose}
              disabled={phase === 'loading' || !goalText.trim()}
              style={{ height: 50, padding: '0 20px', borderRadius: 12, border: 'none', background: phase === 'loading' ? '#9CA3B5' : '#5B4FE8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: phase === 'loading' ? 'not-allowed' : 'pointer', boxShadow: '0 8px 18px rgba(91,79,232,.3)' }}
            >
              {phase === 'loading' ? t('decomposing') : t('decompose')}
            </button>
            <button
              onClick={() => { setMode('view'); setPhase('idle'); setDecompTasks([]) }}
              style={{ height: 50, padding: '0 16px', borderRadius: 12, border: '1.5px solid #E5E7F0', background: '#fff', color: '#6B7385', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {t('cancel')}
            </button>
          </div>

          {(phase === 'loading' || phase === 'done') && (
            <div style={{ marginTop: 24, background: '#fff', border: '1px solid #ECEEF5', borderRadius: 18, padding: 20, maxWidth: 900 }}>
              <DecompAnimation
                departments={departments}
                tasks={decompTasks}
                loading={phase === 'loading'}
                goalText={goalText}
              />
              {phase === 'done' && decompTasks.length > 0 && (
                <div style={{ marginTop: 20, animation: 'fadeUp .4s ease both' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', marginBottom: 10 }}>
                    Review & edit tasks before creating
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {decompTasks.map((task, idx) => {
                      const dept = departments.find(d => d.id === task.department_id)
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1.5px solid #ECEEF5', background: '#FAFBFF' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dept?.color ?? '#9CA3B5', flexShrink: 0 }} />
                          <input
                            value={task.title}
                            onChange={e => setDecompTasks(prev => prev.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))}
                            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#0F1B2D', outline: 'none' }}
                          />
                          <span style={{ fontSize: 11, color: '#9CA3B5', flexShrink: 0 }}>{dept?.name ?? '—'}</span>
                          <select
                            value={task.priority}
                            onChange={e => setDecompTasks(prev => prev.map((t, i) => i === idx ? { ...t, priority: e.target.value as 'high' | 'medium' | 'low' } : t))}
                            style={{ border: '1px solid #E5E7F0', borderRadius: 7, padding: '3px 20px 3px 6px', fontSize: 11, fontWeight: 700, color: task.priority === 'high' ? '#E5487F' : task.priority === 'medium' ? '#F5A623' : '#00C896', background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3B5' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 5px center`, cursor: 'pointer', outline: 'none', appearance: 'none' as const }}
                          >
                            <option value="high">high</option>
                            <option value="medium">medium</option>
                            <option value="low">low</option>
                          </select>
                          <button
                            onClick={() => setDecompTasks(prev => prev.filter((_, i) => i !== idx))}
                            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#F2F3F9', color: '#9CA3B5', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >×</button>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: '#9CA3B5' }}>
                      {decompTasks.length} tasks · {new Set(decompTasks.map(task => task.department_id)).size} departments
                    </span>
                    <button
                      onClick={handleCreate}
                      style={{ height: 46, padding: '0 20px', borderRadius: 12, border: 'none', background: '#0F1B2D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {t('createPuzzle')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {selectedGoal ? (
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 32px 40px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: selectedGoal.color, padding: '4px 10px', borderRadius: 99 }}>
                      {selectedGoal.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3B5' }}>
                      due {selectedGoal.target_date ? formatDate(selectedGoal.target_date) : '—'} · {goalDepts.length} departments
                    </span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-0.9px', lineHeight: 1.15, color: '#0F1B2D' }}>
                    {selectedGoal.title}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', color: selectedGoal.color, lineHeight: 1 }}>
                    {pctComplete(displayTasks)}%
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#9CA3B5' }}>
                    {displayTasks.filter(t => t.stage === 'done' || t.stage === 'ready').length}/{displayTasks.length} {t('pieces')}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={simulateStep} style={btnStyle}>
                  <Play size={13} /> {t('simulateStep')}
                </button>
                <button onClick={toggleAuto} style={{ ...btnStyle, background: autoPlay ? '#5B4FE8' : '#fff', color: autoPlay ? '#fff' : '#0F1B2D', border: autoPlay ? 'none' : '1px solid #E5E7F0' }}>
                  {autoPlay ? <><Square size={13} /> {t('stopAuto')}</> : <><Play size={13} /> {t('autoPlay')}</>}
                </button>
                <button onClick={resetStages} style={btnStyle}>
                  <RotateCcw size={13} /> {t('reset')}
                </button>
                <a href="/en/flow" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, fontWeight: 600, color: '#5B4FE8', textDecoration: 'none' }}>
                  {t('seeInFlow')}
                </a>
              </div>

              {/* Complete banner */}
              {isComplete && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 18px', background: '#0F1B2D', color: '#fff', animation: 'fadeUp .4s ease both' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: selectedGoal.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{t('goalComplete')}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{t('goalCompleteDesc')}</div>
                  </div>
                </div>
              )}

              {/* Hex puzzle board */}
              <div style={{ marginTop: 18, background: '#fff', border: '1px solid #ECEEF5', borderRadius: 18, boxShadow: '0 2px 12px rgba(15,27,45,.04)', padding: '34px 24px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: board.w, height: board.h }}>
                  {displayTasks.map((task, idx) => {
                    const dept = deptMap.get(task.department_id)
                    const color = dept?.color ?? '#9CA3B5'
                    const pos = hexPos(idx, numCols)
                    const fill = hexFill(task.stage, color)
                    const isSelected = selectedPieceIdx === idx
                    const labelColor = fill.fillOpacity > 0.3 ? '#fff' : '#9CA3B5'
                    const deptInitial = dept?.name?.[0] ?? '?'

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedPieceIdx(isSelected ? null : idx)}
                        title={task.title}
                        style={{
                          position: 'absolute',
                          left: pos.x,
                          top: pos.y,
                          width: HEX_W,
                          height: HEX_H,
                          cursor: 'pointer',
                          animation: `snapIn .5s ease ${idx * 0.04}s both`,
                        }}
                      >
                        <svg width={HEX_W} height={HEX_H} viewBox="0 0 87 100" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                          {isSelected && (
                            <polygon
                              points="43.5,0 87,23 87,77 43.5,100 0,77 0,23"
                              fill={color}
                              fillOpacity={0.18}
                              stroke="none"
                            />
                          )}
                          <polygon
                            points="43.5,4 83,27 83,73 43.5,96 4,73 4,27"
                            fill={fill.fill}
                            fillOpacity={fill.fillOpacity}
                            stroke={fill.stroke}
                            strokeWidth={fill.strokeWidth}
                            strokeDasharray={fill.dashed ? '8 5' : undefined}
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: labelColor }}>
                          {deptInitial}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div style={{ marginTop: 26, width: '100%', display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap', paddingTop: 18, borderTop: '1px solid #F0F1F6', alignItems: 'center' }}>
                  {goalDepts.map(d => {
                    const count = displayTasks.filter(t => t.department_id === d.id).length
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 4, background: d.color }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{d.name}</span>
                        <span style={{ fontSize: 12, color: '#9CA3B5' }}>{count} tasks</span>
                      </div>
                    )
                  })}
                  <div style={{ width: 1, height: 18, background: '#ECEEF5' }} />
                  {[
                    { label: 'Done', bg: '#0F1B2D', opacity: 1, dashed: false },
                    { label: 'In review', bg: '#0F1B2D', opacity: 0.45, dashed: false },
                    { label: 'In progress', bg: '#0F1B2D', opacity: 0.12, dashed: false },
                    { label: 'Not started', bg: 'transparent', opacity: 1, dashed: true },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7385' }}>
                      <div style={{
                        width: 11, height: 11, borderRadius: 3,
                        background: s.dashed ? 'transparent' : `rgba(15,27,45,${s.opacity})`,
                        border: s.dashed ? '2px dashed #C9CEDB' : 'none',
                      }} />
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>

              <style>{`
                @keyframes snapIn{0%{transform:scale(.55);opacity:.2}65%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
              `}</style>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 15, color: '#9CA3B5' }}>{t('selectGoal')}</p>
            </div>
          )}

          {/* Right panel: piece detail */}
          <div style={{ width: 330, flexShrink: 0, background: '#fff', borderLeft: '1px solid #ECEEF5', padding: '22px', overflowY: 'auto' }}>
            {selectedPiece ? (
              <div style={{ animation: 'fadeUp .25s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: selectedPieceDept?.color ?? '#9CA3B5', padding: '4px 10px', borderRadius: 99 }}>
                    {selectedPieceDept?.name ?? '—'}
                  </span>
                  {(() => {
                    const sc = STAGE_COLORS[selectedPiece.stage]
                    return sc ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: 99 }}>{sc.label}</span>
                    ) : null
                  })()}
                  <button onClick={() => setSelectedPieceIdx(null)} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, background: '#F2F3F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7385' }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ marginTop: 14, fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.25, color: '#0F1B2D' }}>
                  {selectedPiece.title}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#9CA3B5' }}>
                  Piece {(selectedPieceIdx ?? 0) + 1} of {displayTasks.length} in {selectedGoal?.label ?? ''} · {selectedGoal?.title.split(' ').slice(0, 2).join(' ') ?? ''}
                </div>
                {selectedPiece.description && (
                  <p style={{ marginTop: 12, fontSize: 13, color: '#6B7385', lineHeight: 1.55 }}>{selectedPiece.description}</p>
                )}
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#9CA3B5', fontWeight: 600 }}>Assignee</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {selectedPiece.assignee_name ? (
                        <>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: gradFor(selectedPiece.assignee_name), color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {initialsFor(selectedPiece.assignee_name)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{selectedPiece.assignee_name}</span>
                        </>
                      ) : <span style={{ fontSize: 13, color: '#9CA3B5' }}>Unassigned</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#9CA3B5', fontWeight: 600 }}>Deadline</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{formatDate(selectedPiece.deadline)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#9CA3B5', fontWeight: 600 }}>Source</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#5B4FE8', background: '#EEEDFB', padding: '3px 9px', borderRadius: 99 }}>{selectedPiece.source}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedPieceIdx === null) return
                    setLocalStages(prev => new Map(prev).set(selectedPiece.id, advanceStage(localStages.get(selectedPiece.id) ?? selectedPiece.stage)))
                  }}
                  disabled={selectedPiece.stage === 'done' || selectedPiece.stage === 'ready'}
                  style={{ marginTop: 20, width: '100%', height: 44, borderRadius: 12, border: 'none', background: selectedPiece.stage === 'done' || selectedPiece.stage === 'ready' ? '#E5E7F0' : '#5B4FE8', color: selectedPiece.stage === 'done' || selectedPiece.stage === 'ready' ? '#9CA3B5' : '#fff', fontSize: 13, fontWeight: 700, cursor: selectedPiece.stage === 'done' || selectedPiece.stage === 'ready' ? 'not-allowed' : 'pointer' }}
                >
                  {selectedPiece.stage === 'done' || selectedPiece.stage === 'ready' ? 'Completed' : selectedPiece.stage === 'todo' ? 'Take to work' : 'Advance'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{t('noPiece')}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: '#6B7385' }}>{t('noPieceDesc')}</div>
                <div style={{ marginTop: 16, fontSize: 12, color: '#9CA3B5' }}>{t('tapPiece')}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  height: 40, padding: '0 15px', borderRadius: 11, border: '1px solid #E5E7F0',
  background: '#fff', color: '#0F1B2D', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

// Decomposition animation component
function DecompAnimation({
  departments,
  tasks,
  loading,
  goalText,
}: {
  departments: DeptInfo[]
  tasks: DecompTask[]
  loading: boolean
  goalText: string
}) {
  const depts = departments.slice(0, 3)
  const pathColors = ['#5B4FE8', '#00C896', '#F5A623']
  const paths = [
    'M430 74 C430 130 180 120 180 176',
    'M430 74 L430 176',
    'M430 74 C430 130 680 120 680 176',
  ]
  const leftOffsets = [90, 340, 590]

  // bottom of cards: top 256 + n*(52+8), add 24 padding
  const maxCards = depts.length > 0 ? Math.max(...depts.map(d => tasks.filter(t => t.department_id === d.id).slice(0, 3).length)) : 2
  const animH = loading ? 460 : Math.max(460, 256 + maxCards * 60 + 24)

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 860, height: animH, margin: '0 auto' }}>
      <svg width="860" height={animH} viewBox={`0 0 860 ${animH}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <style>{`
          @keyframes draw{to{stroke-dashoffset:0}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(91,79,232,0)}50%{box-shadow:0 0 0 8px rgba(91,79,232,.12)}}
        `}</style>
        {depts.map((dept, i) => (
          <path
            key={dept.id}
            d={paths[i] ?? paths[0]}
            stroke={pathColors[i] ?? dept.color}
            strokeWidth="3"
            fill="none"
            strokeDasharray="420"
            strokeDashoffset="420"
            style={{ animation: `draw .9s ease ${0.1 + i * 0.15}s forwards` }}
          />
        ))}
        <path d="M180 224 L180 252 M430 224 L430 252 M680 224 L680 252" stroke="#D5D9E5" strokeWidth="2" fill="none" strokeDasharray="40" strokeDashoffset="40" style={{ animation: 'draw .3s ease 1s forwards' }} />
        {depts.map((dept, i) => (
          <circle key={dept.id} r="5" fill={pathColors[i] ?? dept.color}>
            <animateMotion dur="1.4s" begin={`${1 + i * 0.15}s`} repeatCount="indefinite" path={paths[i] ?? paths[0]} />
          </circle>
        ))}
      </svg>

      {/* Goal bubble */}
      <div style={{ position: 'absolute', left: 250, top: 14, width: 360, minHeight: 60, borderRadius: 14, background: 'linear-gradient(135deg,#5B4FE8,#3B33B0)', color: '#fff', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'glow 2s ease-in-out infinite' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.5px', color: 'rgba(255,255,255,.7)' }}>NEW GOAL</div>
        <div style={{ marginTop: 2, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{goalText}</div>
      </div>

      {/* Dept nodes + task cards */}
      {depts.map((dept, i) => {
        const deptTasks = tasks.filter(t => t.department_id === dept.id)
        return (
          <div key={dept.id}>
            <div style={{ position: 'absolute', left: leftOffsets[i], top: 176, width: 180, height: 48, borderRadius: 12, background: '#fff', border: `2px solid ${pathColors[i] ?? dept.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#0F1B2D', animation: `fadeUp .35s ease ${0.7 + i * 0.15}s both` }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: pathColors[i] ?? dept.color, flexShrink: 0 }} />
              {dept.name}
            </div>
            <div style={{ position: 'absolute', left: leftOffsets[i], top: 256, width: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading
                ? [0, 1].map(j => (
                    <div key={j} style={{ border: '1px solid #ECEEF5', borderRadius: 11, padding: '9px 11px', background: '#F7F8FC', height: 52, animation: `fadeUp .4s ease ${1.0 + i * 0.15 + j * 0.1}s both` }} />
                  ))
                : deptTasks.slice(0, 3).map((card, j) => (
                    <div key={j} style={{ border: '1px solid #ECEEF5', borderRadius: 11, padding: '9px 11px', background: '#fff', boxShadow: '0 2px 8px rgba(15,27,45,.05)', animation: `fadeUp .4s ease ${1.0 + i * 0.15 + j * 0.12}s both` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: '#0F1B2D' }}>{card.title}</div>
                      <div style={{ marginTop: 4, fontSize: 10, color: '#9CA3B5' }}>{card.priority} · {card.expected_result}</div>
                    </div>
                  ))
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
