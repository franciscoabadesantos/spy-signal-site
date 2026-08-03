import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import type { ResearchTheme, StockResearchData } from '@/lib/stock-research'
import styles from './ResearchViews.module.css'

const EQUITY_PRIORITY = ['financial-health', 'growth', 'valuation', 'profitability', 'shareholder-return', 'other']

const FUND_PRIORITY = ['risk', 'exposure', 'portfolio', 'valuation', 'distributions', 'other']

function orderedThemes(data: StockResearchData): ResearchTheme[] {
  const order = data.kind === 'fund' ? FUND_PRIORITY : EQUITY_PRIORITY
  return [...data.themes].sort((left, right) => {
    const leftIndex = order.indexOf(left.key)
    const rightIndex = order.indexOf(right.key)
    return (leftIndex < 0 ? order.length : leftIndex) - (rightIndex < 0 ? order.length : rightIndex)
  })
}

export default function StockFundamentalsResearch({ data }: { data: StockResearchData }) {
  const themes = orderedThemes(data)
  const primaryTheme = themes[0]?.key

  return (
    <ResearchViewShell data={data} title="Fundamentals">
      <nav className={styles.themeNav} aria-label="Fundamental themes">
        {themes.map((theme) => <a key={theme.key} href={`#${theme.key}`}>{theme.label}</a>)}
      </nav>

      <div className={styles.themes}>
        {themes.map((theme) => (
          <section className={styles.theme} id={theme.key} key={theme.key} data-priority={theme.key === primaryTheme}>
            <div className={styles.themeTitle}>
              <h2>{theme.label}</h2>
              <p>{theme.metrics.length > 0 ? `${theme.metrics.length} current metric${theme.metrics.length === 1 ? '' : 's'}` : 'Data pending'}</p>
            </div>
            <div className={styles.themeEvidence}>
              {theme.metrics.length > 0 ? (
                <dl className={styles.metricList}>
                  {theme.metrics.slice(0, 14).map((metric) => (
                    <div className={styles.metricRow} key={metric.key}>
                      <dt>
                        {metric.label}
                        {metric.period || metric.unit ? <span className={styles.metricMeta}>{[metric.period, metric.unit].filter(Boolean).join(' · ')}</span> : null}
                      </dt>
                      <dd>{metric.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className={styles.pending}>
                  <span>Partial coverage</span>
                  <strong>No current metrics for this theme</strong>
                </div>
              )}
              <div className={styles.trendPlaceholder} aria-label={`${theme.label} trend preview`}>
                <strong>Historical trend</strong>
                <span>Data pending</span>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className={styles.chapterGrid}>
        <div className={styles.chapterIntro}>
          <h2>Financial evidence</h2>
          <p>Statement-level periods and line items live in the dedicated view.</p>
        </div>
        <div className={styles.chapterBody}>
          <Link className="action-link inline-flex" href={`/stocks/${data.ticker}/financials`}>Open Financial Statements →</Link>
        </div>
      </div>

      <ResearchAdPlacement />
    </ResearchViewShell>
  )
}
