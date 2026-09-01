import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  auditTrail as seedAuditTrail,
  controls as seedControls,
  criticalOperations as seedCriticalOperations,
  remediationActions as seedRemediationActions,
  serviceProviders as seedServiceProviders,
  type AuditEntry,
  type Control,
  type ControlStatus,
  type CriticalOperation,
  type EvidenceItem,
  type RemediationAction,
  type RemediationStatus,
  type ServiceProvider,
  type ToleranceStatus,
} from '../data/seed'

interface RegisterState {
  criticalOperations: CriticalOperation[]
  serviceProviders: ServiceProvider[]
  controls: Control[]
  remediationActions: RemediationAction[]
  auditTrail: AuditEntry[]
}

type RegisterAction =
  | { type: 'UPDATE_OPERATION_STATUS'; operationId: string; status: ToleranceStatus; currentValue?: string }
  | { type: 'UPDATE_OPERATION_THRESHOLD'; operationId: string; toleranceThreshold: string }
  | { type: 'UPDATE_CONTROL_STATUS'; controlId: string; status: ControlStatus }
  | { type: 'ADD_EVIDENCE'; controlId: string; evidence: EvidenceItem }
  | { type: 'ADD_REMEDIATION_ACTION'; action: RemediationAction }
  | { type: 'UPDATE_REMEDIATION_STATUS'; actionId: string; status: RemediationStatus }
  | { type: 'ADD_AUDIT_ENTRY'; entry: AuditEntry }

const initialState: RegisterState = {
  criticalOperations: seedCriticalOperations,
  serviceProviders: seedServiceProviders,
  controls: seedControls,
  remediationActions: seedRemediationActions,
  auditTrail: seedAuditTrail,
}

function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'UPDATE_OPERATION_STATUS':
      return {
        ...state,
        criticalOperations: state.criticalOperations.map((op) =>
          op.id === action.operationId
            ? { ...op, status: action.status, currentValue: action.currentValue ?? op.currentValue }
            : op,
        ),
      }
    case 'UPDATE_OPERATION_THRESHOLD':
      return {
        ...state,
        criticalOperations: state.criticalOperations.map((op) =>
          op.id === action.operationId ? { ...op, toleranceThreshold: action.toleranceThreshold } : op,
        ),
      }
    case 'UPDATE_CONTROL_STATUS':
      return {
        ...state,
        controls: state.controls.map((control) =>
          control.id === action.controlId ? { ...control, status: action.status } : control,
        ),
      }
    case 'ADD_EVIDENCE':
      return {
        ...state,
        controls: state.controls.map((control) =>
          control.id === action.controlId
            ? { ...control, evidence: [...control.evidence, action.evidence] }
            : control,
        ),
      }
    case 'ADD_REMEDIATION_ACTION':
      return { ...state, remediationActions: [action.action, ...state.remediationActions] }
    case 'UPDATE_REMEDIATION_STATUS':
      return {
        ...state,
        remediationActions: state.remediationActions.map((remediation) =>
          remediation.id === action.actionId ? { ...remediation, status: action.status } : remediation,
        ),
      }
    case 'ADD_AUDIT_ENTRY':
      return { ...state, auditTrail: [action.entry, ...state.auditTrail] }
    default:
      return state
  }
}

interface RegisterContextValue extends RegisterState {
  updateOperationStatus: (operationId: string, status: ToleranceStatus, currentValue?: string) => void
  updateOperationThreshold: (operationId: string, toleranceThreshold: string) => void
  updateControlStatus: (controlId: string, status: ControlStatus) => void
  addEvidence: (controlId: string, evidence: EvidenceItem) => void
  addRemediationAction: (action: RemediationAction) => void
  updateRemediationStatus: (actionId: string, status: RemediationStatus) => void
  addAuditEntry: (entry: AuditEntry) => void
}

const RegisterContext = createContext<RegisterContextValue | null>(null)

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(registerReducer, initialState)

  const updateOperationStatus = useCallback(
    (operationId: string, status: ToleranceStatus, currentValue?: string) =>
      dispatch({ type: 'UPDATE_OPERATION_STATUS', operationId, status, currentValue }),
    [],
  )
  const updateOperationThreshold = useCallback(
    (operationId: string, toleranceThreshold: string) =>
      dispatch({ type: 'UPDATE_OPERATION_THRESHOLD', operationId, toleranceThreshold }),
    [],
  )
  const updateControlStatus = useCallback(
    (controlId: string, status: ControlStatus) => dispatch({ type: 'UPDATE_CONTROL_STATUS', controlId, status }),
    [],
  )
  const addEvidence = useCallback(
    (controlId: string, evidence: EvidenceItem) => dispatch({ type: 'ADD_EVIDENCE', controlId, evidence }),
    [],
  )
  const addRemediationAction = useCallback(
    (action: RemediationAction) => dispatch({ type: 'ADD_REMEDIATION_ACTION', action }),
    [],
  )
  const updateRemediationStatus = useCallback(
    (actionId: string, status: RemediationStatus) =>
      dispatch({ type: 'UPDATE_REMEDIATION_STATUS', actionId, status }),
    [],
  )
  const addAuditEntry = useCallback((entry: AuditEntry) => dispatch({ type: 'ADD_AUDIT_ENTRY', entry }), [])

  const value = useMemo<RegisterContextValue>(
    () => ({
      ...state,
      updateOperationStatus,
      updateOperationThreshold,
      updateControlStatus,
      addEvidence,
      addRemediationAction,
      updateRemediationStatus,
      addAuditEntry,
    }),
    [
      state,
      updateOperationStatus,
      updateOperationThreshold,
      updateControlStatus,
      addEvidence,
      addRemediationAction,
      updateRemediationStatus,
      addAuditEntry,
    ],
  )

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>
}

export function useRegister(): RegisterContextValue {
  const ctx = useContext(RegisterContext)
  if (!ctx) throw new Error('useRegister must be used within a RegisterProvider')
  return ctx
}
