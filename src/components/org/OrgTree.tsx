'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GripVertical, Plus, Edit2 } from 'lucide-react'
import { PersonPanel } from './PersonPanel'
import { DeptPanel } from './DeptPanel'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface Person {
  id: string
  name: string
  position: string
  department: string
  role: string
  email: string
  isLead?: boolean
}

interface Dept {
  id: string
  name: string
  color: string
  lead: string
}

const INITIAL_DEPTS: Dept[] = [
  { id: 'd1', name: 'Marketing', color: '#5B4FE8', lead: 'Jane Smith' },
  { id: 'd2', name: 'Development', color: '#00C896', lead: 'Alex Kim' },
  { id: 'd3', name: 'Sales', color: '#F5A623', lead: 'Omar Diaz' },
]

const INITIAL_PEOPLE: Person[] = [
  { id: 'p2', name: 'Vera Kova', position: 'Chief Operating Officer', department: 'C-Level', role: 'c_level', email: 'vera@synco.com' },
  { id: 'p3', name: 'Jane Smith', position: 'Marketing Lead', department: 'Marketing', role: 'team_lead', email: 'jane@synco.com', isLead: true },
  { id: 'p4', name: 'Tom Reyes', position: 'Content Strategist', department: 'Marketing', role: 'member', email: 'tom@synco.com' },
  { id: 'p5', name: 'Mia Cole', position: 'Designer', department: 'Marketing', role: 'member', email: 'mia@synco.com' },
  { id: 'p6', name: 'Ana Silva', position: 'Social Media Manager', department: 'Marketing', role: 'member', email: 'ana@synco.com' },
  { id: 'p7', name: 'Alex Kim', position: 'Tech Lead', department: 'Development', role: 'team_lead', email: 'alex@synco.com', isLead: true },
  { id: 'p8', name: 'Sam Park', position: 'Backend Engineer', department: 'Development', role: 'member', email: 'sam@synco.com' },
  { id: 'p9', name: 'Lena Vu', position: 'Frontend Engineer', department: 'Development', role: 'member', email: 'lena@synco.com' },
  { id: 'p10', name: 'Omar Diaz', position: 'Sales Lead', department: 'Sales', role: 'team_lead', email: 'omar@synco.com', isLead: true },
  { id: 'p11', name: 'Ria Nair', position: 'Account Executive', department: 'Sales', role: 'member', email: 'ria@synco.com' },
]

