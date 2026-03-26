import { getDataStartDate, getLatestSignal, getRecentSignals } from '@/lib/signals'
import Nav from '@/components/Nav'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatReturn(val: number | null) {
  if (val === null) return '—'
  const pct = (val * 100).toFixed(2)
  return val >= 0 ? `+${pct}%` : `${pct}%`
}

function formatProb(prob: number | null) {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

function formatDays(days: number | null) {
  if (days === null) return '—'
  return `${days}d`
}

function parseDate(dateStr: string): Date | null {
  const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1], 10)
    const month = Number.parseInt(dateOnlyMatch[2], 10)
    const day = Number.parseInt(dateOnlyMatch[3], 10)
    return new Date(Date.UTC(year, month - 1, day))
  }

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function elapsedDaysFrom(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const start = parseDate(dateStr)
  if (!start) return null

  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const diff = Math.floor((todayUtc - startUtc) / 86400000)

  return diff >= 0 ? diff : 0
}

function normalizeStance(direction: string | null | undefined): 'bullish' | 'neutral' | null {
  if (!direction) return null
  return direction === 'bullish' ? 'bullish' : 'neutral'
}

function StanceBadge({ direction }: { direction: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    bullish: { bg: '#EAF3DE', color: '#27500A', label: 'Bullish — allocated' },
    neutral: { bg: '#F1EFE8', color: '#5F5E5A', label: 'Neutral — flat' },
    bearish: { bg: '#F1EFE8', color: '#5F5E5A', label: 'Neutral — flat' },
  }
  const c = config[direction] ?? config.neutral
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 10px', borderRadius: '4px',
      fontSize: '12px', fontWeight: 500,
    }}>
      {c.label}
    </span>
  )
}

type EpisodeStatus = string | null

function StatusLabel({ status }: { status: EpisodeStatus }) {
  if (status === null) return <span style={{ color: '#9ca3af' }}>—</span>

  switch (status) {
    case 'flat':
    case 'in_flat':
      return <span style={{ color: '#6b7280' }}>Flat / no position</span>
    case 'pending_entry':
      return (
        <span style={{
          color: '#6b7280', background: '#f9fafb',
          padding: '2px 8px', borderRadius: '4px', fontSize: '12px'
        }}>
          Enter next open
        </span>
      )
    case 'in_trade':
      return (
        <span style={{
          color: '#27500A', background: '#EAF3DE',
          padding: '2px 8px', borderRadius: '4px', fontSize: '12px'
        }}>
          In position
        </span>
      )
    case 'exit_pending':
      return (
        <span style={{
          color: '#854F0B', background: '#FAEEDA',
          padding: '2px 8px', borderRadius: '4px', fontSize: '12px'
        }}>
          Exit next open
        </span>
      )
    default:
      return <span style={{ color: '#6b7280' }}>{status.replaceAll('_', ' ')}</span>
  }
}

