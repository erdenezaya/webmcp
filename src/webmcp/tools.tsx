import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRegister } from '../context/RegisterContext'
import type {
  Control,
  ControlSeverity,
  CriticalOperation,
  EvidenceItem,
  RemediationAction,
  ServiceProvider,
  ToleranceStatus,
} from '../data/seed'
import { useApproval } from './approval'
import type { WebMCPToolDefinition, WebMCPToolResult } from './registerTool'
import { useWebMCPTool } from './registerTool'

function textResult(text: string): WebMCPToolResult {
  return { content: [{ type: 'text', text }] }
}

// ---------------------------------------------------------------------------
// Board summary: the one synthesis tool renders its output into the UI, not
// just back to the agent. This tiny context is the hand-off point between the
// tool's execute() and the BoardSummaryView that displays it.
// ---------------------------------------------------------------------------

export interface BoardSummarySnapshot {
  text: string | null
  generatedAt: string | null
}

interface BoardSummaryContextValue {
  summary: BoardSummarySnapshot
  setSummary: (text: string) => void
}

const BoardSummaryContext = createContext<BoardSummaryContextValue | null>(null)

export function BoardSummaryProvider({ children }: { children: ReactNode }) {
  const [summary, setSummaryState] = useState<BoardSummarySnapshot>({ text: null, generatedAt: null })

  const setSummary = useCallback((text: string) => {
    setSummaryState({ text, generatedAt: new Date().toISOString() })
  }, [])

  const value = useMemo<BoardSummaryContextValue>(() => ({ summary, setSummary }), [summary, setSummary])

  return <BoardSummaryContext.Provider value={value}>{children}</BoardSummaryContext.Provider>
}

