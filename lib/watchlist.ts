import { fetchBackendJson } from './backend'

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export type WatchlistSubscription = {
  userId: string
  ticker: string
}

export async function getUserWatchlistTickers(userId: string): Promise<string[]> {
  const payload = await fetchBackendJson<{ tickers?: string[] }>(
    `/site/watchlist?user_id=${encodeURIComponent(userId)}`,
    { context: 'backend.site.watchlist.read' }
  )
  return Array.isArray(payload?.tickers)
    ? payload!.tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean)
    : []
}

export async function isTickerInWatchlist(userId: string, ticker: string): Promise<boolean> {
  const tickers = await getUserWatchlistTickers(userId)
  return tickers.includes(normalizeTicker(ticker))
}

export async function addTickerToWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const payload = await fetchBackendJson<{ ok?: boolean; error?: string }>('/site/watchlist', {
    context: 'backend.site.watchlist.add',
    init: {
      method: 'POST',
      body: JSON.stringify({ userId, ticker: normalizeTicker(ticker) }),
    },
  })
  if (!payload?.ok) return { ok: false, error: payload?.error || 'Failed to add ticker.' }
  return { ok: true }
}

export async function removeTickerFromWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const payload = await fetchBackendJson<{ ok?: boolean; error?: string }>('/site/watchlist', {
    context: 'backend.site.watchlist.remove',
    init: {
      method: 'DELETE',
      body: JSON.stringify({ userId, ticker: normalizeTicker(ticker) }),
    },
  })
  if (!payload?.ok) return { ok: false, error: payload?.error || 'Failed to remove ticker.' }
  return { ok: true }
}

export async function getAllWatchlistTickers(): Promise<string[]> {
  const payload = await fetchBackendJson<{ tickers?: string[] }>('/site/watchlist/all-tickers', {
    context: 'backend.site.watchlist.all_tickers',
  })
  return Array.isArray(payload?.tickers)
    ? [...new Set(payload!.tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean))]
    : []
}

export async function getWatchlistSubscriptionsForTickers(
  tickers: string[]
): Promise<WatchlistSubscription[]> {
  const normalized = [...new Set(tickers.map((ticker) => normalizeTicker(ticker)))].filter(Boolean)
  if (normalized.length === 0) return []
  const payload = await fetchBackendJson<{ subscriptions?: Array<{ userId?: string; ticker?: string }> }>(
    `/site/watchlist/subscriptions?tickers=${encodeURIComponent(normalized.join(','))}`,
    { context: 'backend.site.watchlist.subscriptions' }
  )
  return (payload?.subscriptions ?? [])
    .map((row) => {
      const userId = (row.userId || '').trim()
      const ticker = normalizeTicker(row.ticker || '')
      if (!userId || !ticker) return null
      return { userId, ticker }
    })
    .filter((row): row is WatchlistSubscription => row !== null)
}
