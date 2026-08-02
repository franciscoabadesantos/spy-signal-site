import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function walkRuntimeFiles(relativeDir: string): string[] {
  const directory = path.join(process.cwd(), relativeDir)
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) return walkRuntimeFiles(relativePath)
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [relativePath] : []
  })
}

test('ticker navigation exposes a stable horizontal Research hierarchy', () => {
  const navigation = readRepoFile('components/stocks/stock-nav-config.ts')
  const overview = readRepoFile('components/stocks/StockOverviewClient.tsx')

  for (const label of ['Overview', 'Fundamentals', 'Financials', 'Valuation', 'Signals', 'Events', 'Relationships', 'Profile', 'Ownership & Capital', 'AI Research', 'Methodology']) assert.match(navigation, new RegExp(`label: '${label.replace(/[&]/g, '\\&')}'`))
  assert.match(navigation, /Income Statement/)
  assert.match(navigation, /Balance Sheet/)
  assert.match(navigation, /Cash Flow/)
  assert.match(navigation, /Signal History/)
  assert.match(navigation, /Indicator Details/)
  assert.doesNotMatch(navigation, /label: 'Lens'/)
  assert.match(overview, /id="fundamentals"/)
  assert.match(overview, /id="signals"/)
  assert.match(overview, /id="relationships"/)
  assert.match(overview, /PerspectiveDial/)
  assert.match(overview, />Technicals</)
  assert.match(overview, />Fundamentals</)
  assert.match(overview, />Relationships</)
  assert.match(overview, /label: 'Summary'/)
  assert.match(overview, /label: 'Oscillators'/)
  assert.match(overview, /label: 'Moving averages'/)
  assert.match(overview, /data-overview-grade/)
  assert.match(overview, /navigationSlot/)
  assert.match(overview, /orderedFundamentalGroups\.slice\(0, 6\)/)
  assert.doesNotMatch(overview, /snapshotAxes|snapshotAxisLabels|Why this grade\?|Shared across perspectives|Canonical grade/)
  assert.doesNotMatch(overview, /Is now a good moment|Is the business attractive|What is moving with it|What shapes this asset/)
  assert.doesNotMatch(overview, /Continue researching|Go deeper|Lens score/)
  assert.doesNotMatch(overview, /strokeDasharray=.*clamped/)
  assert.doesNotMatch(overview, /View fundamental details|SignalFlowStream|SignalDistributionBubbleCluster|RegimeHistoryChart/)
  assert.doesNotMatch(overview, /AiAnalystPanel|Research Copilot/)
})

test('Investment Lens is URL-addressable, semantic, and never scored in the frontend', () => {
  const overview = readRepoFile('components/stocks/StockOverviewClient.tsx')
  const selector = readRepoFile('components/stocks/PerspectiveDial.tsx')
  const contract = readRepoFile('docs/features/investment-lens.md')
  const lensConfig = readRepoFile('lib/investment-lens.ts')

  assert.match(selector, /role="radiogroup"/)
  assert.match(selector, /type="radio"/)
  assert.match(selector, /onPointerMove/)
  assert.match(selector, /onWheel/)
  assert.match(selector, /ArrowRight/)
  assert.match(selector, /params\.set\('lens', nextValue\)/)
  assert.match(lensConfig, /trade: '1M'/)
  assert.match(lensConfig, /long: '5Y'/)
  assert.match(contract, /frontend may change hierarchy, chart windows and evidence emphasis by Lens/i)
  assert.match(contract, /must not calculate or imply a Lens Score/i)
  assert.match(contract, /Missing factors are never treated as neutral zeroes/i)
  assert.doesNotMatch(overview, /const\s+lensScore\s*=|reduce\([^)]*weight/i)
})

test('legacy ticker detail routes resolve to stable research destinations', () => {
  const expectedRedirects: Array<[string, string]> = [
    ['app/(app)/stocks/[ticker]/financials/[statement]/page.tsx', '/financials'],
    ['app/(app)/stocks/[ticker]/holdings-dividends/page.tsx', '/fundamentals'],
    ['app/(app)/stocks/[ticker]/signal-history/page.tsx', '/signals'],
    ['app/(app)/stocks/[ticker]/performance/page.tsx', '/signals'],
  ]

  for (const [file, anchor] of expectedRedirects) {
    const source = readRepoFile(file)
    assert.match(source, /permanentRedirect/)
    assert.ok(source.includes(anchor), `${file} should redirect to ${anchor}`)
  }
  assert.match(readRepoFile('app/(app)/stocks/[ticker]/profile/page.tsx'), /StockProfileResearch/)
  assert.match(readRepoFile('app/(app)/stocks/[ticker]/fundamentals/page.tsx'), /StockFundamentalsResearch/)
  assert.match(readRepoFile('app/(app)/stocks/[ticker]/financials/page.tsx'), /StockFinancialStatementsResearch/)
})

