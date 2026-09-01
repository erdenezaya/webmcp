import type { EvidenceSource } from '../../data/seed'

export function SourceBadge({ source }: { source: EvidenceSource }) {
  const isAgent = source === 'agent'
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isAgent
          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
          : 'border-slate-600/60 bg-slate-800 text-slate-300'
      }`}
    >
      {isAgent ? 'Agent' : 'Human'}
    </span>
  )
}
