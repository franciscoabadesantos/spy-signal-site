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

test('ticker navigation exposes Overview, Relationships, and the complete Research menu', () => {
  const navigation = readRepoFile('components/stocks/stock-nav-config.ts')
  const overview = readRepoFile('components/stocks/StockOverviewClient.tsx')

  assert.match(navigation, /label: 'Overview'/)
  assert.match(navigation, /label: 'Relationships'/)
  for (const label of ['Lens', 'Fundamentals', 'Financial Statements', 'Valuation History', 'Ownership & Capital', 'Company Profile', 'Signal History', 'Indicator Details', 'Earnings & Events', 'AI Research', 'Methodology']) assert.match(navigation, new RegExp(label.replace(/[&]/g, '\\&')))
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
  assert.match(readRepoFile('app/(app)/stocks/[ticker]/fundamentals/page.tsx'), /StockResearchDestination/)
  assert.match(readRepoFile('app/(app)/stocks/[ticker]/financials/page.tsx'), /kind="financials"/)
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
