'use client'

import { ArrowUpRight, History, Loader2, Radar, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import OrbitMini from '@/components/stocks/OrbitMini'
import Input from '@/components/ui/Input'
import { buttonClass } from '@/components/ui/Button'
import { buildMiniOrbitDimensions } from '@/lib/signalOrbit'
import { ensureTickerOnboarding } from '@/lib/ticker-onboarding'
import {
  filterTickerIndexItems,
  getFeaturedTickerIndexResults,
  getTemplateFeaturedTickerResults,
  isTickerLikeQuery,
  normalizeTickerSearchQuery,
  type CachedTickerIndex,
  type TickerIndexItem,
  type TickerIndexPayload,
  type TickerSearchResult,
  type TickerSearchResponse,
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
const TICKER_INDEX_STORAGE_KEY = 'spy_ticker_index_v1'

let memoryTickerIndex: CachedTickerIndex | null = null
let memoryTickerIndexPromise: Promise<CachedTickerIndex | null> | null = null

function normalizeTickerIndexItem(value: unknown): TickerIndexItem | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const symbol =
    typeof row.symbol === 'string' && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(row.symbol.trim().toUpperCase())
      ? row.symbol.trim().toUpperCase()
      : null
  if (!symbol) return null

  const name =
    typeof row.name === 'string' && row.name.trim()
      ? row.name.trim()
      : symbol

  const exchange =
    typeof row.exchange === 'string' && row.exchange.trim()
      ? row.exchange.trim()
      : null

  return {
    symbol,
    name,
    exchange,
    hasSignals: row.hasSignals === true,
  }
}

function normalizeTickerIndexPayload(payload: unknown, etag: string | null): CachedTickerIndex | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => normalizeTickerIndexItem(item))
        .filter((item): item is TickerIndexItem => item !== null)
    : []

  return {
    etag,
    version: typeof record.version === 'string' && record.version.trim() ? record.version.trim() : null,
    generatedAt:
      typeof record.generatedAt === 'string' && record.generatedAt.trim() ? record.generatedAt.trim() : null,
    items,
  }
}

function readSessionTickerIndex(): CachedTickerIndex | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(TICKER_INDEX_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const normalized = normalizeTickerIndexPayload(parsed, typeof parsed.etag === 'string' ? parsed.etag : null)
    return normalized
  } catch {
    return null
  }
}

function writeSessionTickerIndex(value: CachedTickerIndex): void {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(TICKER_INDEX_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore session storage errors.
  }
}

async function fetchTickerIndex(
  existing: CachedTickerIndex | null,
  signal: AbortSignal
): Promise<CachedTickerIndex | null> {
  const response = await fetch('/api/tickers/index', {
    signal,
    cache: 'no-store',
    headers: existing?.etag ? { 'If-None-Match': existing.etag } : undefined,
  })

  if (response.status === 304) {
    return existing
  }
  if (!response.ok) {
    throw new Error(`ticker index request failed (${response.status})`)
  }

  const payload = (await response.json()) as TickerIndexPayload
  return normalizeTickerIndexPayload(payload, response.headers.get('etag'))
}

async function loadTickerIndex(signal: AbortSignal): Promise<CachedTickerIndex | null> {
  if (memoryTickerIndexPromise) return memoryTickerIndexPromise

  const existing = memoryTickerIndex ?? readSessionTickerIndex()
  if (!memoryTickerIndex && existing) {
    memoryTickerIndex = existing
  }

  memoryTickerIndexPromise = fetchTickerIndex(existing, signal)
    .then((next) => {
      if (next) {
        memoryTickerIndex = next
        writeSessionTickerIndex(next)
        return next
      }
      return existing
    })
    .finally(() => {
      memoryTickerIndexPromise = null
    })

  return memoryTickerIndexPromise
}

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
  if (item.hasSignals) {
    return 'border-primary/28 bg-primary/10 text-accent-text'
  }
  return 'border-border bg-surface-elevated text-content-muted'
}

