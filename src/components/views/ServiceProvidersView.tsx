import { useRegister } from '../../context/RegisterContext'
import { formatDate } from '../../lib/format'
import { concentrationTone } from '../../lib/status'
import { StatusPill } from '../common/StatusPill'
import { ViewHeader } from '../common/ViewHeader'

export function ServiceProvidersView() {
  const { serviceProviders } = useRegister()

  return (
    <section>
      <ViewHeader
        title="Service Providers"
        subtitle={`${serviceProviders.length} providers in scope of CPS 230 third-party risk assessment`}
      />
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Material</th>
              <th className="px-4 py-2.5 font-medium">Concentration Risk</th>
              <th className="px-4 py-2.5 font-medium">CPS 230 Gaps</th>
              <th className="px-4 py-2.5 font-medium">Contract Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {serviceProviders.map((sp) => (
              <tr key={sp.id} className="align-top hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{sp.name}</div>
                  <div className="mt-0.5 max-w-sm text-xs text-slate-500">{sp.notes}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{sp.category}</td>
                <td className="px-4 py-3">
                  <StatusPill label={sp.isMaterial ? 'Material' : 'Non-Material'} tone={sp.isMaterial ? 'amber' : 'slate'} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill label={sp.concentrationRisk} tone={concentrationTone(sp.concentrationRisk)} />
                </td>
                <td className="px-4 py-3">
                  <span className={sp.cps230GapCount > 0 ? 'font-medium text-red-400' : 'text-slate-400'}>
                    {sp.cps230GapCount}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatDate(sp.contractReviewDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
