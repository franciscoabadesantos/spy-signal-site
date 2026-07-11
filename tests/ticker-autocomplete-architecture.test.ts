import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  filterTickerIndexItems,
  mergeTickerEnrichmentResult,
  normalizeTickerIndexPayload,
} from '../lib/ticker-search'

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function walkFiles(relativeDir: string): string[] {
  const dir = path.join(process.cwd(), relativeDir)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(relativePath))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(relativePath)
    }
  }

  return files
}

test('autocomplete has no network search request for typed queries', () => {
  const source = readRepoFile('components/search/TickerSearchCombobox.tsx')

  assert.match(source, /\/api\/tickers\/index/)
  assert.match(source, /\/api\/tickers\/enrich\?symbols=/)
  assert.doesNotMatch(source, /\/api\/search/)
  assert.doesNotMatch(source, /\/api\/tickers\/enrich\?q=/)
  assert.doesNotMatch(source, /fetch\([^)]*[?&]q=/s)
  assert.doesNotMatch(source, /displaySource: 'manual'/)
  assert.doesNotMatch(source, /Open this ticker/)
  assert.doesNotMatch(source, /request onboarding/)
})

test('autocomplete runtime path contains no Yahoo or external discovery code', () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), 'app/api/search/route.ts')), false)

  const files = [
    ...walkFiles('app/api/tickers'),
    'components/search/TickerSearchCombobox.tsx',
    'lib/ticker-search.ts',
  ]
  const source = files.map((file) => readRepoFile(file)).join('\n')

  assert.doesNotMatch(source, /query2\.finance\.yahoo\.com\/v1\/finance\/search/)
  assert.doesNotMatch(source, /enableFuzzyQuery/)
  assert.doesNotMatch(source, /YahooSearch/)
  assert.doesNotMatch(source, /searchYahoo/)
})

test('local index suggestions are available without enrichment', () => {
  const index = normalizeTickerIndexPayload(
    {
      items: [
        { symbol: 'GME', name: 'GameStop Corp.', exchange: 'NYSE', hasSignals: false },
        { symbol: 'ABNB', name: 'Airbnb, Inc.', exchange: 'NASDAQ', hasSignals: false },
      ],
    },
    null
  )

  assert.ok(index)
  assert.deepEqual(
    filterTickerIndexItems(index.items, 'gamestop', 8).map((item) => ({
      name: item.name,
      scorecard: item.scorecard,
      symbol: item.symbol,
    })),
    [{ name: 'GameStop Corp.', scorecard: null, symbol: 'GME' }]
  )
})

test('missing enrichment does not remove or replace a base suggestion', () => {
  const base = {
    symbol: 'ABNB',
    name: 'Airbnb, Inc.',
    exchange: 'NASDAQ',
    hasSignals: false,
    convictionPct: null,
    tone: null,
    signalDate: null,
    scorecard: null,
    readiness: null,
  }

  assert.deepEqual(mergeTickerEnrichmentResult(base, null), base)
})
