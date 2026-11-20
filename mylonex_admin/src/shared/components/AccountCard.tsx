import type { ReactNode } from 'react'
import Logo from '../branding/Logo'
import './account-card.css'

export default function AccountCard({ children, busy, error }: {
  children: ReactNode
  busy?: boolean
  error?: string
}) {
  return (
    <main className="auth-page">
      <div className="auth-content">
        <div className="auth-brand"><Logo /></div>
        <section className="auth-card" aria-busy={busy}>
          {error && <p className="error" role="alert">{error}</p>}
          {children}
        </section>
      </div>
    </main>
  )
}