function sourceLabel(item: DisplayItem): string | null {
  if (item.displaySource === 'manual') return 'Direct'
  if (item.convictionPct !== null) return `${item.convictionPct}%`
  if (item.displaySource === 'recent') return 'Recent'
  if (item.displaySource === 'featured' || item.hasSignals) return 'Tracked'
  return null
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
  const [tickerIndex, setTickerIndex] = useState<CachedTickerIndex | null>(memoryTickerIndex)
  const [recentTickers, setRecentTickers] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedIndexOnce, setHasLoadedIndexOnce] = useState(Boolean(memoryTickerIndex?.items.length))
  const [loadAttemptToken, setLoadAttemptToken] = useState(0)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [remoteSuggestions, setRemoteSuggestions] = useState<DisplayItem[]>([])
  const [isRemoteSearching, setIsRemoteSearching] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const normalizedSearch = normalizeTickerSearchQuery(search)

  useEffect(() => {
    setSearch(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (memoryTickerIndex) {
      setTickerIndex(memoryTickerIndex)
      return
    }

    const cached = readSessionTickerIndex()
    if (cached) {
      memoryTickerIndex = cached
      setTickerIndex(cached)
      if (cached.items.length > 0) {
        setHasLoadedIndexOnce(true)
      }
    }
  }, [])

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
    if (loadAttemptToken === 0) return

    const controller = new AbortController()
    const cached = memoryTickerIndex ?? readSessionTickerIndex()
    if (cached) {
      memoryTickerIndex = cached
      setTickerIndex(cached)
    }

    setIsLoading(true)

    void (async () => {
      try {
        const next = await loadTickerIndex(controller.signal)
        if (next) {
          setTickerIndex(next)
          setHasLoadedIndexOnce(next.items.length > 0)
          return
        }

        setHasLoadedIndexOnce(Boolean(cached?.items.length))
      } catch {
        if (!cached) setTickerIndex(null)
        setHasLoadedIndexOnce(Boolean(cached?.items.length))
      } finally {
        setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [loadAttemptToken])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [normalizedSearch])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const featuredBase = useMemo(() => {
    if (tickerIndex) return getFeaturedTickerIndexResults(tickerIndex.items, 8)
    return getTemplateFeaturedTickerResults(8)
  }, [tickerIndex])

  const resultSuggestions = useMemo<DisplayItem[]>(() => {
    if (!tickerIndex || !normalizedSearch) return []
    return filterTickerIndexItems(tickerIndex.items, normalizedSearch, 8).map((item) => ({
      ...item,
      displaySource: 'result' as const,
    }))
  }, [normalizedSearch, tickerIndex])

  useEffect(() => {
    const query = normalizedSearch
    // Só recorremos à pesquisa remota quando o índice local não tem matches.
    if (query.length === 0 || resultSuggestions.length > 0) {
      setRemoteSuggestions([])
      setIsRemoteSearching(false)
      return
    }

    const controller = new AbortController()
    setIsRemoteSearching(true)
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
            cache: 'no-store',
          })
          if (!response.ok) throw new Error(`search failed (${response.status})`)
          const payload = (await response.json()) as TickerSearchResponse
          const items: DisplayItem[] = (payload.results ?? []).map((result) => ({
            ...result,
            displaySource: 'result' as const,
          }))
          setRemoteSuggestions(items)
        } catch {
          setRemoteSuggestions([])
        } finally {
          setIsRemoteSearching(false)
        }
      })()
    }, 220)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [normalizedSearch, resultSuggestions.length])

  const knownSuggestions = useMemo(() => {
    const items = new Map<string, TickerSearchResult>()

    for (const item of resultSuggestions) {
      items.set(item.symbol, item)
    }
    for (const item of featuredBase) {
      if (!items.has(item.symbol)) {
        items.set(item.symbol, item)
      }
    }

    return [...items.values()]
  }, [featuredBase, resultSuggestions])

  const recentSuggestions = useMemo<DisplayItem[]>(() => {
    const bySymbol = new Map(knownSuggestions.map((item) => [item.symbol, item]))
    return recentTickers.map((symbol) => {
      const match = bySymbol.get(symbol)
      return {
        symbol,
        name: match?.name ?? 'Recent ticker',
        exchange: match?.exchange ?? null,
        hasSignals: match?.hasSignals ?? false,
        convictionPct: match?.convictionPct ?? null,
        tone: match?.tone ?? null,
        signalDate: match?.signalDate ?? null,
        displaySource: 'recent',
      }
    })
  }, [knownSuggestions, recentTickers])

  const featuredSuggestions = useMemo<DisplayItem[]>(() => {
    const recentSet = new Set(recentTickers)
    return featuredBase
      .filter((item) => !recentSet.has(item.symbol))
      .slice(0, 8)
      .map((item) => ({
        ...item,
        displaySource: 'featured' as const,
      }))
  }, [featuredBase, recentTickers])

  const canDirectOpen = isTickerLikeQuery(normalizedSearch)
  const showManualSuggestion =
    normalizedSearch.length > 0 &&
    canDirectOpen &&
    resultSuggestions.length === 0 &&
    !isExactMatch(normalizedSearch, resultSuggestions)

  const manualSuggestion = useMemo<DisplayItem | null>(() => {
    if (!showManualSuggestion) return null

    return {
      symbol: normalizedSearch.toUpperCase(),
      name: 'Open this ticker directly and request onboarding if needed.',
      exchange: null,
      hasSignals: false,
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
      } else if (remoteSuggestions.length > 0) {
        nextSections.push({
          label: '',
          items: remoteSuggestions,
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
    remoteSuggestions,
    resultSuggestions,
  ])

  const selectableItems = useMemo(() => sections.flatMap((section) => section.items), [sections])
  const shouldShowDropdown =
    isOpen && (sections.length > 0 || isLoading || isRemoteSearching || normalizedSearch.length > 0)

  function queueTickerIndexLoad() {
    const cached = memoryTickerIndex ?? tickerIndex ?? readSessionTickerIndex()
    if (cached && cached !== tickerIndex) {
      memoryTickerIndex = cached
      setTickerIndex(cached)
      if (cached.items.length > 0) {
        setHasLoadedIndexOnce(true)
      }
    }

    const hasUsableIndex = Boolean(cached?.items.length)

    if (hasUsableIndex && hasLoadedIndexOnce) return
    if (isLoading) return

    setLoadAttemptToken((value) => value + 1)
  }

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

  function handleSearchChange(nextValue: string) {
    setSearch(nextValue)
    setIsOpen(true)

    if (nextValue.trim().length > 0) {
      queueTickerIndexLoad()
    }
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

  function submitSearch() {
    const firstResult = resultSuggestions[0] ?? remoteSuggestions[0]
    if (firstResult) {
      navigateToTicker(firstResult.symbol, firstResult.exchange)
      return
    }

    if (normalizedSearch && canDirectOpen) {
      navigateToTicker(normalizedSearch)
    }
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

      submitSearch()
    }
  }

  function renderSuggestion(item: DisplayItem, index: number, withBorder: boolean) {
    const labelText = sourceLabel(item)
    const subLabelText = rightSubLabel(item)
    return (
      <li key={`${item.displaySource}-${item.symbol}-${index}`}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => navigateToTicker(item.symbol, item.exchange)}
          className={cn(
            'state-interactive grid w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset',
            withBorder ? 'border-b border-border' : '',
            index === highlightedIndex ? 'bg-surface-hover' : 'hover:bg-surface-elevated'
          )}
        >
          <div className="flex items-center justify-center">
            <OrbitMini
              size={40}
              dimensions={buildMiniOrbitDimensions({
                direction: item.tone,
                conviction: item.convictionPct,
                changePercent: null,
                horizon: null,
              })}
            />
          </div>
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <div className="text-data-sm numeric-tabular text-content-primary">{item.symbol}</div>
            <div className="truncate text-body-sm text-content-secondary">
              {item.name}
              {item.displaySource === 'manual' ? (
                <span className="ml-2 inline-flex items-center gap-1 text-content-muted">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Direct
                </span>
              ) : item.displaySource === 'recent' ? (
                <span className="ml-2 inline-flex items-center gap-1 text-content-muted">
                  <History className="h-3.5 w-3.5" />
                  Recent
                </span>
              ) : item.displaySource === 'featured' ? (
                <span className="ml-2 inline-flex items-center gap-1 text-content-muted">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tracked
                </span>
              ) : item.hasSignals ? (
                <span className="ml-2 inline-flex items-center gap-1 text-content-muted">
                  <Radar className="h-3.5 w-3.5" />
                  Signal
                </span>
              ) : null}
            </div>
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
        onChange={(event) => handleSearchChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          setIsOpen(true)
          queueTickerIndexLoad()
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
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
          onClick={submitSearch}
          className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'absolute right-1.5 top-1.5 h-8')}
        >
          {submitLabel}
        </button>
      ) : null}

      {isLoading || isRemoteSearching ? (
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

            {!isLoading && !isRemoteSearching && normalizedSearch.length > 0 &&
            resultSuggestions.length === 0 && remoteSuggestions.length === 0 ? (
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
