'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, Lock, Loader2, MessageSquareText, Send, Sparkles, X } from 'lucide-react'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'

type PromptPreset = {
  id: string
  label: string
  prompt: string
}

type AiAnalystPanelProps = {
  ticker: string
  signal: {
    direction: SignalDirection
    conviction: number | null
    predictionHorizon: number | null
    signalDate: string
  }
  news: Array<{
    title: string
    publisher: string
    publishedAt: string | null
    url: string
  }>
  isPro: boolean
  providerEnabled: boolean
  upgradeHref: string | null
  initialQuestion?: string | null
  initialPromptLabel?: string | null
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'drivers',
    label: 'What are the main drivers behind revenue and earnings performance?',
    prompt: 'What are the main drivers behind revenue and earnings performance?',
  },
  {
    id: 'signal',
    label: 'Why did the model flip into its current stance?',
    prompt: 'Why did the model flip into its current stance?',
  },
  {
    id: 'risk',
    label: 'What risks could invalidate this setup over the next few weeks?',
    prompt: 'What risks could invalidate this setup over the next few weeks?',
  },
]

const FEEDBACK_OPTIONS = [
  "I don't understand this analysis",
  'I think the data or analysis is incorrect',
  'I disagree with this analysis',
  'I have an idea or suggestion',
]

function summarizeSignal(signal: AiAnalystPanelProps['signal']): string {
  const conviction =
    signal.conviction === null ? 'unknown conviction' : `${Math.round(signal.conviction * 100)}% conviction`
  const horizon =
    signal.predictionHorizon === null ? 'unknown horizon' : `${signal.predictionHorizon}d horizon`
  return `${signal.direction.toUpperCase()} · ${conviction} · ${horizon}`
}

function mergeUniqueUrls(existing: string[], incoming: unknown): string[] {
  const next = new Set(existing)
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      if (typeof item !== 'string') continue
      const trimmed = item.trim()
      if (!trimmed.startsWith('http')) continue
      next.add(trimmed)
    }
  }
  return [...next]
}

function statusCopy(direction: SignalDirection): string {
  if (direction === 'bullish') return 'The model is currently leaning risk-on.'
  if (direction === 'bearish') return 'The model is currently leaning defensive.'
  return 'The model is currently waiting for cleaner confirmation.'
}

