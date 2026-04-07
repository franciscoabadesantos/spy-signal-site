import { NextResponse } from 'next/server'

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

type SearchResult = {
  symbol: string
  name: string
  exchange: string | null
}

const SUPPORTED_TYPES = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'])

function isTradableSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q) {
    return NextResponse.json({ results: [] as SearchResult[] })
  }

  const url = new URL('https://query2.finance.yahoo.com/v1/finance/search')
  url.searchParams.set('q', q)
  url.searchParams.set('quotesCount', '8')
  url.searchParams.set('newsCount', '0')
  url.searchParams.set('enableFuzzyQuery', 'false')

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      return NextResponse.json({ results: [] as SearchResult[] })
    }

    const payload = (await response.json()) as YahooSearchResponse
    const quotes = Array.isArray(payload.quotes) ? payload.quotes : []

    const results: SearchResult[] = quotes
      .filter((quote) => {
        const symbol = (quote.symbol || '').trim().toUpperCase()
        if (!symbol || !isTradableSymbol(symbol)) return false
        if (quote.quoteType && !SUPPORTED_TYPES.has(quote.quoteType)) return false
        return true
      })
      .map((quote) => {
        const symbol = (quote.symbol || '').trim().toUpperCase()
        const name = (quote.shortname || quote.longname || symbol).trim()
        const exchange = (quote.exchDisp || quote.exchange || '').trim() || null
        return {
          symbol,
          name,
          exchange,
        }
      })
      .slice(0, 8)

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] as SearchResult[] })
  }
}
