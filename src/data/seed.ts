// Seed data for Meridian Bank's APRA CPS 230 operational risk management register.
// Meridian Bank is a fictional mid-size Australian ADI used for demonstration purposes only.

export type ToleranceStatus = 'within' | 'approaching' | 'breached'

export interface CriticalOperation {
  id: string
  name: string
  description: string
  businessService: string
  toleranceMetric: string
  toleranceThreshold: string
  currentValue: string
  status: ToleranceStatus
}

export type ConcentrationRisk = 'low' | 'medium' | 'high'

export interface ServiceProvider {
  id: string
  name: string
  category: string
  isMaterial: boolean
  contractReviewDate: string
  concentrationRisk: ConcentrationRisk
  cps230GapCount: number
  notes: string
}

export type EvidenceSource = 'human' | 'agent'

export interface EvidenceItem {
  id: string
  description: string
  addedBy: string
  addedAt: string
  source: EvidenceSource
}

export type ControlStatus = 'effective' | 'partially_effective' | 'gap'
export type ControlSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Control {
  id: string
  controlRef: string
  criticalOperationId: string
  description: string
  owner: string
  status: ControlStatus
  severity: ControlSeverity
  lastTested: string
  evidence: EvidenceItem[]
}

export type RemediationStatus = 'open' | 'in_progress' | 'overdue' | 'closed'

export interface RemediationAction {
  id: string
  controlId: string
  owner: string
  dueDate: string
  rationale: string
  status: RemediationStatus
  raisedBy: string
  raisedAt: string
  auditRef: string
}

export type AuditDecision = 'approved' | 'rejected' | 'auto'

export interface AuditEntry {
  id: string
  timestamp: string
  toolName: string
  actor: 'agent'
  args: Record<string, unknown>
  decision: AuditDecision
  approver: string | null
  reason: string | null
}

export const criticalOperations: CriticalOperation[] = [
  {
    id: 'op-payments',
    name: 'Real-Time Payments Processing',
    description:
      'Processing of NPP (PayID/Osko), BECS direct entry and SWIFT international payments for retail and business customers.',
    businessService: 'Domestic & International Payments',
    toleranceMetric: 'Maximum tolerable outage duration',
    toleranceThreshold: '4 hours',
    currentValue: '1h 45m (peak outage, last quarter)',
    status: 'within',
  },
  {
    id: 'op-core-banking',
    name: 'Core Banking Platform Availability',
    description:
      'Availability of the core banking ledger underpinning deposit accounts, transaction processing and balance updates across all channels.',
    businessService: 'Core Banking Services',
    toleranceMetric: 'Maximum unplanned downtime per quarter',
    toleranceThreshold: '2 hours',
    currentValue: '1h 52m',
    status: 'approaching',
  },
  {
    id: 'op-kyc',
    name: 'Customer Onboarding & KYC Verification',
    description:
      'Identity verification and AML/CTF customer due diligence required to open new transaction and savings accounts.',
    businessService: 'Retail Customer Onboarding',
    toleranceMetric: 'Maximum processing delay for identity verification',
    toleranceThreshold: '24 hours',
    currentValue: '18 hours (95th percentile)',
    status: 'approaching',
  },
  {
    id: 'op-card-auth',
    name: 'Card Authorisation Services',
    description:
      'Real-time authorisation of Meridian-issued debit and credit card transactions via the Visa/Mastercard scheme networks.',
    businessService: 'Card & Merchant Services',
    toleranceMetric: 'Maximum tolerable outage duration',
    toleranceThreshold: '30 minutes',
    currentValue: '52 minutes (incident INC-4471, 14 Aug 2026)',
    status: 'breached',
  },
  {
    id: 'op-ib',
    name: 'Internet & Mobile Banking Access',
    description:
      'Customer-facing authentication and transaction functionality across the Meridian internet banking portal and mobile app.',
    businessService: 'Digital Banking Channels',
    toleranceMetric: 'Maximum unplanned downtime per quarter',
    toleranceThreshold: '3 hours',
    currentValue: '58 minutes',
    status: 'within',
  },
  {
    id: 'op-atm',
    name: 'ATM Network Availability',
    description:
      'Cash withdrawal and balance enquiry availability across Meridian-owned and partner ATM fleets nationally.',
    businessService: 'Cash Access Services',
    toleranceMetric: 'Minimum network availability',
    toleranceThreshold: '99.5%',
    currentValue: '99.7%',
    status: 'within',
  },
  {
    id: 'op-loan-orig',
    name: 'Loan Origination Processing',
    description:
      'End-to-end credit decisioning and settlement processing for consumer personal loans, credit cards and home loans.',
    businessService: 'Consumer & Business Lending',
    toleranceMetric: 'Maximum processing delay for credit decisioning',
    toleranceThreshold: '48 hours',
    currentValue: '31 hours (average, last 30 days)',
    status: 'within',
  },
  {
    id: 'op-reg-reporting',
    name: 'Regulatory Reporting Submission',
    description:
      'Preparation and submission of APRA prudential returns (including ARF 720 and EFS reporting) within statutory deadlines.',
    businessService: 'Prudential & Statutory Reporting',
    toleranceMetric: 'Maximum delay against APRA submission deadline',
    toleranceThreshold: '0 days (must meet published deadline)',
    currentValue: '0 days (on time, last 4 submissions)',
    status: 'within',
  },
]

