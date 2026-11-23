import { useRef, useState, type ChangeEvent } from 'react'
import type { BuyerProfile } from '../types/profile.types'
import { removeAvatar, uploadAvatar } from '../api/profileApi'
import ProfileAvatar from './ProfileAvatar'

export default function AvatarUploader({ profile }: { profile: BuyerProfile }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  async function change(file?: File) {
    if (lock.current) return
    setMessage(''); setError('')
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2097152 || !file.size)) {
      setError('Choose a JPEG, PNG or WebP image up to 2 MB.'); return
    }
    lock.current = true; setBusy(true)
    try { if (file) await uploadAvatar(file); else await removeAvatar(); setMessage(file ? 'Profile photo updated.' : 'Profile photo removed.') }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not update your photo.') }
    finally { lock.current = false; setBusy(false); if (input.current) input.current.value = '' }
  }
  return <section className="card flex flex-wrap items-center gap-5 p-6" aria-label="Profile photo">
    <ProfileAvatar name={profile.fullName} email={profile.email} url={profile.avatarUrl} large />
    <div className="min-w-0 flex-1"><h2 className="font-semibold">Profile photo</h2><p className="mt-1 text-xs text-muted">JPEG, PNG or WebP · up to 2 MB. Images are cropped to a square.</p>
      <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy} className="btn-outline" onClick={() => input.current?.click()}>{busy ? 'Updating…' : 'Upload photo'}</button>
        {profile.avatarUrl && <button type="button" disabled={busy} className="btn-ghost text-red-600" onClick={() => { void change() }}>Remove photo</button>}</div>
      <input ref={input} type="file" className="sr-only" tabIndex={-1} accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" onChange={(event: ChangeEvent<HTMLInputElement>) => { void change(event.target.files?.[0]) }} />
      {message && <p role="status" className="mt-2 text-sm text-green-700">{message}</p>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  </section>
}
