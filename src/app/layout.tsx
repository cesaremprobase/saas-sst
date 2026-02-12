import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from './ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Zeta Safe - Plataforma SST',
  description: 'Gestión Inteligente de Seguridad y Salud en el Trabajo',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png', // Using 192 as apple icon for now, usually 180
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
