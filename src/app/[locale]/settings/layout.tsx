'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useParams } from 'next/navigation'
import NextLink from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import {
  User,
  Building2,
  Users,
  ShieldCheck,
  Plug,
  Bell,
  GitBranch,
} from 'lucide-react'

const navItems = [
  { key: 'profile', path: 'profile', icon: User },
  { key: 'workspace', path: 'workspace', icon: Building2 },
  { key: 'members', path: 'members', icon: Users },
  { key: 'permissions', path: 'permissions', icon: ShieldCheck },
  { key: 'integrations', path: 'integrations', icon: Plug },
  { key: 'notifications', path: 'notifications', icon: Bell },
  { key: 'orgTree', path: 'org', icon: GitBranch },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('settings')
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F8FC' }}>
      <TopBar locale={locale} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 250,
            backgroundColor: '#ffffff',
            borderRight: '1px solid #ECEEF5',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 12px',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#0F1B2D',
              letterSpacing: '-0.5px',
              marginBottom: 20,
              paddingLeft: 8,
            }}
          >
            {t('title')}
          </h2>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {navItems.map(({ key, path, icon: Icon }) => {
              const href = `/${locale}/settings/${path}`
              const isActive = pathname === href || pathname.startsWith(href)
              return (
                <NextLink
                  key={key}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '9px 10px',
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#5B4FE8' : '#6B7385',
                    backgroundColor: isActive ? '#F2F3F9' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  <Icon size={15} />
                  {t(`nav.${key as 'profile' | 'workspace' | 'members' | 'permissions' | 'integrations' | 'notifications' | 'orgTree'}`)}
                </NextLink>
              )
            })}
          </nav>

          {/* Workspace card at bottom */}
          <div
            style={{
              padding: '12px',
              borderRadius: 12,
              border: '1px solid #ECEEF5',
              backgroundColor: '#FAFBFF',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #00C896, #00936E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                R
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>SYNCO Demo</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#9CA3B5' }}>
              Signed in as <span style={{ color: '#6B7385', fontWeight: 600 }}>Olga White</span>
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 36px',
          }}
        >
          {children}
        </main>
      </div>

      <LanguageSwitch />
    </div>
  )
}
