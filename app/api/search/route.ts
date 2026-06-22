import { NextResponse } from 'next/server'
import { BackendDataError, fetchBackendJson } from '@/lib/backend'
import { getTickerScorecards } from '@/lib/scorecard'
import { getScreenerSignalsSafe } from '@/lib/signals'
import {
  getTemplateFeaturedTickerResults,
  isTickerLikeQuery,
  mapScreenerRowsToTickerSearchResults,
  normalizeTickerSearchQuery,
  dedupeTickerSearchResults,
  type TickerSearchResult,
  type TickerSearchResponse,
} from '@/lib/ticker-search'

export const dynamic = 'force-dynamic'

type YahooSearchQuote = {
  symbol?: string
  shortname?: string
  longname?: string
  exchange?: string
  exchDisp?: string
  quoteType?: string
}

type YahooSearchResponse = {
  quotes?: YahooSearchQuote[]
}

type SearchCandidate = {
  exchange: string | null
  name: string
  rank: number
  symbol: string
}

type BackendSummarySearchPayload = {
  ticker?: string | null
  quote?: {
    name?: string | null
    ticker?: string | null
  } | null
}

const SUPPORTED_TYPES = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'])

function json(payload: TickerSearchResponse) {
  return NextResponse.json(payload)
}

function isTradableSymbol(symbol: string): boolean {
  return /^[A-Z0-9][A-Z0-9.\-]{0,9}$/.test(symbol)
}

function normalizeCandidate(candidate: SearchCandidate): SearchCandidate {
  return {
    ...candidate,
    symbol: candidate.symbol.trim().toUpperCase(),
  }
}

function rankSearchResult(result: TickerSearchResult, query: string, candidateRank: number): number {
  const upperQuery = query.toUpperCase()
  const lowerQuery = query.toLowerCase()
  const symbol = result.symbol.toUpperCase()
  const name = result.name.toLowerCase()

  let score = 0

  if (symbol === upperQuery) score += 600
  else if (symbol.startsWith(upperQuery)) score += 260
  else if (symbol.includes(upperQuery)) score += 120

  if (name === lowerQuery) score += 360
  else if (name.startsWith(lowerQuery)) score += 210
  else if (name.includes(lowerQuery)) score += 90

  if (result.convictionPct !== null) score += Math.min(result.convictionPct, 100) / 2
  score += Math.max(0, 40 - candidateRank)

  return score
}

async function searchYahooCandidates(query: string): Promise<SearchCandidate[]> {
  const url = new URL('https://query2.finance.yahoo.com/v1/finance/search')
  url.searchParams.set('q', query)
  url.searchParams.set('quotesCount', '16')
  url.searchParams.set('newsCount', '0')
  url.searchParams.set('enableFuzzyQuery', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    next: { revalidate: 900 },
  })

  if (!response.ok) {
    throw new Error(`yahoo search failed (${response.status})`)
  }

  const payload = (await response.json()) as YahooSearchResponse
  const quotes = Array.isArray(payload.quotes) ? payload.quotes : []

  return quotes
    .filter((quote) => {
      const symbol = (quote.symbol || '').trim().toUpperCase()
      if (!symbol || !isTradableSymbol(symbol)) return false
      if (quote.quoteType && !SUPPORTED_TYPES.has(quote.quoteType)) return false
      return true
    })
    .map((quote, index) =>
      normalizeCandidate({
        symbol: (quote.symbol || '').trim().toUpperCase(),
        name: (quote.shortname || quote.longname || quote.symbol || '').trim(),
        exchange: (quote.exchDisp || quote.exchange || '').trim() || null,
        rank: index,
      })
    )
}

async function resolveBackendCandidate(candidate: SearchCandidate): Promise<{
  failed: boolean
  rank: number
  result: TickerSearchResult | null
}> {
  try {
    const payload = await fetchBackendJson<BackendSummarySearchPayload | null>(
      `/tickers/${encodeURIComponent(candidate.symbol)}/summary`,
      {
        context: `backend.tickers.summary.search.${candidate.symbol}`,
        timeoutMs: 3000,
      }
    )

    if (!payload || typeof payload !== 'object') {
      return { failed: false, rank: candidate.rank, result: null }
    }

    const backendTicker =
      (typeof payload.quote?.ticker === 'string' && payload.quote.ticker.trim().toUpperCase()) ||
      (typeof payload.ticker === 'string' && payload.ticker.trim().toUpperCase()) ||
      candidate.symbol
    const backendName =
      (typeof payload.quote?.name === 'string' && payload.quote.name.trim()) ||
      backendTicker ||
      candidate.name ||
      candidate.symbol

    return {
      failed: false,
      rank: candidate.rank,
      result: {
        symbol: backendTicker,
        name: backendName,
        exchange: candidate.exchange,
        hasSignals: false,
        convictionPct: null,
        tone: null,
        signalDate: null,
        scorecard: null,
      },
    }
  } catch (error) {
    if (error instanceof BackendDataError && (error.status === 404 || error.status === 422)) {
      return { failed: false, rank: candidate.rank, result: null }
    }

    return { failed: true, rank: candidate.rank, result: null }
  }
}

