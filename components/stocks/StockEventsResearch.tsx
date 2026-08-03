import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import type { CanonicalEvent, DisclosurePayload, EventCalendarPayload } from '@/lib/canonical-research'
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

function viewHref(ticker: string, view: EventView): string {
  return `/stocks/${ticker}/events?view=${view}`
}

function NextEvent({
  data,
  events,
  view,
}: {
  data: StockResearchData
  events: EventCalendarPayload | null
  view: EventView
}) {
  const earnings = data.summary.nextEarnings
  const distributionDate = data.fundamentals.exDividendDate
  const nextCanonical = view === 'upcoming'
    ? [...(events?.rows ?? [])].sort((a, b) => Date.parse(a.occursAt ?? '') - Date.parse(b.occursAt ?? ''))[0]
    : undefined

  if (data.kind === 'fund') {
    return (
      <section className={styles.nextEvent} aria-labelledby="next-event-heading">
        <div>
          <span className={styles.eyebrow}>Fund Events</span>
          <h2 id="next-event-heading">{nextCanonical?.title ?? (distributionDate ? 'Distribution date' : 'Fund event coverage')}</h2>
          <div className={styles.nextMeta}>
            <span>{formatDate(nextCanonical?.occursAt ?? distributionDate)}</span>
            <span>{nextCanonical ? `${nextCanonical.eventType} · ${nextCanonical.source ?? 'canonical source'}` : 'No upcoming canonical fund event'}</span>
          </div>
        </div>
        <div className={styles.nextFacts}>
          <div className={styles.fact}><span>Distributions</span><strong>{distributionDate ? 'Date available' : 'No canonical date'}</strong></div>
          <div className={styles.fact}><span>Fund coverage</span><strong>{data.coverageLabel}</strong></div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.nextEvent} aria-labelledby="next-event-heading">
      <div>
        <span className={styles.eyebrow}>Next event</span>
        <h2 id="next-event-heading">{nextCanonical?.title ?? 'Next event'}</h2>
        <div className={styles.nextMeta}>
          <span>{formatDate(nextCanonical?.occursAt ?? earnings?.earningsDate ?? null)}</span>
          <span>{earnings?.fiscalPeriod ?? 'Fiscal period unavailable'}</span>
          <span>{nextCanonical?.source ?? earnings?.earningsTime ?? 'Source unavailable'}</span>
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

function EventModules({
  data,
  events,
  disclosures,
}: {
  data: StockResearchData
  events: EventCalendarPayload | null
  disclosures: DisclosurePayload | null
}) {
  const allRows = [...(events?.rows ?? []), ...(disclosures?.rows ?? [])]
  const count = (...domains: string[]) => allRows.filter((row) => domains.includes(row.domain)).length
  const modules: Array<[string, number]> = data.kind === 'fund'
    ? [
        ['Distributions', count('fundDistributions')],
        ['Rebalances', count('fundRebalances')],
        ['Investor events', count('investorEvents')],
        ['Issuer disclosures', count('filings', 'guidance', 'equityCapitalEvents')],
      ]
    : [
        ['Earnings', count('earningsEvents')],
        ['Corporate actions', count('corporateActions')],
        ['Guidance & capital', count('guidance', 'equityCapitalEvents')],
        ['Filings & investor events', count('filings', 'investorEvents')],
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
            <div><strong>{label}</strong><p>{value} canonical {value === 1 ? 'event' : 'events'} in this view</p></div>
            <span className={styles.status}>{value > 0 ? 'Available' : 'No rows'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CanonicalTimeline({
  rows,
  view,
  reason,
}: {
  rows: CanonicalEvent[]
  view: EventView
  reason: string | null
}) {
  const ordered = [...rows].sort((a, b) => {
    const left = Date.parse(a.occursAt ?? '') || 0
    const right = Date.parse(b.occursAt ?? '') || 0
    return view === 'upcoming' ? left - right : right - left
  })
  if (ordered.length === 0) {
    return <div className={styles.moduleRow}><div><strong>No canonical events</strong><p>{reason ?? 'No observations fall inside this date window.'}</p></div><span className={styles.status}>No rows</span></div>
  }
  return (
    <div className={styles.timeline}>
      {ordered.map((row) => (
        <div className={styles.eventRow} key={`${row.domain}:${row.eventId ?? row.title}:${row.knownAt ?? ''}`}>
          <time dateTime={row.occursAt ?? undefined}>{formatDate(row.occursAt)}</time>
          <div>
            <strong>{row.title}</strong>
            <p>{row.domain} · {row.occursAtRole.replaceAll('_', ' ')} · known {formatDate(row.knownAt)}</p>
            {row.documentUrl ? <a href={row.documentUrl} target="_blank" rel="noreferrer">Open {row.documentType ?? 'document'}</a> : null}
          </div>
          <span className={styles.eventStatus}>{row.classification === 'candidate' ? `Candidate${row.confidence ? ` · ${row.confidence}` : ''}` : row.source ?? 'Canonical'}</span>
        </div>
      ))}
    </div>
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

export default function StockEventsResearch({
  data,
  view: rawView,
  events,
  disclosures,
}: {
  data: StockResearchData
  view?: string
  events: EventCalendarPayload | null
  disclosures: DisclosurePayload | null
}) {
  const view = parseView(rawView)
  const isFund = data.kind === 'fund'
  const timelineRows = view === 'upcoming'
    ? events?.rows ?? []
    : [...(events?.rows ?? []), ...(disclosures?.rows ?? [])]

  return (
    <ResearchViewShell data={data} title={isFund ? 'Fund Events' : 'Earnings & Events'}>
      <div className={styles.page} data-events-research="" data-event-view={view}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>{data.ticker} · {isFund ? 'Fund event evidence' : 'Corporate event evidence'}</span>
          <div className={styles.introMeta}><span>{data.coverageLabel}</span><span>{isFund ? 'Earnings are not applicable to this asset.' : 'No event impact is inferred.'}</span></div>
        </header>

        <NextEvent data={data} events={events} view={view} />

        <nav className={styles.viewNav} aria-label="Event view">
          {(['upcoming', 'recent', 'history'] as const).map((item) => (
            <Link key={item} href={viewHref(data.ticker, item)} className={`${styles.viewLink} ${view === item ? styles.viewActive : ''}`} aria-current={view === item ? 'page' : undefined}>
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
            <CanonicalTimeline rows={timelineRows} view={view} reason={events?.reason ?? disclosures?.reason ?? null} />
            {view === 'history' && !isFund ? <EarningsHistory data={data} /> : null}
          </section>

          <EventModules data={data} events={events} disclosures={disclosures} />
        </div>

        <section className={styles.methodology} aria-labelledby="events-methodology-heading">
          <div className={styles.methodHeader}>
            <div>
              <span className={styles.sectionLabel}>Method and coverage</span>
              <h2 id="events-methodology-heading">Methodology</h2>
            </div>
            <Link href={`/stocks/${data.ticker}/methodology`} className={styles.methodLink}>Open methodology →</Link>
          </div>
          <p>Calendar rows and disclosures come from ticker-scoped canonical read models. Event date roles, source, known-at time and candidate confidence remain explicit. No certainty, price impact, filing interpretation or missing event is inferred.</p>
        </section>

        <ResearchAdPlacement />
      </div>
    </ResearchViewShell>
  )
}
