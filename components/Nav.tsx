'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Activity } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Input from '@/components/ui/Input'
import { buttonClass } from '@/components/ui/Button'

export type NavSection = 'stocks' | 'dashboard' | 'screener' | 'performance' | 'methodology'

interface NavProps {
  active?: NavSection
}

type SearchSuggestion = {
  symbol: string
  name: string
  exchange: string | null
}

function navLinkClass(isActive: boolean): string {
  return isActive
    ? 'text-neutral-900 dark:text-neutral-100'
    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
}

const NavAuthControls = dynamic(() => import('./NavAuthControls'), {
  ssr: false,
  loading: () => (
    <>
      <Link href="/sign-in" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
        Log In
      </Link>
      <Link href="/sign-up" className={buttonClass({ variant: 'primary', size: 'sm' })}>
        Sign Up
      </Link>
    </>
  ),
})

export default function Nav({ active }: NavProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        const nextSuggestions = Array.isArray(payload.results) ? payload.results : []
        setSuggestions(nextSuggestions)
        setIsOpen(nextSuggestions.length > 0)
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

  const navigateToTicker = (ticker: string) => {
    const symbol = ticker.trim().toUpperCase()
    if (!symbol) return
    setSearch(symbol)
    setIsOpen(false)
    setHighlightedIndex(-1)
    router.push(`/stocks/${symbol}`)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!suggestions.length) return
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      if (!suggestions.length) return
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex]
        if (selected) navigateToTicker(selected.symbol)
        return
      }
      if (search.trim()) navigateToTicker(search)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="container-lg flex h-[64px] items-center justify-between gap-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-80 dark:text-neutral-100"
        >
          <Activity className="h-6 w-6 text-primary" />
          <span>SpySignal</span>
        </Link>

        <div className="relative hidden max-w-[420px] flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 120)
            }}
            placeholder="Search ticker..."
            className="h-10 pl-9"
          />

          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <ul className="max-h-80 overflow-auto">
                {suggestions.map((item, index) => (
                  <li key={`${item.symbol}-${item.name}`}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigateToTicker(item.symbol)}
                      className={`w-full border-b border-neutral-200 px-3 py-2.5 text-left last:border-b-0 dark:border-neutral-800 ${
                        index === highlightedIndex
                          ? 'bg-neutral-100 dark:bg-neutral-800'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{item.symbol}</div>
                      <div className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">Loading</div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-5">
          <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
            <Link href="/" className={navLinkClass(active === 'stocks')}>Stocks</Link>
            <Link href="/dashboard" className={navLinkClass(active === 'dashboard')}>Dashboard</Link>
            <Link href="/screener" className={navLinkClass(active === 'screener')}>Screener</Link>
            <Link href="/performance" className={navLinkClass(active === 'performance')}>Performance</Link>
            <Link href="/methodology" className={navLinkClass(active === 'methodology')}>Methodology</Link>
          </nav>

          <div className="flex items-center gap-2">
            <NavAuthControls />
          </div>
        </div>
      </div>
    </header>
  )
}
