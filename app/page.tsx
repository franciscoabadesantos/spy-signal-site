import Nav from '@/components/Nav'
import { getStockQuote } from '@/lib/finance'
import { getScreenerSignals } from '@/lib/signals'
import { ArrowRight, BarChart3, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
const MARKET_PULSE_SYMBOLS = ['SPY', 'QQQ', 'DIA'] as const
const MARKET_PULSE_LABELS: Record<(typeof MARKET_PULSE_SYMBOLS)[number], string> = {
  SPY: 'S&P 500',
  QQQ: 'Nasdaq 100',
  DIA: 'Dow Jones',
}

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function formatSignalDate(value: string | null): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function directionBadge(direction: 'bullish' | 'neutral' | 'bearish') {
  if (direction === 'bullish') {
    return {
      icon: <TrendingUp className="w-4 h-4 text-green-600" />,
      label: 'BULLISH',
      className: 'text-green-700 font-bold bg-green-50 border border-green-200/60',
    }
  }

  if (direction === 'bearish') {
    return {
      icon: <TrendingDown className="w-4 h-4 text-red-600" />,
      label: 'BEARISH',
      className: 'text-red-700 font-bold bg-red-50 border border-red-200/60',
    }
  }

  return {
    icon: <Minus className="w-4 h-4 text-gray-500" />,
    label: 'NEUTRAL',
    className: 'text-gray-700 font-bold bg-gray-100 border border-gray-200',
  }
}

export default async function Home() {
  const [tableSignals, pulseSignals, pulseQuotes] = await Promise.all([
    getScreenerSignals({
      sortBy: 'latest',
      limit: 40,
    }),
    getScreenerSignals({
      tickers: [...MARKET_PULSE_SYMBOLS],
      sortBy: 'ticker',
      limit: 30,
    }),
    Promise.all(MARKET_PULSE_SYMBOLS.map((ticker) => getStockQuote(ticker))),
  ])
  const visibleRows = tableSignals.rows.slice(0, 12)
  const isSpyOnlySource = tableSignals.source === 'spy_signals_live'
  const pulseSignalByTicker = new Map(pulseSignals.rows.map((row) => [row.ticker, row]))
  const pulseCards = MARKET_PULSE_SYMBOLS.map((ticker, index) => {
    const quote = pulseQuotes[index]
    const signal = pulseSignalByTicker.get(ticker)
    return {
      ticker,
      label: MARKET_PULSE_LABELS[ticker],
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      direction: signal?.direction ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav active="stocks" />

      <div className="bg-[#f4f7fb] border-b border-gray-200">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-gray-600">
              Market Pulse
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
              {pulseCards.map((card) => {
                const direction = card.direction ?? 'neutral'
                const badge = directionBadge(direction)
                return (
                  <Link
                    key={card.ticker}
                    href={`/stocks/${card.ticker}`}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">{card.ticker}</div>
                        <div className="text-[11px] text-gray-500">{card.label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold text-gray-900">
                          {card.price === null ? '—' : `$${card.price.toFixed(2)}`}
                        </div>
                        <div
                          className={`text-[11px] ${
                            card.changePercent === null
                              ? 'text-gray-500'
                              : card.changePercent >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                          }`}
                        >
                          {formatPct(card.changePercent)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Systems Overview</h1>
          <p className="text-gray-600 text-[15px]">Monitor live quantitative models across actively covered assets.</p>
          {isSpyOnlySource && (
            <p className="text-[12px] text-amber-700 mt-2">
              Current source is SPY-only. Populate <code>latest_signals_view</code> for full cross-ticker coverage.
            </p>
          )}
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Live Tracked Assets
            </h2>
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Updated Daily
            </span>
          </div>

          {visibleRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500">
              No signal rows available yet. Seed <code>market_signals</code> and refresh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3.5 border-b border-gray-200">Asset</th>
                    <th className="px-6 py-3.5 border-b border-gray-200">System State</th>
                    <th className="px-6 py-3.5 border-b border-gray-200">Conviction</th>
                    <th className="px-6 py-3.5 border-b border-gray-200">Last Signal</th>
                    <th className="px-6 py-3.5 border-b border-gray-200 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.map((row) => {
                    const badge = directionBadge(row.direction)
                    return (
                      <tr key={`${row.ticker}-${row.signalDate ?? ''}`} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/stocks/${row.ticker}`} className="flex items-center gap-3 w-max">
                            <div className="font-bold text-primary hover:underline tabular-nums">{row.ticker}</div>
                            <div className="text-gray-500 font-medium text-[13px] hidden sm:block">
                              {row.name ?? 'Tracked Asset'}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {badge.icon}
                            <span className={`px-2 py-0.5 rounded text-[13px] ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{formatConviction(row.conviction)}</td>
                        <td className="px-6 py-4 font-medium text-gray-700">{formatSignalDate(row.signalDate)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/stocks/${row.ticker}`}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary/80"
                          >
                            View Dashboard <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
