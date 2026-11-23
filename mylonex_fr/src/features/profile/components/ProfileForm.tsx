import { useRef, useState, type FormEvent } from 'react'
import type { BuyerProfile } from '../types/profile.types'
import { profileSchema } from '../schemas/profileSchema'
import { saveProfile } from '../api/profileApi'
import { getIndiaCities, getIndiaStates } from '../../../legacy-rfq/app/buyer/inquiries/new/components/indiaLocations'

export default function ProfileForm({ profile }: { profile: BuyerProfile }) {
  const p = profile.buyerProfile
  const [fields, setFields] = useState({ fullName: profile.fullName || '', company: p?.company || '', phone: p?.phone || '',
    designation: p?.designation || '', gstNumber: p?.gstNumber || '', address: p?.address || '',
    state: p?.state || '', city: p?.city || '', pincode: p?.pincode || '' })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const lock = useRef(false)
  type Field = keyof typeof fields
  function update(key: Field, value: string) { setFields(previous => ({ ...previous, [key]: value, ...(key === 'state' ? { city: '' } : {}) })); setMessage(''); setErrors(previous => ({ ...previous, [key]: '' })) }
  function field(key: Field, label: string, maxLength: number, type = 'text', hint?: string) {
    return <label className="block text-sm font-medium" htmlFor={'profile-' + key}>{label}
      <input id={'profile-' + key} className="input mt-2 w-full" value={fields[key]} onChange={event => update(key, event.target.value)} type={type} maxLength={maxLength}
        autoComplete={key === 'fullName' ? 'name' : key === 'company' ? 'organization' : key === 'phone' ? 'tel' : key === 'pincode' ? 'postal-code' : key === 'designation' ? 'organization-title' : 'off'}
        aria-invalid={!!errors[key]} aria-describedby={errors[key] || hint ? key + '-hint' : undefined} disabled={busy} required={key === 'fullName'} />
      {(errors[key] || hint) && <span id={key + '-hint'} className={`mt-1 block text-xs font-normal ${errors[key] ? 'text-red-600' : 'text-muted'}`}>{errors[key] || hint}</span>}
    </label>
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return
    setMessage(''); setErrors({})
    const input = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim() || (key === 'fullName' ? '' : null)]))
    if (typeof input.gstNumber === 'string') input.gstNumber = input.gstNumber.toUpperCase()
    const parsed = profileSchema.safeParse(input)
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0] || 'form'), issue.message]))); return }
    lock.current = true; setBusy(true)
    try { await saveProfile(parsed.data); setMessage('Your profile has been saved.'); setFields(previous => ({ ...previous, gstNumber: previous.gstNumber.toUpperCase() })) }
    catch (error) { setErrors({ form: error instanceof Error ? error.message : 'Could not save your profile.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  return <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7" noValidate>
    <div><h2 className="text-lg font-semibold">Personal and company details</h2><p className="mt-1 text-sm text-muted">Keep your sourcing account up to date. Only your own profile can be edited.</p></div>
    <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">
      {field('fullName', 'Full name *', 200)}{field('company', 'Company name', 200)}
      {field('phone', 'Mobile number', 50, 'tel', '10–15 digits; include + for an international country code.')}{field('designation', 'Designation', 100)}
      {field('gstNumber', 'GSTIN (optional)', 15)}
      <div><p className="text-sm font-medium">Registered email</p><p className="mt-2 break-words rounded-lg bg-slate-50 p-3 text-sm">{profile.email}</p><p className="mt-1 text-xs text-muted">Email changes require a separate verification process.</p></div>
    </fieldset>
    <div className="border-t border-border pt-6"><h2 className="text-lg font-semibold">Address</h2><p className="mt-1 text-sm text-muted">India</p></div>
    <label className="block text-sm font-medium" htmlFor="profile-address">Full address<textarea id="profile-address" className="input mt-2 w-full" rows={3} maxLength={1000} autoComplete="street-address" disabled={busy}
      value={fields.address} onChange={event => update('address', event.target.value)} aria-invalid={!!errors.address} />{errors.address && <span className="mt-1 block text-xs text-red-600">{errors.address}</span>}</label>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-medium" htmlFor="profile-state">State / Union territory<select id="profile-state" className="input mt-2 w-full" autoComplete="address-level1" value={fields.state} disabled={busy} aria-invalid={!!errors.state} onChange={event => update('state', event.target.value)}>
        <option value="">Select state</option>{[...new Set([...getIndiaStates(), ...(fields.state ? [fields.state] : [])])].sort().map(state => <option key={state}>{state}</option>)}</select>{errors.state && <span className="mt-1 block text-xs text-red-600">{errors.state}</span>}</label>
      <label className="block text-sm font-medium" htmlFor="profile-city">City<select id="profile-city" className="input mt-2 w-full" autoComplete="address-level2" disabled={busy || !fields.state} value={fields.city} aria-invalid={!!errors.city} onChange={event => update('city', event.target.value)}>
        <option value="">{fields.state ? 'Select city' : 'Select a state first'}</option>{[...new Set([...getIndiaCities(fields.state), ...(fields.city ? [fields.city] : [])])].sort().map(city => <option key={city}>{city}</option>)}</select>{errors.city && <span className="mt-1 block text-xs text-red-600">{errors.city}</span>}</label>
      {field('pincode', 'Pincode', 6, 'text')}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
      <div aria-live="polite">{message && <p role="status" className="text-sm text-green-700">{message}</p>}{Object.values(errors).some(Boolean) && <p role="alert" className="text-sm text-red-700">{errors.form || 'Please check the highlighted fields.'}</p>}</div>
      <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Saving profile…' : 'Save changes'}</button>
    </div>
  </form>
}
