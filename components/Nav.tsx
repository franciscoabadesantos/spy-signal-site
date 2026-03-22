import Link from 'next/link'

export default function Nav({ active }: { active: 'overview' | 'performance' | 'methodology' }) {
  const tabs = [
    { label: 'Overview', href: '/' },
    { label: 'Performance', href: '/performance' },
    { label: 'Methodology', href: '/methodology' },
  ]

  return (
    <>
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

      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex' }}>
        {tabs.map(tab => (
          <Link key={tab.label} href={tab.href} style={{
            padding: '10px 16px', fontSize: '13px',
            color: tab.href === `/${active === 'overview' ? '' : active}` ? '#1a1a1a' : '#6b7280',
            borderBottom: tab.href === `/${active === 'overview' ? '' : active}` ? '2px solid #1a1a1a' : '2px solid transparent',
            fontWeight: tab.href === `/${active === 'overview' ? '' : active}` ? 500 : 400,
            textDecoration: 'none',
          }}>
            {tab.label}
          </Link>
        ))}
      </div>
    </>
  )
}
