'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { SyncoLogo } from './SyncoLogo'
import { Bell, ChevronDown, Settings } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface TopBarProps {
  userName?: string
  workspaceName?: string
  role?: 'owner' | 'c_level' | 'team_lead' | 'member'
  unreadCount?: number
  locale?: string
}

const ownerTabs = [
  { key: 'workFlow', href: 'flow' },
  { key: 'assignWork', href: 'assign' },
  { key: 'goals', href: 'goals' },
  { key: 'syncMind', href: 'syncmind' },
  { key: 'brainstorm', href: 'brainstorm' },
  { key: 'office', href: 'office' },
]

const cLevelTabs = [
  { key: 'overview', href: 'roles/clevel' },
  { key: 'workFlow', href: 'flow' },
  { key: 'goals', href: 'goals' },
  { key: 'syncMind', href: 'syncmind' },
  { key: 'brainstorm', href: 'brainstorm' },
  { key: 'office', href: 'office' },
]

const teamLeadTabs = [
  { key: 'myTeam', href: 'roles/lead' },
  { key: 'workFlow', href: 'flow' },
  { key: 'goals', href: 'goals' },
  { key: 'syncMind', href: 'syncmind' },
  { key: 'brainstorm', href: 'brainstorm' },
  { key: 'office', href: 'office' },
]

const memberTabs = [
  { key: 'workFlow', href: 'flow' },
  { key: 'goals', href: 'goals' },
  { key: 'syncMind', href: 'syncmind' },
  { key: 'brainstorm', href: 'brainstorm' },
  { key: 'office', href: 'office' },
]

export function TopBar({
  userName = 'Olga White',
  workspaceName = 'SYNCO Demo',
  role = 'owner',
  unreadCount = 0,
  locale: localeProp,
}: TopBarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const params = useParams()
  const locale = localeProp ?? (params?.locale as string) ?? 'en'
  const [showMenu, setShowMenu] = useState(false)

  const tabs =
    role === 'member' ? memberTabs
    : role === 'c_level' ? cLevelTabs
    : role === 'team_lead' ? teamLeadTabs
    : ownerTabs
  const initials = getInitials(userName)
  const avatarGrad = getAvatarColor(userName)

  function href(path: string) {
    return `/${locale}/${path}`
  }

  return (
    <header
      style={{
        height: 60,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #ECEEF5',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 24,
        paddingRight: 24,
        gap: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <NextLink href={href('flow')} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 32, flexShrink: 0 }}>
        <SyncoLogo size={28} />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.4px' }}>
          SYNCO
        </span>
      </NextLink>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {tabs.map(({ key, href: tabHref }) => {
          const isActive = pathname.includes(`/${tabHref}`)
          return (
            <NextLink
              key={key}
              href={href(tabHref)}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? '#5B4FE8' : '#6B7385',
                backgroundColor: isActive ? '#EEEDFB' : 'transparent',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
              }}
            >
              {t(key as 'workFlow' | 'assignWork' | 'goals' | 'syncMind' | 'brainstorm' | 'office' | 'home' | 'overview' | 'myTeam')}
            </NextLink>
          )
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Workspace label */}
        <span style={{ fontSize: 13, color: '#9CA3B5', marginRight: 4 }}>{workspaceName}</span>

        {/* Notifications bell */}
        <NextLink
          href={href('notifications')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7385',
            textDecoration: 'none',
            position: 'relative',
            backgroundColor: 'transparent',
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#F5A623',
                border: '2px solid #ffffff',
                fontSize: 9,
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NextLink>

        {/* Avatar + menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 8px 4px 4px',
              border: 'none',
              borderRadius: 99,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F3F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              className={`bg-gradient-to-br ${avatarGrad}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {initials}
            </div>
            <ChevronDown size={12} color="#9CA3B5" />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 180,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                border: '1px solid #ECEEF5',
                boxShadow: '0 12px 30px rgba(15,27,45,0.12)',
                padding: '6px',
                zIndex: 200,
              }}
            >
              <div style={{ padding: '8px 10px 6px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{userName}</p>
                <p style={{ fontSize: 12, color: '#9CA3B5' }}>{workspaceName}</p>
              </div>
              <div style={{ height: 1, backgroundColor: '#ECEEF5', margin: '4px 0' }} />
              <NextLink
                href={href('settings/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#6B7385',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setShowMenu(false)}
              >
                <Settings size={13} />
                Settings
              </NextLink>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  color: '#E5484D',
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => setShowMenu(false)}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
