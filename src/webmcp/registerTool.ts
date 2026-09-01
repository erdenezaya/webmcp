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

/**
 * The WebMCP API moved from `navigator.modelContext` to `document.modelContext`
 * in Chrome 150; older builds still expose it on `navigator`.
 */
export function getModelContext(): ModelContext | null {
  if (typeof document !== 'undefined' && (document as any).modelContext) {
    return (document as any).modelContext as ModelContext
  }
  if (typeof navigator !== 'undefined' && (navigator as any).modelContext) {
    return (navigator as any).modelContext as ModelContext
  }
  return null
}

export function isWebMCPSupported(): boolean {
  return getModelContext() !== null
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
