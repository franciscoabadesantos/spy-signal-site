'use client'

import { ArrowUpRight, History, Loader2, Radar, Search, Sparkles } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { buttonClass } from '@/components/ui/Button'
import { ensureTickerOnboarding } from '@/lib/ticker-onboarding'
import {
  TEMPLATE_TICKER_SUGGESTIONS,
  dedupeTickerSearchResults,
  isTickerLikeQuery,
  normalizeTickerSearchQuery,
  type TickerSearchResponse,
  type TickerSearchResult,
} from '@/lib/ticker-search'
import { cn } from '@/lib/utils'

type TickerSearchComboboxProps = {
  className?: string
  initialValue?: string
  label?: string
  placeholder: string
  routeForTicker: (symbol: string) => string
  submitLabel?: string | null
  variant: 'header' | 'panel'
}

type DisplaySource = 'manual' | 'recent' | 'featured' | 'result'

type DisplayItem = TickerSearchResult & {
  displaySource: DisplaySource
}

type DisplaySection = {
  items: DisplayItem[]
  label: string
}

const RECENT_TICKERS_STORAGE_KEY = 'spy_recent_tickers_v1'

function sourceChipClass(item: DisplayItem): string {
  if (item.displaySource === 'manual') {
    return 'border-primary/28 bg-primary/10 text-accent-text'
  }
  if (item.tone === 'bullish') {
    return 'signal-bg-bullish signal-bullish border-[var(--bull-200)]'
  }
  if (item.tone === 'bearish') {
    return 'signal-bg-bearish signal-bearish border-[var(--bear-200)]'
  }
  if (item.tone === 'neutral') {
    return 'signal-bg-neutral signal-neutral border-[var(--neutral-200)]'
  }
  return 'border-border bg-surface-elevated text-content-muted'
}

function sourceLabel(item: DisplayItem): string | null {
  if (item.displaySource === 'manual') return 'Direct'
  if (item.convictionPct !== null) return `${item.convictionPct}%`
  if (item.displaySource === 'recent') return 'Recent'
  if (item.displaySource === 'featured') return 'Tracked'
  return 'Match'
}

function rightSubLabel(item: DisplayItem): string | null {
  if (item.convictionPct !== null && item.tone) return item.tone.toUpperCase()
  return item.exchange
}

function isExactMatch(search: string, results: TickerSearchResult[]): boolean {
  const normalized = search.trim().toUpperCase()
  return results.some((result) => result.symbol === normalized)
}