async function enrichWithSignals(results: TickerSearchResult[]): Promise<TickerSearchResult[]> {
  if (results.length === 0) return results

  try {
    const screener = await getScreenerSignalsSafe(
      {
        tickers: results.map((item) => item.symbol),
        limit: results.length,
      },
      { timeoutMs: 2500 }
    )
    const bySymbol = new Map(
      mapScreenerRowsToTickerSearchResults(screener.rows).map((item) => [item.symbol, item])
    )

    return results.map((result) => {
      const signal = bySymbol.get(result.symbol)
      if (!signal) return result
      return {
        ...result,
        hasSignals: true,
        convictionPct: signal.convictionPct,
        tone: signal.tone,
        signalDate: signal.signalDate,
      }
    })
  } catch {
    return results
  }
}

async function enrichWithScorecards(results: TickerSearchResult[]): Promise<TickerSearchResult[]> {
  if (results.length === 0) return results

  try {
    const scorecardsByTicker = await getTickerScorecards(results.map((item) => item.symbol))
    return results.map((result) => ({
      ...result,
      scorecard: scorecardsByTicker[result.symbol] ?? result.scorecard,
    }))
  } catch {
    return results
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = normalizeTickerSearchQuery(searchParams.get('q') || '')
  const symbolParam = searchParams.get('symbols') || ''
  const symbols = symbolParam
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => isTradableSymbol(symbol))
    .slice(0, 12)

  if (symbols.length > 0) {
    const scorecardsByTicker = await getTickerScorecards(symbols)
    return json({
      featured: [],
      fallbackUsed: false,
      query,
      results: symbols.map((symbol) => ({
        symbol,
        name: symbol,
        exchange: null,
        hasSignals: false,
        convictionPct: null,
        tone: null,
        signalDate: null,
        scorecard: scorecardsByTicker[symbol] ?? null,
      })),
      source: 'backend',
    })
  }

  if (!query) {
    try {
      const featured = await getScreenerSignalsSafe(
        {
          limit: 8,
          sortBy: 'conviction',
        },
        { timeoutMs: 3500 }
      )

      return json({
        featured: await enrichWithScorecards(mapScreenerRowsToTickerSearchResults(featured.rows).slice(0, 8)),
        fallbackUsed: false,
        query,
        results: [],
        source: 'backend',
      })
    } catch {
      return json({
        featured: getTemplateFeaturedTickerResults(8),
        fallbackUsed: true,
        query,
        results: [],
        source: 'fallback',
      })
    }
  }

  try {
    const candidates: SearchCandidate[] = []
    if (isTickerLikeQuery(query)) {
      candidates.push(
        normalizeCandidate({
          symbol: query,
          name: query.toUpperCase(),
          exchange: null,
          rank: -1,
        })
      )
    }

    let yahooFailed = false
    try {
      candidates.push(...(await searchYahooCandidates(query)))
    } catch {
      yahooFailed = true
    }

    const dedupedCandidates = dedupeTickerSearchResults(
      candidates.map((candidate) => ({
        symbol: candidate.symbol,
        name: candidate.name,
        exchange: candidate.exchange,
        hasSignals: false,
        convictionPct: null,
        tone: null,
        signalDate: null,
        scorecard: null,
      }))
    ).slice(0, 12)

    const candidateMeta = new Map<string, SearchCandidate>()
    for (const candidate of candidates) {
      if (!candidateMeta.has(candidate.symbol)) {
        candidateMeta.set(candidate.symbol, candidate)
      }
    }
    const resolved = await Promise.all(
      dedupedCandidates.map((candidate) =>
        resolveBackendCandidate(
          candidateMeta.get(candidate.symbol) ?? {
            symbol: candidate.symbol,
            name: candidate.name,
            exchange: candidate.exchange,
            rank: Number.MAX_SAFE_INTEGER,
          }
        )
      )
    )
    const hasInfraFailure = resolved.some((item) => item.failed)
    const matched = resolved.flatMap((item) =>
      item.result
        ? [
            {
              rank: item.rank,
              result: item.result,
            },
          ]
        : []
    )
    const enriched = await enrichWithScorecards(await enrichWithSignals(matched.map((item) => item.result)))
    const enrichedBySymbol = new Map(enriched.map((item) => [item.symbol, item]))
    const rankBySymbol = new Map(matched.map((item) => [item.result.symbol, item.rank]))
    const results = matched
      .map((item) => enrichedBySymbol.get(item.result.symbol) ?? item.result)
      .sort((a, b) => {
        const candidateA = rankBySymbol.get(a.symbol) ?? Number.MAX_SAFE_INTEGER
        const candidateB = rankBySymbol.get(b.symbol) ?? Number.MAX_SAFE_INTEGER
        const scoreDelta = rankSearchResult(b, query, candidateB) - rankSearchResult(a, query, candidateA)
        if (scoreDelta !== 0) return scoreDelta
        return candidateA - candidateB
      })
      .slice(0, 8)

    return json({
      featured: [],
      fallbackUsed: hasInfraFailure || yahooFailed,
      query,
      results,
      source: 'backend',
    })
  } catch {
    return json({
      featured: [],
      fallbackUsed: true,
      query,
      results: [],
      source: 'fallback',
    })
  }
}
