import { useEffect, useState } from 'react'
import { getModelContext, type WebMCPToolDefinition } from '../../webmcp/registerTool'
import { OnboardingPanel } from '../common/OnboardingPanel'
import { StatusPill } from '../common/StatusPill'
import { ViewHeader } from '../common/ViewHeader'

interface JSONSchemaPropertyLike {
  type?: string
  description?: string
  enum?: string[]
}

export function ToolInspectorView({ toolDefs }: { toolDefs: WebMCPToolDefinition[] }) {
  // Prefer the live, actually-registered tool list when WebMCP is supported;
  // fall back to the local manifest (still fully runnable) when it is not,
  // or while the live query hasn't resolved yet.
  const [registeredNames, setRegisteredNames] = useState<Set<string> | null>(null)

  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return

    let cancelled = false
    modelContext.getTools().then((tools) => {
      if (cancelled) return
      setRegisteredNames(new Set(tools.map((tool) => (tool as { name: string }).name)))
    })
    return () => {
      cancelled = true
    }
  }, [toolDefs])

  const visibleTools = registeredNames ? toolDefs.filter((tool) => registeredNames.has(tool.name)) : toolDefs

  return (
    <section>
      <OnboardingPanel />
      <ViewHeader
        title="Tool Inspector"
        subtitle={`${visibleTools.length} tools available via WebMCP${registeredNames ? '' : ' (local manifest — WebMCP not detected in this browser)'}`}
      />

      <div className="space-y-3">
        {visibleTools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </section>
  )
}

function ToolCard({ tool }: { tool: WebMCPToolDefinition }) {
  const properties = (tool.inputSchema.properties ?? {}) as Record<string, JSONSchemaPropertyLike>
  const required = new Set(tool.inputSchema.required ?? [])
  const fieldNames = Object.keys(properties)

  const [values, setValues] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const input: Record<string, unknown> = {}
      for (const name of fieldNames) {
        const raw = values[name]
        if (raw) input[name] = raw
      }
      const res = await tool.execute(input)
      setResult(res.content.map((item) => item.text).join('\n\n'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The tool call failed unexpectedly.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-slate-100">{tool.name}</span>
        <StatusPill
          label={tool.annotations.readOnlyHint ? 'Read-only' : 'Write — requires approval'}
          tone={tool.annotations.readOnlyHint ? 'slate' : 'amber'}
        />
        <span className="text-xs text-slate-500">{tool.title}</span>
      </div>
      <p className="mb-3 text-sm text-slate-300">{tool.description}</p>

      {fieldNames.length > 0 && (
        <div className="mb-3 space-y-2">
          {fieldNames.map((name) => {
            const schema = properties[name] ?? {}
            const isRequired = required.has(name)
            const value = values[name] ?? ''
            const setValue = (v: string) => setValues((prev) => ({ ...prev, [name]: v }))

            return (
              <div key={name}>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {name}
                  {isRequired ? ' *' : ''}
                </label>
                {schema.enum ? (
                  <select
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="">{isRequired ? 'Select…' : '(not set)'}</option>
                    {schema.enum.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
                  />
                )}
                {schema.description && <p className="mt-0.5 text-[11px] text-slate-600">{schema.description}</p>}
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="rounded border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? 'Running…' : 'Run tool'}
      </button>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {result !== null && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs leading-relaxed text-slate-300">
          {result}
        </pre>
      )}
    </div>
  )
}
