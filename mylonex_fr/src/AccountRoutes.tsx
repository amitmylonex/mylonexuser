import FabricLoader from './shared/components/FabricLoader'
import SignOutButton from './shared/components/SignOutButton'
import { useEffect, useState } from 'react'
import AuthPage from './features/auth/AuthPage'
import BuyerPortal from './features/buyer/BuyerPortal'
import SupplierPortal from './features/supplier/SupplierPortal'
import PortalLayout from './shared/components/PortalLayout'
import AccountCard from './shared/components/AccountCard'
import { onSessionChange, restoreAccount, signOut } from './shared/session/auth'
import { completeConfirmation } from './features/auth/confirmation'
import type { PortalAccount } from './shared/session/portal-api'
import { paths, portalRole, replaceRoute } from './routes'

type Resolution = { href: string; account: PortalAccount | null; error?: string }

export default function AccountRoutes({ href, path }: { href: string; path: string }) {
  const [resolution, setResolution] = useState<Resolution>()

  useEffect(() => {
    let active = true
    let signedOut = false
    const unsubscribe = onSessionChange(event => {
      if (!active || event !== 'SIGNED_OUT') return
      signedOut = true
      setResolution({ href, account: null })
    })
    const lookup = path === paths.callback ? completeConfirmation(href) : restoreAccount()
    lookup.then(account => {
      if (!active || signedOut) return
      setResolution({ href, account })
    }).catch(error => {
      if (active) setResolution({ href, account: null, error: error instanceof Error ? error.message : 'Could not check your session.' })
    })
    return () => { active = false; unsubscribe() }
  }, [href, path])

  const current = resolution?.href === href ? resolution : undefined
  const authForm = path === paths.login || path === paths.signup
  const adminUnavailable = path === paths.login && new URL(href).searchParams.get('admin') === 'unavailable'
  const destination = current?.account && !adminUnavailable && portalRole(path) !== current.account.role ? paths.dashboards[current.account.role] :
    current && !current.account && !authForm ? paths.login : undefined

  useEffect(() => {
    if (!destination || destination === path) return
    replaceRoute(destination, current?.error)
  }, [current?.error, destination, path])

  async function logout() {
    await signOut()
    replaceRoute(paths.login)
  }

  if (!current || (destination && destination !== path)) {
    return <AccountCard busy><FabricLoader label="Checking your session…" /></AccountCard>
  }
  const { account } = current
  if (!account) return <AuthPage key={href} signupPage={path === paths.signup}
    initialError={current.error || window.history.state?.authError || ''} />
  if (account.role === 'ADMIN') return <AccountCard 
    error={adminUnavailable ? 'The admin portal URL is not configured correctly.' : undefined}>
    {adminUnavailable ? <SignOutButton onConfirm={logout} /> :
      <p role="status">Opening the admin portal…</p>}
  </AccountCard>

  return (
    <PortalLayout role={account.role} path={path} email={account.email} buyer={account.role === 'BUYER' ? account : undefined} onLogout={logout}>
      {account.role === 'BUYER' && <BuyerPortal account={account} path={path} />}
      {account.role === 'SUPPLIER' && <SupplierPortal account={account} path={path} />}
    </PortalLayout>
  )
}
