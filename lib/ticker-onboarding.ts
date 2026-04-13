type Region = 'us' | 'eu' | 'apac'

type RequestPayload = {
  ticker: string
  region: Region
  exchange?: string
}

const APAC_EXCHANGE_HINTS = ['ASX', 'HKG', 'HKEX', 'TSE', 'TYO', 'NSE', 'BSE', 'SGX', 'KOSPI', 'SET']
const EU_EXCHANGE_HINTS = ['LSE', 'FWB', 'XETRA', 'EPA', 'AMS', 'BME', 'SIX', 'BIT', 'MIL', 'SWX']

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

function inferRegionFromTickerAndExchange(ticker: string, exchange?: string | null): Region {
  const symbol = normalizeTicker(ticker)
  const market = (exchange || '').trim().toUpperCase()

  if (symbol.endsWith('.AX') || symbol.endsWith('.HK') || symbol.endsWith('.T') || symbol.endsWith('.KS')) {
    return 'apac'
  }
  if (symbol.endsWith('.L') || symbol.endsWith('.PA') || symbol.endsWith('.DE') || symbol.endsWith('.AS')) {
    return 'eu'
  }

  if (APAC_EXCHANGE_HINTS.some((hint) => market.includes(hint))) return 'apac'
  if (EU_EXCHANGE_HINTS.some((hint) => market.includes(hint))) return 'eu'
  return 'us'
}

function buildPayload(ticker: string, exchange?: string | null): RequestPayload {
  const symbol = normalizeTicker(ticker)
  const cleanedExchange = (exchange || '').trim() || undefined
  return {
    ticker: symbol,
    region: inferRegionFromTickerAndExchange(symbol, cleanedExchange),
    exchange: cleanedExchange,
  }
}

export async function requestTickerOnboarding(ticker: string, exchange?: string | null): Promise<void> {
  const payload = buildPayload(ticker, exchange)
  const response = await fetch('/api/tickers/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Ticker request failed (${response.status})`)
  }
}

export async function fetchTickerOnboardingStatus(
  ticker: string,
  exchange?: string | null
): Promise<{ status?: string | null }> {
  const payload = buildPayload(ticker, exchange)
  const query = new URLSearchParams({
    ticker: payload.ticker,
    region: payload.region,
  })
  if (payload.exchange) query.set('exchange', payload.exchange)
  const response = await fetch(`/api/tickers/status?${query.toString()}`)
  if (!response.ok) {
    throw new Error(`Ticker status failed (${response.status})`)
  }
  return (await response.json()) as { status?: string | null }
}

export async function ensureTickerOnboarding(ticker: string, exchange?: string | null): Promise<void> {
  const symbol = normalizeTicker(ticker)
  if (!symbol) return
  try {
    await requestTickerOnboarding(symbol, exchange)
    await fetchTickerOnboardingStatus(symbol, exchange)
  } catch (error) {
    console.warn(`Ticker onboarding failed for ${symbol}:`, error)
  }
}