export const serviceProviders: ServiceProvider[] = [
  {
    id: 'sp-nexacore',
    name: 'NexaCore Banking Systems',
    category: 'Core banking platform vendor',
    isMaterial: true,
    contractReviewDate: '2027-02-28',
    concentrationRisk: 'high',
    cps230GapCount: 3,
    notes:
      'Sole provider of the core ledger platform underpinning Core Banking Platform Availability; no viable near-term substitution path. Subcontracts DR hosting to a single regional data centre operator, compounding concentration risk.',
  },
  {
    id: 'sp-helios-cloud',
    name: 'Helios Cloud Services (APAC)',
    category: 'Public cloud infrastructure provider',
    isMaterial: true,
    contractReviewDate: '2026-11-15',
    concentrationRisk: 'medium',
    cps230GapCount: 1,
    notes:
      'Hosts digital banking channel workloads across two Australian availability zones. Exit plan tested in 2025; annual re-test due before next contract review.',
  },
  {
    id: 'sp-paysecure',
    name: 'PaySecure Processing Pty Ltd',
    category: 'Card scheme processing & switching',
    isMaterial: true,
    contractReviewDate: '2027-05-01',
    concentrationRisk: 'medium',
    cps230GapCount: 2,
    notes:
      'Provides primary authorisation switching for card-present and card-not-present transactions. Secondary network link to scheme gateway is contracted but not yet independently verified.',
  },
  {
    id: 'sp-veritas-bureau',
    name: 'Veritas Credit Bureau',
    category: 'Credit reporting & identity verification',
    isMaterial: false,
    contractReviewDate: '2026-10-20',
    concentrationRisk: 'low',
    cps230GapCount: 0,
    notes:
      'Supplies credit bureau data feeds for KYC and loan origination decisioning. Alternative bureau (Illion) available as a fallback under existing panel arrangement.',
  },
  {
    id: 'sp-cleardoc',
    name: 'ClearDoc Document Services',
    category: 'Outsourced correspondence & statement production',
    isMaterial: false,
    contractReviewDate: '2027-01-10',
    concentrationRisk: 'low',
    cps230GapCount: 1,
    notes:
      'Prints and dispatches customer statements and loan offer documents. Non-material service; minor gap relates to outdated data handling clause in the current contract.',
  },
]

