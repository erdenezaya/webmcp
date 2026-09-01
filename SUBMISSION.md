# Devpost Submission — Meridian Bank CPS 230 Operational Risk Register

## Why this use case is a strong fit for WebMCP

Operational risk registers are exactly the kind of application that benefits from
being callable, not just readable: the useful facts (which operations are
breaching tolerance, which controls have gaps, which service providers are
concentrated) live inside one application's live state, not in general knowledge
an LLM already has. Historically, giving an agent access to that state meant
building and hosting a separate MCP server, duplicating the application's business
logic and authorization model on a second surface. WebMCP removes that duplication:
the same page a risk analyst already uses becomes the agent's interface, with no
separate backend to build or keep in sync. It also fits because this domain has a
hard requirement — APRA CPS 230 demands a named human decision for control and
tolerance changes — and WebMCP's tools live in the same page as that human, so an
approval step can sit directly in the UI instead of being bolted on somewhere the
agent can bypass it.

## How it creates a better user experience

Instead of a chat window with no visibility into what an agent is actually doing to
a compliance system, the risk analyst works from one page. Asking an agent to find
control gaps or draft a remediation action shows results in the same tables the
analyst already trusts, generated from the same live data. When the agent proposes
a change, a modal appears in that page — not in a separate approval tool, not in an
email — showing the exact tool call, the affected control or operation with its
current values, and asking for an explicit approve or reject with a reason. The
analyst never has to reconcile "what the agent said it did" against "what actually
changed," because there's only one system of record and one place decisions happen.
A built-in Tool Inspector panel also lets anyone run the same tools by hand, with
auto-generated forms, to see exactly what an agent would see and do — useful for
building trust in the tools before ever pointing an agent at them.

## What people and agents can do together that was difficult or impossible before

Wiring an agent into a real system of record with write access has usually meant
standing up a backend MCP server, an auth layer, and a translation between chat
context and the application's actual data model — enough infrastructure that most
agent integrations stay read-only or informal. WebMCP collapses that: the
application itself exposes structured, typed tools with no separate service to
deploy. Combined with a blocking, promise-based approval gate, this makes a
genuinely new joint workflow possible — an agent can scan the register, find that a
control is a critical gap, and draft a remediation action with an owner and due
date, while a human reviewer sees exactly that proposal, with current-state
context, and decides in seconds, with the decision and reasoning permanently
logged. Neither side does the whole job alone: the agent does the scanning and
drafting at a speed no analyst matches; the human keeps the accountability CPS 230
actually requires. That combination — fast agent drafting, synchronous human
authority, one shared audit trail — wasn't practical without WebMCP's in-page tool
surface.

## How WebMCP was implemented

`getModelContext()` reads `document.modelContext`, falling back to
`navigator.modelContext` for the API's earlier location, and returns `null` when
neither exists so the whole app degrades gracefully. All seven tools are built once
by a `useToolManifest` hook as an array of `{ name, title, description,
inputSchema, annotations, execute }` objects with full JSON Schema input
definitions and `readOnlyHint` annotations; a `useWebMCPTool` hook registers each
with `modelContext.registerTool(toolDef, { signal })` on mount and aborts on
unmount. Because tool state must stay fresh across a component that only registers
once, execute closures read from a ref kept current via `useLayoutEffect` rather
than closing over stale render values. Write-tool `execute` functions call
`requestHumanApproval`, which queues a request and returns a promise that only
resolves when a human decides in the in-page `ApprovalGate` modal or a 60-second
timeout auto-rejects it — guarded against double-resolution races — after which the
decision is written to the audit trail.