export function useBoardSummary(): BoardSummaryContextValue {
  const ctx = useContext(BoardSummaryContext)
  if (!ctx) throw new Error('useBoardSummary must be used within a BoardSummaryProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Fuzzy provider name matching for assess_service_provider
// ---------------------------------------------------------------------------

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function fuzzyMatchProvider(providers: ServiceProvider[], query: string): ServiceProvider | undefined {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return undefined

  const exact = providers.find((p) => normalize(p.name) === normalizedQuery)
  if (exact) return exact

  const substring = providers.find(
    (p) => normalize(p.name).includes(normalizedQuery) || normalizedQuery.includes(normalize(p.name)),
  )
  if (substring) return substring

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  const scored = providers
    .map((provider) => {
      const nameTokens = normalize(provider.name).split(' ').filter(Boolean)
      const overlap = queryTokens.filter((token) =>
        nameTokens.some((nameToken) => nameToken.startsWith(token) || token.startsWith(nameToken)),
      ).length
      return { provider, overlap }
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)

  return scored[0]?.provider
}

// ---------------------------------------------------------------------------
// Board summary synthesis
// ---------------------------------------------------------------------------

interface RegisterSnapshot {
  criticalOperations: CriticalOperation[]
  controls: Control[]
  serviceProviders: ServiceProvider[]
  remediationActions: RemediationAction[]
}

function buildBoardSummary(register: RegisterSnapshot): string {
  const { criticalOperations, controls, serviceProviders, remediationActions } = register
  const dateStr = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  const breaches = criticalOperations.filter((op) => op.status === 'breached')
  const approaching = criticalOperations.filter((op) => op.status === 'approaching')
  const gaps = controls.filter((c) => c.status !== 'effective')
  const criticalOrHighGaps = gaps.filter((c) => c.severity === 'critical' || c.severity === 'high')
  const concentratedMaterialProviders = serviceProviders.filter((p) => p.isMaterial && p.concentrationRisk !== 'low')
  const openRemediations = remediationActions.filter((r) => r.status !== 'closed')
  const overdueRemediations = openRemediations.filter((r) => r.status === 'overdue')

  const paragraphs: string[] = []

  paragraphs.push(
    `Operational Resilience Summary — Meridian Bank — ${dateStr}\n\nThis summary reflects the current state of the CPS 230 operational risk register across ${criticalOperations.length} critical operations, ${controls.length} controls, and ${serviceProviders.length} service providers.`,
  )

  paragraphs.push(
    breaches.length > 0
      ? `Tolerance Breaches: ${breaches.length} critical operation${breaches.length === 1 ? ' is' : 's are'} currently breaching its disruption tolerance — ${breaches
          .map((op) => `${op.name} (${op.currentValue} against a threshold of ${op.toleranceThreshold})`)
          .join('; ')}. This is a direct APRA CPS 230 compliance exposure and requires immediate board attention.`
      : 'Tolerance Breaches: No critical operations are currently breaching their disruption tolerance.',
  )

  if (approaching.length > 0) {
    paragraphs.push(
      `Operations Approaching Tolerance: ${approaching.length} operation${approaching.length === 1 ? ' is' : 's are'} trending toward breach — ${approaching
        .map((op) => op.name)
        .join(', ')}. These warrant proactive monitoring before they escalate.`,
    )
  }

  paragraphs.push(
    gaps.length > 0
      ? `Control Environment: ${gaps.length} of ${controls.length} controls are not fully effective, including ${criticalOrHighGaps.length} rated critical or high severity${
          criticalOrHighGaps.length > 0
            ? ` (${criticalOrHighGaps
                .slice(0, 5)
                .map((c) => `${c.controlRef}: ${c.severity}`)
                .join(', ')})`
            : ''
        }. These represent the bank's weakest points in the CPS 230 control environment.`
      : 'Control Environment: All controls in the register are currently assessed as effective.',
  )

  paragraphs.push(
    concentratedMaterialProviders.length > 0
      ? `Service Provider Concentration: ${concentratedMaterialProviders.length} material service provider${
          concentratedMaterialProviders.length === 1 ? ' carries' : 's carry'
        } elevated concentration risk — ${concentratedMaterialProviders
          .map((p) => `${p.name} (${p.concentrationRisk})`)
          .join(', ')}. Continued reliance on these providers without demonstrated substitutability remains a key third-party risk.`
      : 'Service Provider Concentration: No material service providers are currently assessed at elevated concentration risk.',
  )

  paragraphs.push(
    openRemediations.length > 0
      ? `Remediation Program: ${openRemediations.length} remediation action${openRemediations.length === 1 ? ' is' : 's are'} open, of which ${overdueRemediations.length} ${overdueRemediations.length === 1 ? 'is' : 'are'} overdue. Overdue items should be escalated to close before the next reporting cycle.`
      : 'Remediation Program: No remediation actions are currently open.',
  )

  return paragraphs.join('\n\n')
}

// ---------------------------------------------------------------------------
// useToolManifest: builds the seven tool definitions once. This is the single
// source of truth both for what gets registered with WebMCP (RegisterTools)
// and for the Tool Inspector's local manifest, which must be able to list and
// run every tool even in browsers with no WebMCP support at all.
// ---------------------------------------------------------------------------

export function useToolManifest(options: { onBoardSummaryGenerated?: () => void } = {}): WebMCPToolDefinition[] {
  const register = useRegister()
  const approval = useApproval()
  const { setSummary } = useBoardSummary()
  const { onBoardSummaryGenerated } = options

  // useWebMCPTool registers its toolDef exactly once, on mount, so `execute`
  // closures captured at that point would otherwise go stale as register/approval
  // state changes. Keeping the latest values in a ref (reassigned every render)
  // lets each execute() read live data at call time without re-registering.
  const ctxRef = useRef({ register, approval, setSummary, onBoardSummaryGenerated })
  useLayoutEffect(() => {
    ctxRef.current = { register, approval, setSummary, onBoardSummaryGenerated }
  })

  // Built once (stable identity): every execute() below reads ctxRef.current
  // at call time, so a stable manifest object is both correct and cheap.
  return useMemo<WebMCPToolDefinition[]>(
    () => [
      // --- Read tools -----------------------------------------------------
      {
        name: 'list_critical_operations',
        title: 'List Critical Operations',
        description:
          "List Meridian Bank's critical operations with their operational tolerance metrics, current performance, and whether they are within, approaching, or breaching tolerance under APRA CPS 230.",
        inputSchema: {
          type: 'object',
          properties: {
            statusFilter: {
              type: 'string',
              enum: ['within', 'approaching', 'breached'],
              description: 'Optional. Only return operations currently in this tolerance status.',
            },
          },
          required: [],
        },
        annotations: { readOnlyHint: true },
        execute: async (input: { statusFilter?: ToleranceStatus }) => {
          const { criticalOperations } = ctxRef.current.register
          const filtered = input?.statusFilter
            ? criticalOperations.filter((op) => op.status === input.statusFilter)
            : criticalOperations

          if (filtered.length === 0) {
            return textResult(
              input?.statusFilter
                ? `No critical operations currently have status "${input.statusFilter}".`
                : 'No critical operations are recorded in the register.',
            )
          }

          const lines = filtered.map(
            (op) =>
              `- ${op.name} [${op.status.toUpperCase()}] — ${op.businessService}. ${op.toleranceMetric}: current ${op.currentValue}, threshold ${op.toleranceThreshold}.`,
          )
          return textResult(
            `${filtered.length} critical operation${filtered.length === 1 ? '' : 's'}${
              input?.statusFilter ? ` with status "${input.statusFilter}"` : ''
            }:\n\n${lines.join('\n')}`,
          )
        },
      },
      {
        name: 'get_control_gaps',
        title: 'Get Control Gaps',
        description:
          "Return controls that are not fully effective, with severity, owner, and the critical operation they support. Use this to find where the bank's CPS 230 control environment is weakest.",
        inputSchema: {
          type: 'object',
          properties: {
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Optional. Only return controls at this severity.',
            },
            criticalOperationId: {
              type: 'string',
              description: 'Optional. Only return controls supporting this critical operation id, e.g. "op-card-auth".',
            },
          },
          required: [],
        },
        annotations: { readOnlyHint: true },
        execute: async (input: { severity?: ControlSeverity; criticalOperationId?: string }) => {
          const { controls, criticalOperations } = ctxRef.current.register

          if (input?.criticalOperationId && !criticalOperations.some((op) => op.id === input.criticalOperationId)) {
            return textResult(`No critical operation found with id "${input.criticalOperationId}".`)
          }

          let filtered = controls.filter((c) => c.status !== 'effective')
          if (input?.severity) filtered = filtered.filter((c) => c.severity === input.severity)
          if (input?.criticalOperationId) {
            filtered = filtered.filter((c) => c.criticalOperationId === input.criticalOperationId)
          }

          if (filtered.length === 0) {
            return textResult('No control gaps match the given filters. The control environment is effective for this scope.')
          }

          const operationName = (id: string) => criticalOperations.find((op) => op.id === id)?.name ?? id
          const lines = filtered.map(
            (c) =>
              `- ${c.controlRef} [${c.status.toUpperCase()} / ${c.severity.toUpperCase()}] "${c.description}" — owner: ${c.owner}, supports: ${operationName(c.criticalOperationId)}. Last tested ${c.lastTested}.`,
          )
          return textResult(`${filtered.length} control(s) not fully effective:\n\n${lines.join('\n')}`)
        },
      },
      {
        name: 'assess_service_provider',
        title: 'Assess Service Provider',
        description:
          'Assess a named service provider against CPS 230 material service provider obligations, returning materiality, concentration risk, contract review status, and open gaps.',
        inputSchema: {
          type: 'object',
          properties: {
            providerName: {
              type: 'string',
              description: 'The service provider name to look up. Fuzzy matching is applied, so partial names work.',
            },
          },
          required: ['providerName'],
        },
        annotations: { readOnlyHint: true },
        execute: async (input: { providerName: string }) => {
          const { serviceProviders } = ctxRef.current.register
          const match = fuzzyMatchProvider(serviceProviders, input?.providerName ?? '')

          if (!match) {
            return textResult(
              `No service provider found matching "${input?.providerName ?? ''}". Known providers: ${serviceProviders
                .map((p) => p.name)
                .join(', ')}.`,
            )
          }

          const materiality = match.isMaterial
            ? 'This is a MATERIAL service provider under CPS 230 and is subject to the full material service provider obligations.'
            : 'This is a non-material service provider under CPS 230.'

          return textResult(
            [
              `${match.name} — ${match.category}`,
              materiality,
              `Concentration risk: ${match.concentrationRisk.toUpperCase()}.`,
              `Open CPS 230 gaps: ${match.cps230GapCount}.`,
              `Contract review due: ${match.contractReviewDate}.`,
              `Notes: ${match.notes}`,
            ].join('\n'),
          )
        },
      },
      // --- Write tools ------------------------------------------------------
      {
        name: 'log_control_evidence',
        title: 'Log Control Evidence',
        description:
          'Add a new piece of evidence to a control, recording something observed about its effectiveness. This changes the register and requires human approval before it is applied. Use this when you have gathered a fact relevant to whether a control is working.',
        inputSchema: {
          type: 'object',
          properties: {
            controlId: { type: 'string', description: 'The control id to attach evidence to, e.g. "CTRL-04".' },
            description: { type: 'string', description: 'A factual description of the evidence being added.' },
          },
          required: ['controlId', 'description'],
        },
        annotations: { readOnlyHint: false },
        execute: async (input: { controlId: string; description: string }) => {
          const { register, approval } = ctxRef.current
          const control = register.controls.find((c) => c.id === input?.controlId)
          if (!control) {
            return textResult(`No control found with id "${input?.controlId}". Evidence was not added.`)
          }
          if (!input?.description?.trim()) {
            return textResult('Evidence description cannot be empty. Evidence was not added.')
          }

          const summary = `Add evidence to ${control.controlRef} (${control.description}): "${input.description}"`
          const decision = await approval.requestHumanApproval('log_control_evidence', input, summary)
          approval.logToAuditTrail('log_control_evidence', input, decision)

          if (!decision.approved) {
            return textResult(
              `Request to log evidence on ${control.controlRef} was rejected by ${decision.approver ?? 'the reviewer'}. Reason: ${decision.reason ?? 'No reason given.'}`,
            )
          }

          const evidence: EvidenceItem = {
            id: `EV-AGENT-${Date.now()}`,
            description: input.description.trim(),
            addedBy: 'CPS 230 Evidence Agent',
            addedAt: new Date().toISOString(),
            source: 'agent',
          }
          register.addEvidence(control.id, evidence)

          return textResult(
            `Evidence added to ${control.controlRef}, approved by ${decision.approver}. Audit ref ${decision.ref}.`,
          )
        },
      },
      {
        name: 'raise_remediation_action',
        title: 'Raise Remediation Action',
        description:
          'Raise a new remediation action against a control to close a gap. This changes the register and requires human approval before it is applied. Use this after identifying a control gap that needs a tracked, owned fix.',
        inputSchema: {
          type: 'object',
          properties: {
            controlId: { type: 'string', description: 'The control id this remediation action addresses, e.g. "CTRL-07".' },
            owner: { type: 'string', description: 'Job title or name of the person accountable for closing this action.' },
            dueDate: { type: 'string', description: 'ISO date (YYYY-MM-DD) by which the action must be closed.' },
            rationale: { type: 'string', description: 'Optional explanation of why this remediation action is being raised.' },
          },
          required: ['controlId', 'owner', 'dueDate'],
        },
        annotations: { readOnlyHint: false },
        execute: async (input: { controlId: string; owner: string; dueDate: string; rationale?: string }) => {
          const { register, approval } = ctxRef.current
          const control = register.controls.find((c) => c.id === input?.controlId)
          if (!control) {
            return textResult(`No control found with id "${input?.controlId}". Remediation action was not raised.`)
          }
          if (!input?.owner?.trim() || !input?.dueDate?.trim()) {
            return textResult('Owner and due date are both required. Remediation action was not raised.')
          }
          if (Number.isNaN(Date.parse(input.dueDate))) {
            return textResult(`"${input.dueDate}" is not a valid ISO date. Remediation action was not raised.`)
          }

          const rationale =
            input.rationale?.trim() ||
            `Remediation required to close the outstanding ${control.severity} gap on ${control.controlRef}.`
          const summary = `Raise a remediation action on ${control.controlRef} (${control.description}), owned by ${input.owner}, due ${input.dueDate}.`
          const decision = await approval.requestHumanApproval('raise_remediation_action', input, summary)
          approval.logToAuditTrail('raise_remediation_action', input, decision)

          if (!decision.approved) {
            return textResult(
              `Request to raise a remediation action on ${control.controlRef} was rejected by ${decision.approver ?? 'the reviewer'}. Reason: ${decision.reason ?? 'No reason given.'}`,
            )
          }

          const action: RemediationAction = {
            id: `REM-AGENT-${Date.now()}`,
            controlId: control.id,
            owner: input.owner.trim(),
            dueDate: input.dueDate,
            rationale,
            status: 'open',
            raisedBy: 'CPS 230 Agent',
            raisedAt: new Date().toISOString(),
            auditRef: decision.ref,
          }
          register.addRemediationAction(action)

          return textResult(
            `Remediation action ${action.id} raised on ${control.controlRef}, approved by ${decision.approver}. Due ${input.dueDate}. Audit ref ${decision.ref}.`,
          )
        },
      },
      {
        name: 'update_risk_tolerance',
        title: 'Update Risk Tolerance',
        description:
          "Change the disruption tolerance threshold for a critical operation. This changes the bank's stated risk appetite and requires human approval before it is applied. Use this only when there is a documented justification for revising the tolerance.",
        inputSchema: {
          type: 'object',
          properties: {
            criticalOperationId: {
              type: 'string',
              description: 'The critical operation whose tolerance threshold should change, e.g. "op-card-auth".',
            },
            newThreshold: { type: 'string', description: 'The proposed new tolerance threshold, e.g. "45 minutes".' },
            justification: { type: 'string', description: 'Why this tolerance threshold change is being proposed.' },
          },
          required: ['criticalOperationId', 'newThreshold', 'justification'],
        },
        annotations: { readOnlyHint: false },
        execute: async (input: { criticalOperationId: string; newThreshold: string; justification: string }) => {
          const { register, approval } = ctxRef.current
          const operation = register.criticalOperations.find((op) => op.id === input?.criticalOperationId)
          if (!operation) {
            return textResult(`No critical operation found with id "${input?.criticalOperationId}". Tolerance was not changed.`)
          }
          if (!input?.newThreshold?.trim() || !input?.justification?.trim()) {
            return textResult('A new threshold and justification are both required. Tolerance was not changed.')
          }

          const summary = `Change the disruption tolerance threshold for ${operation.name} from "${operation.toleranceThreshold}" to "${input.newThreshold}". Justification: ${input.justification}`
          const decision = await approval.requestHumanApproval('update_risk_tolerance', input, summary)
          approval.logToAuditTrail('update_risk_tolerance', input, decision)

          if (!decision.approved) {
            return textResult(
              `Request to change the tolerance threshold for ${operation.name} was rejected by ${decision.approver ?? 'the reviewer'}. Reason: ${decision.reason ?? 'No reason given.'}`,
            )
          }

          register.updateOperationThreshold(operation.id, input.newThreshold.trim())

          return textResult(
            `Tolerance threshold for ${operation.name} updated to "${input.newThreshold}", approved by ${decision.approver}. Audit ref ${decision.ref}.`,
          )
        },
      },
      // --- Synthesis tool -----------------------------------------------------
      {
        name: 'generate_board_summary',
        title: 'Generate Board Summary',
        description:
          'Generate a board-ready operational resilience summary from the current register: tolerance breaches, critical control gaps, material service provider concentration, and open remediation actions. Use this when asked to prepare a summary, briefing, or report for the board or senior management.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        annotations: { readOnlyHint: true },
        execute: async () => {
          const { register, setSummary: setSummaryFn, onBoardSummaryGenerated: onGenerated } = ctxRef.current
          const text = buildBoardSummary(register)
          setSummaryFn(text)
          onGenerated?.()
          return textResult(text)
        },
      },
    ],
    [],
  )
}

// ---------------------------------------------------------------------------
// RegisterTools: registers all seven tools from the manifest with WebMCP.
// Exactly seven literal useWebMCPTool calls (not a loop) to satisfy the rules
// of hooks, indexing into the manifest built by useToolManifest.
// ---------------------------------------------------------------------------

export function RegisterTools({ toolDefs }: { toolDefs: WebMCPToolDefinition[] }) {
  useWebMCPTool(toolDefs[0])
  useWebMCPTool(toolDefs[1])
  useWebMCPTool(toolDefs[2])
  useWebMCPTool(toolDefs[3])
  useWebMCPTool(toolDefs[4])
  useWebMCPTool(toolDefs[5])
  useWebMCPTool(toolDefs[6])
  return null
}
