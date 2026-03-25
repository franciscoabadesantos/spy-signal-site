import { getLatestSignal, getRecentSignals } from '@/lib/signals'
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

export default async function Home() {
  const [latest, signals] = await Promise.all([
    getLatestSignal(),
    getRecentSignals(20),
  ])

  const matured = signals.filter(s => s.realized_return !== null)
  const bullishMatured = matured.filter(s => s.direction === 'bullish')
  const hitRate = bullishMatured.length > 0
    ? (bullishMatured.filter(s => s.correct).length / bullishMatured.length * 100).toFixed(1)
    : null

  const currentStance = latest
    ? (latest.direction === 'bullish' ? 'bullish' : 'neutral')
    : null

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
      <Nav active="overview" />

      {/* Hero */}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · Timing & Allocation System
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
          SPY Timing & Allocation System
        </div>
        {latest ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{
                fontSize: '28px', fontWeight: 600,
                color: currentStance === 'bullish' ? '#27500A' : '#5F5E5A'
              }}>
                {currentStance === 'bullish' ? 'ALLOCATED' : 'FLAT'}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {formatProb(latest.prob_side)} model probability
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Signal date: {formatDate(latest.signal_date)} · {latest.prediction_horizon}-day horizon · 45-day display lag applied
            </div>
            <div style={{
              marginTop: '10px', fontSize: '12px', color: '#6b7280',
              background: '#f9fafb', borderRadius: '6px',
              padding: '8px 12px', display: 'inline-block'
            }}>
              Bullish = positive SPY exposure &nbsp;·&nbsp; Neutral = flat (no position)
            </div>
          </>
        ) : (
          <div style={{ color: '#6b7280' }}>No signals yet</div>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', padding: '20px 0' }}>

        {/* Left column */}
        <div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              {
                label: 'Current stance',
                value: currentStance === 'bullish' ? 'Allocated' : currentStance === 'neutral' ? 'Flat' : '—',
                color: currentStance === 'bullish' ? '#27500A' : '#5F5E5A'
              },
              {
                label: 'Model probability',
                value: formatProb(latest?.prob_side ?? null),
                color: '#1a1a1a'
              },
              {
                label: 'Directional accuracy (secondary)',
                value: hitRate ? `${hitRate}%` : '—',
                color: '#1a1a1a'
              },
            ].map(card => (
              <div key={card.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Signal history table */}
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Signal history</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Signal date', 'Stance', 'Model probability', 'Horizon', 'SPY return', 'Outcome'].map(h => (
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
                const isActive = signal.direction === 'bullish'
                const isPending = signal.realized_return === null
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
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                      {signal.prediction_horizon}d
                    </td>
                    <td style={{
                      padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                      color: isPending ? '#9ca3af' : (signal.realized_return ?? 0) >= 0 ? '#27500A' : '#791F1F'
                    }}>
                      {formatReturn(signal.realized_return)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {isPending ? (
                        <span style={{ color: '#9ca3af' }}>Pending</span>
                      ) : !isActive ? (
                        <span style={{ color: '#6b7280' }}>Flat / no position</span>
                      ) : signal.correct ? (
                        <span style={{ color: '#27500A' }}>✓ Correct</span>
                      ) : (
                        <span style={{ color: '#791F1F' }}>✗ Incorrect</span>
                      )}
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

        {/* Sidebar */}
        <div>
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: '8px',
            padding: '14px 16px', marginBottom: '14px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>System summary</div>
            {[
              { key: 'Strategy type', val: 'Long-flat SPY timing' },
              { key: 'Target', val: '20-day directional expectation' },
              { key: 'Execution', val: 'Signal at close, fills next open' },
              { key: 'Validation', val: 'Walk-forward (OOS)' },
              { key: 'Retrain', val: 'Monthly' },
              { key: 'Display lag', val: '45 days' },
              { key: 'Built by', val: '1 person · 12 months' },
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
            This is a research and portfolio project. Signals are displayed with a 45-day lag.
            Nothing on this site constitutes investment advice or a recommendation to buy or sell any security.
          </div>
        </div>
      </div>
    </div>
  )
}