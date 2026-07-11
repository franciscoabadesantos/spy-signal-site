'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type WatchlistButtonProps = {
  ticker: string
  initialInWatchlist: boolean
  signedIn: boolean
}

async function callWatchlistApi(method: 'POST' | 'DELETE', ticker: string) {
  const response = await fetch('/api/watchlist', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker }),
  })

  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    throw new Error(payload?.error || 'Watchlist request failed.')
  }
}

export default function WatchlistButton({
  ticker,
  initialInWatchlist,
  signedIn,
}: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClick = async () => {
    if (!signedIn) {
      setError('Sign in to save this ticker to your watchlist.')
      return
    }

    setPending(true)
    setError(null)
    const nextState = !inWatchlist

    try {
      await callWatchlistApi(nextState ? 'POST' : 'DELETE', ticker)
      setInWatchlist(nextState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update watchlist.')
    } finally {
      setPending(false)
    }
  }

  const label = inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'

  return (
    <div className="flex flex-col items-start md:items-end gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={label}
        title={label}
        aria-pressed={inWatchlist}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-secondary)] shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-[30px] saturate-[1.8] transition-[border-color,color,transform] duration-150 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-90 disabled:opacity-60"
      >
        <Star
          size={16}
          className={inWatchlist ? 'fill-amber-400 text-amber-400' : undefined}
        />
      </button>
      {error && <span className="text-[12px] text-red-600">{error}</span>}
    </div>
  )
}
