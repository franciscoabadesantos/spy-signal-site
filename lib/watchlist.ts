import { createClient } from '@supabase/supabase-js'

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function getSupabaseWriteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type WatchlistSubscription = {
  userId: string
  ticker: string
}

export async function getUserWatchlistTickers(userId: string): Promise<string[]> {
  const client = getSupabaseWriteClient()
  if (!client) return []

  const { data, error } = await client
    .from('user_watchlists')
    .select('ticker')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Failed to read user watchlist:', error.message)
    return []
  }

  return (data ?? [])
    .map((row) => normalizeTicker((row as { ticker?: string }).ticker || ''))
    .filter((ticker) => ticker.length > 0)
}

export async function isTickerInWatchlist(userId: string, ticker: string): Promise<boolean> {
  const client = getSupabaseWriteClient()
  if (!client) return false

  const normalizedTicker = normalizeTicker(ticker)
  const { data, error } = await client
    .from('user_watchlists')
    .select('ticker')
    .eq('user_id', userId)
    .eq('ticker', normalizedTicker)
    .limit(1)

  if (error) return false
  return Boolean(data && data.length > 0)
}

export async function addTickerToWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseWriteClient()
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }
  }

  const normalizedTicker = normalizeTicker(ticker)
  if (!normalizedTicker) return { ok: false, error: 'Ticker is required.' }

  const { error } = await client
    .from('user_watchlists')
    .upsert({ user_id: userId, ticker: normalizedTicker }, { onConflict: 'user_id,ticker' })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function removeTickerFromWatchlist(userId: string, ticker: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseWriteClient()
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is missing.' }
  }

  const normalizedTicker = normalizeTicker(ticker)
  const { error } = await client
    .from('user_watchlists')
    .delete()
    .eq('user_id', userId)
    .eq('ticker', normalizedTicker)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getAllWatchlistTickers(): Promise<string[]> {
  const client = getSupabaseWriteClient()
  if (!client) return []

  const { data, error } = await client.from('user_watchlists').select('ticker')
  if (error) {
    console.warn('Failed to read watchlist tickers:', error.message)
    return []
  }

  return [...new Set(
    (data ?? [])
      .map((row) => normalizeTicker((row as { ticker?: string }).ticker || ''))
      .filter((ticker) => ticker.length > 0)
  )]
}

export async function getWatchlistSubscriptionsForTickers(
  tickers: string[]
): Promise<WatchlistSubscription[]> {
  const normalizedTickers = [...new Set(tickers.map((ticker) => normalizeTicker(ticker)))].filter(Boolean)
  if (normalizedTickers.length === 0) return []

  const client = getSupabaseWriteClient()
  if (!client) return []

  const { data, error } = await client
    .from('user_watchlists')
    .select('user_id,ticker')
    .in('ticker', normalizedTickers)

  if (error) {
    console.warn('Failed to read watchlist subscriptions:', error.message)
    return []
  }

  return (data ?? [])
    .map((row) => {
      const typed = row as { user_id?: string; ticker?: string }
      const userId = (typed.user_id || '').trim()
      const ticker = normalizeTicker(typed.ticker || '')
      if (!userId || !ticker) return null
      return { userId, ticker }
    })
    .filter((row): row is WatchlistSubscription => row !== null)
}
