import { useId, useRef, useState } from 'react'
import FabricLoader from './FabricLoader'

export default function SignOutButton({ onConfirm, className = 'btn-outline', menuItem = false }: {
  onConfirm: () => Promise<void>; className?: string; menuItem?: boolean
}) {
  const title = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const stay = useRef<HTMLButtonElement>(null)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await onConfirm()
      dialog.current?.close()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <>
    <button ref={trigger} type="button" role={menuItem ? 'menuitem' : undefined} className={className} aria-haspopup="dialog" onClick={() => {
      setError('')
      dialog.current?.showModal()
      stay.current?.focus()
    }}>Sign out</button>
    <dialog ref={dialog} aria-labelledby={title}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-white p-5 text-ink shadow-xl backdrop:bg-slate-900/40 sm:p-6"
      onCancel={event => { if (pending.current) event.preventDefault() }}
      onClose={() => trigger.current?.focus()}>
      <h2 id={title} className="text-lg font-semibold">Sign out of MyloNex?</h2>
      <div className="mt-2 min-h-12">
        {busy && <FabricLoader label="Signing out…" />}
        {error && <p role="alert" className="text-sm text-destructive">{error} Choose Sign out to retry.</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button ref={stay} type="button" className="btn-outline" disabled={busy} onClick={() => dialog.current?.close()}>Stay signed in</button>
        <button type="button" className="btn-primary" disabled={busy} onClick={confirm}>{busy ? 'Signing out…' : 'Sign out'}</button>
      </div>
    </dialog>
  </>
}

