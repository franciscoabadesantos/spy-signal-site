import { getLatestSignal, getRecentSignals } from '@/lib/signals'
import Link from 'next/link'

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

function formatConfidence(prob: number | null) {
  if (prob === null) return '—'
  return `${(prob * 100).toFixed(0)}%`
}

function DirectionBadge({ direction }: { direction: string }) {
  const styles: Record<string, string> = {
    bullish: 'background:#EAF3DE;color:#27500A',
    bearish: 'background:#FCEBEB;color:#791F1F',
    neutral: 'background:#F1EFE8;color:#5F5E5A',
  }
  return (
    <span style={{
      ...Object.fromEntries((styles[direction] ?? styles.neutral).split(';').map(s => s.split(':'))),
      padding: '2px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {direction.charAt(0).toUpperCase() + direction.slice(1)}
    </span>
  )
}

export default async function Home() {
  const [latest, signals] = await Promise.all([
    getLatestSignal(),
    getRecentSignals(20),
  ])

  const maturedSignals = signals.filter(s => s.realized_return !== null)
  const hitRate = maturedSignals.length > 0
    ? (maturedSignals.filter(s => s.correct).length / maturedSignals.length * 100).toFixed(1)
    : null

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        height: '48px',
      }}>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>SPY · ML Signal</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Research project · Not investment advice</span>
      </nav>

      {/* Hero */}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · ML Directional Model
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
          SPY Direction Model
        </div>
        {latest ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 600,
                color: latest.direction === 'bullish' ? '#27500A' : latest.direction === 'bearish' ? '#791F1F' : '#5F5E5A'
              }}>
                {latest.direction.toUpperCase()}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {formatConfidence(latest.prob_side)} confidence
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Signal date: {formatDate(latest.signal_date)} · {latest.prediction_horizon}-day horizon · 45-day display lag applied
            </div>
          </>
        ) : (
          <div style={{ color: '#6b7280' }}>No signals yet</div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0' }}>
        {[
          { label: 'Overview', href: '/' },
          { label: 'Performance', href: '/performance' },
          { label: 'Methodology', href: '/methodology' },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} style={{
            padding: '10px 16px',
            fontSize: '13px',
            color: tab.href === '/' ? '#1a1a1a' : '#6b7280',
            borderBottom: tab.href === '/' ? '2px solid #1a1a1a' : '2px solid transparent',
            fontWeight: tab.href === '/' ? 500 : 400,
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', padding: '20px 0' }}>

        {/* Left column */}
        <div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Latest direction', value: latest?.direction.toUpperCase() ?? '—', color: latest?.direction === 'bullish' ? '#27500A' : latest?.direction === 'bearish' ? '#791F1F' : undefined },
              { label: 'Confidence', value: formatConfidence(latest?.prob_side ?? null) },
              { label: 'Hit rate (live)', value: hitRate ? `${hitRate}%` : '—' },
            ].map(card => (
              <div key={card.label} style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: card.color ?? '#1a1a1a' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Signal history table */}
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Signal history</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Signal date', 'Direction', 'Confidence', 'Horizon', 'SPY return', 'Outcome'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0',
                    color: '#6b7280', fontWeight: 400,
                    borderBottom: '1px solid #e5e7eb', fontSize: '12px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.map(signal => (
                <tr key={signal.id}>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                    {formatDate(signal.signal_date)}
                  </td>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <DirectionBadge direction={signal.direction} />
                  </td>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {formatConfidence(signal.prob_side)}
                  </td>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {signal.prediction_horizon}d
                  </td>
                  <td style={{
                    padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                    color: signal.realized_return === null ? '#9ca3af' : signal.realized_return >= 0 ? '#27500A' : '#791F1F'
                  }}>
                    {formatReturn(signal.realized_return)}
                  </td>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                    {signal.correct === null ? (
                      <span style={{ color: '#9ca3af' }}>Pending</span>
                    ) : signal.correct ? (
                      <span style={{ color: '#27500A' }}>✓ Correct</span>
                    ) : (
                      <span style={{ color: '#791F1F' }}>✗ Incorrect</span>
                    )}
                  </td>
                </tr>
              ))}
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

        {/* Right sidebar */}
        <div>
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: '8px',
            padding: '14px 16px', marginBottom: '14px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Model summary</div>
            {[
              { key: 'Target', val: 'SPY directional movement' },
              { key: 'Horizon', val: `${latest?.prediction_horizon ?? 20} trading days` },
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
