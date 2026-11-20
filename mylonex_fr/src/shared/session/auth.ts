import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { ApiError } from '../api'
import { verifyBuyer } from '../../features/auth/buyer-api'
import { loadPortal, readAccount } from './portal-api'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const auth = url && key ? createClient(url, key, {
  auth: {
    storageKey: 'mylonex-buyer-session',
    detectSessionInUrl: false,
  },
}).auth : null

function client() {
  if (!auth) throw new Error('Buyer authentication is not configured. Check the frontend environment settings.')
  return auth
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

async function checkSession(session: Session, buyerSignup = false) {
  try {
    return await (buyerSignup ? verifyBuyer(session.access_token) : loadPortal(session.access_token))
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 409].includes(error.status)) {
      await signOut().catch(() => undefined)
    }
    throw error
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await client().signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error || !data.session) {
    if (error?.code === 'email_not_confirmed') throw new Error('Confirm your email before signing in.')
    if (error?.code === 'invalid_credentials') throw new Error('Email or password is incorrect.')
    if (error?.status === 429) throw new Error('Too many attempts. Wait a moment and try again.')
    throw new Error('Could not sign in. Please try again.')
  }
  return checkSession(data.session)
}

export async function acceptBuyerSignup(accessToken: string, refreshToken: string) {
  const { data, error } = await client().setSession({
    access_token: accessToken, refresh_token: refreshToken,
  })
  if (error || !data.session) throw new Error('Your account was registered. Please sign in.')
  return checkSession(data.session, true)
}
export const acceptSession = (tokens: { access_token: string; refresh_token: string }) => client().setSession(tokens)
export const verifySignupOtp = (params: { token_hash: string; type: 'signup' | 'email' }) => client().verifyOtp(params)
export const verifyAccountSession = (session: Session) => checkSession(session)

export async function restoreAccount() {
  const { data, error } = await client().getSession()
  if (error) throw new Error('Could not restore your session. Please try again.')
  return data.session ? checkSession(data.session) : null
}

export function onSessionChange(handler: (event: AuthChangeEvent) => void) {
  const subscription = auth?.onAuthStateChange(event => handler(event)).data.subscription
  return () => subscription?.unsubscribe()
}

export async function readCurrentAccount(signal: AbortSignal) {
  if (!auth) return null
  const { data } = await auth.getSession()
  return data.session && !signal.aborted ? readAccount(data.session.access_token, signal) : null
}
