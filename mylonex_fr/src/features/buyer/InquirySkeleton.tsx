export function InquiryPlaceholder({ className }: { className: string }) {
  return <div aria-hidden="true" className={'animate-shimmer rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] motion-reduce:animate-none ' + className} />
}

export function InquirySkeleton() {
  return <div aria-hidden="true" className="card space-y-4 p-5">
    <InquiryPlaceholder className="h-5 w-2/5" />
    <InquiryPlaceholder className="h-3 w-1/4" />
    <InquiryPlaceholder className="h-12 w-full" />
  </div>
}
