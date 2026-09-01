export function HeaderBar({ supported, toolCount }: { supported: boolean; toolCount: number }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tracking-tight text-slate-100">Meridian Bank</span>
        <span className="text-xs text-slate-500">Operational Risk Register — APRA CPS 230</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`h-1.5 w-1.5 rounded-full ${supported ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className={`font-medium ${supported ? 'text-emerald-400' : 'text-red-400'}`}>
          WebMCP: {supported ? 'Active' : 'Unsupported'}
        </span>
        {supported && (
          <span className="text-slate-500">
            — {toolCount} tool{toolCount === 1 ? '' : 's'} registered
          </span>
        )}
      </div>
    </header>
  )
}
