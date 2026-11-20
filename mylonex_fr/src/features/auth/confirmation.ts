import { acceptSession, verifyAccountSession, verifySignupOtp } from '../../shared/session/auth'
import { paths } from '../../routes'

let pendingConfirmation: { href: string; result: ReturnType<typeof verifyAccountSession> } | undefined

export function completeConfirmation(href: string) {
  if (pendingConfirmation?.href === href) return pendingConfirmation.result
  const result = (async () => {
    const current = new URL(href)
    const hash = new URLSearchParams(current.hash.slice(1))
    const tokenHash = current.searchParams.get('token_hash')
    const type = current.searchParams.get('type')
    const expired = new Error('This confirmation link is invalid or has expired. If already confirmed, sign in.')
    window.history.replaceState(null, '', paths.callback)
    if (tokenHash && (type === 'signup' || type === 'email')) {
      const { data, error } = await verifySignupOtp({ token_hash: tokenHash, type })
      if (error || !data.session) throw expired
      return data.session
    }
    const access_token = hash.get('access_token')
    const refresh_token = hash.get('refresh_token')
    if (!access_token || !refresh_token || !['signup', 'email'].includes(hash.get('type') ?? '')) throw expired
    const { data, error } = await acceptSession({ access_token, refresh_token })
    if (error || !data.session) throw expired
    return data.session
  })().then(session => verifyAccountSession(session))
  pendingConfirmation = { href, result }
  const clear = () => {
    if (pendingConfirmation?.result === result) pendingConfirmation = undefined
  }
  void result.then(clear, clear)
  return result
}

