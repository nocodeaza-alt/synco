import { useTranslations } from 'next-intl'
import { SyncoLogo } from '@/components/layout/SyncoLogo'
import { Sparkles, Eye, CheckCircle2, BookOpen } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const features = [
  { icon: Sparkles, key: 'feature1' },
  { icon: Eye, key: 'feature2' },
  { icon: CheckCircle2, key: 'feature3' },
  { icon: BookOpen, key: 'feature4' },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations('auth.leftPanel')

  return (
    <div className="flex min-h-screen min-w-app">
      {/* Left panel — 46% gradient */}
      <div
        className="relative hidden lg:flex flex-col"
        style={{
          width: '46%',
          background: 'linear-gradient(155deg, #5B4FE8 0%, #3B33B0 45%, #0F1B2D 100%)',
          padding: '48px',
          overflow: 'hidden',
        }}
      >
        {/* White radial glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '380px',
            height: '380px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                backgroundColor: '#5B4FE8',
                borderRadius: 4,
                transform: 'rotate(12deg)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            SYNCO
          </span>
        </div>

        {/* Hero content */}
        <div className="mt-auto">
          <h1
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-1.6px',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            {t('tagline')}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 360,
            }}
          >
            {t('subtitle')}
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-2">
            {features.map(({ icon: Icon, key }) => (
              <div
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 99,
                  padding: '8px 16px',
                  alignSelf: 'flex-start',
                }}
              >
                <Icon size={14} color="rgba(255,255,255,0.80)" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {t(key as 'feature1' | 'feature2' | 'feature3' | 'feature4')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — 54% form */}
      <div
        className="flex flex-col flex-1"
        style={{
          backgroundColor: '#ffffff',
          overflowY: 'auto',
        }}
      >
        <div
          className="flex items-center justify-center flex-1"
          style={{ padding: '40px 60px' }}
        >
          <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}
