import Link from 'next/link'
import TemporalLineChart from '@/components/charts/TemporalLineChart'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import type { MarketMetricObservation, MarketMetricsPayload } from '@/lib/canonical-research'
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

const METRICS: Array<{ key: ValuationMetric; label: string }> = [
  { key: 'pe', label: 'P/E' },
  { key: 'ps', label: 'P/S' },
  { key: 'pb', label: 'P/B' },
  { key: 'pfcf', label: 'P/FCF' },
  { key: 'ev-ebitda', label: 'EV/EBITDA' },
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

function formatObservationValue(row: MarketMetricObservation | null): string {
  if (!row || row.value === null || !Number.isFinite(row.value)) return '—'
  return formatMultiple(row.value)
}

function formatMultiple(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}x`
}

function SnapshotContext({
  snapshot,
  metric,
  latest,
}: {
  snapshot: CurrentResearchSnapshot
  metric: ValuationMetric
  latest: MarketMetricObservation | null
}) {
  const metricLabel = METRICS.find((item) => item.key === metric)?.label ?? 'Multiple'
  const currentValue = latest ? formatObservationValue(latest) : metric === 'pe' ? formatResearchMultiple(snapshot.trailingPe) : '—'
  const metricAvailable = latest !== null || metric === 'pe' && snapshot.trailingPe !== null

  return (
    <aside className={styles.contextColumn} aria-label="Current valuation context">
      <div>
        <div className={styles.contextHeader}>
          <h2>Current value</h2>
          <span>{metricAvailable ? 'Available' : 'No canonical rows'}</span>
        </div>
        <div className={styles.currentValue}>
          <span>{metricLabel}</span>
          <strong>{currentValue}</strong>
          <small>{latest ? `Observed ${formatResearchDate(latest.observationDate)}` : snapshot.reportingPeriod ? `Reported ${formatResearchDate(snapshot.reportingPeriod)}` : 'Observation date unavailable'}</small>
        </div>
      </div>
      <dl className={styles.contextList}>
        <div><dt>Market cap</dt><dd>{formatResearchMoney(snapshot.marketCap, snapshot.currency)}</dd></div>
        <div><dt>Currency</dt><dd>{snapshot.currency}</dd></div>
        <div><dt>Known at</dt><dd>{latest ? formatResearchDate(latest.knownAt) : '—'}</dd></div>
        <div><dt>Source</dt><dd>{latest?.source ?? '—'}</dd></div>
      </dl>
    </aside>
  )
}

export default function StockValuationResearch({
  data,
  lens,
  metric,
  period,
  observations,
}: {
  data: StockResearchData
  lens: InvestmentLensKey
  metric: ValuationMetric
  period: ValuationPeriod
  observations: MarketMetricsPayload | null
}) {
  const snapshot = currentResearchSnapshot(data)
  const metricLabel = METRICS.find((item) => item.key === metric)?.label ?? 'Multiple'
  const earnings = data.summary.nextEarnings
  const rows = observations?.available ? observations.rows : []
  const latest = rows.find((row) => row.value !== null && Number.isFinite(row.value)) ?? null
  const chartPoints = rows
    .filter((row): row is MarketMetricObservation & { value: number } => row.value !== null && Number.isFinite(row.value))
    .map((row) => ({
      date: row.observationDate,
      value: row.value,
      key: `${row.observationDate}:${row.knownAt}:${row.metric}`,
      tooltipMeta: `Known ${formatResearchDate(row.knownAt)}`,
    }))
    .sort((left, right) => left.date.localeCompare(right.date) || left.key.localeCompare(right.key))

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
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <section className={styles.hero} aria-labelledby="valuation-history-chart">
          <div className={styles.chartColumn}>
            <div className={styles.chartHeader}>
              <h2 id="valuation-history-chart">Historical {metricLabel}</h2>
              <span>Temporal observations</span>
            </div>
            <div className={styles.chartFrame} data-empty={chartPoints.length === 0}>
              <TemporalLineChart
                className={styles.valuationChart}
                points={chartPoints}
                ariaLabel={`${metricLabel} canonical temporal observations`}
                valueFormat="multiple"
                emptyState={
                  <div className={styles.chartPlaceholder}>
                    <strong>No canonical {metricLabel} history</strong>
                    <span>{observations?.reason ?? 'Market metric read model unavailable'}</span>
                  </div>
                }
              />
              <div className={styles.chartFooter}>
                <span>{chartPoints.length} temporal {chartPoints.length === 1 ? 'observation' : 'observations'}</span>
                <span>No range or percentile inferred</span>
              </div>
            </div>
          </div>
          <SnapshotContext snapshot={snapshot} metric={metric} latest={latest} />
        </section>

        <section className={styles.secondaryGrid} aria-label="Valuation comparisons">
          <div className={styles.secondaryModule}>
            <div className={styles.sectionHeader}>
              <h2>Series coverage</h2>
              <span>Canonical</span>
            </div>
            <dl className={styles.moduleRows}>
              <div><dt>First observation</dt><dd>{chartPoints.length ? formatResearchDate(chartPoints[0]?.date ?? null) : '—'}</dd></div>
              <div><dt>Latest observation</dt><dd>{latest ? formatResearchDate(latest.observationDate) : '—'}</dd></div>
              <div><dt>Methodology</dt><dd>{latest?.methodologyVersion ?? '—'}</dd></div>
            </dl>
          </div>
          <div className={styles.secondaryModule}>
            <div className={styles.sectionHeader}>
              <h2>Peer and sector comparison</h2>
              <span>Not supplied</span>
            </div>
            <dl className={styles.moduleRows}>
              <div><dt>Comparable companies</dt><dd>Not in this contract</dd></div>
              <div><dt>Sector reference</dt><dd>Not in this contract</dd></div>
              <div><dt>Method</dt><dd>No frontend inference</dd></div>
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
            <p>Values are direct temporal market-metric observations. Known-at dates remain distinct from observation dates; ranges, percentiles and peer comparisons are not calculated in the frontend.</p>
            <Link href={`/stocks/${data.ticker}/methodology?lens=${lens}`}>Open methodology →</Link>
          </div>
        </section>

        <ResearchAdPlacement />
      </div>
    </ResearchViewShell>
  )
}
