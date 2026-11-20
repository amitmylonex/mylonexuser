import FabricLoader from './shared/components/FabricLoader'
import { useEffect, useState, type FormEvent } from 'react'
import AccountCard from './shared/components/AccountCard'
import AdminDashboard from './features/admin/AdminDashboard'
import RfqReview from './features/admin/RfqReview'
import AdminLayout from './features/admin/AdminLayout'
import { dashboard, login, review } from './routes'
import { onSignedOut, restoreAdmin, signIn, signOut, type Admin } from './features/admin/session'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const protectedPath = path === review ? review : dashboard
const requested = new URLSearchParams(window.location.search).get('next')
const destination = path === login && requested === review ? review : protectedPath
const loginPath = protectedPath === review ? login + '?next=' + review : login
const message = (error: unknown) => error instanceof Error ? error.message : 'Please try again.'

export default function App() {
  const [account, setAccount] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (![login, dashboard, review, '/'].includes(path)) return
    let active = true
    let signedOut = false
    const unsubscribe = onSignedOut(() => { signedOut = true; setAccount(null) })
    restoreAdmin().then(result => {
      if (active && !signedOut) setAccount(result)
    }).catch(error => {
      if (active) setError(message(error))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; unsubscribe() }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!account && [dashboard, review, '/'].includes(path)) {
      window.history.replaceState(null, '', loginPath)
    } else if (account && (path === login || path === '/' || window.location.pathname === login)) {
      window.history.replaceState(null, '', destination)
    }
  }, [account, loading])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try { setAccount(await signIn(String(form.get('email')), String(form.get('password')))) }
    catch (error) { setError(message(error)) }
    finally { setBusy(false) }
  }

  async function logout() {
    await signOut()
    window.location.replace(login)
  }

  if (![login, dashboard, review, '/'].includes(path)) {
    return <AccountCard><h1>Page not found</h1><a href={dashboard}>Back to dashboard</a></AccountCard>
  }
  if (loading) return <AccountCard busy><FabricLoader label="Checking your session…" /></AccountCard>
  if (account) return <AdminLayout path={destination} onLogout={logout}>
    {destination === review ? <RfqReview /> : <AdminDashboard account={account} />}
  </AdminLayout>
  return <AccountCard busy={busy} error={error}>
    <h1>Admin sign in</h1>
    <p>Access the MyloNex Admin Console.</p>
    <form method="post" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Email address<input className="input" name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input className="input" name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn-primary" type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
      </fieldset>
    </form>
  </AccountCard>
}
