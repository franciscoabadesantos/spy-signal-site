'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'

type WatchlistButtonProps = {
  ticker: string
  initialInWatchlist: boolean
  signedIn: boolean
  variant?: 'button' | 'icon'
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
  variant = 'button',
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

  if (variant === 'icon') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <IconButton
          aria-label={inWatchlist ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
          title={inWatchlist ? 'In watchlist' : 'Add to watchlist'}
          onClick={onClick}
          disabled={pending}
          active={inWatchlist}
        >
          <Star className="size-4" fill={inWatchlist ? 'currentColor' : 'none'} aria-hidden="true" />
        </IconButton>
        {error && <span className="text-[12px] text-signal-bearish">{error}</span>}
      </div>
    )
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
      {error && <span className="text-[12px] text-signal-bearish">{error}</span>}
    </div>
  )
}
