export type ViewId = 'operations' | 'controls' | 'providers' | 'audit' | 'board-summary' | 'tool-inspector'

const navItems: { id: ViewId; label: string; description: string }[] = [
  { id: 'operations', label: 'Critical Operations', description: 'Tolerance monitoring' },
  { id: 'controls', label: 'Controls', description: 'Control effectiveness' },
  { id: 'providers', label: 'Service Providers', description: 'Third-party risk' },
  { id: 'audit', label: 'Audit Trail', description: 'Agent activity log' },
  { id: 'board-summary', label: 'Board Summary', description: 'Agent-generated report' },
  { id: 'tool-inspector', label: 'Tool Inspector', description: 'Run tools manually' },
]

export function Sidebar({ active, onSelect }: { active: ViewId; onSelect: (id: ViewId) => void }) {
  return (
    <nav className="w-56 shrink-0 border-r border-slate-800 bg-slate-950 py-4">
      <div className="px-4 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Register
      </div>
      <ul className="space-y-0.5 px-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                active === item.id
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-[11px] text-slate-500">{item.description}</div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
