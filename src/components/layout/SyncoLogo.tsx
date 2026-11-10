import { cn } from '@/lib/utils'

interface SyncoLogoProps {
  size?: number
  className?: string
  variant?: 'default' | 'white'
}

export function SyncoLogo({ size = 36, className, variant = 'default' }: SyncoLogoProps) {
  const bgColor = variant === 'white' ? '#ffffff' : '#5B4FE8'
  const squareColor = variant === 'white' ? '#5B4FE8' : '#ffffff'

  return (
    <div
      className={cn('relative flex-shrink-0', className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size * 0.44,
          height: size * 0.44,
          backgroundColor: squareColor,
          borderRadius: Math.round(size * 0.1),
          transform: 'rotate(12deg)',
        }}
      />
    </div>
  )
}

export function SyncoWordmark({
  size = 36,
  className,
  variant = 'default',
}: SyncoLogoProps) {
  const textColor = variant === 'white' ? '#ffffff' : '#0F1B2D'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <SyncoLogo size={size} variant={variant === 'white' ? 'default' : 'default'} />
      <span
        style={{
          fontSize: Math.round(size * 0.5),
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.5px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        SYNCO
      </span>
    </div>
  )
}
