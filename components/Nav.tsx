'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Activity } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth, UserButton } from '@clerk/nextjs'

type NavSection = 'stocks' | 'dashboard' | 'screener' | 'performance' | 'methodology'

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
    ? 'text-primary'
    : 'hover:text-primary transition-colors'
}

export default function Nav({ active }: NavProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
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
    <div className="border-b border-border bg-white sticky top-0 z-50">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 h-[60px] flex items-center justify-between gap-6">
        
        {/* Left Side: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[22px] tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <Activity className="w-6 h-6 text-primary" />
          <span>SpySignal</span>
        </Link>
        
        {/* Middle: Search Bar */}
        <div className="flex-1 max-w-[400px] relative hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
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
              className="w-full bg-white border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded py-1.5 pl-9 pr-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground shadow-sm"
            />
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50">
              <ul className="max-h-80 overflow-auto">
                {suggestions.map((item, index) => (
                  <li key={`${item.symbol}-${item.name}`}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigateToTicker(item.symbol)}
                      className={`w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 ${
                        index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-[13px] font-semibold text-gray-900">{item.symbol}</div>
                      <div className="text-[12px] text-gray-600 truncate">
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">Loading</div>
          )}
        </div>

        {/* Right Side: Links */}
        <div className="flex flex-1 justify-end items-center gap-6">
          <nav className="hidden lg:flex items-center gap-5 text-[15px] font-medium text-foreground/80">
             <Link href="/" className={navLinkClass(active === 'stocks')}>Stocks</Link>
             <Link href="/dashboard" className={navLinkClass(active === 'dashboard')}>Dashboard</Link>
             <Link href="/screener" className={navLinkClass(active === 'screener')}>Screener</Link>
             <Link href="/performance" className={navLinkClass(active === 'performance')}>Performance</Link>
             <Link href="/methodology" className={navLinkClass(active === 'methodology')}>Methodology</Link>
          </nav>
          
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <>
              <Link
                href="/sign-in"
                className="text-[14px] font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 hidden sm:block"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                className="text-[14px] font-medium bg-[#1e293b] hover:bg-black text-white px-4 py-1.5 rounded transition-colors shadow-sm"
              >
                Sign Up
              </Link>
              </>
            ) : (
              <>
              <Link
                href="/dashboard"
                className="text-[14px] font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 hidden sm:block"
              >
                Dashboard
              </Link>
              <UserButton />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
