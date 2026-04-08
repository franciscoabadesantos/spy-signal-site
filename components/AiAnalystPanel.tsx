'use client'

import { useMemo, useState } from 'react'
import { Bot, Loader2 } from 'lucide-react'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'

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
}

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

export default function AiAnalystPanel({ ticker, signal, news }: AiAnalystPanelProps) {
  const [analysis, setAnalysis] = useState('')
  const [citations, setCitations] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signalSummary = useMemo(() => summarizeSignal(signal), [signal])

  const onGenerate = async () => {
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

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-300 flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-400" />
          AI Analyst
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-cyan-500/90 px-3 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Analysis'
          )}
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-900/90 bg-slate-900/50">
        <div className="text-[11px] text-slate-400">Context</div>
        <div className="text-[12px] text-slate-200 mt-1">{ticker} · {signalSummary}</div>
      </div>

      <div className="px-4 py-3">
        {error ? (
          <div className="text-[12px] text-red-300 bg-red-950/40 border border-red-900/40 rounded-md px-3 py-2">
            {error}
          </div>
        ) : (
          <pre className="font-mono text-[12px] leading-5 text-slate-100 whitespace-pre-wrap min-h-[150px]">
            {analysis || (pending ? 'Running live analysis...\n' : 'Click "Generate Analysis" to synthesize the latest catalysts.')}
          </pre>
        )}

        {citations.length > 0 && (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Sources</div>
            <div className="space-y-1.5">
              {citations.slice(0, 5).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[12px] text-cyan-300 hover:text-cyan-200 truncate"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
