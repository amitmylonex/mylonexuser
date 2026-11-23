import { useEffect, useRef } from 'react'
import type { ChatMessage } from './api'
import { requirementText } from './handoff'

const prompts = [
  ['Browse Fabric Categories', 'What fabric categories, weaves, and states are available on MyloNex?'],
  ['Find Cotton Twill', 'Show me active cotton twill fabrics with GSM between 140 and 200.'],
  ['Suppliers in Surat', 'Which approved fabric suppliers or mills are based in Surat?'],
  ['Check My Inquiries', 'What is the status of my recent inquiries and quote responses?'],
]
function FormattedText({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap break-words text-sm leading-6">{text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</div>
}
export default function ChatMessages({ messages, busy, onPrompt, onRequirement }: {
  messages: ChatMessage[]; busy: boolean; onPrompt: (text: string) => void; onRequirement: (text: string) => void
}) {
  const bottom = useRef<HTMLDivElement>(null)
  const latest = messages.at(-1)?.id
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [latest, busy])
  return <>
    {!messages.length && <div className="mx-auto max-w-2xl py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary" aria-hidden="true">✧</span>
      <h2 className="mt-5 text-xl font-semibold">How can I assist your sourcing today?</h2>
      <p className="mt-2 text-sm text-ink/60">Ask about fabrics, approved suppliers, textile specifications, or your past RFQs.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">{prompts.map(([title, prompt]) =>
        <button key={title} type="button" disabled={busy} onClick={() => onPrompt(prompt)} className="rounded-xl border border-ink/10 p-4 text-left hover:border-primary/50">
          <span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-ink/60">{prompt}</span>
        </button>)}</div>
    </div>}
    <div role="log" aria-label="Conversation messages" aria-live="polite" className="space-y-5">
      {messages.map(message => <article key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`min-w-0 max-w-[95%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${message.role === 'user' ? 'bg-primary text-white' : 'border border-ink/10 bg-white'}`}>
          <p className="mb-1 text-xs font-semibold opacity-60">{message.role === 'user' ? 'You' : message.metadata?.responseMode === 'local' ? 'MyloNex Assistant · Guided help' : 'MyloNex AI'}</p>
          <FormattedText text={message.content} />
          {!!message.metadata?.inquiries?.length && <div className="mt-3 space-y-2">{message.metadata.inquiries.map(inquiry =>
            <a key={inquiry.id} href={'/buyer/inquiries/' + encodeURIComponent(inquiry.id)} className="block rounded-lg border border-ink/10 p-3 text-sm text-primary">{inquiry.rfqNumber} · {inquiry.fabricName} →</a>)}</div>}
          {message.metadata?.requirement && <div className="mt-3 rounded-lg bg-primary/5 p-3 text-ink">
            <p className="text-sm font-semibold">Your sourcing requirement</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">{Object.entries(message.metadata.requirement).map(([key, value]) =>
              <div key={key}><dt className="capitalize text-ink/60">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="break-words">{value}</dd></div>)}</dl>
            <button type="button" className="btn-primary mt-3 text-xs" onClick={() => {
              onRequirement(requirementText(message.metadata!.requirement!))
            }}>Review in RFQ builder</button>
          </div>}
          {!!message.metadata?.fabrics?.length && <div className="mt-3 space-y-2">{message.metadata.fabrics.map(fabric =>
            <a key={fabric.id} href={'/buyer/fabrics#fabric-' + encodeURIComponent(fabric.id)} className="block rounded-lg border border-ink/10 p-3 text-sm text-primary">
              {fabric.fabricName} · {fabric.gsm} GSM · {fabric.weaveType}<span className="block text-xs">View in fabric catalog →</span>
            </a>)}</div>}
        </div>
      </article>)}
      {busy && <p role="status" className="text-sm text-ink/60">Searching and preparing your reply…</p>}
    </div><div ref={bottom} />
  </>
}
