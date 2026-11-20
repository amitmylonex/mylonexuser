import SignOutButton from './SignOutButton'
import { useState, type ReactNode } from 'react'
import Logo from '../branding/Logo'
import type { Role } from '../session/portal-api'
import { paths } from '../../routes'

const navigation = {
  BUYER: [['Fabrics', '/buyer/fabrics'], ['Inquiries', '/buyer/inquiries']],
  SUPPLIER: [['Inquiries', '/supplier/inquiries']],
}

export default function PortalLayout({ role, path, email, onLogout, children }: {
  role: Exclude<Role, 'ADMIN'>; path: string; email: string; onLogout: () => Promise<void>; children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const links = [['Dashboard', paths.dashboards[role]], ...navigation[role]]
  return <div className="min-h-screen bg-[#f4f5f7]">
    <header className="sticky top-0 z-40 border-b border-[#e4e7ec] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between px-4 py-3 sm:px-6">
        <Logo compact />
        <button type="button" className="rounded-md p-2 text-[#4a5568] md:hidden" aria-label="Open main menu"
          aria-expanded={open} aria-controls="portal-navigation" onClick={() => setOpen(!open)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d={open ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
        <div id="portal-navigation" className={`w-full flex-col gap-3 border-t border-[#e4e7ec] pt-3 md:ml-8 md:flex md:w-auto md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:pt-0 ${open ? 'mt-3 flex md:mt-0' : 'hidden'}`}>
          <nav className="flex flex-col gap-2 md:flex-row" aria-label={role.toLowerCase() + ' portal'}>
            {links.map(([name, href]) => {
              const active = path === href || path.startsWith(href + '/')
              return <a key={href} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary text-white shadow-sm' : 'text-[#4a5568] hover:bg-[#eef2ff] hover:text-primary'}`}
                aria-current={active ? 'page' : undefined} href={href}>{name}</a>
            })}
          </nav>
          <div className="flex flex-wrap gap-3">
          {role === 'BUYER' && <a className="btn-primary" href="/buyer/inquiries/new">New RFQ</a>}
          <SignOutButton onConfirm={onLogout} />
          </div>
        </div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:py-10">
      <p className="mb-6 break-words text-xs text-[#687385]">{email}</p>
      {children}
    </main>
  </div>
}
