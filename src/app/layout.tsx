import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZETA SAFE - Plataforma de Capacitación SST',
  description: 'Sistema de gestión de seguridad y salud en el trabajo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
