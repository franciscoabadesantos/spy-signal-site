import Link from 'next/link'
import SignalBlock from '@/components/ui/SignalBlock'
import {
  TableBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from '@/components/ui/DataTable'
import type { WatchlistWorkspaceRow } from '@/lib/watchlist-workspace'

function formatConviction(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(0)}%`
}

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type WatchlistTableProps = {
  rows: WatchlistWorkspaceRow[]
}

export default function WatchlistTable({ rows }: WatchlistTableProps) {
  return (
    <TableShell>
      <TableBase className="whitespace-nowrap">
        <TableHead sticky>
          <tr>
            <TableHeaderCell sortable sortDirection="asc">Ticker</TableHeaderCell>
            <TableHeaderCell>Current Price</TableHeaderCell>
            <TableHeaderCell>Live Signal</TableHeaderCell>
            <TableHeaderCell>Conviction</TableHeaderCell>
            <TableHeaderCell>Last Changed</TableHeaderCell>
            <TableHeaderCell>% Chg</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.map(({ ticker, row, direction, lastFlippedDate }, index) => (
            <TableRow key={ticker} index={index}>
              <TableCell className="text-label-lg">
                <Link href={`/stocks/${ticker}`} className="text-accent-text hover:underline">
                  {ticker}
                </Link>
                {row?.name ? (
                  <div className="text-caption max-w-[220px] truncate text-content-muted">
                    {row.name}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-data-sm numeric-tabular">{formatPrice(row?.price ?? null)}</TableCell>
              <TableCell>
                {direction ? (
                  <SignalBlock
                    direction={direction}
                    conviction={row?.conviction ?? null}
                    compact
                    showLabel={false}
                  />
                ) : (
                  <span className="text-caption text-content-muted">Unavailable</span>
                )}
              </TableCell>
              <TableCell muted className="numeric-tabular">{formatConviction(row?.conviction ?? null)}</TableCell>
              <TableCell muted className="numeric-tabular">{formatDate(lastFlippedDate)}</TableCell>
              <TableCell
                className={
                  (row?.changePercent ?? null) === null
                    ? 'text-content-muted'
                    : (row?.changePercent ?? 0) >= 0
                      ? 'signal-bullish'
                      : 'signal-bearish'
                }
              >
                {formatPct(row?.changePercent ?? null)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableBase>
    </TableShell>
  )
}
