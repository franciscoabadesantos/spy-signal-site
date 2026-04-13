'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Input from '@/components/ui/Input'
import { buttonClass } from '@/components/ui/Button'
import { ensureTickerOnboarding } from '@/lib/ticker-onboarding'

type SearchSuggestion = {
  symbol: string
  name: string
  exchange: string | null
}

type PerformanceTickerAutocompleteProps = {
  initialTicker: string
}

export default function PerformanceTickerAutocomplete({
  initialTicker,
}: PerformanceTickerAutocompleteProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialTicker)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearch(initialTicker)
  }, [initialTicker])

  useEffect(() => {
    const query = search.trim()
    if (!query) {
      setSuggestions([])
      setIsOpen(false)
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
          setSuggestions([])
          setIsOpen(false)
          return
        }

        const payload = (await response.json()) as { results?: SearchSuggestion[] }
        const next = Array.isArray(payload.results) ? payload.results : []
        setSuggestions(next)
        setIsOpen(next.length > 0)
      } catch {
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setLoading(false)
        setHighlightedIndex(-1)
      }
    }, 180)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const navigate = (tickerRaw: string, exchange?: string | null) => {
    const ticker = tickerRaw.trim().toUpperCase()
    if (!ticker) return
    setSearch(ticker)
    setIsOpen(false)
    setHighlightedIndex(-1)
    void ensureTickerOnboarding(ticker, exchange)
    router.push(`/stocks/${encodeURIComponent(ticker)}/performance`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (!suggestions.length) return
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      if (!suggestions.length) return
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex]
        if (selected) navigate(selected.symbol, selected.exchange)
        return
      }
      navigate(search)
    }
  }

  return (
    <div className="relative max-w-[460px]">
      <label className="text-filter-label mb-2 block">Ticker</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
        <Input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 120)
          }}
          placeholder="Search ticker (AAPL, MSFT, SPY...)"
          className="h-11 pr-24 pl-9 uppercase"
        />
        <button
          type="button"
          onClick={() => navigate(search)}
          className={`${buttonClass({ variant: 'primary', size: 'sm' })} absolute right-1.5 top-1.5 h-8`}
        >
          Load
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-surface-card shadow-sm">
          <ul className="max-h-80 overflow-auto">
            {suggestions.map((item, index) => (
              <li key={`${item.symbol}-${item.name}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigate(item.symbol, item.exchange)}
                  className={`w-full border-b border-border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset last:border-b-0 ${
                    index === highlightedIndex
                      ? 'bg-surface-hover'
                      : 'hover:bg-surface-elevated active:bg-surface-hover'
                  }`}
                >
                  <div className="text-[13px] font-semibold text-content-primary">{item.symbol}</div>
                  <div className="text-[12px] text-content-muted truncate">
                    {item.name}
                    {item.exchange ? ` · ${item.exchange}` : ''}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && search.trim() && (
        <div className="absolute right-16 top-[34px] text-[11px] text-content-muted">Loading</div>
      )}
    </div>
  )
}
