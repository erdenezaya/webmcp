import { useEffect, useRef, useState } from 'react'

interface SamplePrompt {
  prompt: string
  note: string
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    prompt: 'What critical operations are approaching their tolerance threshold?',
    note: 'read — no approval needed',
  },
  {
    prompt: 'Assess NexaCore Banking Systems against CPS 230 material service provider obligations.',
    note: 'read',
  },
  {
    prompt:
      'Raise a remediation action against our most critical control gap, owned by the Head of Payments, due 30 November 2026.',
    note: 'write — triggers the approval gate',
  },
  {
    prompt: 'Generate a board summary of our current operational resilience position.',
    note: 'synthesis',
  },
]

const DISMISS_KEY = 'assurance-desk:onboarding-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // Storage can be unavailable (private browsing, disabled site data). The
    // panel simply won't remember the dismissal across visits — not fatal.
  }
}

export function OnboardingPanel({ dismissible = false }: { dismissible?: boolean }) {
  const [dismissed, setDismissed] = useState(() => (dismissible ? readDismissed() : false))
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    },
    [],
  )

  if (dismissible && dismissed) return null

  const handleCopy = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API can be unavailable (insecure context, denied permission).
      // The prompt is still right there on screen to copy by hand.
    }
    setCopiedIndex(index)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 1500)
  }

  return (
    <div className="mb-4 rounded border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-300">
          This register exposes 7 tools to AI agents via WebMCP. Agents can read freely; every write requires human
          approval and is recorded in the audit trail.
        </p>
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              setDismissed(true)
              writeDismissed()
            }}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-300"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Try these with your agent
        </div>
        <ul className="space-y-2">
          {SAMPLE_PROMPTS.map((item, index) => (
            <li
              key={item.prompt}
              className="flex items-start justify-between gap-3 rounded border border-slate-800 bg-slate-950/40 p-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-200">&ldquo;{item.prompt}&rdquo;</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.note}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(index, item.prompt)}
                className="shrink-0 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
              >
                {copiedIndex === index ? 'Copied' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        No WebMCP agent? Use the Tool Inspector to run the same tools manually.
      </p>
    </div>
  )
}
