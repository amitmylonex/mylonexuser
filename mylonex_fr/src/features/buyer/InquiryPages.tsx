import BuyerInquiryList from './BuyerInquiryList'
import { PortalBadge, PortalBanner, PortalEmpty, PortalFact } from '../../shared/components/PortalPanels'
import DataState from '../../shared/components/DataState'
import { usePortalData, type Inquiry, type Quote } from '../../shared/session/rfq-api'
import { InquiryPlaceholder, InquirySkeleton } from './InquirySkeleton'

export { default as Fabrics } from './catalog/FabricBrowser'

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
