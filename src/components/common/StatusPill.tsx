import type { Tone } from '../../lib/status'

const toneClasses: Record<Tone, string> = {
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  red: 'border-red-500/30 bg-red-500/10 text-red-400',
  slate: 'border-slate-600/50 bg-slate-800/60 text-slate-300',
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
}

const dotClasses: Record<Tone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
  sky: 'bg-sky-500',
}

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[tone]}`} />
      {label}
    </span>
  )
}
