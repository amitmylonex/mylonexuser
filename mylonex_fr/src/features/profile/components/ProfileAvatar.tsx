import { useState } from 'react'
export default function ProfileAvatar({ name, email, url, large = false }: { name?: string | null; email: string; url?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState<string>()
  const initials = (name?.trim() || email.split('@')[0]).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-primary/10 font-semibold text-primary ${large ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm'}`}>
    {url && url !== failed ? <img className="h-full w-full object-cover" src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(url)} /> : <span aria-hidden="true">{initials}</span>}
  </span>
}