export default function TickerSearchCombobox({
  className,
  initialValue = '',
  label,
  placeholder,
  routeForTicker,
  submitLabel = null,
  variant,
}: TickerSearchComboboxProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialValue)
  const [defaultsResponse, setDefaultsResponse] = useState<TickerSearchResponse | null>(null)
  const [searchResponse, setSearchResponse] = useState<TickerSearchResponse | null>(null)
  const [recentTickers, setRecentTickers] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deferredQuery = useDeferredValue(normalizeTickerSearchQuery(search))

  useEffect(() => {
    setSearch(initialValue)
  }, [initialValue])

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
    if (!isFocused || deferredQuery.length > 0 || hasLoadedDefaults) return

    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch('/api/search', {
          signal: controller.signal,
        })
        if (!response.ok) return
        const payload = (await response.json()) as TickerSearchResponse
        setDefaultsResponse(payload)
      } catch {
        // Ignore and rely on local fallback suggestions.
      } finally {
        setHasLoadedDefaults(true)
      }
    })()

    return () => controller.abort()
  }, [deferredQuery.length, hasLoadedDefaults, isFocused])

  useEffect(() => {
    if (!deferredQuery) {
      setSearchResponse(null)
      setIsLoading(false)
      setHighlightedIndex(-1)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      setIsLoading(true)
      void (async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}`, {
            signal: controller.signal,
          })
          if (!response.ok) {
            setSearchResponse(null)
            return
          }

          const payload = (await response.json()) as TickerSearchResponse
          setSearchResponse(payload)
          if (isFocused) setIsOpen(true)
        } catch {
          setSearchResponse(null)
        } finally {
          setIsLoading(false)
          setHighlightedIndex(-1)
        }
      })()
    }, 160)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [deferredQuery, isFocused])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const knownSuggestions = useMemo(() => {
    return dedupeTickerSearchResults([
      ...(searchResponse?.results ?? []),
      ...(defaultsResponse?.featured ?? []),
      ...TEMPLATE_TICKER_SUGGESTIONS,
    ])
  }, [defaultsResponse?.featured, searchResponse?.results])

  const recentSuggestions = useMemo<DisplayItem[]>(() => {
    const bySymbol = new Map(knownSuggestions.map((item) => [item.symbol, item]))
    return recentTickers.map((symbol) => {
      const match = bySymbol.get(symbol)
      return {
        symbol,
        name: match?.name ?? 'Recent ticker',
        exchange: match?.exchange ?? null,
        convictionPct: match?.convictionPct ?? null,
        tone: match?.tone ?? null,
        signalDate: match?.signalDate ?? null,
        displaySource: 'recent',
      }
    })
  }, [knownSuggestions, recentTickers])

  const featuredSuggestions = useMemo<DisplayItem[]>(() => {
    const featured = defaultsResponse?.featured ?? TEMPLATE_TICKER_SUGGESTIONS
    const recentSet = new Set(recentTickers)
    return featured
      .filter((item) => !recentSet.has(item.symbol))
      .slice(0, 8)
      .map((item) => ({
        ...item,
        displaySource: 'featured' as const,
      }))
  }, [defaultsResponse?.featured, recentTickers])

  const resultSuggestions = useMemo<DisplayItem[]>(() => {
    return (searchResponse?.results ?? []).map((item) => ({
      ...item,
      displaySource: 'result' as const,
    }))
  }, [searchResponse?.results])

  const normalizedSearch = normalizeTickerSearchQuery(search)
  const canDirectOpen = isTickerLikeQuery(normalizedSearch)
  const showManualSuggestion =
    normalizedSearch.length > 0 &&
    canDirectOpen &&
    resultSuggestions.length === 0 &&
    !isExactMatch(normalizedSearch, searchResponse?.results ?? [])

  const manualSuggestion = useMemo<DisplayItem | null>(() => {
    if (!showManualSuggestion) return null

    return {
      symbol: normalizedSearch.toUpperCase(),
      name: 'Open this ticker directly and request onboarding if needed.',
      exchange: null,
      convictionPct: null,
      tone: null,
      signalDate: null,
      displaySource: 'manual',
    }
  }, [normalizedSearch, showManualSuggestion])

  const sections = useMemo<DisplaySection[]>(() => {
    if (normalizedSearch.length > 0) {
      const nextSections: DisplaySection[] = []

      if (manualSuggestion) {
        nextSections.push({
          label: '',
          items: [manualSuggestion],
        })
      }

      if (resultSuggestions.length > 0) {
        nextSections.push({
          label: '',
          items: resultSuggestions,
        })
      }

      return nextSections
    }

    const nextSections: DisplaySection[] = []
    if (recentSuggestions.length > 0) {
      nextSections.push({ label: '', items: recentSuggestions })
    }
    if (featuredSuggestions.length > 0) {
      nextSections.push({
        label: '',
        items: featuredSuggestions,
      })
    }
    return nextSections
  }, [
    featuredSuggestions,
    manualSuggestion,
    normalizedSearch.length,
    recentSuggestions,
    resultSuggestions,
  ])

  const selectableItems = useMemo(() => sections.flatMap((section) => section.items), [sections])
  const shouldShowDropdown =
    isOpen && (sections.length > 0 || isLoading || normalizedSearch.length > 0)

  function pushRecentTicker(ticker: string) {
    const symbol = ticker.trim().toUpperCase()
    if (!symbol) return

    setRecentTickers((prev) => {
      const next = [symbol, ...prev.filter((value) => value !== symbol)].slice(0, 6)
      try {
        window.localStorage.setItem(RECENT_TICKERS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage errors.
      }
      return next
    })
  }

  function navigateToTicker(tickerRaw: string, exchange?: string | null) {
    const symbol = tickerRaw.trim().toUpperCase()
    if (!symbol) return
    pushRecentTicker(symbol)
    setSearch(symbol)
    setIsOpen(false)
    setHighlightedIndex(-1)
    void ensureTickerOnboarding(symbol, exchange)
    router.push(routeForTicker(symbol))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (!selectableItems.length) return
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev + 1) % selectableItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      if (!selectableItems.length) return
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev <= 0 ? selectableItems.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
        const selected = selectableItems[highlightedIndex]
        if (selected) navigateToTicker(selected.symbol, selected.exchange)
        return
      }

      if (resultSuggestions.length > 0) {
        const firstResult = resultSuggestions[0]
        if (firstResult) navigateToTicker(firstResult.symbol, firstResult.exchange)
        return
      }

      if (normalizedSearch && canDirectOpen) navigateToTicker(normalizedSearch)
    }
  }

  function renderSuggestion(item: DisplayItem, index: number, withBorder: boolean) {
    const labelText = sourceLabel(item)
    const subLabelText = rightSubLabel(item)
    const Icon =
      item.displaySource === 'manual'
        ? ArrowUpRight
        : item.displaySource === 'recent'
          ? History
          : item.displaySource === 'featured'
            ? Sparkles
            : Radar

    return (
      <li key={`${item.displaySource}-${item.symbol}-${index}`}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => navigateToTicker(item.symbol, item.exchange)}
          className={cn(
            'state-interactive grid w-full cursor-pointer grid-cols-[1.1rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset',
            withBorder ? 'border-b border-border' : '',
            index === highlightedIndex ? 'bg-surface-hover' : 'hover:bg-surface-elevated'
          )}
        >
          <Icon className="h-4 w-4 text-content-muted" />
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <div className="text-data-sm numeric-tabular text-content-primary">{item.symbol}</div>
            <div className="truncate text-body-sm text-content-secondary">{item.name}</div>
          </div>
          <div className="shrink-0 text-right">
            {labelText ? (
              <span className={cn('rounded-full border px-1.5 py-0.5 text-micro', sourceChipClass(item))}>
                {labelText}
              </span>
            ) : null}
            {subLabelText ? <div className="mt-1 text-micro text-content-muted">{subLabelText}</div> : null}
          </div>
        </button>
      </li>
    )
  }

  const inputClassName =
    variant === 'header'
      ? 'no-lift-interaction h-12 rounded-full border-slate-950/8 bg-white/80 pl-11 pr-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_12px_28px_rgba(20,33,51,0.05)] backdrop-blur-xl placeholder:text-content-muted/80 hover:border-slate-950/14 hover:bg-white focus-visible:border-primary/55 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:hover:border-white/18 dark:hover:bg-white/[0.09]'
      : 'h-11 pr-24 pl-9 uppercase'

  const panelClassName =
    variant === 'header'
      ? 'mt-3 rounded-[26px] border border-slate-950/8 bg-white/96 shadow-[0_28px_90px_rgba(20,33,51,0.14)] ring-1 ring-slate-950/6 backdrop-blur-[32px] dark:border-white/10 dark:bg-[#0a1220]/90 dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)] dark:ring-white/8'
      : 'mt-1 rounded-xl border border-border bg-surface-card shadow-sm'

  return (
    <div className={cn('relative', className)}>
      {label ? <label className="text-filter-label mb-2 block">{label}</label> : null}

      <Search
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-content-muted',
          label ? 'top-[calc(50%+17px)]' : 'left-4'
        )}
      />

      <Input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          setIsFocused(true)
          setIsOpen(true)
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
            setIsFocused(false)
            setIsOpen(false)
          }, 120)
        }}
        placeholder={placeholder}
        className={inputClassName}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />

      {submitLabel ? (
        <button
          type="button"
          onClick={() => navigateToTicker(search)}
          className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'absolute right-1.5 top-1.5 h-8')}
        >
          {submitLabel}
        </button>
      ) : null}

      {isLoading ? (
        <div
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-muted',
            submitLabel ? 'right-16' : ''
          )}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : null}

      {shouldShowDropdown ? (
        <div className={cn('absolute left-0 right-0 top-full z-50 overflow-hidden', panelClassName)}>
          <div className="max-h-[28rem] overflow-auto py-1">
            {sections.map((section, sectionGroupIndex) => {
              let runningIndex = 0
              for (const previousSection of sections) {
                if (previousSection === section) break
                runningIndex += previousSection.items.length
              }

              return (
                <div
                  key={`section-${sectionGroupIndex}`}
                  className={sectionGroupIndex > 0 ? 'border-t border-border/70' : undefined}
                >
                  {section.label ? (
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted/90">
                      {section.label}
                    </div>
                  ) : null}
                  <ul>
                    {section.items.map((item, sectionIndex) =>
                      renderSuggestion(
                        item,
                        runningIndex + sectionIndex,
                        sectionIndex < section.items.length - 1
                      )
                    )}
                  </ul>
                </div>
              )
            })}

            {!isLoading && normalizedSearch.length > 0 && resultSuggestions.length === 0 ? (
              <div className="border-t border-border/70 px-4 py-4">
                <div className="text-body-sm text-content-primary">No exact match found.</div>
                {canDirectOpen ? (
                  <div className="mt-1 text-caption text-content-muted">
                    Press Enter to open {normalizedSearch.toUpperCase()} directly.
                  </div>
                ) : (
                  <div className="mt-1 text-caption text-content-muted">
                    Try the ticker symbol instead of the company name.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
