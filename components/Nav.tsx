'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Activity } from 'lucide-react'
import { useState } from 'react'

type NavSection = 'stocks' | 'screener' | 'performance' | 'methodology'

interface NavProps {
  active?: NavSection
}

function navLinkClass(isActive: boolean): string {
  return isActive
    ? 'text-primary'
    : 'hover:text-primary transition-colors'
}

export default function Nav({ active }: NavProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/stocks/${search.trim().toUpperCase()}`)
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
              placeholder="Search ticker..."
              className="w-full bg-white border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded py-1.5 pl-9 pr-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground shadow-sm"
            />
          </div>
        </div>

        {/* Right Side: Links */}
        <div className="flex flex-1 justify-end items-center gap-6">
          <nav className="hidden lg:flex items-center gap-5 text-[15px] font-medium text-foreground/80">
             <Link href="/" className={navLinkClass(active === 'stocks')}>Stocks</Link>
             <Link href="/screener" className={navLinkClass(active === 'screener')}>Screener</Link>
             <Link href="/performance" className={navLinkClass(active === 'performance')}>Performance</Link>
             <Link href="/methodology" className={navLinkClass(active === 'methodology')}>Methodology</Link>
          </nav>
          
          <div className="flex items-center gap-2">
            <button className="text-[14px] font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 hidden sm:block">
              Log In
            </button>
            <button className="text-[14px] font-medium bg-[#1e293b] hover:bg-black text-white px-4 py-1.5 rounded transition-colors shadow-sm">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
