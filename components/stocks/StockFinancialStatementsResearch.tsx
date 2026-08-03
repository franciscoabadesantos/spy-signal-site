import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import { formatCompactMoney } from '@/lib/currency'
import type { FinancialStatementLineItem, FinancialStatementsPayload } from '@/lib/canonical-research'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

export type StatementKey = 'income' | 'balance-sheet' | 'cash-flow'
export type StatementPeriod = 'annual' | 'quarterly'

const STATEMENTS: Array<{ key: StatementKey; label: string }> = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance-sheet', label: 'Balance Sheet' },
  { key: 'cash-flow', label: 'Cash Flow' },
]

function statementHref({
  ticker,
  statement,
  period,
}: {
  ticker: string
  statement: StatementKey
  period: StatementPeriod
}) {
  const params = new URLSearchParams({ statement, period })
  return `/stocks/${ticker}/financials?${params.toString()}`
}

function formatPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const scaled = Math.abs(value) <= 1.5 ? value * 100 : value
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(scaled)}%`
}

function formatPeriod(row: FinancialStatementLineItem): string {
  if (row.periodType === 'quarterly' && row.fiscalQuarter) {
    return `${row.fiscalYear ?? ''} ${row.fiscalQuarter}`.trim()
  }
  return row.fiscalYear ? `FY ${row.fiscalYear}` : row.periodEnd
}

function formatStatementValue(row: FinancialStatementLineItem | undefined, fallbackCurrency: string): string {
  if (!row || row.value === null || !Number.isFinite(row.value)) return '—'
  const id = row.lineItemId.toLowerCase()
  if (id.includes('per_share') || id.includes('eps')) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(row.value)
  }
  if (id.includes('shares')) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(row.value)
  }
  return formatCompactMoney(row.value, row.currency || fallbackCurrency)
}

export default function StockFinancialStatementsResearch({
  data,
  statement,
  period,
  statements,
}: {
  data: StockResearchData
  statement: StatementKey
  period: StatementPeriod
  statements: FinancialStatementsPayload | null
}) {
  const activeStatement = STATEMENTS.find((item) => item.key === statement) ?? STATEMENTS[0]
  const fundamentals = data.summary.fundamentalsSummary
  const canonicalRows = statements?.available ? statements.rows : []
  const periodRows = new Map<string, FinancialStatementLineItem>()
  for (const row of canonicalRows) {
    const key = `${row.lineItemId}:${row.periodEnd}`
    if (!periodRows.has(key)) periodRows.set(key, row)
  }
  const periods = [...new Map(canonicalRows.map((row) => [row.periodEnd, row])).values()].slice(0, 5)
  const lineItems = [...new Map(canonicalRows.map((row) => [row.lineItemId, row])).values()]
  const latestKnownAt = canonicalRows.reduce<string | null>(
    (latest, row) => !latest || row.knownAt > latest ? row.knownAt : latest,
    null,
  )
  const currencies = [...new Set(canonicalRows.map((row) => row.currency).filter(Boolean))]
  const snapshot = [
    fundamentals?.latestRevenue !== null && fundamentals?.latestRevenue !== undefined
      ? { label: 'Revenue', value: formatCompactMoney(fundamentals.latestRevenue, data.currency) }
      : null,
    fundamentals?.latestEps !== null && fundamentals?.latestEps !== undefined
      ? { label: 'EPS', value: fundamentals.latestEps.toFixed(2) }
      : null,
    fundamentals ? { label: 'Revenue growth', value: formatPercent(fundamentals.revenueGrowthYoy) } : null,
    fundamentals ? { label: 'Earnings growth', value: formatPercent(fundamentals.earningsGrowthYoy) } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item?.value))

  return (
    <ResearchViewShell data={data} title="Financial Statements">
      <div className={styles.statementToolbar}>
        <nav className={styles.statementTabs} aria-label="Financial statement">
          {STATEMENTS.map((item) => (
            <Link
              key={item.key}
              href={statementHref({ ticker: data.ticker, statement: item.key, period })}
              aria-current={item.key === statement ? 'page' : undefined}
              scroll={false}
            >
              {item.label.replace(' Statement', '')}
            </Link>
          ))}
        </nav>
        <nav className={styles.periodTabs} aria-label="Reporting frequency">
          {(['annual', 'quarterly'] as const).map((item) => (
            <Link
              key={item}
              href={statementHref({ ticker: data.ticker, statement, period: item })}
              aria-current={item === period ? 'page' : undefined}
              scroll={false}
            >
              {item === 'annual' ? 'Annual' : 'Quarterly'}
            </Link>
          ))}
        </nav>
      </div>

      {snapshot.length > 0 ? (
        <section aria-labelledby="latest-snapshot">
          <div className={styles.sectionHeading}>
            <h2 id="latest-snapshot">Latest available snapshot</h2>
            <p>{fundamentals?.periodEnd || 'Reporting period unavailable'} · not a complete statement series</p>
          </div>
          <div className={styles.snapshotStrip}>
            {snapshot.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="statement-detail">
        <div className={styles.sectionHeading}>
          <h2 id="statement-detail">{activeStatement.label}</h2>
          <p>{period === 'annual' ? 'Annual' : 'Quarterly'} periods</p>
        </div>
        <div className={styles.statementCanvas}>
          <div className={styles.trajectory} aria-label="Canonical statement coverage">
            <strong>{lineItems.length > 0 ? `${lineItems.length} canonical line items` : 'No canonical statement rows'}</strong>
            <span>{periods.length > 0 ? `${periods.length} latest reported periods · latest known ${latestKnownAt ?? 'unknown'}` : statements?.reason ?? 'Statement read model unavailable'}</span>
          </div>
          <aside className={styles.statementContext} aria-label="Statement context">
            <div className={styles.contextRow}><span>Coverage</span><strong>{statements?.available ? `${statements.count} observations` : 'Unavailable'}</strong></div>
            <div className={styles.contextRow}><span>Currency</span><strong>{currencies.join(', ') || data.currency}</strong></div>
            <div className={styles.contextRow}><span>Unit</span><strong>As reported</strong></div>
            <div className={styles.contextRow}><span>Known at</span><strong>{latestKnownAt ?? '—'}</strong></div>
          </aside>
        </div>

        <div className={styles.statementTableWrap}>
          <table className={styles.statementTable}>
            <caption>{activeStatement.label} · {period === 'annual' ? 'annual' : 'quarterly'} canonical observations</caption>
            <thead>
              <tr>
                <th scope="col">Line item</th>
                {periods.map((row) => <th scope="col" key={row.periodEnd}>{formatPeriod(row)}<small>{row.periodEnd}</small></th>)}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((lineItem) => (
                <tr key={lineItem.lineItemId}>
                  <th scope="row">{lineItem.displayLabel}<small>{lineItem.lineItemId}</small></th>
                  {periods.map((periodRow) => (
                    <td key={periodRow.periodEnd}>{formatStatementValue(periodRows.get(`${lineItem.lineItemId}:${periodRow.periodEnd}`), data.currency)}</td>
                  ))}
                </tr>
              ))}
              {lineItems.length === 0 ? <tr><td className={styles.pendingCell} colSpan={Math.max(2, periods.length + 1)}>{statements?.reason ?? 'Canonical statement data unavailable'}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <ResearchAdPlacement />
    </ResearchViewShell>
  )
}
