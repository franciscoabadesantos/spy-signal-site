'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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

  const navigate = (tickerRaw: string) => {
    const ticker = tickerRaw.trim().toUpperCase()
    if (!ticker) return
    setSearch(ticker)
    setIsOpen(false)
    setHighlightedIndex(-1)
    router.push(`/performance?ticker=${encodeURIComponent(ticker)}`)
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
        if (selected) navigate(selected.symbol)
        return
      }
      navigate(search)
    }
  }

  return (
    <div className="relative max-w-[460px]">
      <label className="block text-[12px] text-muted-foreground mb-1">Ticker</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
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
          className="h-10 w-full pl-9 pr-20 rounded-md border border-border bg-background text-[14px] uppercase outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <button
          type="button"
          onClick={() => navigate(search)}
          className="absolute right-1.5 top-1.5 h-7 px-3 rounded bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90"
        >
          Load
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden z-20">
          <ul className="max-h-80 overflow-auto">
            {suggestions.map((item, index) => (
              <li key={`${item.symbol}-${item.name}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigate(item.symbol)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/80 last:border-b-0 ${
                    index === highlightedIndex ? 'bg-muted/70' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="text-[13px] font-semibold text-foreground">{item.symbol}</div>
                  <div className="text-[12px] text-muted-foreground truncate">
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
        <div className="absolute right-16 top-[29px] text-[11px] text-muted-foreground">Loading</div>
      )}
    </div>
  )
}
