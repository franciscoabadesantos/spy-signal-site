import assert from 'node:assert/strict'
import test from 'node:test'
import { GET, parseEnrichmentSymbols } from '../app/api/tickers/enrich/route'

function preserveEnv() {
  const original = {
    BACKEND_BASE_URL: process.env.BACKEND_BASE_URL,
    BACKEND_SHARED_SECRET: process.env.BACKEND_SHARED_SECRET,
    CF_ACCESS_CLIENT_ID: process.env.CF_ACCESS_CLIENT_ID,
    CF_ACCESS_CLIENT_SECRET: process.env.CF_ACCESS_CLIENT_SECRET,
    FINANCE_BACKEND_URL: process.env.FINANCE_BACKEND_URL,
  }

  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('ticker enrichment symbols are validated, deduped, and capped server-side', () => {
  assert.deepEqual(
    parseEnrichmentSymbols('aapl,AAPL,bad!,msft,goog,amzn,meta,tsla,nvda,orcl,ibm'),
    ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'ORCL']
  )
})

test('ticker enrichment ignores invalid-only input without backend work', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    throw new Error('fetch should not be called for invalid symbols')
  }

  try {
    const response = await GET(new Request('https://site.example.test/api/tickers/enrich?symbols=bad!,@@@'))
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(fetchCalled, false)
    assert.deepEqual(payload.results, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('ticker enrichment times out fail-soft and keeps basic symbol rows', async () => {
  const restoreEnv = preserveEnv()
  const originalFetch = globalThis.fetch

  process.env.BACKEND_BASE_URL = 'https://backend.example.test'
  delete process.env.FINANCE_BACKEND_URL
  process.env.BACKEND_SHARED_SECRET = 'shared-secret'
  delete process.env.CF_ACCESS_CLIENT_ID
  delete process.env.CF_ACCESS_CLIENT_SECRET

  globalThis.fetch = async () => new Promise<Response>(() => {})

  try {
    const startedAt = Date.now()
    const response = await GET(new Request('https://site.example.test/api/tickers/enrich?symbols=slow1'))
    const elapsedMs = Date.now() - startedAt
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.fallbackUsed, true)
    assert.ok(elapsedMs < 2500)
    assert.deepEqual(
      payload.results.map((item: { symbol: string; scorecard: unknown }) => ({
        scorecard: item.scorecard,
        symbol: item.symbol,
      })),
      [{ scorecard: null, symbol: 'SLOW1' }]
    )
  } finally {
    globalThis.fetch = originalFetch
    restoreEnv()
  }
})
