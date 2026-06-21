import type { NetworkGraph } from './network'

export const MOCK_MARKET_NETWORK: NetworkGraph = {
  asOf: '2026-06-20',
  window: '1y',
  focus: null,
  nodes: [
    { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', country: 'US', region: 'northAmerica', sector: null, marketCap: 520_000_000_000, degree: 9 },
    { ticker: 'QQQ', name: 'Invesco QQQ Trust', country: 'US', region: 'northAmerica', sector: null, marketCap: 320_000_000_000, degree: 8 },
    { ticker: 'IWM', name: 'iShares Russell 2000 ETF', country: 'US', region: 'northAmerica', sector: null, marketCap: 75_000_000_000, degree: 5 },
    { ticker: 'AAPL', name: 'Apple Inc.', country: 'US', region: 'northAmerica', sector: null, marketCap: 3_350_000_000_000, degree: 7 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', country: 'US', region: 'northAmerica', sector: null, marketCap: 3_150_000_000_000, degree: 7 },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', country: 'US', region: 'northAmerica', sector: null, marketCap: 3_000_000_000_000, degree: 6 },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', country: 'US', region: 'northAmerica', sector: null, marketCap: 610_000_000_000, degree: 4 },
    { ticker: 'XOM', name: 'Exxon Mobil Corporation', country: 'US', region: 'northAmerica', sector: null, marketCap: 480_000_000_000, degree: 4 },
    { ticker: 'VGK', name: 'Vanguard FTSE Europe ETF', country: null, region: 'europe', sector: null, marketCap: 24_000_000_000, degree: 5 },
    { ticker: 'EZU', name: 'iShares MSCI Eurozone ETF', country: null, region: 'europe', sector: null, marketCap: 9_000_000_000, degree: 4 },
    { ticker: 'ASML', name: 'ASML Holding N.V.', country: 'NL', region: 'europe', sector: null, marketCap: 410_000_000_000, degree: 4 },
    { ticker: 'SAP', name: 'SAP SE', country: 'DE', region: 'europe', sector: null, marketCap: 290_000_000_000, degree: 3 },
    { ticker: 'EWJ', name: 'iShares MSCI Japan ETF', country: 'JP', region: 'eastAsia', sector: null, marketCap: 17_000_000_000, degree: 5 },
    { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing', country: 'TW', region: 'eastAsia', sector: null, marketCap: 920_000_000_000, degree: 6 },
    { ticker: 'BABA', name: 'Alibaba Group Holding Limited', country: 'CN', region: 'eastAsia', sector: null, marketCap: 190_000_000_000, degree: 4 },
    { ticker: 'MCHI', name: 'iShares MSCI China ETF', country: 'CN', region: 'eastAsia', sector: null, marketCap: 5_400_000_000, degree: 4 },
    { ticker: 'INDA', name: 'iShares MSCI India ETF', country: 'IN', region: 'india', sector: null, marketCap: 11_000_000_000, degree: 4 },
    { ticker: 'EPI', name: 'WisdomTree India Earnings Fund', country: 'IN', region: 'india', sector: null, marketCap: 3_100_000_000, degree: 3 },
    { ticker: 'EWS', name: 'iShares MSCI Singapore ETF', country: 'SG', region: 'southeastAsia', sector: null, marketCap: 520_000_000, degree: 3 },
    { ticker: 'EZA', name: 'iShares MSCI South Africa ETF', country: 'ZA', region: 'africa', sector: null, marketCap: 260_000_000, degree: 2 },
    { ticker: 'ILF', name: 'iShares Latin America 40 ETF', country: 'BR', region: 'latinAmerica', sector: null, marketCap: 1_200_000_000, degree: 3 },
    { ticker: 'EWA', name: 'iShares MSCI Australia ETF', country: 'AU', region: 'australia', sector: null, marketCap: 1_900_000_000, degree: 3 },
    { ticker: 'UAE', name: 'iShares MSCI UAE ETF', country: 'AE', region: 'middleEast', sector: null, marketCap: 42_000_000, degree: 2 },
  ],
  edges: [
    { source: 'SPY', target: 'QQQ', correlation: 0.91, absCorrelation: 0.91, inMst: true },
    { source: 'SPY', target: 'IWM', correlation: 0.82, absCorrelation: 0.82, inMst: true },
    { source: 'SPY', target: 'VGK', correlation: 0.74, absCorrelation: 0.74, inMst: true },
    { source: 'SPY', target: 'EWJ', correlation: 0.66, absCorrelation: 0.66, inMst: true },
    { source: 'SPY', target: 'ILF', correlation: 0.61, absCorrelation: 0.61, inMst: true },
    { source: 'QQQ', target: 'AAPL', correlation: 0.87, absCorrelation: 0.87, inMst: true },
    { source: 'QQQ', target: 'MSFT', correlation: 0.89, absCorrelation: 0.89, inMst: true },
    { source: 'QQQ', target: 'NVDA', correlation: 0.8, absCorrelation: 0.8, inMst: true },
    { source: 'MSFT', target: 'AAPL', correlation: 0.78, absCorrelation: 0.78, inMst: false },
    { source: 'MSFT', target: 'NVDA', correlation: 0.76, absCorrelation: 0.76, inMst: false },
    { source: 'AAPL', target: 'NVDA', correlation: 0.7, absCorrelation: 0.7, inMst: false },
    { source: 'SPY', target: 'JPM', correlation: 0.72, absCorrelation: 0.72, inMst: true },
    { source: 'SPY', target: 'XOM', correlation: 0.58, absCorrelation: 0.58, inMst: true },
    { source: 'JPM', target: 'IWM', correlation: 0.62, absCorrelation: 0.62, inMst: false },
    { source: 'XOM', target: 'ILF', correlation: 0.52, absCorrelation: 0.52, inMst: false },
    { source: 'VGK', target: 'EZU', correlation: 0.94, absCorrelation: 0.94, inMst: true },
    { source: 'VGK', target: 'ASML', correlation: 0.71, absCorrelation: 0.71, inMst: true },
    { source: 'VGK', target: 'SAP', correlation: 0.67, absCorrelation: 0.67, inMst: true },
    { source: 'ASML', target: 'TSM', correlation: 0.69, absCorrelation: 0.69, inMst: true },
    { source: 'EWJ', target: 'TSM', correlation: 0.65, absCorrelation: 0.65, inMst: true },
    { source: 'EWJ', target: 'MCHI', correlation: 0.5, absCorrelation: 0.5, inMst: false },
    { source: 'TSM', target: 'BABA', correlation: 0.56, absCorrelation: 0.56, inMst: false },
    { source: 'BABA', target: 'MCHI', correlation: 0.86, absCorrelation: 0.86, inMst: true },
    { source: 'INDA', target: 'EPI', correlation: 0.9, absCorrelation: 0.9, inMst: true },
    { source: 'EWJ', target: 'INDA', correlation: 0.46, absCorrelation: 0.46, inMst: true },
    { source: 'INDA', target: 'EWS', correlation: 0.55, absCorrelation: 0.55, inMst: true },
    { source: 'EWS', target: 'EWA', correlation: 0.63, absCorrelation: 0.63, inMst: true },
    { source: 'EWA', target: 'SPY', correlation: 0.57, absCorrelation: 0.57, inMst: true },
    { source: 'ILF', target: 'EZA', correlation: 0.49, absCorrelation: 0.49, inMst: true },
    { source: 'EZA', target: 'VGK', correlation: 0.44, absCorrelation: 0.44, inMst: true },
    { source: 'UAE', target: 'EZA', correlation: 0.4, absCorrelation: 0.4, inMst: true },
    { source: 'UAE', target: 'XOM', correlation: 0.43, absCorrelation: 0.43, inMst: false },
  ],
}

export function sliceMockNetwork(tickerRaw: string, hops = 1): NetworkGraph {
  const ticker = tickerRaw.trim().toUpperCase()
  const maxHops = Math.max(1, Math.min(2, Math.round(hops)))
  const included = new Set<string>([ticker])

  for (let depth = 0; depth < maxHops; depth += 1) {
    const frontier = new Set(included)
    for (const edge of MOCK_MARKET_NETWORK.edges) {
      if (frontier.has(edge.source)) included.add(edge.target)
      if (frontier.has(edge.target)) included.add(edge.source)
    }
  }

  return {
    ...MOCK_MARKET_NETWORK,
    focus: ticker,
    nodes: MOCK_MARKET_NETWORK.nodes.filter((node) => included.has(node.ticker)),
    edges: MOCK_MARKET_NETWORK.edges.filter((edge) => included.has(edge.source) && included.has(edge.target)),
  }
}
