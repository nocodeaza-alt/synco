export interface TaskRow {
  id: string
  title: string
  description: string | null
  stage: string
  priority: string
  source: string
  tag: string | null
  deadline: string | null
  started_at: string | null
  ready_at: string | null
  goal_id: string | null
  goal_label: string | null
  goal_color: string | null
  department_id: string
  department_name: string
  department_color: string
  assigned_to: string | null
  assignee_name: string | null
  assignee_initials: string | null
  assigned_by: string | null
  assigner_name: string | null
  results: { id: string; kind: string; url: string; file_name: string | null }[]
  comments: { id: string; author_name: string; body: string; created_at: string }[]
}

export interface DeptColumn {
  id: string
  name: string
  color: string
  tasks: TaskRow[]
  reviewer: { name: string; initials: string; role: string; doc_count: number } | null
}

export interface MemberRow {
  membership_id: string
  user_id: string
  name: string
  initials: string
  role: string
  department_id: string | null
  department_name: string | null
  open_load: number
  capacity: number
  battery_pct: number
  efficiency_pct: number
}

export interface RequestRow {
  id: string
  workspace_id: string
  from_membership_id: string
  to_department_id: string
  title: string
  description: string | null
  is_priority: boolean
  status: string
  decline_reason: string | null
  created_at: string
  from_name: string | null
  from_dept_name: string | null
  to_dept_name: string | null
}
