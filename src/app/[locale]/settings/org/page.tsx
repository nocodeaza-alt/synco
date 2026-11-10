'use client'

import { useTranslations } from 'next-intl'
import { OrgTree } from '@/components/org/OrgTree'

export default function OrgPage() {
  const t = useTranslations('org')

  return (
    <div style={{ height: 'calc(100vh - 60px - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7385' }}>{t('subtitle')}</p>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#F7F8FC',
          borderRadius: 16,
          border: '1px solid #ECEEF5',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(15,27,45,0.04)',
        }}
      >
        <OrgTree />
      </div>
    </div>
  )
}
