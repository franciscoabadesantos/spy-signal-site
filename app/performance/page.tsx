import { getRecentSignals } from '@/lib/signals'
import Link from 'next/link'

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

export default async function Performance() {
  const signals = await getRecentSignals(200)
  const matured = signals.filter(s => s.realized_return !== null)

  const totalSignals = matured.length
  const correct = matured.filter(s => s.correct).length
  const hitRate = totalSignals > 0 ? (correct / totalSignals * 100).toFixed(1) : null

  const bullish = matured.filter(s => s.direction === 'bullish')
  const bearish = matured.filter(s => s.direction === 'bearish')

  const avgReturn = totalSignals > 0
    ? (matured.reduce((sum, s) => sum + (s.realized_return ?? 0), 0) / totalSignals * 100).toFixed(2)
    : null

  const bullishHitRate = bullish.length > 0
    ? (bullish.filter(s => s.correct).length / bullish.length * 100).toFixed(1)
    : null

  const bearishHitRate = bearish.length > 0
    ? (bearish.filter(s => s.correct).length / bearish.length * 100).toFixed(1)
    : null

  const returns = matured.map(s => s.realized_return ?? 0)
  const maxDrawdown = returns.length > 0 ? (Math.min(...returns) * 100).toFixed(2) : null

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        gap: '24px', height: '48px',
      }}>
        <Link href="/" style={{ fontWeight: 600, fontSize: '15px', textDecoration: 'none', color: '#1a1a1a' }}>
          SPY · ML Signal
        </Link>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Research project · Not investment advice</span>
      </nav>

      {/* Header */}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · ML Directional Model
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600 }}>Live performance</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          Out-of-sample signals only · Outcomes filled after prediction horizon matures
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex' }}>
        {[
          { label: 'Overview', href: '/' },
          { label: 'Performance', href: '/performance' },
          { label: 'Methodology', href: '/methodology' },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} style={{
            padding: '10px 16px', fontSize: '13px',
            color: tab.href === '/performance' ? '#1a1a1a' : '#6b7280',
            borderBottom: tab.href === '/performance' ? '2px solid #1a1a1a' : '2px solid transparent',
            fontWeight: tab.href === '/performance' ? 500 : 400,
            textDecoration: 'none',
          }}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 0' }}>

        {/* Summary stats */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Summary statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Total signals (matured)', value: totalSignals > 0 ? String(totalSignals) : '—' },
            { label: 'Hit rate', value: hitRate ? `${hitRate}%` : '—' },
            { label: 'Avg signal return', value: avgReturn ? `${avgReturn}%` : '—', color: avgReturn && parseFloat(avgReturn) >= 0 ? '#27500A' : '#791F1F' },
            { label: 'Worst single return', value: maxDrawdown ? `${maxDrawdown}%` : '—', color: '#791F1F' },
          ].map(card => (
            <div key={card.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: card.color ?? '#1a1a1a' }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* By direction */}
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Hit rate by direction</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Bullish signals', value: bullishHitRate ? `${bullishHitRate}%` : '—', sub: `${bullish.length} signals`, color: '#27500A' },
            { label: 'Bearish signals', value: bearishHitRate ? `${bearishHitRate}%` : '—', sub: `${bearish.length} signals`, color: '#791F1F' },
            { label: 'Overall', value: hitRate ? `${hitRate}%` : '—', sub: `${totalSignals} signals`, color: '#1a1a1a' },
          ].map(card => (
            <div key={card.label} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 500, color: card.color, marginBottom: '2px' }}>{card.value}</div>
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
                {['Signal date', 'Direction', 'Horizon', 'SPY return', 'Outcome'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 0',
                    color: '#6b7280', fontWeight: 400,
                    borderBottom: '1px solid #e5e7eb', fontSize: '12px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matured.map(signal => (
                <tr key={signal.id}>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                    {formatDate(signal.signal_date)}
                  </td>
                  <td style={{ padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                      background: signal.direction === 'bullish' ? '#EAF3DE' : signal.direction === 'bearish' ? '#FCEBEB' : '#F1EFE8',
                      color: signal.direction === 'bullish' ? '#27500A' : signal.direction === 'bearish' ? '#791F1F' : '#5F5E5A',
                    }}>
                      {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}
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
                    {signal.correct
                      ? <span style={{ color: '#27500A' }}>✓ Correct</span>
                      : <span style={{ color: '#791F1F' }}>✗ Incorrect</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Disclaimer */}
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
