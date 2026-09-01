# Meridian Bank — CPS 230 Operational Risk Register

A single-page web application that models an APRA CPS 230 operational risk register
for a fictional mid-size Australian bank ("Meridian Bank"), and exposes it to AI
agents through [WebMCP](https://github.com/webmachinelearning/webmcp) — an
in-browser, in-page tool-calling API. The same register that a risk analyst browses
in the UI is also a set of callable tools an agent can use, with every write gated
behind human approval.

This is a demonstration / prototype built for a hackathon submission. It has no
backend, no database, and no authentication — all data is seeded in memory and lives
only in the browser tab.

## The problem

APRA's [CPS 230](https://www.apra.gov.au/operational-risk-management) standard
requires Australian banks to identify critical operations, set tolerances for how
long each can be disrupted, maintain an effective control environment, manage
material service provider risk, and keep an auditable record of how all of that is
managed. In practice this register is maintained by hand in spreadsheets and GRC
tools, updated slowly, and rarely consulted until an audit or an incident forces the
issue.

AI agents are a natural fit for keeping a register like this current — reading
tolerance data, flagging control gaps, drafting remediation actions, summarising
the state of play for the board. But CPS 230 is explicitly about accountability:
a bank cannot let an autonomous agent unilaterally change a control's status or a
risk tolerance threshold. Every change needs a named, accountable human decision,
with a reason, on the record.

This project explores what that looks like when the tool-calling boundary is the
browser itself: the tools an agent calls are the same UI a human uses, and every
mutating tool call blocks until a human in that UI approves or rejects it.

## The seven WebMCP tools

Registered from [`src/webmcp/tools.tsx`](src/webmcp/tools.tsx) via the
`useWebMCPTool` hook in [`src/webmcp/registerTool.ts`](src/webmcp/registerTool.ts).

| Tool | Type | Input | What it does |
|---|---|---|---|
| `list_critical_operations` | read-only | `{ statusFilter?: 'within' \| 'approaching' \| 'breached' }` | Lists critical operations with their tolerance metric, current value, threshold, and status. |
| `get_control_gaps` | read-only | `{ severity?: 'low' \| 'medium' \| 'high' \| 'critical', criticalOperationId?: string }` | Lists controls that are not fully effective (`partially_effective` or `gap`), with owner and the operation they support. |
| `assess_service_provider` | read-only | `{ providerName: string }` (fuzzy-matched) | Looks up a service provider by name and reports materiality, concentration risk, contract review status, and open CPS 230 gaps. |
| `log_control_evidence` | **write** | `{ controlId: string, description: string }` | Adds an evidence item to a control. Requires human approval. |
| `raise_remediation_action` | **write** | `{ controlId: string, owner: string, dueDate: string, rationale?: string }` | Raises a tracked remediation action against a control gap. Requires human approval. |
| `update_risk_tolerance` | **write** | `{ criticalOperationId: string, newThreshold: string, justification: string }` | Changes the disruption tolerance threshold for a critical operation — a risk-appetite change. Requires human approval. |
| `generate_board_summary` | read-only (synthesis) | `{}` | Synthesises a board-ready summary (breaches, control gaps, provider concentration, open remediations) from the live register and renders it into the UI's Board Summary panel, not just back to the agent. |

Every tool returns `{ content: [{ type: "text", text: string }] }` and handles a
not-found id by returning a plain-text explanation rather than throwing.

Read tools execute immediately. Write tools always call `requestHumanApproval(...)`
before mutating anything, and always call `logToAuditTrail(...)` with the outcome —
whether approved, rejected, or timed out.

## The human approval gate

Implemented in [`src/webmcp/approval.tsx`](src/webmcp/approval.tsx).

When a write tool runs, `requestHumanApproval(toolName, args, summary)` pushes a
request onto a queue and returns a `Promise` that does not resolve until a human
acts on it — the agent's tool call genuinely blocks. A fixed modal overlay
(`ApprovalGate`) appears showing:

- the tool name and a plain-English summary of the requested change
- the full arguments
- the specific control or operation affected, with its **current** values, so the
  reviewer can see exactly what would change
- an approver field, prefilled with the reviewer's name and title
- a reason field (required to reject, optional to approve)
- Approve / Reject buttons

If nobody responds within 60 seconds, the request auto-rejects with the reason
`"No human response within timeout window"`, so an agent can never hang forever
waiting on a human who isn't there. Every decision — approved, rejected, or
timed out — is assigned an audit reference in the form `AUD-YYYYMMDD-NNNN` and
recorded as an `AuditEntry` in the register's audit trail, visible in the
Audit Trail view.

This matters because it's the actual control CPS 230 requires: not "the AI is
careful," but a named human, an explicit decision, a stated reason, and a
permanent record — for every single change an agent proposes. The read tools have
no such gate, because reading the register isn't a risk decision.

You can exercise this whole flow — including the approval modal and the audit
trail entry it produces — without any AI agent involved at all, from the
**Tool Inspector** view in the sidebar, which lists all seven tools with an
auto-generated form for each and a "Run tool" button.

## Running locally

Requires Node.js 18+.

```bash
npm install
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # type-check and build for production
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

There is no environment configuration, database, or API key to set up — the app
is entirely client-side and starts from the seed data in
[`src/data/seed.ts`](src/data/seed.ts).

## Testing the WebMCP integration

The app works in any browser — the header shows **WebMCP: Unsupported** and the
Tool Inspector falls back to its local tool manifest when the API isn't present.
To see an agent actually discover and call the tools, you need a browser or host
that implements the WebMCP `modelContext` API.

**WebMCP-enabled Chrome** (experimental):

1. Use a Chrome build with the WebMCP / Web Model Context origin trial or flag
   enabled (check `chrome://flags` for a "Web Model Context" or "WebMCP" entry;
   the exact flag name has moved around as the spec has evolved, and the API
   itself moved from `navigator.modelContext` to `document.modelContext` around
   Chrome 150 — this app checks both, see `getModelContext()` in
   [`src/webmcp/registerTool.ts`](src/webmcp/registerTool.ts)).
