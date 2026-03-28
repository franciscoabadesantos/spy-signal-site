import { getRecentSignals } from '@/lib/signals'
import Nav from '@/components/Nav'

export const dynamic = 'force-dynamic'

function formatReturn(val: number | null) {
  if (val === null) return '—'
  const pct = (val * 100).toFixed(2)
  return val >= 0 ? `+${pct}%` : `${pct}%`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function avg(nums: number[]) {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
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

export default async function Performance() {
  const signals = await getRecentSignals(200)
  const allocated = signals.filter(
    s => s.live_episode_return_to_date !== null
  )
  const flat = signals.filter(
    s => s.live_episode_return_to_date === null && s.live_flat_episode_spy_move_to_date !== null
  )
  const hasSignals = signals.length > 0

  const avgAllocatedReturn = avg(allocated.map(s => s.live_episode_return_to_date!))
  const avgFlatReturn = avg(flat.map(s => s.live_flat_episode_spy_move_to_date!))

  const totalEpisodes = allocated.length + flat.length
  const pctTimeAllocated = totalEpisodes > 0
    ? (allocated.length / totalEpisodes * 100).toFixed(1)
    : null

  const positiveEpisodes = allocated.filter(s => (s.live_episode_return_to_date ?? 0) > 0).length
  const episodeHitRate = allocated.length > 0
    ? (positiveEpisodes / allocated.length * 100).toFixed(1)
    : null

  const allEpisodes = [...signals].sort(
    (a, b) => new Date(b.signal_date).getTime() - new Date(a.signal_date).getTime()
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
      <Nav active="performance" />

      {/* Header */}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · Timing & Allocation System
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600 }}>Live performance</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          Episode returns only · Based on actual allocation lifecycle
        </div>
      </div>

      <div style={{ padding: '20px 0' }}>

        {/* Framing note */}
        <div style={{
          background: '#f9fafb', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '24px',
          fontSize: '12px', color: '#374151', lineHeight: '1.6'
        }}>
          Performance is measured by allocation episode — the return earned while the system
          was invested, compared to periods when it chose to stay flat. The goal is to be
          allocated during favourable conditions and out during unfavourable ones. Test data
          started on January 1st, 2026.
        </div>

        {/* Primary metrics */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>
          Allocation metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            {
              label: 'Avg return when allocated',
              value: avgAllocatedReturn !== null ? formatReturn(avgAllocatedReturn) : '—',
              color: avgAllocatedReturn !== null
                ? (avgAllocatedReturn >= 0 ? '#27500A' : '#791F1F')
                : '#1a1a1a'
            },
            {
              label: 'Avg SPY return when flat',
              value: avgFlatReturn !== null ? formatReturn(avgFlatReturn) : '—',
              color: '#1a1a1a'
            },
            {
              label: '% time allocated',
              value: pctTimeAllocated ? `${pctTimeAllocated}%` : '—',
              color: '#1a1a1a'
            },
            {
              label: 'Positive allocated episodes',
              value: episodeHitRate ? `${episodeHitRate}%` : '—',
              color: '#1a1a1a'
            },
          ].map(card => (
            <div key={card.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Episode breakdown */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
          Episode breakdown
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Allocated episodes with positive return vs negative return.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            {
              label: 'Allocated episodes',
              value: allocated.length > 0 ? String(allocated.length) : '—',
              sub: 'with episode return data'
            },
            {
              label: 'Positive return episodes',
              value: positiveEpisodes > 0 ? String(positiveEpisodes) : '—',
              sub: 'allocated, return > 0'
            },
            {
              label: 'Negative return episodes',
              value: allocated.filter(s => (s.live_episode_return_to_date ?? 0) <= 0).length > 0
                ? String(allocated.filter(s => (s.live_episode_return_to_date ?? 0) <= 0).length)
                : '—',
              sub: 'allocated, return ≤ 0'
            },
          ].map(card => (
            <div key={card.label} style={{
              border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2px' }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Episode table */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>All episodes</span>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>return earned during each allocation period</span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Each row shows the return earned (or avoided) during that episode.
          Flat rows show what SPY did while the system was uninvested.
          Signals are shown through today.
        </div>

        {!hasSignals ? (
          <div style={{ color: '#9ca3af', padding: '24px 0' }}>
            No signals yet — check back after market close.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Signal date', 'Stance', 'Days in episode', 'Episode return', 'Result'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0',
                    color: '#6b7280', fontWeight: 400,
                    borderBottom: '1px solid #e5e7eb', fontSize: '12px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allEpisodes.map(signal => {
                const hasAllocatedReturn = signal.live_episode_return_to_date !== null
                const hasFlatReturn = signal.live_flat_episode_spy_move_to_date !== null
                const isAllocated = hasAllocatedReturn
                  ? true
                  : hasFlatReturn
                    ? false
                    : signal.direction === 'bullish'
                const ret = hasAllocatedReturn
                  ? signal.live_episode_return_to_date
                  : hasFlatReturn
                    ? signal.live_flat_episode_spy_move_to_date
                    : null
                const status = hasAllocatedReturn
                  ? signal.live_episode_status
                  : hasFlatReturn
                    ? signal.live_flat_episode_status
                    : (signal.direction === 'bullish'
                      ? signal.live_episode_status
                      : signal.live_flat_episode_status)
                const daysInEpisode = signal.live_episode_days_in_trade ?? extractDaysFromStatus(status)
                const hasReturn = ret !== null
                const isPositive = (ret ?? 0) > 0

                return (
                  <tr key={signal.id}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {formatDate(signal.signal_date)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: '4px',
                        fontSize: '12px', fontWeight: 500,
                        background: isAllocated ? '#EAF3DE' : '#F1EFE8',
                        color: isAllocated ? '#27500A' : '#5F5E5A',
                      }}>
                        {isAllocated ? 'Allocated' : 'Flat'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                      {daysInEpisode !== null
                        ? `${daysInEpisode}d`
                        : '—'}
                    </td>
                    <td style={{
                      padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                      color: ret === null ? '#9ca3af' : isPositive ? '#27500A' : '#791F1F'
                    }}>
                      {formatReturn(ret)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {!hasReturn ? (
                        <span style={{ color: '#6b7280' }}>Pending</span>
                      ) : !isAllocated ? (
                        <span style={{ color: '#6b7280' }}>Flat / avoided</span>
                      ) : isPositive ? (
                        <span style={{ color: '#27500A' }}>✓ Positive</span>
                      ) : (
                        <span style={{ color: '#791F1F' }}>✗ Negative</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div style={{
          fontSize: '11px', color: '#9ca3af', lineHeight: '1.6',
          padding: '12px', border: '1px solid #e5e7eb',
          borderRadius: '8px', marginTop: '28px'
        }}>
          Past performance does not guarantee future results. This is a research project.
          Signals are displayed through today. Nothing here constitutes investment advice.
        </div>
      </div>
    </div>
  )
}
