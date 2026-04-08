'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import UserMenu from '@/components/UserMenu'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === '/login'

  if (isLanding) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <header className="flex items-center justify-between py-3 px-6 bg-white border-b border-gray-100 shrink-0">
          <div />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  )
}
