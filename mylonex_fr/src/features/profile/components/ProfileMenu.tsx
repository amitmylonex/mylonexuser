import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useProfile } from '../hooks/useProfile'
import ProfileAvatar from './ProfileAvatar'
import SignOutButton from '../../../shared/components/SignOutButton'
import { replaceRoute } from '../../../routes'

export default function ProfileMenu({ userId, email, name, onLogout }: { userId: string; email: string; name?: string | null; onLogout: () => Promise<void> }) {
  const { data } = useProfile(userId)
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  function focusItem(index: number) {
    const items = container.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    if (items?.length) items[(index + items.length) % items.length].focus()
  }
  function keyboard(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('dialog')) return
    const items = Array.from(container.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1))
    }
    if (event.key === 'Tab') setOpen(false)
  }
  function navigate(path: string) { setOpen(false); replaceRoute(path) }
  return <div ref={container} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} type="button" className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Profile menu for ${data?.fullName || name || email}`}
      aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => { setOpen(value => !value); requestAnimationFrame(() => focusItem(0)) }}
      onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); requestAnimationFrame(() => focusItem(0)) } }}>
      <ProfileAvatar name={data?.fullName || name} email={email} url={data?.avatarUrl} />
    </button>
    {open && <div id={menuId} role="menu" aria-label="Buyer account" onKeyDown={keyboard} className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-border bg-white p-2 shadow-xl">
      <div className="border-b border-border px-3 py-3"><p className="truncate text-sm font-semibold">{data?.fullName || name || 'Buyer'}</p><p className="truncate text-xs text-muted">{email}</p></div>
      {[['My Profile', '/buyer/profile'], ['Edit Profile', '/buyer/profile/edit'], ['Change Password', '/buyer/profile/password']].map(([label, path]) =>
        <button key={path} type="button" role="menuitem" className="block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary/5 focus:bg-primary/5 focus:outline-none" onClick={() => navigate(path)}>{label}</button>)}
      <div role="none" className="border-t border-border pt-1" onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
        <SignOutButton className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50" menuItem onConfirm={onLogout} />
      </div>
    </div>}
  </div>
}
