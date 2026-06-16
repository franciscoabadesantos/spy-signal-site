import { NextResponse } from 'next/server'
import { BackendDataError, fetchBackendJson } from '@/lib/backend'
import { getScreenerSignalsSafe } from '@/lib/signals'
import {
  filterTemplateTickerResults,
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
  symbol: string
}

type BackendSummarySearchPayload = {
  quote?: {
    name?: string | null
    ticker?: string | null
  } | null
  ticker?: string | null
}

const SUPPORTED_TYPES = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'])

function json(payload: TickerSearchResponse) {
  return NextResponse.json(payload)
}

function isTradableSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)
}

function normalizeCandidate(candidate: SearchCandidate): SearchCandidate {
  return {
    ...candidate,
    symbol: candidate.symbol.trim().toUpperCase(),
  }
}

async function searchYahooCandidates(query: string): Promise<SearchCandidate[]> {
  const url = new URL('https://query2.finance.yahoo.com/v1/finance/search')
  url.searchParams.set('q', query)
  url.searchParams.set('quotesCount', '12')
  url.searchParams.set('newsCount', '0')
  url.searchParams.set('enableFuzzyQuery', 'false')

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
    .map((quote) =>
      normalizeCandidate({
        symbol: (quote.symbol || '').trim().toUpperCase(),
        name: (quote.shortname || quote.longname || quote.symbol || '').trim(),
        exchange: (quote.exchDisp || quote.exchange || '').trim() || null,
      })
    )
}

async function resolveBackendCandidate(candidate: SearchCandidate): Promise<{
  failed: boolean
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
      return { failed: false, result: null }
    }

    const backendName =
      (typeof payload.quote?.name === 'string' && payload.quote.name.trim()) ||
      (typeof payload.quote?.ticker === 'string' && payload.quote.ticker.trim()) ||
      (typeof payload.ticker === 'string' && payload.ticker.trim()) ||
      candidate.name ||
      candidate.symbol

    return {
      failed: false,
      result: {
        symbol: candidate.symbol,
        name: backendName,
        exchange: candidate.exchange,
        convictionPct: null,
        tone: null,
        signalDate: null,
      },
    }
  } catch (error) {
    if (error instanceof BackendDataError && (error.status === 404 || error.status === 422)) {
      return { failed: false, result: null }
    }

    return { failed: true, result: null }
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
        convictionPct: signal.convictionPct,
        tone: signal.tone,
        signalDate: signal.signalDate,
      }
    })
  } catch {
    return results
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = normalizeTickerSearchQuery(searchParams.get('q') || '')

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
        featured: mapScreenerRowsToTickerSearchResults(featured.rows).slice(0, 8),
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
        source: 'template',
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
        convictionPct: null,
        tone: null,
        signalDate: null,
      }))
    )
      .slice(0, 10)
      .map((candidate) => ({
        symbol: candidate.symbol,
        name: candidate.name,
        exchange: candidate.exchange,
      }))

    const resolved = await Promise.all(dedupedCandidates.map((candidate) => resolveBackendCandidate(candidate)))
    const hasInfraFailure = resolved.some((item) => item.failed)
    const matched = resolved
      .flatMap((item) => (item.result ? [item.result] : []))
      .slice(0, 8)
    if (matched.length === 0 && (hasInfraFailure || yahooFailed)) {
      throw new Error('search discovery failed')
    }
    const results = await enrichWithSignals(matched)

    return json({
      featured: [],
      fallbackUsed: false,
      query,
      results,
      source: 'backend',
    })
  } catch {
    return json({
      featured: [],
      fallbackUsed: true,
      query,
      results: filterTemplateTickerResults(query, 8),
      source: 'template',
    })
  }
}
