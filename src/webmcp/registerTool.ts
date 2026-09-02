import { useEffect, useState } from 'react'

export interface WebMCPToolResult {
  content: Array<{ type: 'text'; text: string }>
}

export interface WebMCPToolDefinition<TInput = any> {
  name: string
  title: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  annotations: {
    readOnlyHint: boolean
  }
  execute: (input: TInput) => Promise<WebMCPToolResult>
}

export interface ModelContext {
  registerTool: (
    toolDef: WebMCPToolDefinition,
    options?: { signal?: AbortSignal },
  ) => void
  getTools: () => Promise<unknown[]>
  addEventListener?: (type: 'toolchange', listener: () => void) => void
  removeEventListener?: (type: 'toolchange', listener: () => void) => void
  [key: string]: unknown
}

export type WebMCPStatus =
  | { supported: true; context: ModelContext }
  | { supported: false; reason: 'unsupported' | 'origin-not-isolated' | 'error'; detail?: string }

/**
 * `document.modelContext` (or, on older builds, `navigator.modelContext`) throws
 * a SecurityError — rather than simply being `undefined` — when the page is
 * running in a site-keyed agent cluster instead of an origin-keyed one. That
 * happens whenever the `Origin-Agent-Cluster: ?1` response header is missing,
 * or anything on the page has read or written `document.domain`. A plain
 * property access must not be allowed to throw past this point, or it takes
 * down whatever called it (registration, the support banner, everything).
 */
function isOriginIsolationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'SecurityError' && /document\.domain/i.test(error.message)
}

function classifyWebMCPError(error: unknown): WebMCPStatus {
  const detail = error instanceof Error ? error.message : String(error)
  return {
    supported: false,
    reason: isOriginIsolationError(error) ? 'origin-not-isolated' : 'error',
    detail,
  }
}

/**
 * The WebMCP API moved from `navigator.modelContext` to `document.modelContext`
 * in Chrome 150; older builds still expose it on `navigator`. Safe to call from
 * any browser, in any isolation mode — never throws.
 */
export function getWebMCPStatus(): WebMCPStatus {
  try {
    const fromDocument = typeof document !== 'undefined' ? (document as any).modelContext : undefined
    if (fromDocument) return { supported: true, context: fromDocument as ModelContext }
  } catch (error) {
    return classifyWebMCPError(error)
  }

  try {
    const fromNavigator = typeof navigator !== 'undefined' ? (navigator as any).modelContext : undefined
    if (fromNavigator) return { supported: true, context: fromNavigator as ModelContext }
  } catch (error) {
    return classifyWebMCPError(error)
  }

  return { supported: false, reason: 'unsupported' }
}

export function getModelContext(): ModelContext | null {
  const status = getWebMCPStatus()
  return status.supported ? status.context : null
}

export function isWebMCPSupported(): boolean {
  return getWebMCPStatus().supported
}

export function useWebMCPTool(toolDef: WebMCPToolDefinition): void {
  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return

    const controller = new AbortController()
    modelContext.registerTool(toolDef, { signal: controller.signal })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Live-updating list of tool names currently registered with the model context.
 * Refreshes on mount and whenever the browser fires a `toolchange` event.
 */
export function useRegisteredToolNames(): string[] {
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return

    let cancelled = false
    const refresh = async () => {
      const tools = await modelContext.getTools()
      if (!cancelled) {
        setNames(tools.map((tool) => (tool as { name: string }).name))
      }
    }

    refresh()
    modelContext.addEventListener?.('toolchange', refresh)
    return () => {
      cancelled = true
      modelContext.removeEventListener?.('toolchange', refresh)
    }
  }, [])

  return names
}
