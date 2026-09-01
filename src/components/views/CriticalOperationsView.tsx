import { useRegister } from '../../context/RegisterContext'
import { StatusPill } from '../common/StatusPill'
import { ViewHeader } from '../common/ViewHeader'
import { toleranceLabel, toleranceTone } from '../../lib/status'

export function CriticalOperationsView() {
  const { criticalOperations } = useRegister()

  return (
    <section>
      <ViewHeader
        title="Critical Operations"
        subtitle="Tolerance monitoring against APRA CPS 230 disruption tolerances"
      />
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Operation</th>
              <th className="px-4 py-2.5 font-medium">Business Service</th>
              <th className="px-4 py-2.5 font-medium">Tolerance Metric</th>
              <th className="px-4 py-2.5 font-medium">Current / Threshold</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {criticalOperations.map((op) => (
              <tr key={op.id} className="align-top hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{op.name}</div>
                  <div className="mt-0.5 max-w-sm text-xs text-slate-500">{op.description}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{op.businessService}</td>
                <td className="px-4 py-3 text-slate-300">{op.toleranceMetric}</td>
                <td className="px-4 py-3">
                  <div className="text-slate-200">{op.currentValue}</div>
                  <div className="text-xs text-slate-500">Threshold: {op.toleranceThreshold}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill label={toleranceLabel(op.status)} tone={toleranceTone(op.status)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
