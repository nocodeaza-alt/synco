export const STAGE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  todo:           { color: '#5B4FE8', bg: '#EEEDFB', label: 'To Do' },
  in_progress:    { color: '#C77E0A', bg: 'rgba(245,166,35,.16)', label: 'In Progress' },
  ready:          { color: '#00936E', bg: 'rgba(0,200,150,.14)', label: 'Done' },
  in_review:      { color: '#7B6FF0', bg: '#F0EEFF', label: 'In Review' },
  final_review:   { color: '#7B6FF0', bg: '#F0EEFF', label: 'Final Review' },
  needs_revision: { color: '#E5484D', bg: 'rgba(229,72,77,.12)', label: 'Needs Revision' },
  done:           { color: '#6B7385', bg: '#EEF0F6', label: 'Done' },
}

export const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  high:   { color: '#E5484D', bg: 'rgba(229,72,77,.12)' },
  medium: { color: '#C77E0A', bg: 'rgba(245,166,35,.16)' },
  low:    { color: '#6B7385', bg: '#EEF0F6' },
}

export const STAGE_NODE_COLOR: Record<string, string> = {
  todo:           '#5B4FE8',
  in_progress:    '#C77E0A',
  ready:          '#00936E',
  in_review:      '#7B6FF0',
  final_review:   '#7B6FF0',
  needs_revision: '#E5484D',
  done:           '#aaa',
}
