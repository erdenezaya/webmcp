import type { AuditDecision, ConcentrationRisk, ControlSeverity, ControlStatus, ToleranceStatus } from '../data/seed'

export type Tone = 'green' | 'amber' | 'red' | 'slate' | 'sky'

export function toleranceTone(status: ToleranceStatus): Tone {
  switch (status) {
    case 'within':
      return 'green'
    case 'approaching':
      return 'amber'
    case 'breached':
      return 'red'
  }
}

export function toleranceLabel(status: ToleranceStatus): string {
  switch (status) {
    case 'within':
      return 'Within Tolerance'
    case 'approaching':
      return 'Approaching'
    case 'breached':
      return 'Breached'
  }
}

export function controlStatusTone(status: ControlStatus): Tone {
  switch (status) {
    case 'effective':
      return 'green'
    case 'partially_effective':
      return 'amber'
    case 'gap':
      return 'red'
  }
}

export function controlStatusLabel(status: ControlStatus): string {
  switch (status) {
    case 'effective':
      return 'Effective'
    case 'partially_effective':
      return 'Partially Effective'
    case 'gap':
      return 'Gap'
  }
}

export function severityTone(severity: ControlSeverity): Tone {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'high':
      return 'amber'
    case 'medium':
    case 'low':
      return 'slate'
  }
}

export function decisionTone(decision: AuditDecision): Tone {
  switch (decision) {
    case 'approved':
      return 'green'
    case 'rejected':
      return 'red'
    case 'auto':
      return 'sky'
  }
}

export function concentrationTone(risk: ConcentrationRisk): Tone {
  switch (risk) {
    case 'high':
      return 'red'
    case 'medium':
      return 'amber'
    case 'low':
      return 'slate'
  }
}
