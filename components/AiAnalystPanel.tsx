'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, Sparkles } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import FilterChip from '@/components/ui/FilterChip'
import { buttonClass } from '@/components/ui/Button'

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
    label: 'Revenue and earnings drivers',
    prompt: 'What are the main drivers behind revenue and earnings performance?',
  },
  {
    id: 'signal',
    label: 'Reason for current model stance',
    prompt: 'Why did the model flip into its current stance?',
  },
  {
    id: 'risk',
    label: 'Near-term invalidation risks',
    prompt: 'What risks could invalidate this setup over the next few weeks?',
  },
]

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

function summarizeSignal(signal: AiAnalystPanelProps['signal']): string {
  const conviction =
    signal.conviction === null ? 'unknown conviction' : `${Math.round(signal.conviction * 100)}% conviction`
  const horizon =
    signal.predictionHorizon === null ? 'unknown horizon' : `${signal.predictionHorizon}d horizon`
  return `${signal.direction.toUpperCase()} · ${conviction} · ${horizon}`
}

function signalVariant(direction: SignalDirection): 'success' | 'danger' | 'neutral' {
  if (direction === 'bullish') return 'success'
  if (direction === 'bearish') return 'danger'
  return 'neutral'
}

function LockedState({ ticker, upgradeHref }: { ticker: string; upgradeHref: string | null }) {
  const href = upgradeHref ?? '/pricing'
  const openUpgradeInNewTab = href.startsWith('http')

  return (
    <Card className="section-gap">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-filter-label">AI Analyst</div>
          <h3 className="text-card-title mt-1 text-neutral-900 dark:text-neutral-100">{ticker} research copilot</h3>
        </div>
        <Badge variant="warning">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" />
            Pro
          </span>
        </Badge>
      </div>
      <p className="text-body">
        Ask deeper questions about catalysts, risk scenarios, and stance shifts. Upgrade to run unlimited AI research prompts.
      </p>
      <a
        href={href}
        target={openUpgradeInNewTab ? '_blank' : undefined}
        rel={openUpgradeInNewTab ? 'noopener noreferrer' : undefined}
        className={buttonClass({ variant: 'secondary' })}
      >
        Upgrade to Pro
      </a>
    </Card>
  )
}

function UnavailableState() {
  return (
    <Card className="section-gap">
      <div className="text-filter-label">AI Analyst</div>
      <h3 className="text-card-title text-neutral-900 dark:text-neutral-100">Provider not enabled</h3>
      <p className="text-body">
        The AI panel is available, but the server provider key is missing. Add provider credentials to enable live responses.
      </p>
    </Card>
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

  const signalSummary = useMemo(() => summarizeSignal(signal), [signal])
  const selectedPrompt = PROMPT_PRESETS.find((preset) => preset.id === selectedPromptId) ?? PROMPT_PRESETS[0]

  useEffect(() => {
    if (initialQuestion) setCustomQuestion(initialQuestion)
  }, [initialQuestion])

  useEffect(() => {
    if (!initialPromptLabel) return
    const matched = PROMPT_PRESETS.find((preset) =>
      preset.label.toLowerCase() === initialPromptLabel.toLowerCase()
    )
    if (matched) setSelectedPromptId(matched.id)
  }, [initialPromptLabel])

  const runAnalysis = async (question: string) => {
    setPending(true)
    setError(null)
    setAnalysis('')
    setCitations([])

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
            if (gatheredCitations.length > 0) setCitations(gatheredCitations)
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

  if (!isPro) return <LockedState ticker={ticker} upgradeHref={upgradeHref} />
  if (!providerEnabled) return <UnavailableState />

  return (
    <Card className="section-gap">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-filter-label">AI Analyst</div>
          <h3 className="text-card-title mt-1 text-neutral-900 dark:text-neutral-100">{ticker} research copilot</h3>
          <p className="text-body mt-1">{signalSummary}</p>
        </div>
        <Badge variant={signalVariant(signal.direction)}>{signal.direction.toUpperCase()}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROMPT_PRESETS.map((preset) => (
          <FilterChip
            key={preset.id}
            label={preset.label}
            active={preset.id === selectedPromptId}
            onClick={() => setSelectedPromptId(preset.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={customQuestion}
          onChange={(event) => setCustomQuestion(event.target.value)}
          placeholder="Ask a follow-up question..."
        />
        <button
          type="button"
          disabled={pending || customQuestion.trim().length === 0}
          onClick={() => runAnalysis(customQuestion.trim())}
          className={buttonClass({ variant: 'primary' })}
        >
          {pending ? 'Running...' : 'Run'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => runAnalysis(selectedPrompt.prompt)}
        disabled={pending}
        className={buttonClass({ variant: 'secondary' })}
      >
        <span className="inline-flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Run selected prompt
        </span>
      </button>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
        {error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <pre className="min-h-[140px] whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {analysis || (pending ? 'Running live synthesis...' : 'Run a prompt to generate AI analysis.')}
          </pre>
        )}
      </div>

      {citations.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-filter-label mb-2">Sources</div>
          <div className="space-y-1.5">
            {citations.slice(0, 5).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-primary hover:underline"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
