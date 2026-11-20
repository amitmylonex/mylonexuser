import './fabric-loader.css'

export default function FabricLoader({ label }: { label: string }) {
  return <div role="status" className="flex min-h-12 items-center gap-3 text-sm text-muted">
    <svg className="fabric-loader h-8 w-9 shrink-0" viewBox="0 0 36 32" aria-hidden="true">
      <rect width="36" height="32" rx="6" fill="#eef2ff" />
      <path d="M6 4v24m6-24v24m6-24v24m6-24v24m6-24v24" stroke="#98a2b3" strokeWidth="2" />
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M4 7h28" stroke="#2f5fe3" />
        <path d="M32 13H4" stroke="#16a34a" />
        <path d="M4 19h28" stroke="#2f5fe3" />
        <path d="M32 25H4" stroke="#16a34a" />
      </g>
      <path d="M6 11v4m12-4v4m12-4v4M12 17v4m12-4v4M6 23v4m12-4v4m12-4v4" stroke="#98a2b3" strokeWidth="2" />
    </svg>
    <span>{label}</span>
  </div>
}

