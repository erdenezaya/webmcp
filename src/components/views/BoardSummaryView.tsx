import { formatDateTime } from '../../lib/format'
import { useBoardSummary } from '../../webmcp/tools'
import { ViewHeader } from '../common/ViewHeader'

export function BoardSummaryView() {
  const { summary } = useBoardSummary()

  return (
    <section>
      <ViewHeader
        title="Board Summary"
        subtitle="Agent-generated operational resilience summary, synthesised from the live register"
      />
      {!summary.text ? (
        <div className="rounded border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-500">
          No board summary has been generated yet. Ask the agent to run the{' '}
          <span className="font-mono text-xs text-slate-400">generate_board_summary</span> tool.
        </div>
      ) : (
        <div className="rounded border border-slate-800 bg-slate-900/30 p-5">
          <div className="mb-3 text-xs text-slate-500">
            Generated {summary.generatedAt ? formatDateTime(summary.generatedAt) : ''}
          </div>
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-200">
            {summary.text.split('\n\n').map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
