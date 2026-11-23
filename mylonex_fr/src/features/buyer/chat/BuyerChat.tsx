import { useEffect, useRef, useState, type FormEvent } from 'react'
import { deleteChat, listChats, readChat, sendChat, type ChatMessage, type Conversation } from './api'
import ChatMessages from './ChatMessages'

export default function BuyerChat({ buyerId }: { buyerId: string }) {
  const [chats, setChats] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [next, setNext] = useState<string | null>(null)
  const [older, setOlder] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const locked = useRef(false)
  const mounted = useRef(true)
  function failure(error: unknown) { setError(error instanceof Error ? error.message : 'Could not load chat. Please try again.') }
  async function loadList(before?: string) {
    const result = await listChats(before)
    if (!mounted.current) return
    setChats(rows => before ? [...rows, ...result.conversations] : result.conversations)
    setNext(result.next)
  }
  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    listChats(undefined, controller.signal).then(result => {
      if (!controller.signal.aborted) { setChats(result.conversations); setNext(result.next) }
    }).catch(error => { if (!controller.signal.aborted) failure(error) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { mounted.current = false; controller.abort() }
  }, [])
  async function action(work: () => Promise<void>) {
    if (locked.current) return
    locked.current = true; setLoading(true); setError('')
    try { await work() } catch (error) { if (mounted.current) failure(error) }
    finally { locked.current = false; if (mounted.current) setLoading(false) }
  }
  function newChat() { if (locked.current) return; setActive(undefined); setMessages([]); setOlder(null); setDraft(''); setError(''); setConfirmDelete(false) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || locked.current) return
    locked.current = true; setBusy(true); setError('')
    try {
      const result = await sendChat(text, active?.id)
      if (!mounted.current) return
      setActive(result.conversation); setMessages(rows => [...rows, result.userMessage, result.message]); setDraft('')
      setChats(rows => [result.conversation, ...rows.filter(row => row.id !== result.conversation.id)])
    } catch (error) { if (mounted.current) failure(error) }
    finally { locked.current = false; if (mounted.current) setBusy(false) }
  }
  function requirement(text: string) {
    try { sessionStorage.setItem('mylonex-chat-rfq:' + buyerId, text); window.location.assign('/buyer/inquiries/new') }
    catch { setError('Could not transfer the requirement. Copy the specifications into the RFQ builder.') }
  }
  const disabled = loading || busy
  return <section className="grid min-h-[620px] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm md:h-[calc(100dvh-230px)] md:min-h-[420px] md:grid-cols-[250px_minmax(0,1fr)]">
    <aside className="border-b border-ink/10 bg-[#faf9f7] p-4 md:border-b-0 md:border-r" aria-label="Chat history">
      <button className="btn-ghost w-full" type="button" disabled={disabled} onClick={newChat}>＋ New Chat</button>
      <div className="mt-4 max-h-40 space-y-1 overflow-y-auto md:max-h-[570px]">
        {!chats.length && <p className="p-3 text-xs text-ink/50">No chat history yet. Start a conversation to save your inquiries.</p>}
        {chats.map(chat => <button key={chat.id} type="button" disabled={disabled} aria-current={active?.id === chat.id ? 'true' : undefined}
          className={`block w-full truncate rounded-lg p-3 text-left text-sm ${active?.id === chat.id ? 'bg-primary/10 text-primary' : 'hover:bg-ink/5'}`}
          onClick={() => { void action(async () => { const result = await readChat(chat.id); if (!mounted.current) return; setActive(result.conversation); setMessages(result.messages); setOlder(result.next); setConfirmDelete(false); setDraft('') }) }}>{chat.title}</button>)}
        {next && <button type="button" disabled={disabled} className="btn-ghost w-full text-xs" onClick={() => { void action(() => loadList(next)) }}>Load more chats</button>}
      </div>
    </aside>
    <div className="flex min-h-0 min-w-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-5">
        <div className="min-w-0"><h1 className="truncate text-lg font-semibold">{active?.title || 'New Chat'} <span className="ml-2 text-xs font-normal text-primary">AI Sourcing</span></h1>
          <p className="mt-1 text-xs text-ink/50">Catalog, inquiry tracking and guided RFQ help · AI assistance when available</p></div>
        {active && <button type="button" disabled={disabled} className="text-xs text-red-600" onClick={() => setConfirmDelete(true)}>Delete chat</button>}
      </header>
      {confirmDelete && active && <div className="flex flex-wrap items-center gap-3 bg-red-50 p-3 text-sm" role="alert">
        Delete this conversation permanently?<button type="button" className="text-red-700 underline" disabled={disabled} onClick={() => { void action(async () => { await deleteChat(active.id); setChats(rows => rows.filter(row => row.id !== active.id)); setActive(undefined); setMessages([]); setOlder(null); setConfirmDelete(false) }) }}>Delete</button>
        <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
      </div>}
      <div className="h-[50vh] min-h-0 flex-1 overflow-y-auto p-4 sm:p-6" aria-busy={disabled}>
        {older && active && <button type="button" disabled={disabled} className="btn-ghost mb-4 text-xs" onClick={() => { void action(async () => { const result = await readChat(active.id, older); if (!mounted.current) return; setMessages(rows => [...result.messages, ...rows]); setOlder(result.next) }) }}>Load earlier messages</button>}
        {loading && <p role="status" className="text-sm text-ink/60">Loading chat…</p>}
        <ChatMessages messages={messages} busy={busy} onPrompt={setDraft} onRequirement={requirement} />
      </div>
      <form onSubmit={submit} className="border-t border-ink/10 p-4">
        {error && <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}
          <button type="button" disabled={disabled} className="ml-2 underline" onClick={() => { void action(() => loadList()) }}>Reload history</button></div>}
        <label className="sr-only" htmlFor="chat-message">Message the sourcing assistant</label>
        <div className="flex items-end gap-3 rounded-xl border border-ink/15 p-3">
          <textarea id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} rows={2} disabled={disabled}
            placeholder="Ask about fabrics, suppliers, inquiries, or describe your specifications…" className="min-w-0 flex-1 resize-none bg-transparent text-sm outline-none"
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
          <button type="submit" disabled={disabled || !draft.trim()} className="btn-primary disabled:opacity-50">{busy ? 'Sending…' : 'Send'}</button>
        </div><p className="mt-2 text-right text-xs text-ink/40">{draft.length}/4000 · Shift + Enter for a new line</p>
      </form>
    </div>
  </section>
}