function FeedbackModal({
  ticker,
  runId,
  visible,
  onClose,
}: {
  ticker: string
  runId: number | null
  visible: boolean
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setSelected(null)
      setNote('')
      setSubmitted(false)
      setPending(false)
      setError(null)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-stone-300 bg-[#f3efe7] p-6 text-stone-950 shadow-[0_24px_90px_-28px_rgba(0,0,0,0.6)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Feedback
            </div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Feedback on {ticker} AI research
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 p-2 text-stone-500 transition-colors hover:bg-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-stone-300 bg-white/70 p-5 text-lg font-medium">
            Feedback saved. This run is now attached to your AI research history.
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {FEEDBACK_OPTIONS.map((option, index) => {
              const active = selected === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(option)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-xl transition-colors ${
                    active
                      ? 'border-stone-950 bg-white shadow-[0_6px_20px_-16px_rgba(0,0,0,0.4)]'
                      : 'border-stone-300 bg-stone-100/80 hover:bg-white'
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg font-bold ${
                      active
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-300 bg-stone-50 text-stone-900'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </button>
              )
            })}

            <div className="pt-2">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note"
                className="min-h-[120px] w-full rounded-2xl border border-stone-300 bg-white/80 px-4 py-3 text-base outline-none placeholder:text-stone-400"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!selected || pending || submitted) return
              setPending(true)
              setError(null)

              try {
                const response = await fetch('/api/ai-analyst/feedback', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    runId,
                    ticker,
                    category: selected,
                    note: note.trim() || null,
                  }),
                })

                if (!response.ok) {
                  const payload = (await response.json().catch(() => null)) as { error?: string } | null
                  throw new Error(payload?.error || 'Failed to submit feedback.')
                }

                setSubmitted(true)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to submit feedback.')
              } finally {
                setPending(false)
              }
            }}
            disabled={!selected || submitted || pending}
            className="rounded-2xl bg-[#f5cf66] px-7 py-3 text-xl font-semibold text-stone-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Saving...' : 'OK'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function LockedState({
  ticker,
  upgradeHref,
}: {
  ticker: string
  upgradeHref: string | null
}) {
  const href = upgradeHref ?? '/pricing'
  const openUpgradeInNewTab = href.startsWith('http')

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(240,198,89,0.12),_transparent_30%),linear-gradient(180deg,_rgba(30,32,36,0.98),_rgba(22,24,29,0.98))] shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-slate-200">{ticker} AI Research</div>
          <div className="text-sm text-slate-500">Paid plans only</div>
        </div>
        <div className="rounded-full border border-slate-700 bg-white/5 p-2 text-slate-400">
          <Lock className="h-4 w-4" />
        </div>
      </div>

      <div className="px-5 py-7 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
          <Lock className="h-3.5 w-3.5" />
          Premium Research
        </div>
        <h3 className="mx-auto mt-6 max-w-[14ch] text-4xl font-semibold tracking-tight text-white">
          Ask deeper questions about this setup
        </h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">
          Unlock a guided AI research workflow with prompt suggestions, live synthesis, and structured follow-up questions.
        </p>
        <a
          href={href}
          target={openUpgradeInNewTab ? '_blank' : undefined}
          rel={openUpgradeInNewTab ? 'noopener noreferrer' : undefined}
          className="mt-7 inline-flex items-center justify-center rounded-2xl bg-[#f2cf6b] px-6 py-3 text-lg font-semibold text-stone-950 transition-transform hover:-translate-y-0.5"
        >
          Upgrade Now
        </a>
      </div>

      <div className="space-y-3 border-t border-slate-800 bg-black/10 px-5 py-5">
        {PROMPT_PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-left text-lg font-medium text-slate-600"
          >
            {preset.label}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 bg-[#1d1b18] px-5 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-600">
          <span className="text-base">Ask your question here...</span>
          <div className="rounded-xl bg-[#2f2a1c] p-2 text-[#8f7c49]">
            <Send className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

function UnavailableState() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(18,24,33,0.98),_rgba(12,17,24,0.98))] shadow-[0_24px_70px_-28px_rgba(0,0,0,0.65)]">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <Bot className="h-4 w-4 text-cyan-300" />
          AI Research
        </div>
      </div>
      <div className="px-5 py-6">
        <h3 className="text-2xl font-semibold tracking-tight text-white">Provider not enabled</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The premium AI research surface is ready, but the provider is currently disabled. Once you select a model/provider later, this panel can run live.
        </p>
      </div>
    </div>
  )
}

