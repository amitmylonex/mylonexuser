import FabricLoader from '../../shared/components/FabricLoader'
import { PortalBadge, PortalBanner, PortalEmpty, PortalFact } from '../../shared/components/PortalPanels'
import type { SupplierTotals } from './SupplierDashboard'
import DataState from '../../shared/components/DataState'
import { useRef, useState, type FormEvent } from 'react'
import { portalRequest, usePortalData, type Inquiry, type Quote } from '../../shared/session/rfq-api'

type Match = { id: string; forwardedAt?: string | null; communicationRequest: Inquiry; response: Quote | null }

export function SupplierInquiries({ id }: { id?: string }) {
  return id ? <SupplierInquiry id={id} /> : <SupplierList />
}

function SupplierList() {
  const { data, error, loading, refresh } = usePortalData<{ items: Match[]; totals: SupplierTotals }>('/supplier/inquiries')
  return <div className="space-y-6">
    <PortalBanner label="Supplier Portal" title="Inquiries" description="Review incoming fabric requirements and track your quotes." />
    <p className="rounded-2xl border border-[#c7d2fe] bg-[#eef2ff] px-5 py-4 text-sm text-[#344054]">
      Buyer contact details are kept private. MyloNex reviews quotes before releasing them to buyers.
    </p>
    <h2 className="text-lg font-semibold">Production RFQs</h2>
    <DataState data={data} error={error} loading={loading} retry={refresh} skeleton="table" />
    {data?.items.length === 0 && <PortalEmpty title="No production RFQs yet" description="Forwarded fabric RFQs will appear here." />}
    {data && data.totals.total > data.items.length && <p className="text-sm text-muted">Showing {data.items.length} of {data.totals.total} forwarded RFQs.</p>}
    {!!data?.items.length && <div className="overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-sm">
      <div aria-hidden="true" className="hidden grid-cols-[1fr_3fr_2fr_auto] gap-4 bg-[#f9fafb] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#667085] sm:grid">
        <span>Received</span><span>Requirement</span><span>Status</span><span>View</span>
      </div>
      <ul className="divide-y divide-[#edf1f6]">{data.items.map(match => <li key={match.id}>
        <a className="grid gap-2 px-5 py-3.5 text-sm hover:bg-[#f9fafb] sm:grid-cols-[1fr_3fr_2fr_auto] sm:items-center sm:gap-4"
          href={'/supplier/inquiries/' + match.id}>
          <time className="text-[#667085]">{match.forwardedAt ? new Date(match.forwardedAt).toLocaleDateString('en-IN') : '—'}</time>
          <span><strong>{match.communicationRequest.fabricName}</strong><br /><span className="text-xs text-[#667085]">{match.communicationRequest.rfqNumber}</span></span>
          <span><QuoteBadge status={match.response?.status} /></span><span className="font-semibold text-primary">View</span>
        </a>
      </li>)}</ul>
    </div>}
  </div>
}

function QuoteBadge({ status }: { status?: string }) {
  switch (status) {
    case 'PENDING_ADMIN_REVIEW': return <PortalBadge tone="amber">Quote Pending</PortalBadge>
    case 'APPROVED_FOR_REQUESTER': return <PortalBadge tone="green">Quote Released</PortalBadge>
    case 'ACCEPTED_BY_BUYER': return <PortalBadge tone="green">Accepted by Buyer</PortalBadge>
    case 'REJECTED_BY_ADMIN': return <PortalBadge tone="red">Quote Returned for Revision</PortalBadge>
    default: return <PortalBadge tone="amber">Needs Response</PortalBadge>
  }
}

function SupplierInquiry({ id }: { id: string }) {
  const { data, error, loading, refresh } = usePortalData<Match>('/supplier/inquiries/' + id)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || submitted || loading) return
    pending.current = true
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setMessage('')
    setBusy(true)
    try {
      await portalRequest('/supplier/inquiries/' + id + '/quote', values)
      setSubmitted(true)
      refresh()
    } catch (error) { setMessage((error as Error).message) }
    finally { pending.current = false; setBusy(false) }
  }
  const quote = data?.response
  return <div className="mx-auto max-w-4xl space-y-6"><a className="text-sm font-medium text-primary" href="/supplier/inquiries">← Back to Inbox</a><DataState data={data} error={error} loading={loading} retry={refresh} skeleton="table" />
    {data && <>
      <section className="overflow-hidden rounded-2xl border border-[#dfe3eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e7ec] px-4 py-5 sm:px-6">
          <div><h1 className="text-lg font-semibold">RFQ Match Details</h1><p className="mt-1 text-sm text-muted">{data.communicationRequest.rfqNumber}</p></div>
          <QuoteBadge status={quote?.status} />
        </header>
        <dl className="grid grid-cols-2 gap-5 px-4 py-5 sm:px-6">
          <PortalFact label="Requirement">{data.communicationRequest.fabricName}</PortalFact>
          <PortalFact label="Quantity Needed">{data.communicationRequest.quantity} meters</PortalFact>
          <PortalFact label="Delivery Pincode">{data.communicationRequest.deliveryPincode}</PortalFact>
        </dl>
        <p className="border-t border-[#e4e7ec] px-4 py-4 text-sm text-muted sm:px-6">{data.communicationRequest.buyerMessage}</p>
      </section>
      {quote && <section className="card p-4"><h2>Submitted quote</h2>
        <p>₹{quote.price} per meter · Revision {quote.submissionRevision} · {quote.status.replaceAll('_', ' ').toLowerCase()}</p>
        {quote.adminReviewNote && <p>{quote.adminReviewNote}</p>}
      </section>}
      {(!quote || quote.status === 'REJECTED_BY_ADMIN') && <form className="card max-w-xl space-y-3 p-5" onSubmit={submit}>
        <h2>{quote ? 'Revise quote' : 'Submit a quote'}</h2>
        {busy && <FabricLoader label="Submitting quote…" />}
        {message && <p role="alert">{message}</p>}
        <label className="block">Price per meter (INR)<input className="input" name="price" type="number" min="0.01" step="0.01" defaultValue={quote?.price} required /></label>
        <label className="block">Lead time in days<input className="input" name="leadTimeDays" type="number" min="1" defaultValue={quote?.leadTimeDays} required /></label>
        <label className="block">Minimum order in meters<input className="input" name="moq" type="number" min="1" defaultValue={quote?.moq} required /></label>
        <label className="block">Dispatch location<input className="input" name="dispatchLocation" defaultValue={quote?.dispatchLocation} required /></label>
        <label className="block">Quote type<select className="input" name="quoteType" defaultValue={quote?.quoteType || 'indicative'}><option value="indicative">Indicative</option><option value="exact">Exact</option></select></label>
        <label className="block">Sample availability<input className="input" name="sampleAvailability" defaultValue={quote?.sampleAvailability} /></label>
        <label className="block">Notes<textarea className="input" name="notes" defaultValue={quote?.notes} /></label>
        <button className="btn-primary" disabled={busy || submitted || loading}>{busy ? 'Submitting…' : 'Submit for approval'}</button>
      </form>}
    </>}
  </div>
}
