import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import type { InvestmentLensKey } from '@/lib/investment-lens'
import type { StockResearchData } from '@/lib/stock-research'
import { normalizeEarningsHistory } from '@/lib/event-research'
import styles from './StockEventsResearch.module.css'

type EventView = 'upcoming' | 'recent' | 'history'

function formatDate(value: string | null, withYear = true): string {
  if (!value || Number.isNaN(Date.parse(value))) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  }).format(new Date(value))
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: 3 })
}

function parseView(value: string | undefined): EventView {
  return value === 'recent' || value === 'history' ? value : 'upcoming'
}

function viewHref(ticker: string, lens: InvestmentLensKey, view: EventView): string {
  return `/stocks/${ticker}/events?lens=${lens}&view=${view}`
}

function NextEvent({ data }: { data: StockResearchData }) {
  const earnings = data.summary.nextEarnings
  const distributionDate = data.fundamentals.exDividendDate

  if (data.kind === 'fund') {
    return (
      <section className={styles.nextEvent} aria-labelledby="next-event-heading">
        <div>
          <span className={styles.eyebrow}>Fund Events</span>
          <h2 id="next-event-heading">{distributionDate ? 'Distribution date' : 'Fund event coverage'}</h2>
          <div className={styles.nextMeta}>
            <span>{distributionDate ? formatDate(distributionDate) : 'Pending integration'}</span>
            <span>Issuer, rebalance and structural events are not connected.</span>
          </div>
        </div>
        <div className={styles.nextFacts}>
          <div className={styles.fact}><span>Distributions</span><strong>{distributionDate ? 'Date available' : 'Pending integration'}</strong></div>
          <div className={styles.fact}><span>Fund coverage</span><strong>{data.coverageLabel}</strong></div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.nextEvent} aria-labelledby="next-event-heading">
      <div>
        <span className={styles.eyebrow}>Next event</span>
        <h2 id="next-event-heading">Next event</h2>
        <div className={styles.nextMeta}>
          <span>{earnings?.earningsDate ? formatDate(earnings.earningsDate) : 'Pending integration'}</span>
          <span>{earnings?.fiscalPeriod ?? 'Fiscal period unavailable'}</span>
          <span>{earnings?.earningsTime ?? 'Time unavailable'}</span>
        </div>
      </div>
      <div className={styles.nextFacts}>
        <div className={styles.fact}><span>EPS estimate</span><strong>{earnings?.epsEstimate === null || earnings?.epsEstimate === undefined ? '—' : formatNumber(earnings.epsEstimate)}</strong></div>
        <div className={styles.fact}><span>Revenue estimate</span><strong>{earnings?.revenueEstimate === null || earnings?.revenueEstimate === undefined ? '—' : formatNumber(earnings.revenueEstimate)}</strong></div>
        <div className={styles.fact}><span>As of</span><strong>{earnings?.asOf ? formatDate(earnings.asOf) : '—'}</strong></div>
        <div className={styles.fact}><span>Event state</span><strong>{earnings ? 'Available fields' : data.summary.coverage.hasEarnings ? 'Partial coverage' : 'Unavailable'}</strong></div>
      </div>
    </section>
  )
}

