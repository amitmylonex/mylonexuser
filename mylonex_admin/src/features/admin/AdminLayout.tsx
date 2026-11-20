import SignOutButton from '../../shared/components/SignOutButton'
import { dashboard, review } from '../../routes'
import type { ReactNode } from 'react'
import Logo from '../../shared/branding/Logo'


export default function AdminLayout({ path, onLogout, children }: {
  path: string; onLogout: () => Promise<void>; children: ReactNode
}) {
  return <div className="min-h-screen bg-canvas">
    <header className="border-b border-border bg-white">
      <div className="container-shell flex flex-wrap items-center justify-between gap-4 py-3">
        <Logo href={dashboard} />
        <nav aria-label="Admin console" className="flex flex-wrap gap-4 text-sm font-semibold">
          <a href={dashboard} aria-current={path === dashboard ? 'page' : undefined} className={path === dashboard ? 'text-primary underline' : 'hover:text-primary'}>Dashboard</a>
          <a href={review} aria-current={path === review ? 'page' : undefined} className={path === review ? 'text-primary underline' : 'hover:text-primary'}>RFQ review</a>
        </nav>
        <SignOutButton onConfirm={onLogout} />
      </div>
    </header>
    <main className="container-shell space-y-4 py-8">
      {children}
    </main>
  </div>
}
