import { useMemo } from 'react'
import { useRegister } from '../../context/RegisterContext'
import { formatDateTime } from '../../lib/format'
import { decisionTone } from '../../lib/status'
import { StatusPill } from '../common/StatusPill'
import { ViewHeader } from '../common/ViewHeader'

export function AuditTrailView() {
  const { auditTrail } = useRegister()

  const sorted = useMemo(
    () => [...auditTrail].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [auditTrail],
  )

  return (
    <section>
      <ViewHeader title="Audit Trail" subtitle={`${sorted.length} recorded agent actions, most recent first`} />
      <ul className="space-y-2">
        {sorted.map((entry) => (
          <li key={entry.id} className="rounded border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500">{formatDateTime(entry.timestamp)}</span>
                <span className="font-mono text-xs text-slate-300">{entry.toolName}</span>
                <span className="text-[11px] text-slate-600">{entry.id}</span>
              </div>
              <StatusPill label={entry.decision} tone={decisionTone(entry.decision)} />
            </div>

            <div className="mt-2">
              {entry.reason && <p className="text-xs text-slate-300">{entry.reason}</p>}
              <p className="mt-1 text-[11px] text-slate-500">
                Approver: {entry.approver ?? 'Not required (automated action)'}
              </p>
            </div>

            <pre className="mt-3 overflow-x-auto rounded bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
              {JSON.stringify(entry.args, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  )
}
