import { useMemo, useState } from 'react'
import type { ControlSeverity, ControlStatus } from '../../data/seed'
import { useRegister } from '../../context/RegisterContext'
import { formatDate, formatDateTime } from '../../lib/format'
import { controlStatusLabel, controlStatusTone, severityTone } from '../../lib/status'
import { SourceBadge } from '../common/SourceBadge'
import { StatusPill } from '../common/StatusPill'
import { ViewHeader } from '../common/ViewHeader'

const statusOptions: { value: ControlStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'effective', label: 'Effective' },
  { value: 'partially_effective', label: 'Partially Effective' },
  { value: 'gap', label: 'Gap' },
]

const severityOptions: { value: ControlSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function ControlsView() {
  const { controls, criticalOperations } = useRegister()
  const [statusFilter, setStatusFilter] = useState<ControlStatus | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ControlSeverity | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const operationName = (id: string) => criticalOperations.find((op) => op.id === id)?.name ?? id

  const filtered = useMemo(
    () =>
      controls.filter(
        (control) =>
          (statusFilter === 'all' || control.status === statusFilter) &&
          (severityFilter === 'all' || control.severity === severityFilter),
      ),
    [controls, statusFilter, severityFilter],
  )

  const selected = controls.find((control) => control.id === selectedId) ?? null

  return (
    <section>
      <ViewHeader
        title="Controls"
        subtitle={`${filtered.length} of ${controls.length} controls`}
        right={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ControlStatus | 'all')}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as ControlSeverity | 'all')}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="flex gap-4">
        <div className={`rounded border border-slate-800 ${selected ? 'w-2/3' : 'w-full'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Ref</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Operation</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Severity</th>
                  <th className="px-4 py-2.5 font-medium">Last Tested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filtered.map((control) => (
                  <tr
                    key={control.id}
                    onClick={() => setSelectedId(control.id)}
                    className={`cursor-pointer align-top hover:bg-slate-900/40 ${
                      selectedId === control.id ? 'bg-slate-900/60' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                      {control.controlRef}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-200">
                      <span className="line-clamp-2" title={control.description}>
                        {control.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{operationName(control.criticalOperationId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{control.owner}</td>
                    <td className="px-4 py-3">
                      <StatusPill label={controlStatusLabel(control.status)} tone={controlStatusTone(control.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={control.severity} tone={severityTone(control.severity)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatDate(control.lastTested)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                      No controls match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <aside className="w-1/3 shrink-0 rounded border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-slate-500">{selected.controlRef}</div>
                <h2 className="mt-1 text-sm font-semibold text-slate-100">{selected.description}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-300"
              >
                Close
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Operation</dt>
                <dd className="text-right text-slate-300">{operationName(selected.criticalOperationId)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Owner</dt>
                <dd className="text-right text-slate-300">{selected.owner}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusPill label={controlStatusLabel(selected.status)} tone={controlStatusTone(selected.status)} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Severity</dt>
                <dd>
                  <StatusPill label={selected.severity} tone={severityTone(selected.severity)} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Last Tested</dt>
                <dd className="text-slate-300">{formatDate(selected.lastTested)}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-slate-800 pt-3">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Evidence ({selected.evidence.length})
              </h3>
              <ul className="space-y-2">
                {selected.evidence.map((ev) => (
                  <li key={ev.id} className="rounded border border-slate-800 bg-slate-950/60 p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <SourceBadge source={ev.source} />
                      <span className="text-[11px] text-slate-500">{formatDateTime(ev.addedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-300">{ev.description}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Added by {ev.addedBy}</p>
                  </li>
                ))}
                {selected.evidence.length === 0 && (
                  <li className="text-xs text-slate-500">No evidence recorded.</li>
                )}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
