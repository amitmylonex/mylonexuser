import { createClient, type Session } from '@supabase/supabase-js'
import { ApiError, request } from '../../shared/api'

export type Admin = { id: string; role: 'ADMIN'; email: string; fullName: string | null }

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const auth = url && key ? createClient(url, key, {
  auth: { storageKey: 'mylonex-admin-session', detectSessionInUrl: false },
}).auth : null

function client() {
  if (!auth) throw new Error('Admin authentication is not configured.')
  return auth
}

async function verify(session: Session) {
  try {
    return await request<Admin>('/admin/me', {
      headers: { Authorization: 'Bearer ' + session.access_token },
    })
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      await signOut().catch(() => undefined)
    }
    throw error
  }
}

export async function restoreAdmin() {
  const { data, error } = await client().getSession()
  if (error) throw new Error('Could not restore your session. Please sign in again.')
  return data.session ? verify(data.session) : null
}

export async function signIn(email: string, password: string) {
  const { data, error } = await client().signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error?.code === 'email_not_confirmed') throw new Error('Confirm your email before signing in.')
  if (error?.code === 'invalid_credentials') throw new Error('Email or password is incorrect.')
  if (error?.status === 429) throw new Error('Too many attempts. Wait a moment and try again.')
  if (error || !data.session) throw new Error('Could not sign in. Please try again.')
  return verify(data.session)
}

export async function getAccessToken() {
  const { data, error } = await client().getSession()
  if (error || !data.session) throw new Error('Sign in to continue.')
  return data.session.access_token
}

export async function signOut() {
  const authClient = client()
  const { data, error } = await authClient.getSession()
  const failure = 'Could not sign out. Check your connection and try again.'
  if (error) throw new Error(failure)

  // Revoke before the SDK clears local state so a failed request can be retried.
  if (data.session) {
    const { error: revokeError } = await authClient.admin.signOut(data.session.access_token, 'local')
    if (revokeError && ![401, 403, 404].includes(revokeError.status ?? 0)) throw new Error(failure)
  }

  // This clears SDK storage and broadcasts SIGNED_OUT; revocation is idempotent.
  const result = await authClient.signOut({ scope: 'local' })
  if (result.error && (await authClient.getSession()).data.session) throw new Error(failure)
}

export function onSignedOut(handler: () => void) {
  const sub = auth?.onAuthStateChange(event => { if (event === 'SIGNED_OUT') handler() }).data.subscription
  return () => sub?.unsubscribe()
}
