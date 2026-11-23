import { useRef, useState, type FormEvent } from 'react'
import { updatePassword } from '../api/profileApi'

export default function PasswordSecurityCard() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const lock = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return
    const form = event.currentTarget
    const values = new FormData(form)
    const currentPassword = String(values.get('currentPassword') || ''), newPassword = String(values.get('newPassword') || '')
    setError(''); setSuccess('')
    if (newPassword.length < 12 || newPassword.length > 128 || currentPassword === newPassword || newPassword !== values.get('confirmPassword')) {
      setError('Use a different password of 12–128 characters and make sure both new password fields match.'); return
    }
    lock.current = true; setBusy(true)
    try { const result = await updatePassword({ currentPassword, newPassword }); form.reset(); setSuccess(result.message) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not change your password. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="card mx-auto max-w-xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Change password</h2>
    <p className="mt-2 text-sm text-muted">Confirm your current password to set a new one. Your password is managed securely by the authentication provider.</p>
    <form className="mt-6 space-y-5" onSubmit={submit}>
      {([['currentPassword', 'Current password', 'current-password'], ['newPassword', 'New password', 'new-password'], ['confirmPassword', 'Confirm new password', 'new-password']] as const).map(([name, label, autocomplete]) =>
        <label key={name} className="block text-sm font-medium" htmlFor={name}>{label}<input id={name} name={name} type="password" autoComplete={autocomplete} required maxLength={128} minLength={name === 'currentPassword' ? 1 : 12} className="input mt-2 w-full" disabled={busy} /></label>)}
      <p className="text-xs text-muted">Use at least 12 characters. A unique passphrase is a good choice.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{success && <p role="status" className="text-sm text-green-700">{success}</p>}
      <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Update password'}</button>
    </form>
  </section>
}
