import type { TickerRelationships } from './relationships'

export function usableRelationshipSymbols(relationships: TickerRelationships): string[] {
  const symbols = [
    ...relationships.residualCoMovers.map((item) => item.symbol),
    ...relationships.themePeers.map((item) => item.symbol),
    ...relationships.leadLag.followers.map((item) => item.symbol),
    ...relationships.leadLag.leaders.map((item) => item.symbol),
    ...relationships.marketCoMovers.map((item) => item.symbol),
  ]

  return symbols.filter(
    (symbol, index) => symbol !== relationships.ticker && symbols.indexOf(symbol) === index
  )
}

export function hasRelationshipExperience(
  relationships: TickerRelationships,
  minimum = 6
): boolean {
  return usableRelationshipSymbols(relationships).length >= minimum
}