test('Phase 2 research views preserve Lens and do not simulate statement data', () => {
  const navigation = readRepoFile('components/stocks/StockResearchNav.tsx')
  const tabs = readRepoFile('components/stocks/StockTabsAuto.tsx')
  const profile = readRepoFile('components/stocks/StockProfileResearch.tsx')
  const fundamentals = readRepoFile('components/stocks/StockFundamentalsResearch.tsx')
  const financials = readRepoFile('components/stocks/StockFinancialStatementsResearch.tsx')
  const overviewLink = readRepoFile('components/stocks/ResearchOverviewLink.tsx')
  const contract = readRepoFile('docs/features/ticker-research-views.md')

  assert.match(navigation, /stockResearchHref\(ticker, item, lens\)/)
  assert.match(navigation, /aria-label="Ticker research"/)
  assert.match(navigation, /scrollTo/)
  assert.match(navigation, /ArrowDown/)
  assert.match(navigation, /Escape/)
  assert.doesNotMatch(navigation, /Perspective|lensLabel|Company & fund|Market evidence/)
  assert.match(tabs, /parseInvestmentLens\(searchParams\.get\('lens'\)\)/)
  assert.match(profile, /Fund Profile/)
  assert.match(profile, /Company Profile/)
  assert.match(fundamentals, /EQUITY_PRIORITY/)
  assert.match(fundamentals, /FUND_PRIORITY/)
  assert.match(financials, /canonicalRows/)
  assert.match(financials, /lineItemId/)
  assert.match(financials, /statementHref/)
  assert.match(financials, /aria-label="Reporting frequency"/)
  assert.doesNotMatch(financials, /Math\.random|mock|fake/i)
  assert.match(overviewLink, /\?lens=\$\{lens\}/)
  assert.match(contract, /canonical financial statement contract/i)
})

test('canonical research views use shared ticker-scoped backend contracts', () => {
  const helper = readRepoFile('lib/canonical-research.ts')
  const financialsPage = readRepoFile('app/(app)/stocks/[ticker]/financials/page.tsx')
  const eventsPage = readRepoFile('app/(app)/stocks/[ticker]/events/page.tsx')
  const valuationPage = readRepoFile('app/(app)/stocks/[ticker]/valuation/page.tsx')
  const overview = readRepoFile('components/stocks/StockOverviewClient.tsx')
  const valuation = readRepoFile('components/stocks/StockValuationResearch.tsx')
  const temporalChart = readRepoFile('components/charts/TemporalLineChart.tsx')
  const temporalChartStyles = readRepoFile('components/charts/TemporalLineChart.module.css')

  assert.match(helper, /import 'server-only'/)
  assert.match(helper, /\/tickers\/\$\{encodeURIComponent\(ticker\)\}\/financial-statements/)
  assert.match(helper, /\/tickers\/\$\{encodeURIComponent\(ticker\)\}\/market-metrics/)
  assert.match(helper, /\/tickers\/\$\{encodeURIComponent\(ticker\)\}\/events/)
  assert.match(helper, /\/tickers\/\$\{encodeURIComponent\(ticker\)\}\/disclosures/)
  assert.doesNotMatch(helper, /\/analyst\//)
  assert.match(financialsPage, /getTickerFinancialStatements/)
  assert.match(eventsPage, /getTickerEvents/)
  assert.match(eventsPage, /getTickerDisclosures/)
  assert.match(valuationPage, /getTickerMarketMetrics/)
  assert.match(overview, /TemporalLineChart/)
  assert.match(valuation, /TemporalLineChart/)
  assert.doesNotMatch(valuation, /observationRow/)
  assert.match(temporalChart, /data-temporal-line-chart/)
  assert.match(temporalChart, /showRangeChange/)
  assert.match(temporalChartStyles, /animation: draw-line/)
  assert.match(temporalChartStyles, /prefers-reduced-motion: reduce/)
})

test('frontoffice runtime contains no direct Yahoo or Supabase client path', () => {
  const source = ['app', 'components', 'lib']
    .flatMap(walkRuntimeFiles)
    .map(readRepoFile)
    .join('\n')

  assert.doesNotMatch(source, /@supabase\/supabase-js|createClient\s*\([^)]*SUPABASE/s)
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE/)
  assert.doesNotMatch(source, /query[12]\.finance\.yahoo\.com|searchYahoo|YahooSearch/)
})