export function OrgTree() {
  const t = useTranslations('org')
  const [depts, setDepts] = useState<Dept[]>(INITIAL_DEPTS)
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedDept, setSelectedDept] = useState<Dept | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverDept, setDragOverDept] = useState<string | null>(null)

  const cLevel = people.filter((p) => p.department === 'C-Level')

  function handleDragStart(personId: string) {
    setDragId(personId)
  }

  function handleDrop(deptName: string) {
    if (!dragId) return
    setPeople((prev) =>
      prev.map((p) => (p.id === dragId ? { ...p, department: deptName } : p))
    )
    setDragId(null)
    setDragOverDept(null)
  }

  function handleDeptSave(updated: Dept) {
    setDepts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  function handlePersonSave(updated: Person) {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handlePersonRemove(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }

  function handleDeptDelete(id: string) {
    setDepts((prev) => prev.filter((d) => d.id !== id))
  }

  function PersonCard({ person }: { person: Person }) {
    const avatarGrad = getAvatarColor(person.name)
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(person.id)}
        onClick={() => { setSelectedDept(null); setSelectedPerson(person) }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          backgroundColor: selectedPerson?.id === person.id ? '#EEEDFB' : '#ffffff',
          border: `1.5px solid ${selectedPerson?.id === person.id ? '#5B4FE8' : '#ECEEF5'}`,
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.12s',
          marginBottom: 6,
        }}
        onMouseEnter={(e) => {
          if (selectedPerson?.id !== person.id)
            e.currentTarget.style.borderColor = '#D0D5E8'
        }}
        onMouseLeave={(e) => {
          if (selectedPerson?.id !== person.id)
            e.currentTarget.style.borderColor = '#ECEEF5'
        }}
      >
        <GripVertical size={12} color="#C8CCE0" style={{ flexShrink: 0 }} />
        <div
          className={`bg-gradient-to-br ${avatarGrad}`}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {getInitials(person.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#0F1B2D',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {person.name}
            {person.isLead && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#5B4FE8',
                  backgroundColor: '#EEEDFB',
                  padding: '1px 5px',
                  borderRadius: 99,
                }}
              >
                Lead
              </span>
            )}
          </p>
          <p
            style={{
              fontSize: 11,
              color: '#9CA3B5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {person.position}
          </p>
        </div>
      </div>
    )
  }

  const deptLeads = people.filter((p) => p.isLead).map((p) => p.name)

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Auto-save indicator */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: selectedPerson || selectedDept ? 332 : 12,
          fontSize: 11,
          color: '#9CA3B5',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'right 0.22s',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00C896' }} />
        {t('autoSaved')}
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          backgroundImage: 'radial-gradient(#DDE0EA 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          padding: '40px',
        }}
      >
        {/* Owner node */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #5B4FE8, #3B33B0)',
              borderRadius: 16,
              padding: '16px 24px',
              color: '#ffffff',
              textAlign: 'center',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(91,79,232,0.30)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'rgba(255,255,255,0.65)',
                marginBottom: 6,
              }}
            >
              SYNCO Demo
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                OW
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700 }}>Olga White</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Owner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connector line */}
        <div
          style={{
            width: 2,
            height: 24,
            backgroundColor: '#DDE0EA',
            margin: '0 auto',
            marginBottom: 8,
          }}
        />

        {/* C-Level row */}
        {cLevel.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              {cLevel.map((person) => (
                <div
                  key={person.id}
                  onClick={() => { setSelectedDept(null); setSelectedPerson(person) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: `1.5px solid ${selectedPerson?.id === person.id ? '#5B4FE8' : '#ECEEF5'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
                    transition: 'all 0.12s',
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8B5CF6, #6D3FE0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {getInitials(person.name)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{person.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3B5' }}>{person.position}</p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#8B5CF6',
                      backgroundColor: 'rgba(139,92,246,0.10)',
                      padding: '2px 7px',
                      borderRadius: 99,
                      marginLeft: 'auto',
                    }}
                  >
                    C-Level
                  </span>
                </div>
              ))}
            </div>

            {/* Connector */}
            <div
              style={{
                width: 2,
                height: 24,
                backgroundColor: '#DDE0EA',
                margin: '0 auto',
                marginBottom: 8,
              }}
            />
          </>
        )}

        {/* Horizontal line to depts */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginBottom: 0,
          }}
        >
          {/* Department columns */}
          {depts.map((dept) => {
            const deptPeople = people.filter((p) => p.department === dept.name)
            const isDragOver = dragOverDept === dept.name

            return (
              <div
                key={dept.id}
                style={{ width: 236 }}
                onDragOver={(e) => { e.preventDefault(); setDragOverDept(dept.name) }}
                onDragLeave={() => setDragOverDept(null)}
                onDrop={() => handleDrop(dept.name)}
              >
                {/* Dept header card */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 14,
                    border: `1.5px solid ${isDragOver ? dept.color : '#ECEEF5'}`,
                    borderTop: `3px solid ${dept.color}`,
                    padding: '12px 14px',
                    marginBottom: 8,
                    boxShadow: isDragOver ? `0 0 0 2px ${dept.color}22` : '0 2px 10px rgba(15,27,45,0.04)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.2px' }}>
                        {dept.name}
                      </p>
                      <p style={{ fontSize: 11, color: '#9CA3B5' }}>
                        {deptPeople.length} {deptPeople.length === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedPerson(null); setSelectedDept(dept) }}
                      style={{
                        width: 26,
                        height: 26,
                        border: 'none',
                        borderRadius: 7,
                        backgroundColor: selectedDept?.id === dept.id ? '#EEEDFB' : '#F7F8FC',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selectedDept?.id === dept.id ? '#5B4FE8' : '#9CA3B5',
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                </div>

                {/* People */}
                <div style={{ paddingBottom: isDragOver ? 40 : 0 }}>
                  {deptPeople.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>

                {/* Add person button */}
                <button
                  style={{
                    width: '100%',
                    height: 32,
                    border: '1.5px dashed #D0D5E8',
                    borderRadius: 9,
                    backgroundColor: 'transparent',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#B7BCCB',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <Plus size={12} />
                  {t('addPerson')}
                </button>
              </div>
            )
          })}

          {/* Add dept button */}
          <div style={{ width: 236 }}>
            <button
              style={{
                width: '100%',
                height: 56,
                border: '1.5px dashed #D0D5E8',
                borderRadius: 14,
                backgroundColor: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: '#B7BCCB',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
              onClick={() => {
                const newDept: Dept = {
                  id: `d${Date.now()}`,
                  name: 'New Department',
                  color: '#5B4FE8',
                  lead: '',
                }
                setDepts([...depts, newDept])
              }}
            >
              <Plus size={16} />
              {t('addDepartment')}
            </button>
          </div>
        </div>
      </div>

      {/* Side panels */}
      {selectedPerson && (
        <PersonPanel
          person={selectedPerson}
          departments={depts.map((d) => d.name)}
          onClose={() => setSelectedPerson(null)}
          onSave={handlePersonSave}
          onRemove={handlePersonRemove}
        />
      )}
      {selectedDept && (
        <DeptPanel
          dept={selectedDept}
          leads={deptLeads}
          memberCount={people.filter((p) => p.department === selectedDept.name).length}
          onClose={() => setSelectedDept(null)}
          onSave={handleDeptSave}
          onDelete={handleDeptDelete}
        />
      )}
    </div>
  )
}
