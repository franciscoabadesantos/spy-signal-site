'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Input from '@/components/ui/Input'
import { ensureTickerOnboarding } from '@/lib/ticker-onboarding'
import { cn } from '@/lib/utils'

type SearchSuggestion = {
  symbol: string
  name: string
  exchange: string | null
}

type SuggestionSource = 'search' | 'recent' | 'suggested' | 'discovery'
type SignalTone = 'bullish' | 'neutral' | 'bearish'

type NavSuggestion = SearchSuggestion & {
  source: SuggestionSource
  convictionPct?: number
  tone?: SignalTone
}

const RECENT_TICKERS_STORAGE_KEY = 'spy_recent_tickers_v1'

const TOP_TICKER_SUGGESTIONS: SearchSuggestion[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSEARCA' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
]

const TOP_CONVICTION_DISCOVERY: Array<SearchSuggestion & { convictionPct: number; tone: SignalTone }> = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', convictionPct: 79, tone: 'bullish' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', convictionPct: 76, tone: 'bullish' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', convictionPct: 74, tone: 'bullish' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', convictionPct: 62, tone: 'neutral' },
]

function sourceLabel(source: SuggestionSource): string | null {
  if (source === 'search') return 'Result'
  if (source === 'recent') return 'Recent'
  if (source === 'suggested') return 'Top'
  if (source === 'discovery') return 'Signal'
  return null
}

function sourceChipClass(source: SuggestionSource, tone?: SignalTone): string {
  if (source === 'discovery' && tone === 'bullish') {
    return 'signal-bg-bullish signal-bullish border-[var(--bull-200)]'
  }
  if (source === 'discovery' && tone === 'bearish') {
    return 'signal-bg-bearish signal-bearish border-[var(--bear-200)]'
  }
  if (source === 'discovery' && tone === 'neutral') {
    return 'signal-bg-neutral signal-neutral border-[var(--neutral-200)]'
  }
  if (source === 'search') {
    return 'border-primary/30 bg-primary/10 text-accent-text'
  }
  return 'border-border bg-surface-elevated text-content-muted'
}

