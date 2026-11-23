import { useState, type FormEvent } from 'react'
import { portalRequest } from '../../../shared/session/rfq-api'
import { PortalBadge } from '../../../shared/components/PortalPanels'
import type { Fabric } from './types'

export default function FabricCard({ fabric }: { fabric: Fabric }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setMessage('')
    try {
      const selectedShadeIds = form.getAll('shade')
      const result = await portalRequest<{ id: string }>('/buyer/inquiries/from-fabric', {
        selectedPath: 'production', fabricId: fabric.id, quantity: Number(form.get('quantity')),
        deliveryPincode: form.get('pincode'), contactPhone: form.get('phone'), buyerMessage: form.get('message'),
        ...(selectedShadeIds.length ? { selectedShadeIds } : {}),
      })
      window.location.assign('/buyer/inquiries/' + result.id)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not submit the inquiry.') }
    finally { setBusy(false) }
  }
  return <section id={'fabric-' + fabric.id} className="card scroll-mt-28 overflow-hidden">
    {fabric.imageUrls?.[0] ? <img src={fabric.imageUrls[0]} alt={fabric.fabricName} loading="lazy" className="aspect-[4/3] w-full object-cover" /> :
      <div className="grid aspect-[4/3] place-items-center bg-[#f1f5f9] text-sm text-muted">No image</div>}
    <div className="space-y-3 p-5">
      {fabric.productionCycle && <PortalBadge tone="blue">{fabric.productionCycle.replaceAll('_', ' ')}</PortalBadge>}
      <h2 className="text-xl font-semibold">{fabric.fabricName}</h2>
      <p className="text-sm text-muted">{fabric.compositionText} · {fabric.weaveType} · {fabric.gsm} GSM</p>
      <p className="text-sm">{fabric.supplier.companyName} · Minimum {fabric.minimumOrderQuantity} m per shade</p>
      <details><summary className="cursor-pointer text-sm font-semibold text-primary">Request production quote</summary>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          {fabric.shades.length > 0 && <fieldset><legend>Shades</legend>{fabric.shades.map(shade => <label className="block" key={shade.id}><input type="checkbox" name="shade" value={shade.id} disabled={busy} /> {shade.name}</label>)}</fieldset>}
          <label className="block text-sm">Meters per shade<input className="input mt-1 w-full" name="quantity" type="number" min={fabric.minimumOrderQuantity} required disabled={busy} /></label>
          <label className="block text-sm">Delivery pincode<input className="input mt-1 w-full" name="pincode" minLength={3} required disabled={busy} /></label>
          <label className="block text-sm">Contact phone<input className="input mt-1 w-full" name="phone" type="tel" minLength={10} required disabled={busy} /></label>
          <label className="block text-sm">Buyer note<textarea className="input mt-1 w-full" name="message" maxLength={500} disabled={busy} /></label>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit inquiry'}</button>
        </form>
      </details>
    </div>
  </section>
}