export default function AiAnalystPanel({
  ticker,
  signal,
  news,
  isPro,
  providerEnabled,
  upgradeHref,
  initialQuestion = null,
  initialPromptLabel = null,
}: AiAnalystPanelProps) {
  const [analysis, setAnalysis] = useState('')
  const [citations, setCitations] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromptId, setSelectedPromptId] = useState<string>(PROMPT_PRESETS[0].id)
  const [customQuestion, setCustomQuestion] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [runId, setRunId] = useState<number | null>(null)

  const signalSummary = useMemo(() => summarizeSignal(signal), [signal])
  const selectedPrompt = PROMPT_PRESETS.find((preset) => preset.id === selectedPromptId) ?? PROMPT_PRESETS[0]

  useEffect(() => {
    if (initialQuestion) {
      setCustomQuestion(initialQuestion)
    }
  }, [initialQuestion])

  const runAnalysis = async (question: string) => {
    setPending(true)
    setError(null)
    setAnalysis('')
    setCitations([])
    setRunId(null)

    try {
      const response = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          signal,
          news,
          question,
          promptLabel: selectedPrompt.label,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null
        throw new Error(payload?.details || payload?.error || 'AI analysis request failed.')
      }

      if (!response.body) {
        throw new Error('AI analysis stream is unavailable.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''
      let gatheredCitations: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() || ''

        for (const eventBlock of events) {
          const lines = eventBlock
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data:'))

          for (const line of lines) {
            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') continue

            let parsed: Record<string, unknown>
            try {
              parsed = JSON.parse(payload) as Record<string, unknown>
            } catch {
              continue
            }

            const parsedRunId =
              typeof parsed.run_id === 'number'
                ? parsed.run_id
                : typeof parsed.run_id === 'string'
                  ? Number(parsed.run_id)
                  : null
            if (parsedRunId !== null && Number.isFinite(parsedRunId)) {
              setRunId(parsedRunId)
              continue
            }

            const choices = Array.isArray(parsed.choices) ? parsed.choices : []
            const firstChoice = (choices[0] as Record<string, unknown> | undefined) ?? null
            const delta = (firstChoice?.delta as Record<string, unknown> | undefined) ?? null
            const message = (firstChoice?.message as Record<string, unknown> | undefined) ?? null

            const deltaContent = typeof delta?.content === 'string' ? delta.content : null
            const messageContent = typeof message?.content === 'string' ? message.content : null
            const contentChunk = deltaContent ?? (accumulated.length === 0 ? messageContent : null)

            if (contentChunk && contentChunk.length > 0) {
              accumulated += contentChunk
              setAnalysis(accumulated)
            }

            gatheredCitations = mergeUniqueUrls(gatheredCitations, parsed.citations)
            if (gatheredCitations.length > 0) {
              setCitations(gatheredCitations)
            }
          }
        }
      }

      if (accumulated.trim().length === 0) {
        throw new Error('No analysis content was returned.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI analysis.')
    } finally {
      setPending(false)
    }
  }

  if (!isPro) {
    return <LockedState ticker={ticker} upgradeHref={upgradeHref} />
  }

  if (!providerEnabled) {
    return <UnavailableState />
  }

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(94,234,212,0.1),_transparent_26%),linear-gradient(180deg,_rgba(12,16,23,0.98),_rgba(11,15,21,0.98))] shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)]">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Bot className="h-4 w-4 text-cyan-300" />
                AI Research
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {ticker} · {signalSummary}
              </div>
              <div className="mt-1 text-sm text-slate-500">{statusCopy(signal.direction)}</div>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="rounded-full border border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
            >
              Feedback
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {initialQuestion ? (
            <div className="mb-4 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100">
              Loaded from saved research history{initialPromptLabel ? `: ${initialPromptLabel}` : ''}.
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => runAnalysis(selectedPrompt.prompt)}
            disabled={pending}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#f2cf6b] bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] px-4 py-4 text-left transition-colors hover:bg-[#1a1c21]"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-[#f2cf6b]/15 p-2 text-[#f2cf6b]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg font-semibold text-white">{selectedPrompt.label}</span>
            </span>
            {pending ? <Loader2 className="h-4 w-4 animate-spin text-[#f2cf6b]" /> : null}
          </button>

          <div className="mt-4 space-y-2">
            {PROMPT_PRESETS.map((preset) => {
              const active = preset.id === selectedPromptId
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPromptId(preset.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'border-slate-600 bg-slate-800/80 text-slate-100'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-[#18191d] p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <MessageSquareText className="h-4 w-4" />
              Custom Follow-up
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={customQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
                placeholder="Ask your own question..."
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                disabled={pending || customQuestion.trim().length === 0}
                onClick={() => runAnalysis(customQuestion.trim())}
                className="rounded-xl bg-[#f2cf6b] p-3 text-stone-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-black/10 px-5 py-5">
          {error ? (
            <div className="rounded-2xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <pre className="min-h-[180px] whitespace-pre-wrap font-mono text-[12px] leading-6 text-slate-100">
                {analysis || (pending ? 'Running live synthesis...\n' : 'Choose a research prompt to generate structured analysis.')}
              </pre>
            </div>
          )}

          {citations.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sources
              </div>
              <div className="space-y-1.5">
                {citations.slice(0, 5).map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-cyan-300 hover:text-cyan-200"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <FeedbackModal
        ticker={ticker}
        runId={runId}
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  )
}
