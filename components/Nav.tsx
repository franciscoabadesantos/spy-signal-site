import Link from 'next/link'

type NavActive = 'overview' | 'performance' | 'methodology'

export default function Nav({ active }: { active: NavActive }) {
  const tabs = [
    { label: 'Overview', href: '/', key: 'overview' as const },
    { label: 'Performance', href: '/performance', key: 'performance' as const },
    { label: 'Methodology', href: '/methodology', key: 'methodology' as const },
  ]

  return (
    <>
      <nav
        style={{
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          height: '48px',
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
            color: '#1a1a1a',
          }}
        >
          SPY · Timing & Allocation
        </Link>

        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Research project · Not investment advice
        </span>
      </nav>

      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex' }}>
        {tabs.map((tab) => {
          const isActive = tab.key === active

          return (
            <Link
              key={tab.key}
              href={tab.href}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                color: isActive ? '#1a1a1a' : '#6b7280',
                borderBottom: isActive
                  ? '2px solid #1a1a1a'
                  : '2px solid transparent',
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}