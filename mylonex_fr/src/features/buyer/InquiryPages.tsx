import BuyerInquiryList from './BuyerInquiryList'
import { PortalBadge, PortalBanner, PortalEmpty, PortalFact } from '../../shared/components/PortalPanels'
import DataState from '../../shared/components/DataState'
import { useState, type FormEvent } from 'react'
import { usePortalData, portalRequest, type Inquiry, type Quote } from '../../shared/session/rfq-api'
import { InquiryPlaceholder, InquirySkeleton } from './InquirySkeleton'

type Fabric = { compositionText?: string; productionCycle?: string; gsm?: number; weaveType?: string; imageUrls?: string[]; id: string; fabricName: string; minimumOrderQuantity: number; supplier: { companyName: string }; shades: { id: string; name: string }[] }

export function Fabrics() {
  const { data, error, loading, refresh } = usePortalData<{ items: Fabric[] }>('/buyer/fabrics')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>, fabricId: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setMessage('')
    try {
      const selectedShadeIds = form.getAll('shade')
      const result = await portalRequest<{ id: string }>('/buyer/inquiries/from-fabric', {
        selectedPath: 'production', fabricId, quantity: Number(form.get('quantity')),
        deliveryPincode: form.get('pincode'), contactPhone: form.get('phone'), buyerMessage: form.get('message'),
        ...(selectedShadeIds.length ? { selectedShadeIds } : {}),
      })
      window.location.assign('/buyer/inquiries/' + result.id)
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  return <div className="space-y-6"><PortalBanner label="Buyer Portal" title="Browse Fabrics" description="Explore individual fabrics and request a production quote." /><DataState data={data} error={error} loading={loading} retry={refresh} />
    {message && <p role="alert">{message}</p>}
    {data?.items.length === 0 && <p>No eligible fabrics are available.</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.items.map(fabric => (
      <section className="card space-y-3 p-5" key={fabric.id}>
        {fabric.imageUrls?.[0] ? <img src={fabric.imageUrls[0]} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /> :
          <div className="grid aspect-[4/3] place-items-center rounded-xl bg-[#f1f5f9] text-sm text-muted">No image</div>}
        {fabric.productionCycle && <PortalBadge tone="blue">{fabric.productionCycle.replaceAll('_', ' ')}</PortalBadge>}
        <h2 className="text-xl">{fabric.fabricName}</h2>
        <p className="text-sm text-muted">{fabric.compositionText} · {fabric.weaveType} · {fabric.gsm} GSM</p>
        <p className="text-sm">{fabric.supplier.companyName} · Minimum {fabric.minimumOrderQuantity} m per shade</p>
        <details><summary className="cursor-pointer text-primary">Request production quote</summary>
          <form className="mt-3 space-y-3" onSubmit={event => submit(event, fabric.id)}>
            {fabric.shades.length > 0 && <fieldset><legend>Shades</legend>{fabric.shades.map(shade => <label className="block" key={shade.id}><input type="checkbox" name="shade" value={shade.id} /> {shade.name}</label>)}</fieldset>}
            <label className="block">Meters per shade<input className="input" name="quantity" type="number" min={fabric.minimumOrderQuantity} required /></label>
            <label className="block">Delivery pincode<input className="input" name="pincode" minLength={3} required /></label>
            <label className="block">Contact phone<input className="input" name="phone" type="tel" minLength={10} required /></label>
            <label className="block">Buyer note<textarea className="input" name="message" maxLength={500} /></label>
            <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit inquiry'}</button>
          </form>
        </details>
      </section>
    ))}</div>
  </div>
}

export function BuyerInquiries({ id }: { id?: string }) {
  return id ? <BuyerInquiry id={id} /> : <BuyerInquiryList />
}

function BuyerInquiry({ id }: { id: string }) {
  const { data, error, loading, refresh } = usePortalData<Inquiry & {
    buyerMessage: string; status: string; buyerImageUrls: string[];
    quotes: (Quote & { responseImageUrls: string[] })[]; isFabricQuickRfq: boolean
  }>('/buyer/inquiries/' + id)
  return <div className="space-y-7">
    <a className="text-sm font-medium text-primary" href="/buyer/inquiries">← Back to Inquiries</a>
    <DataState data={data} error={error} loading={loading} retry={refresh} />
    {loading && !data && <>
      <div className="card space-y-4 p-6">
        <InquiryPlaceholder className="h-4 w-32" />
        <InquiryPlaceholder className="h-8 w-2/3" />
      </div>
      <section className="space-y-4" aria-label="Inquiry requirements">
        <h2 className="text-lg">Inquiry requirements</h2>
        <InquirySkeleton />
      </section>
      <section className="space-y-4" aria-label="Released quotes">
        <h2 className="text-xl">Released quotes</h2>
        <InquirySkeleton />
      </section>
    </>}
    {data && <>
      <PortalBanner label={data.rfqNumber} title={data.fabricName} description={'Created ' + new Date(data.createdAt).toLocaleDateString('en-IN')}
        action={<div className="flex flex-wrap gap-2">{data.isFabricQuickRfq && <PortalBadge tone="blue">Fabric RFQ</PortalBadge>}<PortalBadge tone="slate">{data.status}</PortalBadge></div>} />
      <section className="card space-y-4 p-5 sm:p-6"><h2 className="text-lg">Inquiry requirements</h2>
        <dl className="grid grid-cols-2 gap-4"><PortalFact label="Quantity">{data.quantity} m</PortalFact>
          <PortalFact label="Delivery pincode">{data.deliveryPincode}</PortalFact></dl>
        <p className="text-sm leading-relaxed text-muted">{data.buyerMessage}</p>
        <Attachments urls={data.buyerImageUrls} label="Reference attachment" />
      </section>
      <h2 className="text-xl">Released quotes</h2>
      {!data.quotes.length && <PortalEmpty title="No quotes have been released yet." description="Supplier quotes appear here after approval." />}
      {data.quotes.map(quote => <section className="card space-y-3 p-5" key={quote.id}>
        <div className="flex flex-wrap justify-between gap-3"><h3>₹{quote.price} per meter</h3><PortalBadge tone="green">{quote.quoteType} quote</PortalBadge></div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3"><PortalFact label="Lead time">{quote.leadTimeDays} days</PortalFact>
          <PortalFact label="MOQ">{quote.moq} m</PortalFact><PortalFact label="Dispatch location">{quote.dispatchLocation}</PortalFact></dl>
        {quote.sampleAvailability && <p>Samples: {quote.sampleAvailability}</p>}
        {quote.notes && <p>{quote.notes}</p>}
        {quote.additionalNotes && <p>{quote.additionalNotes}</p>}
        <Attachments urls={quote.responseImageUrls} label="Quote attachment" />
      </section>)}
    </>}
  </div>
}

function Attachments({ urls, label }: { urls?: string[]; label: string }) {
  const links = urls?.filter(url => /^https?:\/\//i.test(url)) ?? []
  if (!links.length) return null
  return <ul className="space-y-1 text-sm">
    {links.map((url, index) => <li key={index}>
      <a className="text-primary underline" href={url} target="_blank" rel="noreferrer">{label} {index + 1}</a>
    </li>)}
  </ul>
}