function EventModules({ data }: { data: StockResearchData }) {
  const modules = data.kind === 'fund'
    ? [
        ['Distributions', data.fundamentals.exDividendDate ? `Date · ${formatDate(data.fundamentals.exDividendDate)}` : 'Pending integration'],
        ['Rebalances', 'Pending integration'],
        ['Index changes', 'Pending integration'],
        ['Issuer & structural events', 'Pending integration'],
      ]
    : [
        ['Dividends', data.fundamentals.exDividendDate ? `Ex-date · ${formatDate(data.fundamentals.exDividendDate)}` : 'Pending integration'],
        ['Corporate actions', 'Pending integration'],
        ['Guidance & revisions', 'Pending integration'],
        ['Filings & shareholder events', 'Pending integration'],
      ]

  return (
    <section className={styles.eventSection} aria-labelledby="event-modules-heading">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionLabel}>Coverage map</span>
          <h2 id="event-modules-heading">{data.kind === 'fund' ? 'Fund event types' : 'Event types'}</h2>
        </div>
      </div>
      <div className={styles.eventModules}>
        {modules.map(([label, value]) => (
          <div className={styles.moduleRow} key={label}>
            <div><strong>{label}</strong><p>{value}</p></div>
            <span className={styles.status}>{value === 'Pending integration' ? 'Pending integration' : 'Partial coverage'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function EarningsHistory({ data }: { data: StockResearchData }) {
  const normalized = normalizeEarningsHistory(data.summary.earningsHistory)
  if (normalized.duplicateKeys.length > 0) {
    return <div className={styles.moduleRow}><div><strong>Earnings history</strong><p>Historical rows contain duplicate date and fiscal-period keys.</p></div><span className={styles.status}>Partial coverage</span></div>
  }
  if (normalized.rows.length === 0) {
    return <div className={styles.moduleRow}><div><strong>Earnings history</strong><p>No individually safe historical rows are available.</p></div><span className={styles.status}>Unavailable</span></div>
  }

  return (
    <div className={styles.earningsList}>
      {normalized.rows.slice(0, 12).map((row) => (
        <div className={styles.earningsRow} key={`${row.earningsDate}-${row.fiscalPeriod ?? 'period'}`}>
          <time dateTime={row.earningsDate}>{formatDate(row.earningsDate)}</time>
          <div><strong>{row.fiscalPeriod ?? 'Fiscal period unavailable'}</strong><span>Actual and estimate fields only · no price reaction calculated</span></div>
          <div className={styles.earningsValues}>
            <span>EPS {formatNumber(row.epsActual)} / {formatNumber(row.epsEstimate)}</span>
            <span>Revenue {formatNumber(row.revenueActual)} / {formatNumber(row.revenueEstimate)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StockEventsResearch({ data, lens, view: rawView }: { data: StockResearchData; lens: InvestmentLensKey; view?: string }) {
  const view = parseView(rawView)
  const isFund = data.kind === 'fund'

  return (
    <ResearchViewShell data={data} lens={lens} title={isFund ? 'Fund Events' : 'Earnings & Events'}>
      <div className={styles.page} data-events-research="" data-event-view={view}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>{data.ticker} · {isFund ? 'Fund event evidence' : 'Corporate event evidence'}</span>
          <div className={styles.introMeta}><span>{data.coverageLabel}</span><span>{isFund ? 'Earnings are not applicable to this asset.' : 'No event impact is inferred.'}</span></div>
        </header>

        <NextEvent data={data} />

        <nav className={styles.viewNav} aria-label="Event view">
          {(['upcoming', 'recent', 'history'] as const).map((item) => (
            <Link key={item} href={viewHref(data.ticker, lens, item)} className={`${styles.viewLink} ${view === item ? styles.viewActive : ''}`} aria-current={view === item ? 'page' : undefined}>
              {item === 'upcoming' ? 'Upcoming' : item === 'recent' ? 'Recent' : 'History'}
            </Link>
          ))}
        </nav>

        <div className={styles.eventGrid}>
          <section className={styles.eventSection} aria-labelledby="event-timeline-heading">
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionLabel}>Temporal view</span>
                <h2 id="event-timeline-heading">Event timeline</h2>
              </div>
              <span className={styles.status}>{view}</span>
            </div>
            {view === 'history' && !isFund ? <EarningsHistory data={data} /> : (
              <div className={styles.timeline}>
                <div className={styles.eventRow}>
                  <time>{view === 'upcoming' ? 'Next' : 'Recent'}</time>
                  <div><strong>{isFund ? 'Fund events' : 'Earnings and events'}</strong><p>{view === 'upcoming' ? 'Only the next earnings fields are currently connected.' : 'Historical event feed is pending canonical normalization.'}</p></div>
                  <span className={styles.eventStatus}>{view === 'upcoming' && data.summary.nextEarnings ? 'Partial coverage' : 'Pending integration'}</span>
                </div>
                {view !== 'upcoming' ? <div className={styles.eventRow}><time>Future</time><div><strong>{isFund ? 'Distribution and rebalance history' : 'Filings, actions and guidance'}</strong><p>Final timeline geometry reserved for the approved event contract.</p></div><span className={styles.eventStatus}>Pending integration</span></div> : null}
              </div>
            )}
          </section>

          <EventModules data={data} />
        </div>

        <section className={styles.methodology} aria-labelledby="events-methodology-heading">
          <div className={styles.methodHeader}>
            <div>
              <span className={styles.sectionLabel}>Method and coverage</span>
              <h2 id="events-methodology-heading">Methodology</h2>
            </div>
            <Link href={`/stocks/${data.ticker}/methodology?lens=${lens}`} className={styles.methodLink}>Open methodology →</Link>
          </div>
          <p>Dates, fiscal periods and estimates are presented only when supplied by the existing summary or profile payloads. Historical earnings are withheld when duplicate date and period keys prevent safe normalization. No timezone, certainty, source, guidance, restatement or price impact is inferred.</p>
        </section>

        <ResearchAdPlacement />
      </div>
    </ResearchViewShell>
  )
}
