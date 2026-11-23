import { useProfile } from '../hooks/useProfile'
import ProfileAvatar from '../components/ProfileAvatar'
import AvatarUploader from '../components/AvatarUploader'
import ProfileForm from '../components/ProfileForm'
import PasswordSecurityCard from '../components/PasswordSecurityCard'
import { replaceRoute } from '../../../routes'

export default function BuyerProfilePage({ userId, path }: { userId: string; path: string }) {
  const { data, loading, error, refresh } = useProfile(userId)
  const editing = path === '/buyer/profile/edit', password = path === '/buyer/profile/password'
  if (!data) return <section className="card p-6">{loading ? <p role="status">Loading your profile…</p> : <><p role="alert">{error || 'Your profile could not be loaded.'}</p><button type="button" className="btn-outline mt-4" onClick={refresh}>Try again</button></>}</section>
  const p = data.buyerProfile
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="label">Buyer account</p><h1 className="text-2xl font-semibold">{password ? 'Account security' : editing ? 'Edit profile' : 'My profile'}</h1></div>
      <nav className="flex flex-wrap gap-2" aria-label="Profile sections">{[['My profile', '/buyer/profile'], ['Edit profile', '/buyer/profile/edit'], ['Change password', '/buyer/profile/password']].map(([label, href]) =>
        <button key={href} type="button" onClick={() => replaceRoute(href)} aria-current={path === href ? 'page' : undefined} className={path === href ? 'btn-primary' : 'btn-outline'}>{label}</button>)}</nav></div>
    {password ? <PasswordSecurityCard /> : <>
      <section className="card flex flex-wrap items-center gap-5 p-6"><ProfileAvatar name={data.fullName} email={data.email} url={data.avatarUrl} large />
        <div className="min-w-0 flex-1"><h2 className="break-words text-xl font-semibold">{data.fullName || 'Your buyer account'}</h2><p className="mt-1 break-words text-sm text-muted">{data.email}</p><span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Buyer</span></div>
        <div className="text-xs text-muted"><p>Member since {new Date(data.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p><p className="mt-1">Updated {new Date(p?.updatedAt || data.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p></div>
      </section>
      {editing ? <><AvatarUploader profile={data} /><ProfileForm key={data.id} profile={data} /></> : <section className="card p-6 sm:p-8"><h2 className="text-lg font-semibold">Profile details</h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">{[
          ['Full name', data.fullName], ['Company', p?.company], ['Mobile', p?.phone], ['Designation', p?.designation], ['GSTIN', p?.gstNumber],
          ['Registered email', data.email], ['Address', p?.address], ['State', p?.state], ['City', p?.city], ['Pincode', p?.pincode],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{value || 'Not added'}</dd></div>)}</dl>
        <button type="button" className="btn-primary mt-7" onClick={() => replaceRoute('/buyer/profile/edit')}>Edit profile</button>
      </section>}
    </>}
  </div>
}
