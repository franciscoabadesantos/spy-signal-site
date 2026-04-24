function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || process.env.NEXT_PUBLIC_FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

function backendHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  }
  const secret = (
    process.env.BACKEND_SHARED_SECRET ||
    process.env.FINANCE_BACKEND_SHARED_SECRET ||
    ''
  ).trim()
  if (secret) headers['x-backend-shared-secret'] = secret
  return headers
}

async function backendJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = backendBaseUrl()
  if (!base) return null
  const response = await fetch(`${base}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...backendHeaders(),
      ...(init?.headers ?? {}),
    },
  }).catch(() => null)
  if (!response || !response.ok) return null
  return (await response.json().catch(() => null)) as T | null
}

export type WatchlistSubscription = {
  userId: string
  ticker: string
}

export async function getUserWatchlistTickers(userId: string): Promise<string[]> {
  const payload = await backendJson<{ tickers?: string[] }>(`/site/watchlist?user_id=${encodeURIComponent(userId)}`)
  return Array.isArray(payload?.tickers)
    ? payload!.tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean)
    : []
}

export async function isTickerInWatchlist(userId: string, ticker: string): Promise<boolean> {
  const tickers = await getUserWatchlistTickers(userId)
  return tickers.includes(normalizeTicker(ticker))
}

export async function addTickerToWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const payload = await backendJson<{ ok?: boolean; error?: string }>('/site/watchlist', {
    method: 'POST',
    body: JSON.stringify({ userId, ticker: normalizeTicker(ticker) }),
  })
  if (!payload?.ok) return { ok: false, error: payload?.error || 'Failed to add ticker.' }
  return { ok: true }
}

export async function removeTickerFromWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const payload = await backendJson<{ ok?: boolean; error?: string }>('/site/watchlist', {
    method: 'DELETE',
    body: JSON.stringify({ userId, ticker: normalizeTicker(ticker) }),
  })
  if (!payload?.ok) return { ok: false, error: payload?.error || 'Failed to remove ticker.' }
  return { ok: true }
}

export async function getAllWatchlistTickers(): Promise<string[]> {
  const payload = await backendJson<{ tickers?: string[] }>('/site/watchlist/all-tickers')
  return Array.isArray(payload?.tickers)
    ? [...new Set(payload!.tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean))]
    : []
}

export async function getWatchlistSubscriptionsForTickers(
  tickers: string[]
): Promise<WatchlistSubscription[]> {
  const normalized = [...new Set(tickers.map((ticker) => normalizeTicker(ticker)))].filter(Boolean)
  if (normalized.length === 0) return []
  const payload = await backendJson<{ subscriptions?: Array<{ userId?: string; ticker?: string }> }>(
    `/site/watchlist/subscriptions?tickers=${encodeURIComponent(normalized.join(','))}`
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
