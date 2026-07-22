import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import { formatCompactMoney } from '@/lib/currency'
import type { InvestmentLensKey } from '@/lib/investment-lens'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

export type StatementKey = 'income' | 'balance-sheet' | 'cash-flow'
export type StatementPeriod = 'annual' | 'quarterly'

const STATEMENTS: Array<{ key: StatementKey; label: string; rows: string[] }> = [
  { key: 'income', label: 'Income Statement', rows: ['Revenue', 'Cost of revenue', 'Gross profit', 'Operating income', 'Net income', 'Earnings per share'] },
  { key: 'balance-sheet', label: 'Balance Sheet', rows: ['Cash and equivalents', 'Total assets', 'Total debt', 'Total liabilities', 'Shareholders’ equity', 'Shares outstanding'] },
  { key: 'cash-flow', label: 'Cash Flow', rows: ['Operating cash flow', 'Capital expenditure', 'Free cash flow', 'Financing cash flow', 'Investing cash flow', 'Cash change'] },
]

function statementHref({
  ticker,
  lens,
  statement,
  period,
}: {
  ticker: string
  lens: InvestmentLensKey
  statement: StatementKey
  period: StatementPeriod
}) {
  const params = new URLSearchParams({ lens, statement, period })
  return `/stocks/${ticker}/financials?${params.toString()}`
}

function formatPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const scaled = Math.abs(value) <= 1.5 ? value * 100 : value
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(scaled)}%`
}

export default function StockFinancialStatementsResearch({
  data,
  lens,
  statement,
  period,
}: {
  data: StockResearchData
  lens: InvestmentLensKey
  statement: StatementKey
  period: StatementPeriod
}) {
  const activeStatement = STATEMENTS.find((item) => item.key === statement) ?? STATEMENTS[0]
  const fundamentals = data.summary.fundamentalsSummary
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
    <ResearchViewShell data={data} lens={lens} title="Financial Statements">
      <div className={styles.statementToolbar}>
        <nav className={styles.statementTabs} aria-label="Financial statement">
          {STATEMENTS.map((item) => (
            <Link
              key={item.key}
              href={statementHref({ ticker: data.ticker, lens, statement: item.key, period })}
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
              href={statementHref({ ticker: data.ticker, lens, statement, period: item })}
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
          <div className={styles.trajectory} aria-label="Financial trajectory preview">
            <strong>Financial trajectory</strong>
            <span>Pending integration</span>
          </div>
          <aside className={styles.statementContext} aria-label="Statement context">
            <div className={styles.contextRow}><span>Coverage</span><strong>Pending integration</strong></div>
            <div className={styles.contextRow}><span>Currency</span><strong>{data.currency}</strong></div>
            <div className={styles.contextRow}><span>Unit</span><strong>As reported</strong></div>
            <div className={styles.contextRow}><span>Restatements</span><strong>Data pending</strong></div>
          </aside>
        </div>

        <div className={styles.statementTableWrap}>
          <table className={styles.statementTable}>
            <caption>{activeStatement.label} · {period === 'annual' ? 'annual' : 'quarterly'} structure preview</caption>
            <thead>
              <tr><th scope="col">Metric</th><th scope="col">Selected period</th><th scope="col">Comparison</th><th scope="col">Growth</th></tr>
            </thead>
            <tbody>
              {activeStatement.rows.map((row) => (
                <tr key={row}>
                  <th scope="row">{row}</th>
                  <td className={styles.pendingCell}>Data pending</td>
                  <td className={styles.pendingCell}>Pending</td>
                  <td className={styles.pendingCell}>Pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ResearchAdPlacement />
    </ResearchViewShell>
  )
}
