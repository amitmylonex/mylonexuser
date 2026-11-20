import FabricLoader from '../../shared/components/FabricLoader'
import DataState from '../../shared/components/DataState'
import { useRef, useState, type FormEvent } from 'react'
import { portalRequest, usePortalData, type Inquiry, type Quote } from './rfq-api'

type Match = { id: string; supplier: { companyName: string }; communicationRequest: Inquiry }
type PendingQuote = Quote & { supplier: Match['supplier']; requestMatch: { communicationRequest: Inquiry } }

export default function RfqReview() {
  const { data, error, loading, refresh } = usePortalData<{ matches: Match[]; quotes: PendingQuote[] }>('/admin/rfq-review')
  const [message, setMessage] = useState('')
  const [action, setAction] = useState('')
  const pending = useRef(false)
  const [saved, setSaved] = useState('')
  async function review(event: FormEvent<HTMLFormElement>, path: string) {
    event.preventDefault()
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
    const note = new FormData(event.currentTarget).get('note')
    if (pending.current || loading || saved === path) return
    pending.current = true
    setAction(button.value === 'reject' ? 'Rejecting…' : path.startsWith('matches/') ? 'Forwarding RFQ…' : 'Releasing quote…')
    setMessage('')
    try {
      await portalRequest('/admin/rfq-review/' + path, { decision: button.value, note })
      setSaved(path)
      refresh()
    } catch (error) { setMessage((error as Error).message) }
    finally { pending.current = false; setAction('') }
  }
  function controls(path: string, approve: string) {
    return <form className="space-y-2" onSubmit={event => review(event, path)}>
      <label className="block">Review note<input className="input" name="note" maxLength={1000} /></label>
      <div className="flex gap-2"><button className="btn-primary" value="approve" disabled={!!action || loading || saved === path}>{approve}</button>
        <button className="btn-outline" value="reject" disabled={!!action || loading || saved === path}>Reject</button></div>
    </form>
  }
  return <><h1>RFQ review</h1><DataState data={data} error={error} loading={loading} retry={refresh} skeleton="cards" />{action && <FabricLoader label={action} />}{message && <p role="alert">{message} Try again using the same review controls.</p>}
    {data && <><h2>Matches to forward</h2>
      {!data.matches.length && <p>No pending matches.</p>}
      {data.matches.map(match => <section className="card space-y-2 p-4" key={match.id}>
        <h3>{match.communicationRequest.rfqNumber} · {match.communicationRequest.fabricName}</h3>
        <p>{match.supplier.companyName} · {match.communicationRequest.quantity} m</p>
        <p>{match.communicationRequest.buyerMessage}</p>
        {controls('matches/' + match.id, 'Forward to supplier')}
      </section>)}
      <h2>Quotes to release</h2>
      {!data.quotes.length && <p>No pending quotes.</p>}
      {data.quotes.map(quote => <section className="card space-y-2 p-4" key={quote.id}>
        <h3>{quote.requestMatch.communicationRequest.rfqNumber} · {quote.supplier.companyName}</h3>
        <p>₹{quote.price} per meter · {quote.leadTimeDays} days · MOQ {quote.moq} m · {quote.dispatchLocation}</p>
        {quote.notes && <p>{quote.notes}</p>}
        {controls('quotes/' + quote.id, 'Release to buyer')}
      </section>)}
    </>}
  </>
}
