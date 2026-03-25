import { getRecentSignals } from '@/lib/signals'
import Nav from '@/components/Nav'

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

export default async function Performance() {
  const signals = await getRecentSignals(200)
  const matured = signals.filter(s => s.realized_return !== null)

  const bullish = matured.filter(s => s.direction === 'bullish')
  const neutral = matured.filter(s => s.direction !== 'bullish')

  const avgBullishReturn = avg(bullish.map(s => s.realized_return!))
  const avgNeutralReturn = avg(neutral.map(s => s.realized_return!))
  const pctTimeInvested = matured.length > 0
    ? (bullish.length / matured.length * 100).toFixed(1)
    : null

  const bullishHitRate = bullish.length > 0
    ? (bullish.filter(s => s.correct).length / bullish.length * 100).toFixed(1)
    : null

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
          Out-of-sample signals only · Outcomes filled after prediction horizon matures
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 0' }}>

        {/* Framing note */}
        <div style={{
          background: '#f9fafb', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '24px',
          fontSize: '13px', color: '#374151', lineHeight: '1.6'
        }}>
          This system is designed as a timing and allocation model. Directional accuracy is not
          the primary objective — the goal is to allocate capital only when expected returns
          justify exposure.
        </div>

        {/* Primary metrics */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Allocation metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            {
              label: 'Avg return when allocated',
              value: avgBullishReturn !== null ? formatReturn(avgBullishReturn) : '—',
              color: avgBullishReturn !== null ? (avgBullishReturn >= 0 ? '#27500A' : '#791F1F') : '#1a1a1a'
            },
            {
              label: 'Avg SPY return during flat periods',
              value: avgNeutralReturn !== null ? formatReturn(avgNeutralReturn) : '—',
              color: '#1a1a1a'
            },
            {
              label: '% time allocated',
              value: pctTimeInvested ? `${pctTimeInvested}%` : '—',
              color: '#1a1a1a'
            },
            {
              label: 'Total matured signals',
              value: matured.length > 0 ? String(matured.length) : '—',
              color: '#1a1a1a'
            },
          ].map(card => (
            <div key={card.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Secondary — directional accuracy */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
          Directional accuracy <span style={{ fontSize: '13px', fontWeight: 400, color: '#6b7280' }}>(secondary metric)</span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Measured on allocated (bullish) signals only — flat periods are not evaluated.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            {
              label: 'Hit rate when allocated',
              value: bullishHitRate ? `${bullishHitRate}%` : '—',
              sub: `${bullish.length} signals`
            },
            {
              label: 'Correct calls',
              value: bullish.filter(s => s.correct).length > 0 ? String(bullish.filter(s => s.correct).length) : '—',
              sub: 'allocated signals'
            },
            {
              label: 'Incorrect calls',
              value: bullish.filter(s => s.correct === false).length > 0 ? String(bullish.filter(s => s.correct === false).length) : '—',
              sub: 'allocated signals'
            },
          ].map(card => (
            <div key={card.label} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2px' }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Full results table */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>All matured signals</div>
        {matured.length === 0 ? (
          <div style={{ color: '#9ca3af', padding: '24px 0' }}>
            No matured signals yet — outcomes appear once the prediction horizon has passed.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Signal date', 'Stance', 'Horizon', 'SPY return', 'Outcome'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0',
                    color: '#6b7280', fontWeight: 400,
                    borderBottom: '1px solid #e5e7eb', fontSize: '12px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matured.map(signal => {
                const isActive = signal.direction === 'bullish'
                return (
                  <tr key={signal.id}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {formatDate(signal.signal_date)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                        background: isActive ? '#EAF3DE' : '#F1EFE8',
                        color: isActive ? '#27500A' : '#5F5E5A',
                      }}>
                        {isActive ? 'Allocated' : 'Flat'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                      {signal.prediction_horizon}d
                    </td>
                    <td style={{
                      padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                      color: (signal.realized_return ?? 0) >= 0 ? '#27500A' : '#791F1F'
                    }}>
                      {formatReturn(signal.realized_return)}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                      {!isActive ? (
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
            </tbody>
          </table>
        )}

        <div style={{
          fontSize: '11px', color: '#9ca3af', lineHeight: '1.6',
          padding: '12px', border: '1px solid #e5e7eb',
          borderRadius: '8px', marginTop: '28px'
        }}>
          Past performance does not guarantee future results. This is a research project.
          All signals are displayed after a 45-day lag. Nothing here constitutes investment advice.
        </div>
      </div>
    </div>
  )
}