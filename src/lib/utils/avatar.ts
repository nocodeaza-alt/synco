const GRADS = [
  'linear-gradient(135deg,#5B4FE8,#3B33B0)',
  'linear-gradient(135deg,#00C896,#00936E)',
  'linear-gradient(135deg,#F5A623,#D98A0E)',
  'linear-gradient(135deg,#E5484D,#C23338)',
  'linear-gradient(135deg,#0F1B2D,#34445F)',
]

export function gradFor(str: string): string {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return GRADS[h % GRADS.length]
}

export function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
