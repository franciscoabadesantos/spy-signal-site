import { getTickerScorecards } from '../../../../lib/scorecard'
import type { Scorecard } from '../../../../lib/scorecard-types'
import { type TickerSearchResponse, type TickerSearchResult } from '../../../../lib/ticker-search'
import { tickerReadinessBadge, type TickerReadinessBadge } from '../../../../lib/ticker-readiness'

export const dynamic = 'force-dynamic'

const SYMBOL_LIMIT = 8
const SCORECARD_TIMEOUT_MS = 1500

function json(payload: TickerSearchResponse) {
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json',
    },
  })
}

function isTradableSymbol(symbol: string): boolean {
  return /^[A-Z0-9][A-Z0-9.\-]{0,9}$/.test(symbol)
}

export function parseEnrichmentSymbols(raw: string): string[] {
  const symbols: string[] = []
  const seen = new Set<string>()

  for (const value of raw.split(',')) {
    const symbol = value.trim().toUpperCase()
    if (!isTradableSymbol(symbol) || seen.has(symbol)) continue

    seen.add(symbol)
    symbols.push(symbol)

    if (symbols.length >= SYMBOL_LIMIT) break
  }

  return symbols
}

function readinessFromScorecard(scorecard: Scorecard | null | undefined): TickerReadinessBadge | null {
  if (!scorecard) return null
  const readiness = tickerReadinessBadge({
    coverageState: scorecard.coverageState,
    hasPrices: scorecard.hasPrices,
    hasTechnicals: scorecard.hasTechnicals,
    hasScorecard: scorecard.hasScorecard,
    missingInputs: scorecard.missingInputs,
    registryStatus: scorecard.registryStatus,
    validationStatus: scorecard.validationStatus,
    promotionStatus: scorecard.promotionStatus,
    scorecardReadiness: scorecard.readiness,
  })
  return readiness.label === 'Tracked' ? null : readiness
}

async function getTickerScorecardsFailSoft(symbols: string[]): Promise<{
  failed: boolean
  scorecardsByTicker: Record<string, Scorecard>
}> {
  if (symbols.length === 0) {
    return { failed: false, scorecardsByTicker: {} }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), SCORECARD_TIMEOUT_MS)
  })

  try {
    const scorecardsByTicker = await Promise.race([getTickerScorecards(symbols), timeout])
    if (!scorecardsByTicker) {
      return { failed: true, scorecardsByTicker: {} }
    }

    return { failed: false, scorecardsByTicker }
  } catch {
    return { failed: true, scorecardsByTicker: {} }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function symbolResult(symbol: string, scorecard: Scorecard | null | undefined): TickerSearchResult {
  return {
    symbol,
    name: symbol,
    exchange: null,
    hasSignals: false,
    readiness: readinessFromScorecard(scorecard),
    convictionPct: null,
    tone: null,
    signalDate: null,
    scorecard: scorecard ?? null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = parseEnrichmentSymbols(searchParams.get('symbols') || '')

  if (symbols.length === 0) {
    return json({
      featured: [],
      fallbackUsed: false,
      query: '',
      results: [],
      source: 'backend',
    })
  }

  const { failed, scorecardsByTicker } = await getTickerScorecardsFailSoft(symbols)
  return json({
    featured: [],
    fallbackUsed: failed,
    query: '',
    results: symbols.map((symbol) => symbolResult(symbol, scorecardsByTicker[symbol])),
    source: 'backend',
  })
}
