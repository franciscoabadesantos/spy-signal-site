import { NextResponse } from 'next/server'
import { getScreenerSignalsSafe } from '@/lib/signals'
import {
  filterTemplateTickerResults,
  getTemplateFeaturedTickerResults,
  mapScreenerRowsToTickerSearchResults,
  normalizeTickerSearchQuery,
  type TickerSearchResponse,
} from '@/lib/ticker-search'

export const dynamic = 'force-dynamic'

function json(payload: TickerSearchResponse) {
  return NextResponse.json(payload)
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
    const results = await getScreenerSignalsSafe(
      {
        limit: 8,
        sortBy: 'conviction',
        textQuery: query,
      },
      { timeoutMs: 3500 }
    )

    return json({
      featured: [],
      fallbackUsed: false,
      query,
      results: mapScreenerRowsToTickerSearchResults(results.rows).slice(0, 8),
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