export default function HeaderSearch({
  className,
  placeholder = 'Search ticker, model context, or signal...',
}: {
  className?: string
  placeholder?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [apiSuggestions, setApiSuggestions] = useState<NavSuggestion[]>([])
  const [recentTickers, setRecentTickers] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recentSuggestions = useMemo<NavSuggestion[]>(() => {
    return recentTickers.slice(0, 6).map((symbol) => {
      const topMatch = TOP_TICKER_SUGGESTIONS.find((item) => item.symbol === symbol)
      return {
        symbol,
        name: topMatch?.name ?? 'Recent search',
        exchange: topMatch?.exchange ?? null,
        source: 'recent',
      }
    })
  }, [recentTickers])

  const suggestedSuggestions = useMemo<NavSuggestion[]>(() => {
    const recentSet = new Set(recentTickers)
    return TOP_TICKER_SUGGESTIONS.filter((item) => !recentSet.has(item.symbol)).map((item) => ({
      ...item,
      source: 'suggested',
    }))
  }, [recentTickers])

  const discoverySuggestions = useMemo<NavSuggestion[]>(() => {
    const recentSet = new Set(recentTickers)
    return TOP_CONVICTION_DISCOVERY.filter((item) => !recentSet.has(item.symbol)).map((item) => ({
      ...item,
      source: 'discovery',
    }))
  }, [recentTickers])

  const query = search.trim()
  const displaySuggestions =
    query.length > 0 ? apiSuggestions : [...recentSuggestions, ...suggestedSuggestions, ...discoverySuggestions]
  const shouldShowDropdown = isOpen && displaySuggestions.length > 0

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_TICKERS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return
      const next = parsed
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^[A-Z][A-Z0-9.\-]{0,9}$/.test(value))
        .slice(0, 6)
      setRecentTickers(next)
    } catch {
      setRecentTickers([])
    }
  }, [])

  useEffect(() => {
    if (!query) {
      setApiSuggestions([])
      setLoading(false)
      setHighlightedIndex(-1)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          setApiSuggestions([])
          if (isFocused) setIsOpen(false)
          return
        }
        const payload = (await response.json()) as { results?: SearchSuggestion[] }
        const nextSuggestions = (Array.isArray(payload.results) ? payload.results : []).map((item) => ({
          ...item,
          source: 'search' as const,
        }))
        setApiSuggestions(nextSuggestions)
        if (isFocused) setIsOpen(nextSuggestions.length > 0)
      } catch {
        setApiSuggestions([])
        if (isFocused) setIsOpen(false)
      } finally {
        setLoading(false)
        setHighlightedIndex(-1)
      }
    }, 180)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, isFocused])

  useEffect(() => {
    if (!isFocused || query.length > 0) return
    setIsOpen(displaySuggestions.length > 0)
  }, [displaySuggestions.length, isFocused, query.length])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const pushRecentTicker = (ticker: string) => {
    const symbol = ticker.trim().toUpperCase()
    if (!symbol) return
    setRecentTickers((prev) => {
      const next = [symbol, ...prev.filter((value) => value !== symbol)].slice(0, 6)
      try {
        window.localStorage.setItem(RECENT_TICKERS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage errors in private mode.
      }
      return next
    })
  }

  const navigateToTicker = (ticker: string, exchange?: string | null) => {
    const symbol = ticker.trim().toUpperCase()
    if (!symbol) return
    pushRecentTicker(symbol)
    setSearch(symbol)
    setIsOpen(false)
    setHighlightedIndex(-1)
    void ensureTickerOnboarding(symbol, exchange)
    router.push(`/stocks/${symbol}`)
  }

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!displaySuggestions.length) return
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev + 1) % displaySuggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      if (!displaySuggestions.length) return
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev <= 0 ? displaySuggestions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < displaySuggestions.length) {
        const selected = displaySuggestions[highlightedIndex]
        if (selected) navigateToTicker(selected.symbol, selected.exchange)
        return
      }
      if (search.trim()) navigateToTicker(search)
    }
  }

  const renderSuggestion = (item: NavSuggestion, index: number, showBottomBorder: boolean) => {
    const label =
      item.source === 'discovery' && item.convictionPct
        ? `${item.convictionPct}%`
        : sourceLabel(item.source)
    const rightSubLabel =
      item.source === 'discovery'
        ? item.tone
          ? item.tone.toUpperCase()
          : null
        : item.exchange
    return (
      <li key={`${item.symbol}-${item.name}-${item.source}-${index}`}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => navigateToTicker(item.symbol, item.exchange)}
          className={`state-interactive w-full px-5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset ${showBottomBorder ? 'border-b border-border' : ''} ${
            index === highlightedIndex ? 'bg-surface-hover' : 'hover:bg-surface-elevated'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-data-sm numeric-tabular text-content-primary">{item.symbol}</div>
              <div className="truncate text-body-sm text-content-secondary">{item.name}</div>
            </div>
            {label ? (
              <div className="shrink-0 text-right">
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-micro ${sourceChipClass(item.source, item.tone)}`}
                >
                  {label}
                </span>
                {rightSubLabel ? <div className="mt-1 text-micro text-content-muted">{rightSubLabel}</div> : null}
              </div>
            ) : rightSubLabel ? (
              <div className="shrink-0 text-right text-micro text-content-muted">{rightSubLabel}</div>
            ) : null}
          </div>
        </button>
      </li>
    )
  }

  const renderSectionTitle = (label: string, className?: string) => (
    <div
      className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted/90 ${className ?? ''}`}
    >
      {label}
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-content-muted" />
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearch}
        onFocus={() => {
          setIsFocused(true)
          setIsOpen(displaySuggestions.length > 0)
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
            setIsFocused(false)
            setIsOpen(false)
          }, 120)
        }}
        placeholder={placeholder}
        className="no-lift-interaction h-12 rounded-full border-slate-950/8 bg-white/80 pl-11 pr-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_12px_28px_rgba(20,33,51,0.05)] backdrop-blur-xl placeholder:text-content-muted/80 hover:border-slate-950/14 hover:bg-white focus-visible:border-primary/55 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:hover:border-white/18 dark:hover:bg-white/[0.09]"
      />

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[26px] border border-slate-950/8 bg-white/96 shadow-[0_28px_90px_rgba(20,33,51,0.14)] ring-1 ring-slate-950/6 backdrop-blur-[32px] dark:border-white/10 dark:bg-[#0a1220]/90 dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)] dark:ring-white/8">
          {query.length === 0 ? (
            <div className="max-h-[30rem] overflow-auto py-1">
              {recentSuggestions.length > 0 ? (
                <>
                  {renderSectionTitle('Recent')}
                  <ul>
                    {recentSuggestions.map((item, index) =>
                      renderSuggestion(item, index, index < recentSuggestions.length - 1)
                    )}
                  </ul>
                </>
              ) : null}

              {suggestedSuggestions.length > 0 ? (
                <>
                  {renderSectionTitle('Suggested', 'border-b border-t border-border')}
                  <ul>
                    {suggestedSuggestions.map((item, sectionIndex) => {
                      const absoluteIndex = recentSuggestions.length + sectionIndex
                      return renderSuggestion(item, absoluteIndex, sectionIndex < suggestedSuggestions.length - 1)
                    })}
                  </ul>
                </>
              ) : null}

              {discoverySuggestions.length > 0 ? (
                <>
                  {renderSectionTitle('Top Conviction', 'border-b border-t border-border')}
                  <ul>
                    {discoverySuggestions.map((item, sectionIndex) => {
                      const absoluteIndex = recentSuggestions.length + suggestedSuggestions.length + sectionIndex
                      return renderSuggestion(item, absoluteIndex, sectionIndex < discoverySuggestions.length - 1)
                    })}
                  </ul>
                </>
              ) : null}
            </div>
          ) : (
            <div className="max-h-[26rem] overflow-auto py-1">
              {renderSectionTitle('Results')}
              <ul>
                {displaySuggestions.map((item, index) =>
                  renderSuggestion(item, index, index < displaySuggestions.length - 1)
                )}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {loading && query.length > 0 ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-micro text-content-muted">Loading</div>
      ) : null}
    </div>
  )
}