2. Load the app and confirm the header reads **WebMCP: Active — 7 tools
   registered**.
3. In DevTools, confirm `(document.modelContext ?? navigator.modelContext).getTools()`
   resolves with all seven tools.
4. Drive it from whatever agent surface that Chrome build exposes for
   page-registered tools, and confirm a write tool call opens the approval modal
   in the tab and blocks until you respond.

**ChatGPT's in-app browser:**

1. Open the deployed app's URL inside ChatGPT's in-app/embedded browser.
2. Ask ChatGPT to inspect or act on the page — for example, "what critical
   operations are breaching tolerance?" or "raise a remediation action for the
   ATM redundancy control."
3. ChatGPT should discover the page's registered WebMCP tools and call the
   appropriate one directly. For write tools, the approval modal should appear
   in the visible page and block the agent's call until you approve or reject it.

As this is an emerging browser API, exact steps depend on the build/version you're
testing with — if a tool isn't discovered, check the header banner first to
confirm whether that surface exposes `modelContext` at all.

## Project structure

```
src/
  data/seed.ts                 Seed data + domain types for the register
  context/RegisterContext.tsx  Register state: useReducer + context, mutation actions
  webmcp/
    registerTool.ts            getModelContext(), useWebMCPTool(), useRegisteredToolNames()
    approval.tsx                ApprovalProvider, requestHumanApproval(), ApprovalGate, logToAuditTrail()
    tools.tsx                   The seven tool definitions (useToolManifest) + RegisterTools + board summary synthesis
  components/
    layout/                     HeaderBar, Sidebar
    common/                     StatusPill, SourceBadge, ViewHeader
    views/                      Critical Operations, Controls, Service Providers, Audit Trail, Board Summary, Tool Inspector
  App.tsx                       Provider wiring + view routing (no router — local state)
```

## Tech stack

- **Vite** — build tool and dev server
- **React 19** with **TypeScript**
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin
- **Oxlint** for linting
- No backend, no database, no authentication — all state is client-side React
  state (`useReducer` + context), seeded once at load
