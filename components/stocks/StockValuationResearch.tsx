import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import type { InvestmentLensKey } from '@/lib/investment-lens'
import {
  currentResearchSnapshot,
  formatResearchDate,
  formatResearchMoney,
  formatResearchMultiple,
  type CurrentResearchSnapshot,
} from '@/lib/research-evidence'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './StockValuationResearch.module.css'

export type ValuationMetric = 'pe' | 'ps' | 'pb' | 'pfcf' | 'ev-ebitda'
export type ValuationPeriod = 'annual' | 'quarterly'

const METRICS: Array<{ key: ValuationMetric; label: string; available: boolean }> = [
  { key: 'pe', label: 'P/E', available: true },
  { key: 'ps', label: 'P/S', available: false },
  { key: 'pb', label: 'P/B', available: false },
  { key: 'pfcf', label: 'P/FCF', available: false },
  { key: 'ev-ebitda', label: 'EV/EBITDA', available: false },
]

function valuationHref(
  ticker: string,
  lens: InvestmentLensKey,
  metric: ValuationMetric,
  period: ValuationPeriod,
): string {
  const params = new URLSearchParams({ lens, metric, period })
  return `/stocks/${ticker}/valuation?${params.toString()}`
}

function SnapshotContext({ snapshot, metric }: { snapshot: CurrentResearchSnapshot; metric: ValuationMetric }) {
  const metricLabel = METRICS.find((item) => item.key === metric)?.label ?? 'Multiple'
  const currentValue = metric === 'pe' ? formatResearchMultiple(snapshot.trailingPe) : '—'
  const metricAvailable = metric === 'pe' && snapshot.trailingPe !== null

  return (
    <aside className={styles.contextColumn} aria-label="Current valuation context">
      <div>
        <div className={styles.contextHeader}>
          <h2>Current value</h2>
          <span>{metricAvailable ? 'Available' : 'Pending integration'}</span>
        </div>
        <div className={styles.currentValue}>
          <span>{metricLabel}</span>
          <strong>{currentValue}</strong>
          <small>{snapshot.reportingPeriod ? `Reported ${formatResearchDate(snapshot.reportingPeriod)}` : 'Reporting period unavailable'}</small>
        </div>
      </div>
      <dl className={styles.contextList}>
        <div><dt>Market cap</dt><dd>{formatResearchMoney(snapshot.marketCap, snapshot.currency)}</dd></div>
        <div><dt>Currency</dt><dd>{snapshot.currency}</dd></div>
        <div><dt>Historical range</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
        <div><dt>Peer / sector context</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
      </dl>
    </aside>
  )
}

export default function StockValuationResearch({
  data,
  lens,
  metric,
  period,
}: {
  data: StockResearchData
  lens: InvestmentLensKey
  metric: ValuationMetric
  period: ValuationPeriod
}) {
  const snapshot = currentResearchSnapshot(data)
  const metricLabel = METRICS.find((item) => item.key === metric)?.label ?? 'Multiple'
  const earnings = data.summary.nextEarnings

  return (
    <ResearchViewShell data={data} lens={lens} title="Valuation History">
      <div className={styles.page} data-lens={lens}>
        <nav className={styles.controls} aria-label="Valuation controls">
          <div className={styles.controlGroup} aria-label="Valuation metric">
            <span className={styles.controlLabel}>Metric</span>
            {METRICS.map((item) => (
              <Link
                key={item.key}
                href={valuationHref(data.ticker, lens, item.key, period)}
                aria-current={item.key === metric ? 'page' : undefined}
                data-pending={!item.available || undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.controlGroup} aria-label="Valuation frequency">
            <span className={styles.controlLabel}>Frequency</span>
            {(['annual', 'quarterly'] as const).map((item) => (
              <Link
                key={item}
                href={valuationHref(data.ticker, lens, metric, item)}
                aria-current={item === period ? 'page' : undefined}
              >
                {item === 'annual' ? 'Annual' : 'Quarterly'}
              </Link>
            ))}
          </div>
        </nav>

        <section className={styles.hero} aria-labelledby="valuation-history-chart">
          <div className={styles.chartColumn}>
            <div className={styles.chartHeader}>
              <h2 id="valuation-history-chart">Historical {metricLabel}</h2>
              <span>{period === 'annual' ? 'Annual series' : 'Quarterly series'}</span>
            </div>
            <div className={styles.chartFrame} role="img" aria-label={`${metricLabel} historical series pending integration`}>
              <div className={styles.chartPlaceholder}>
                <strong>Historical multiple series</strong>
                <span>Pending integration · no series rendered</span>
              </div>
              <div className={styles.chartFooter}>
                <span>Current value is shown in the context panel</span>
                <span>Range and position pending</span>
              </div>
            </div>
          </div>
          <SnapshotContext snapshot={snapshot} metric={metric} />
        </section>

        <section className={styles.secondaryGrid} aria-label="Valuation comparisons">
          <div className={styles.secondaryModule}>
            <div className={styles.sectionHeader}>
              <h2>Range context</h2>
              <span>Future data</span>
            </div>
            <dl className={styles.moduleRows}>
              <div><dt>Historical interval</dt><dd>Pending integration</dd></div>
              <div><dt>Median / average</dt><dd>Pending integration</dd></div>
              <div><dt>Current position</dt><dd>Pending integration</dd></div>
            </dl>
          </div>
          <div className={styles.secondaryModule}>
            <div className={styles.sectionHeader}>
              <h2>Peer and sector comparison</h2>
              <span>Future data</span>
            </div>
            <dl className={styles.moduleRows}>
              <div><dt>Comparable companies</dt><dd>Pending integration</dd></div>
              <div><dt>Sector reference</dt><dd>Pending integration</dd></div>
              <div><dt>Method</dt><dd>Pending integration</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.earningsStrip} aria-labelledby="valuation-earnings">
          <div>
            <h2 id="valuation-earnings">Earnings context</h2>
            <p>Events can anchor future valuation readings when the historical multiple series is available.</p>
          </div>
          <div className={styles.earningsValue}>
            {earnings?.earningsDate ? `Next earnings · ${formatResearchDate(earnings.earningsDate)}` : 'No earnings date available'}
          </div>
        </section>

        <section className={styles.methodology} aria-labelledby="valuation-methodology">
          <div>
            <h2 id="valuation-methodology">Methodology</h2>
            <p>Current values are separated from future historical comparisons.</p>
          </div>
          <div>
            <p>Historical ranges, peer definitions, sector references and as-of rules will be supplied by the canonical finance-backend contract.</p>
            <Link href={`/stocks/${data.ticker}/methodology?lens=${lens}`}>Open methodology →</Link>
          </div>
        </section>

        <ResearchAdPlacement />
      </div>
    </ResearchViewShell>
  )
}
