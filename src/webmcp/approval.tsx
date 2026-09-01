import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { StatusPill } from '../components/common/StatusPill'
import { useRegister } from '../context/RegisterContext'
import type { AuditEntry } from '../data/seed'
import { controlStatusLabel, controlStatusTone, severityTone, toleranceLabel, toleranceTone } from '../lib/status'

export const DEFAULT_APPROVER = 'E. Batnasan (Head of Operational Risk)'

const APPROVAL_TIMEOUT_MS = 60_000

export interface Decision {
  approved: boolean
  approver: string | null
  reason: string | null
  ref: string
}

export interface PendingApprovalRequest {
  id: string
  toolName: string
  args: Record<string, unknown>
  summary: string
  createdAt: number
}

interface PendingApprovalInternal extends PendingApprovalRequest {
  resolve: (decision: Decision) => void
  timeoutId: ReturnType<typeof setTimeout>
  settled: boolean
}

interface ApprovalContextValue {
  queue: PendingApprovalRequest[]
  requestHumanApproval: (
    toolName: string,
    args: Record<string, unknown>,
    summary: string,
  ) => Promise<Decision>
  decideRequest: (id: string, approved: boolean, approver: string, reason: string | null) => void
  logToAuditTrail: (toolName: string, args: Record<string, unknown>, decision: Decision) => void
}

const ApprovalContext = createContext<ApprovalContextValue | null>(null)

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `apr-${crypto.randomUUID()}`
  }
  return `apr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const { addAuditEntry } = useRegister()
  const [queue, setQueue] = useState<PendingApprovalRequest[]>([])

  // Promise resolvers and timeout handles live in a ref, not React state: they are
  // mutable, non-serializable, and must be reachable synchronously from both the
  // timeout callback and the UI's decide handler without waiting on a re-render.
  const pendingRef = useRef<Map<string, PendingApprovalInternal>>(new Map())
  const refCounterRef = useRef<{ date: string; count: number }>({ date: '', count: 0 })

  const generateAuditRef = useCallback((): string => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`
    const counter = refCounterRef.current
    if (counter.date !== dateStr) {
      counter.date = dateStr
      counter.count = 0
    }
    counter.count += 1
    return `AUD-${dateStr}-${String(counter.count).padStart(4, '0')}`
  }, [])

  // Single settlement path for every outcome (approve, reject, or timeout). Guarded by
  // `settled` so a timeout that fires just after a human clicks — or a decide call that
  // arrives just after the timeout already fired — can never resolve the same promise
  // twice or generate two audit refs for one request.
  const settleRequest = useCallback(
    (id: string, outcome: { approved: boolean; approver: string | null; reason: string | null }) => {
      const pending = pendingRef.current.get(id)
      if (!pending || pending.settled) return
      pending.settled = true
      clearTimeout(pending.timeoutId)
      pendingRef.current.delete(id)
      setQueue((prev) => prev.filter((request) => request.id !== id))

      const decision: Decision = {
        approved: outcome.approved,
        approver: outcome.approver,
        reason: outcome.reason,
        ref: generateAuditRef(),
      }
      pending.resolve(decision)
    },
    [generateAuditRef],
  )

  const requestHumanApproval = useCallback(
    (toolName: string, args: Record<string, unknown>, summary: string): Promise<Decision> => {
      return new Promise<Decision>((resolve) => {
        const id = createRequestId()
        const timeoutId = setTimeout(() => {
          settleRequest(id, {
            approved: false,
            approver: null,
            reason: 'No human response within timeout window',
          })
        }, APPROVAL_TIMEOUT_MS)

        const pending: PendingApprovalInternal = {
          id,
          toolName,
          args,
          summary,
          createdAt: Date.now(),
          resolve,
          timeoutId,
          settled: false,
        }
        pendingRef.current.set(id, pending)
        setQueue((prev) => [...prev, { id, toolName, args, summary, createdAt: pending.createdAt }])
      })
    },
    [settleRequest],
  )

  const decideRequest = useCallback(
    (id: string, approved: boolean, approver: string, reason: string | null) => {
      settleRequest(id, { approved, approver: approver.trim() || null, reason })
    },
    [settleRequest],
  )

  const logToAuditTrail = useCallback(
    (toolName: string, args: Record<string, unknown>, decision: Decision) => {
      const entry: AuditEntry = {
        id: decision.ref,
        timestamp: new Date().toISOString(),
        toolName,
        actor: 'agent',
        args,
        decision: decision.approved ? 'approved' : 'rejected',
        approver: decision.approver,
        reason: decision.reason,
      }
      addAuditEntry(entry)
    },
    [addAuditEntry],
  )

  // Belt-and-braces: if the provider itself unmounts with requests in flight, clear
  // their timeouts so a stray callback never fires against torn-down state.
  useEffect(() => {
    const pendingMap = pendingRef.current
    return () => {
      pendingMap.forEach((pending) => clearTimeout(pending.timeoutId))
    }
  }, [])

  const value = useMemo<ApprovalContextValue>(
    () => ({ queue, requestHumanApproval, decideRequest, logToAuditTrail }),
    [queue, requestHumanApproval, decideRequest, logToAuditTrail],
  )

  // Dev-only debug hook so this promise-blocking flow can be exercised from outside
  // React (e.g. a test script) without a real WebMCP write tool wired up yet.
  // Dead-code-eliminated from production builds by the `import.meta.env.DEV` check.
  useEffect(() => {
    if (import.meta.env.DEV) {
      ;(window as unknown as { __approvalDebug?: ApprovalContextValue }).__approvalDebug = value
    }
  }, [value])

  return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>
}