export const controls: Control[] = [
  {
    id: 'CTRL-01',
    controlRef: 'CPS230-BCM-04',
    criticalOperationId: 'op-payments',
    description: 'Automated failover of NPP/BECS payment processing to the secondary data centre.',
    owner: 'Head of Payments Operations',
    status: 'effective',
    severity: 'high',
    lastTested: '2026-06-15',
    evidence: [
      {
        id: 'EV-0001',
        description: 'DR failover test report — full payment queue drained and reprocessed within 22 minutes of cutover.',
        addedBy: 'Marcus Webb, Payments Platform Manager',
        addedAt: '2026-06-16T09:12:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-02',
    controlRef: 'CPS230-MON-11',
    criticalOperationId: 'op-payments',
    description: 'Real-time payment queue depth monitoring with automated alerting to the Payments Operations Centre.',
    owner: 'Payments Platform Manager',
    status: 'effective',
    severity: 'medium',
    lastTested: '2026-07-01',
    evidence: [
      {
        id: 'EV-0002',
        description: 'Alert threshold configuration exported from monitoring platform; alerts fired correctly during monthly synthetic test.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-07-01T04:31:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-03',
    controlRef: 'CPS230-BCM-01',
    criticalOperationId: 'op-core-banking',
    description: 'Core banking platform active-active clustering across dual metro data centres.',
    owner: 'Chief Technology Officer',
    status: 'partially_effective',
    severity: 'critical',
    lastTested: '2026-05-20',
    evidence: [
      {
        id: 'EV-0003',
        description: 'Failover test completed successfully at 40% of peak transaction load; full peak-load failover not yet demonstrated.',
        addedBy: 'Angela Ferretti, Head of Infrastructure',
        addedAt: '2026-05-21T14:05:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-04',
    controlRef: 'CPS230-TPRM-07',
    criticalOperationId: 'op-core-banking',
    description: 'Vendor SLA monitoring and quarterly performance review for the core banking platform provider.',
    owner: 'Third Party Risk Manager',
    status: 'gap',
    severity: 'critical',
    lastTested: '2026-03-10',
    evidence: [
      {
        id: 'EV-0004',
        description: 'Q1 2026 SLA report received; NexaCore Banking Systems has not supplied Q2 2026 performance data as required under Schedule 4.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-08-05T08:00:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-05',
    controlRef: 'CPS230-KYC-02',
    criticalOperationId: 'op-kyc',
    description: 'Automated identity verification combining document authentication and biometric liveness checks.',
    owner: 'Head of Financial Crime Operations',
    status: 'effective',
    severity: 'medium',
    lastTested: '2026-07-10',
    evidence: [
      {
        id: 'EV-0005',
        description: 'Quarterly accuracy sampling of 500 verifications — 99.1% match rate against manual review, above 98% threshold.',
        addedBy: 'Ravi Kapoor, Financial Crime Analytics Lead',
        addedAt: '2026-07-11T11:20:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-06',
    controlRef: 'CPS230-OPS-09',
    criticalOperationId: 'op-kyc',
    description: 'Manual KYC escalation queue review to be actioned within 24-hour service level.',
    owner: 'AML/KYC Operations Manager',
    status: 'gap',
    severity: 'high',
    lastTested: '2026-04-02',
    evidence: [
      {
        id: 'EV-0006',
        description: 'Queue backlog report shows 62 escalated cases outstanding beyond 24-hour SLA, sustained over 3 consecutive weeks.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-08-18T07:45:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-07',
    controlRef: 'CPS230-CYB-05',
    criticalOperationId: 'op-card-auth',
    description: 'Redundant card scheme connectivity via dual, independently routed network links.',
    owner: 'Head of Card Services',
    status: 'gap',
    severity: 'critical',
    lastTested: '2026-06-01',
    evidence: [
      {
        id: 'EV-0007',
        description: 'Network topology review confirms secondary link is provisioned but has never been cut over in a live failover test.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-08-15T06:10:00+10:00',
        source: 'agent',
      },
      {
        id: 'EV-0008',
        description: 'Incident INC-4471 post-incident review: outage caused by primary link failure with no automatic failover to secondary.',
        addedBy: 'Denise Okafor, Card Services Operations Manager',
        addedAt: '2026-08-15T16:40:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-08',
    controlRef: 'CPS230-INC-03',
    criticalOperationId: 'op-card-auth',
    description: 'Documented incident response runbook for card authorisation service outages.',
    owner: 'Card Services Operations Manager',
    status: 'partially_effective',
    severity: 'high',
    lastTested: '2026-05-18',
    evidence: [
      {
        id: 'EV-0009',
        description: 'Runbook exists and was followed during INC-4471, but escalation to scheme liaison took 35 minutes against a 15-minute target.',
        addedBy: 'Denise Okafor, Card Services Operations Manager',
        addedAt: '2026-08-15T17:05:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-09',
    controlRef: 'CPS230-CYB-02',
    criticalOperationId: 'op-ib',
    description: 'Multi-factor authentication enforced for all internet and mobile banking logins.',
    owner: 'Head of Digital Channels',
    status: 'effective',
    severity: 'high',
    lastTested: '2026-07-15',
    evidence: [
      {
        id: 'EV-0010',
        description: 'Configuration audit confirms MFA enforcement at 100% of login attempts across web and app channels; no bypass paths identified.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-07-15T05:50:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-10',
    controlRef: 'CPS230-CHG-06',
    criticalOperationId: 'op-ib',
    description: 'Mandatory change advisory board approval gate prior to production release of digital banking changes.',
    owner: 'Digital Release Manager',
    status: 'effective',
    severity: 'medium',
    lastTested: '2026-06-25',
    evidence: [
      {
        id: 'EV-0011',
        description: 'Sample of 20 production releases in Q2 2026 shows 100% CAB approval prior to deployment.',
        addedBy: 'Tom Reidy, Digital Release Manager',
        addedAt: '2026-06-26T10:15:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-11',
    controlRef: 'CPS230-BCM-08',
    criticalOperationId: 'op-atm',
    description: 'Automated ATM network failover to the backup switch provider during primary switch outages.',
    owner: 'ATM Network Manager',
    status: 'effective',
    severity: 'medium',
    lastTested: '2026-06-10',
    evidence: [
      {
        id: 'EV-0012',
        description: 'Scheduled failover drill completed with 99.8% of fleet transacting on backup switch within 6 minutes.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-06-10T22:15:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-12',
    controlRef: 'CPS230-OPS-14',
    criticalOperationId: 'op-loan-orig',
    description: 'Capacity monitoring of the automated credit decisioning engine against processing volume forecasts.',
    owner: 'Head of Consumer Lending Operations',
    status: 'partially_effective',
    severity: 'medium',
    lastTested: '2026-05-30',
    evidence: [
      {
        id: 'EV-0013',
        description: 'Monitoring dashboard in place, but alert thresholds have not been recalibrated since the FY25 volume increase.',
        addedBy: 'Head of Consumer Lending Operations',
        addedAt: '2026-05-30T13:22:00+10:00',
        source: 'human',
      },
    ],
  },
  {
    id: 'CTRL-13',
    controlRef: 'CPS230-DATA-04',
    criticalOperationId: 'op-reg-reporting',
    description: 'Automated data lineage and reconciliation control for figures submitted in APRA regulatory returns.',
    owner: 'Regulatory Reporting Manager',
    status: 'gap',
    severity: 'medium',
    lastTested: '2026-02-14',
    evidence: [
      {
        id: 'EV-0014',
        description: 'Reconciliation is currently performed via manual spreadsheet cross-check; automated lineage tooling scoped but not yet implemented.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-08-10T09:00:00+10:00',
        source: 'agent',
      },
    ],
  },
  {
    id: 'CTRL-14',
    controlRef: 'CPS230-DOC-02',
    criticalOperationId: 'op-loan-orig',
    description: 'Maintenance of current process documentation and RACI mapping for loan origination exception handling.',
    owner: 'Head of Consumer Lending Operations',
    status: 'gap',
    severity: 'low',
    lastTested: '2026-01-22',
    evidence: [
      {
        id: 'EV-0015',
        description: 'Process documentation last updated 19 months ago and does not reflect the current exception-handling workflow.',
        addedBy: 'CPS 230 Evidence Agent',
        addedAt: '2026-08-01T07:30:00+10:00',
        source: 'agent',
      },
    ],
  },
]

export const remediationActions: RemediationAction[] = [
  {
    id: 'REM-001',
    controlId: 'CTRL-04',
    owner: 'Third Party Risk Manager',
    dueDate: '2026-10-15',
    rationale:
      'NexaCore Banking Systems has not provided Q2 2026 SLA performance evidence as required under the outsourcing agreement. The quarterly vendor performance review control cannot be assessed as effective until independent verification is obtained and reviewed.',
    status: 'in_progress',
    raisedBy: 'CPS 230 Evidence Agent',
    raisedAt: '2026-08-05T08:05:00+10:00',
    auditRef: 'AUD-2026-0142',
  },
  {
    id: 'REM-002',
    controlId: 'CTRL-06',
    owner: 'AML/KYC Operations Manager',
    dueDate: '2026-09-05',
    rationale:
      'KYC escalation queue has exceeded the 24-hour service level for 3 consecutive weeks due to a staffing shortfall in the Financial Crime Operations team. Interim overtime resourcing and a queue-triage automation fix are required.',
    status: 'overdue',
    raisedBy: 'CPS 230 Evidence Agent',
    raisedAt: '2026-08-18T07:50:00+10:00',
    auditRef: 'AUD-2026-0140',
  },
  {
    id: 'REM-003',
    controlId: 'CTRL-07',
    owner: 'Head of Card Services',
    dueDate: '2026-09-30',
    rationale:
      'The secondary card scheme network link has never been cut over in a live failover test and did not activate automatically during incident INC-4471, contributing to the Card Authorisation Services tolerance breach. A scheduled failover test and automatic cutover fix are required.',
    status: 'open',
    raisedBy: 'Denise Okafor, Card Services Operations Manager',
    raisedAt: '2026-08-15T17:15:00+10:00',
    auditRef: 'AUD-2026-0146',
  },
]

export const auditTrail: AuditEntry[] = [
  {
    id: 'AUD-2026-0119',
    timestamp: '2026-05-30T13:40:00+10:00',
    toolName: 'update_control_status',
    actor: 'agent',
    args: {
      controlId: 'CTRL-12',
      proposedStatus: 'effective',
      evidenceSummary: 'Capacity monitoring dashboard screenshot attached showing live volume tracking.',
    },
    decision: 'rejected',
    approver: 'Head of Consumer Lending Operations',
    reason:
      'Dashboard exists but alert thresholds have not been recalibrated since the FY25 volume increase, so the control cannot be marked effective. Status held at partially effective.',
  },
  {
    id: 'AUD-2026-0140',
    timestamp: '2026-08-18T07:52:00+10:00',
    toolName: 'create_remediation_action',
    actor: 'agent',
    args: {
      controlId: 'CTRL-06',
      proposedOwner: 'AML/KYC Operations Manager',
      proposedDueDate: '2026-09-05',
      trigger: 'KYC escalation queue backlog exceeded 24-hour SLA for 3 consecutive weeks',
    },
    decision: 'approved',
    approver: 'Priya Chandrasekaran, Chief Risk Officer',
    reason: 'Backlog confirmed via independent sample review of the escalation queue; remediation action approved as drafted.',
  },
  {
    id: 'AUD-2026-0142',
    timestamp: '2026-08-05T08:07:00+10:00',
    toolName: 'create_remediation_action',
    actor: 'agent',
    args: {
      controlId: 'CTRL-04',
      proposedOwner: 'Third Party Risk Manager',
      proposedDueDate: '2026-10-15',
      trigger: 'NexaCore Banking Systems Q2 2026 SLA performance data not received',
    },
    decision: 'approved',
    approver: 'David Whitfield, Head of Third Party Risk',
    reason: 'Consistent with outsourcing policy escalation path for overdue material-provider SLA evidence.',
  },
  {
    id: 'AUD-2026-0146',
    timestamp: '2026-08-15T17:20:00+10:00',
    toolName: 'flag_tolerance_breach',
    actor: 'agent',
    args: {
      criticalOperationId: 'op-card-auth',
      previousStatus: 'approaching',
      newStatus: 'breached',
      currentValue: '52 minutes',
      toleranceThreshold: '30 minutes',
      incidentRef: 'INC-4471',
    },
    decision: 'auto',
    approver: null,
    reason: 'Automated tolerance threshold breach detection; status flagging does not require human approval under the agent operating mandate.',
  },
]
