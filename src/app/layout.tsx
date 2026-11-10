import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SYNCO — Your team, always in sync.',
  description: 'AI-powered operating system for remote teams.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