export function useApproval(): ApprovalContextValue {
  const ctx = useContext(ApprovalContext)
  if (!ctx) throw new Error('useApproval must be used within an ApprovalProvider')
  return ctx
}

function useAffectedEntity(args: Record<string, unknown>) {
  const { controls, criticalOperations } = useRegister()

  const controlId = typeof args.controlId === 'string' ? args.controlId : undefined
  const operationId =
    (typeof args.criticalOperationId === 'string' ? args.criticalOperationId : undefined) ??
    (typeof args.operationId === 'string' ? args.operationId : undefined)

  const control = controlId ? controls.find((c) => c.id === controlId) : undefined
  const operation = operationId
    ? criticalOperations.find((op) => op.id === operationId)
    : control
      ? criticalOperations.find((op) => op.id === control.criticalOperationId)
      : undefined

  return { control, operation }
}

export function ApprovalGate() {
  const { queue } = useApproval()
  const current = queue[0] ?? null

  if (!current) return null

  // Keying on the request id forces a fresh mount (and fresh local form state) each
  // time the front of the queue changes, instead of syncing state via an effect.
  return <ApprovalRequestPanel key={current.id} request={current} queueDepth={queue.length} />
}

function ApprovalRequestPanel({
  request,
  queueDepth,
}: {
  request: PendingApprovalRequest
  queueDepth: number
}) {
  const { decideRequest } = useApproval()
  const [reason, setReason] = useState('')
  const [approver, setApprover] = useState(DEFAULT_APPROVER)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { control: affectedControl, operation: affectedOperation } = useAffectedEntity(request.args)

  const handleApprove = () => {
    if (submitting) return
    setSubmitting(true)
    decideRequest(request.id, true, approver.trim() || DEFAULT_APPROVER, reason.trim() || null)
  }

  const handleReject = () => {
    if (submitting) return
    if (!reason.trim()) {
      setValidationError('A reason is required to reject this request.')
      return
    }
    setSubmitting(true)
    decideRequest(request.id, false, approver.trim() || DEFAULT_APPROVER, reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
              Human Approval Required
            </div>
            <div className="mt-0.5 font-mono text-xs text-slate-500">{request.toolName}</div>
          </div>
          {queueDepth > 1 && (
            <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
              +{queueDepth - 1} more pending
            </span>
          )}
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-sm text-slate-200">{request.summary}</p>

          {(affectedControl || affectedOperation) && (
            <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Affected</div>
              {affectedControl && (
                <div className="mb-2 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-slate-400">{affectedControl.controlRef}</span>
                    <StatusPill
                      label={controlStatusLabel(affectedControl.status)}
                      tone={controlStatusTone(affectedControl.status)}
                    />
                    <StatusPill label={affectedControl.severity} tone={severityTone(affectedControl.severity)} />
                  </div>
                  <div className="text-slate-300">{affectedControl.description}</div>
                  <div className="text-slate-500">Owner: {affectedControl.owner}</div>
                </div>
              )}
              {affectedOperation && (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300">{affectedOperation.name}</span>
                    <StatusPill
                      label={toleranceLabel(affectedOperation.status)}
                      tone={toleranceTone(affectedOperation.status)}
                    />
                  </div>
                  <div className="text-slate-500">
                    Current value: <span className="text-slate-300">{affectedOperation.currentValue}</span>
                    {' · '}Threshold: {affectedOperation.toleranceThreshold}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Arguments</div>
            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
              {JSON.stringify(request.args, null, 2)}
            </pre>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Approver
            </label>
            <input
              value={approver}
              onChange={(event) => setApprover(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Reason <span className="normal-case text-slate-600">(required to reject, optional to approve)</span>
            </label>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                if (validationError) setValidationError(null)
              }}
              rows={3}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
              placeholder="Add context for the audit trail..."
            />
            {validationError && <p className="mt-1 text-xs text-red-400">{validationError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={submitting}
            className="rounded border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting}
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