function extractDaysFromStatus(status: string | null): number | null {
  if (!status) return null

  const patterns = [
    /(?:^|[_\s-])d(?:ays?)?[_\s-]?(\d+)/i,
    /(\d+)\s*d(?:ays?)?/i,
    /day[_\s-]?(\d+)/i,
    /(\d+)[_\s-]?day/i,
  ]

  for (const pattern of patterns) {
    const match = status.match(pattern)
    if (match?.[1]) {
      const parsed = Number.parseInt(match[1], 10)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

export default async function Home() {
  const [latest, signals, dataStartDate] = await Promise.all([
    getLatestSignal(),
    getRecentSignals(20),
    getDataStartDate(),
  ])

  const currentStance = latest
    ? (latest.direction === 'bullish' ? 'bullish' : 'neutral')
    : null
  const currentRegimeStartDate = (() => {
    if (!latest || !currentStance || signals.length === 0) return null

    let regimeStartDate: string | null = latest.signal_date
    for (const signal of signals) {
      if (normalizeStance(signal.direction) !== currentStance) break
      regimeStartDate = signal.signal_date
    }

    return regimeStartDate
  })()

  const liveStatus = latest
    ? (currentStance === 'bullish'
      ? latest.live_episode_status
      : (latest.live_flat_episode_status ?? latest.live_episode_status))
    : null
  const currentRegimeDays = latest
    ? (
      latest.live_episode_days_in_trade
      ?? extractDaysFromStatus(latest.live_episode_status)
      ?? extractDaysFromStatus(latest.live_flat_episode_status)
      ?? elapsedDaysFrom(
        currentStance === 'bullish'
          ? (latest.live_episode_entry_date ?? currentRegimeStartDate ?? latest.signal_date)
          : (currentRegimeStartDate ?? latest.signal_date)
      )
    )
    : null
  const stanceTitle = currentStance === 'bullish' ? 'ALLOCATED' : currentStance === 'neutral' ? 'FLAT' : '—'
  const stanceColor = currentStance === 'bullish' ? '#1f5f2d' : '#374151'
  const stanceDescription = currentStance === 'bullish'
    ? 'Model currently prefers SPY exposure.'
    : 'Model is waiting for clearer conditions.'

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
      <Nav active="overview" />

      {/* Hero */}
      <div style={{
        marginTop: '14px',
        border: '1px solid #dbe3ef',
        borderRadius: '14px',
        padding: '20px',
        background: 'linear-gradient(130deg, #f9fbff 0%, #f6f3e8 58%, #edf8ef 100%)',
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · Timing & Allocation System
        </div>
        <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          SPY Timing & Allocation System
        </div>
        {latest ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                color: '#0f5132',
                background: '#def7e8',
                border: '1px solid #b9ead4',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
                LIVE
              </span>
              <span style={{
                fontSize: '30px',
                fontWeight: 700,
                color: stanceColor,
                letterSpacing: '0.01em',
              }}>
                {stanceTitle}
              </span>
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {formatProb(latest.prob_side)} model probability
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Signal date: {formatDate(latest.signal_date)} · {latest.prediction_horizon}-day horizon · published live
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>
              {stanceDescription}
            </div>
            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#4b5563',
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'inline-block',
            }}>
              Bullish = positive SPY exposure &nbsp;·&nbsp; Neutral = flat (no position)
            </div>
          </>
        ) : (
          <div style={{ color: '#6b7280' }}>No signals yet</div>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '22px', padding: '20px 0' }}>

        {/* Left column */}
        <div style={{ flex: '999 1 620px', minWidth: 0 }}>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Current stance</div>
              <div style={{
                fontSize: '20px',
                fontWeight: 600,
                color: currentStance === 'bullish' ? '#1f5f2d' : '#374151',
              }}>
                {currentStance === 'bullish' ? 'Allocated' : currentStance === 'neutral' ? 'Flat' : '—'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Model probability</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#1a1a1a' }}>
                {formatProb(latest?.prob_side ?? null)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                Current regime duration
              </div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#1a1a1a' }}>
                {formatDays(currentRegimeDays)}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                {liveStatus ? <StatusLabel status={liveStatus} /> : '—'}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                Started: {currentRegimeStartDate ? formatDate(currentRegimeStartDate) : '—'}
              </div>
            </div>
          </div>

          {/* Signal history table */}
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Signal history</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '740px' }}>
            <thead>
              <tr>
                {['Signal date', 'Stance', 'Model probability', 'Status', 'Return (to date)', 'Days'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0',
                    color: '#6b7280', fontWeight: 400,
                    borderBottom: '1px solid #e5e7eb', fontSize: '12px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.map(signal => {
                const status = signal.live_episode_status ?? signal.live_flat_episode_status
                const ret = signal.live_episode_return_to_date ?? signal.live_flat_episode_spy_move_to_date
                const showReturn = ret !== null
                const daysInEpisode =
                  signal.live_episode_days_in_trade
                  ?? extractDaysFromStatus(signal.live_episode_status)
                  ?? extractDaysFromStatus(signal.live_flat_episode_status)
                  ?? extractDaysFromStatus(status)
                const showDays = daysInEpisode !== null

                return (
                  <tr key={signal.id}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {formatDate(signal.signal_date)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <StanceBadge direction={signal.direction} />
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                      {formatProb(signal.prob_side)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <StatusLabel status={status} />
                    </td>
                    <td style={{
                      padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                      color: !showReturn ? '#9ca3af' : (ret ?? 0) >= 0 ? '#27500A' : '#791F1F'
                    }}>
                      {showReturn && ret !== null ? formatReturn(ret) : '—'}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                      {showDays && daysInEpisode !== null
                        ? `${daysInEpisode}d`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
              {signals.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px 0', color: '#9ca3af', textAlign: 'center' }}>
                    No signals yet — check back after market close
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '14px',
            background: '#fcfcfd',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>System summary</div>
            {[
              { key: 'Strategy type', val: 'Long-flat SPY timing' },
              { key: 'Signal', val: 'Daily at market close' },
              { key: 'Execution', val: 'Fills next open' },
              { key: 'Validation', val: 'Walk-forward (OOS)' },
              { key: 'Retrain', val: 'Monthly' },
              { key: 'Data start', val: dataStartDate ? formatDate(dataStartDate) : '—' },
              { key: 'Publication', val: 'Live (no delay)' },
              { key: 'Built by', val: 'Francisco Santos' },
            ].map(row => (
              <div key={row.key} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', fontSize: '13px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ color: '#6b7280' }}>{row.key}</span>
                <span style={{ textAlign: 'right', maxWidth: '160px' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '11px', color: '#9ca3af', lineHeight: '1.6',
            padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px'
          }}>
            This is a research and portfolio project. Signals are published live after the daily model run.
            Nothing on this site constitutes investment advice or a recommendation to buy or sell any security.
          </div>
        </div>
      </div>
    </div>
  )
}
