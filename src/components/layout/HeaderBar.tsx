import type { WebMCPStatus } from '../../webmcp/registerTool'

const toneClasses = {
  green: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-400' },
  red: { dot: 'bg-red-500', text: 'text-red-400' },
}

function describeStatus(status: WebMCPStatus): {
  label: string
  tone: keyof typeof toneClasses
  hint?: string
} {
  if (status.supported) {
    return { label: 'Active', tone: 'green' }
  }
  switch (status.reason) {
    case 'origin-not-isolated':
      return {
        label: 'Blocked — origin not isolated',
        tone: 'amber',
        hint: 'Missing the Origin-Agent-Cluster: ?1 response header (or document.domain was set).',
      }
    case 'error':
      return { label: 'Error', tone: 'red', hint: status.detail }
    case 'unsupported':
    default:
      return { label: 'Unsupported', tone: 'red', hint: 'This browser does not implement WebMCP.' }
  }
}

export function HeaderBar({ status, toolCount }: { status: WebMCPStatus; toolCount: number }) {
  const { label, tone, hint } = describeStatus(status)
  const classes = toneClasses[tone]

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tracking-tight text-slate-100">Meridian Bank</span>
        <span className="text-xs text-slate-500">Operational Risk Register — APRA CPS 230</span>
      </div>
      <div className="flex items-center gap-2 text-xs" title={hint}>
        <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
        <span className={`font-medium ${classes.text}`}>WebMCP: {label}</span>
        {status.supported && (
          <span className="text-slate-500">
            — {toolCount} tool{toolCount === 1 ? '' : 's'} registered
          </span>
        )}
      </div>
    </header>
  )
}
