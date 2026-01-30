import { Sidebar } from '@/features/layout/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003366] to-[#001F3F] text-white selection:bg-zgas-lime selection:text-zgas-navy">
      <Sidebar />
      <main className="md:pl-64 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}
