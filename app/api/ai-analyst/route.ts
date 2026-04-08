import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SignalDirection = 'bullish' | 'neutral' | 'bearish'

type AnalystSignalInput = {
  direction?: unknown
  conviction?: unknown
  predictionHorizon?: unknown
  signalDate?: unknown
}

type AnalystNewsInput = {
  title?: unknown
  publisher?: unknown
  publishedAt?: unknown
  url?: unknown
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asDirection(value: unknown): SignalDirection | null {
  if (value !== 'bullish' && value !== 'neutral' && value !== 'bearish') return null
  return value
}

function asConviction(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < 0 || value > 1) return null
  return value
}

function asHorizon(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (rounded <= 0) return null
  return rounded
}

function normalizeTicker(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  const ticker = raw.toUpperCase()
  if (!/^[A-Z0-9.\-]{1,10}$/.test(ticker)) return null
  return ticker
}

function sanitizeNews(items: unknown): Array<{
  title: string
  publisher: string
  publishedAt: string | null
  url: string
}> {
  if (!Array.isArray(items)) return []

  const sanitized: Array<{
    title: string
    publisher: string
    publishedAt: string | null
    url: string
  }> = []

  for (const item of items) {
    const row = item as AnalystNewsInput
    const title = asString(row?.title)
    const publisher = asString(row?.publisher) ?? 'Unknown publisher'
    const publishedAt = asString(row?.publishedAt)
    const url = asString(row?.url)
    if (!title || !url || !url.startsWith('http')) continue
    sanitized.push({ title, publisher, publishedAt, url })
    if (sanitized.length >= 8) break
  }

  return sanitized
}

function buildPrompt({
  ticker,
  signal,
  news,
}: {
  ticker: string
  signal: {
    direction: SignalDirection
    conviction: number | null
    predictionHorizon: number | null
    signalDate: string | null
  }
  news: Array<{
    title: string
    publisher: string
    publishedAt: string | null
    url: string
  }>
}): string {
  const conviction =
    signal.conviction === null ? 'unknown conviction' : `${Math.round(signal.conviction * 100)}% conviction`
  const horizon =
    signal.predictionHorizon === null
      ? 'unspecified horizon'
      : `${signal.predictionHorizon}-day prediction horizon`
  const signalDate = signal.signalDate ?? 'recent session'

  const headlineContext = news
    .map((item, index) => {
      const publishedAt = item.publishedAt ?? 'unknown time'
      return `${index + 1}. ${item.title} | ${item.publisher} | ${publishedAt} | ${item.url}`
    })
    .join('\n')

  return [
    `Ticker: ${ticker}`,
    `Signal: ${signal.direction.toUpperCase()} (${conviction}, ${horizon}, date ${signalDate})`,
    '',
    'Recent headlines:',
    headlineContext || 'No headlines provided.',
    '',
    'Task:',
    'Write exactly 3 concise bullet points explaining plausible catalysts behind this model stance.',
    'Rules:',
    '- Focus on macro, sector, company, rates, and flow dynamics.',
    '- Mention uncertainty when evidence is mixed.',
    '- Keep each bullet under 38 words.',
    '- Do not provide investment advice.',
  ].join('\n')
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY?.trim()
  const model = process.env.PERPLEXITY_MODEL?.trim() || 'sonar-pro'

  if (!apiKey) {
    return NextResponse.json(
      { error: 'PERPLEXITY_API_KEY is not configured on the server.' },
      { status: 503 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const ticker = normalizeTicker(payload.ticker)
  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required.' }, { status: 400 })
  }

  const signalInput = (payload.signal ?? {}) as AnalystSignalInput
  const direction = asDirection(signalInput.direction)
  if (!direction) {
    return NextResponse.json({ error: 'signal.direction is required.' }, { status: 400 })
  }

  const signal = {
    direction,
    conviction: asConviction(signalInput.conviction),
    predictionHorizon: asHorizon(signalInput.predictionHorizon),
    signalDate: asString(signalInput.signalDate),
  }
  const news = sanitizeNews(payload.news)

  const body = {
    model,
    stream: true,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are an elite quantitative market analyst. Use web-aware reasoning grounded in cited sources and keep output concise.',
      },
      {
        role: 'user',
        content: buildPrompt({ ticker, signal, news }),
      },
    ],
  }

  let upstream: Response
  try {
    upstream = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Perplexity API.' }, { status: 502 })
  }

  if (!upstream.ok) {
    const errorBody = await upstream.text().catch(() => '')
    return NextResponse.json(
      {
        error: 'Perplexity API error.',
        status: upstream.status,
        details: errorBody.slice(0, 400),
      },
      { status: 502 }
    )
  }

  if (!upstream.body) {
    return NextResponse.json({ error: 'Perplexity API returned an empty stream.' }, { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
