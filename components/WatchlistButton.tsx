'use client'

import { useState } from 'react'
import { buttonClass } from '@/components/ui/Button'

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
      setError('Sign in to save this ticker to your dashboard watchlist.')
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

  return (
    <div className="flex flex-col items-start md:items-end gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={buttonClass({ variant: 'secondary' })}
      >
        {pending
          ? 'Saving...'
          : inWatchlist
            ? 'In Watchlist'
            : 'Add to Watchlist'}
      </button>
      {error && <span className="text-[12px] text-red-600">{error}</span>}
    </div>
  )
}
