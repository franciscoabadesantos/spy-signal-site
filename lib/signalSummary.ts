export type SignalDirection = 'bullish' | 'bearish' | 'neutral'

export type ConvictionBand = 'no-edge' | 'weak' | 'developing' | 'high'

export function convictionPercent(value: number | null): number | null {
  if (value === null) return null
  const scaled = value > 1 ? value : value * 100
  if (!Number.isFinite(scaled)) return null
  return Math.max(0, Math.min(100, scaled))
}

export function convictionBand(convictionPct: number | null): ConvictionBand {
  if (convictionPct === null || convictionPct < 20) return 'no-edge'
  if (convictionPct < 50) return 'weak'
  if (convictionPct < 70) return 'developing'
  return 'high'
}

export function signalHeadline(direction: SignalDirection, band: ConvictionBand): string {
  if (direction === 'bullish' && band === 'high') return 'Strong bullish setup'
  if (direction === 'bullish' && band === 'developing') return 'Bullish bias building'
  if (direction === 'bullish' && band === 'weak') return 'Weak bullish bias'
  if (direction === 'bullish') return 'Weak signal — no actionable edge'

  if (direction === 'bearish' && band === 'high') return 'High conviction bearish setup'
  if (direction === 'bearish' && band === 'developing') return 'Downside risk building'
  if (direction === 'bearish' && band === 'weak') return 'Weak bearish bias'
  if (direction === 'bearish') return 'Weak signal — no actionable edge'

  if (band === 'high') return 'High conviction range setup'
  if (band === 'developing') return 'Developing neutral regime'
  if (band === 'weak') return 'Weak signal — no actionable edge'
  return 'No actionable edge'
}

export function signalHeadlineFromInputs(
  direction: SignalDirection,
  conviction: number | null
): string {
  return signalHeadline(direction, convictionBand(convictionPercent(conviction)))
}

export function shortSignalHeadline(
  direction: SignalDirection,
  conviction: number | null
): string {
  const band = convictionBand(convictionPercent(conviction))
  if (band === 'no-edge') return 'No edge'
  if (direction === 'bullish' && band === 'high') return 'Strong bullish'
  if (direction === 'bullish' && band === 'developing') return 'Bullish building'
  if (direction === 'bullish') return 'Weak bullish'
  if (direction === 'bearish' && band === 'high') return 'Strong bearish'
  if (direction === 'bearish' && band === 'developing') return 'Downside building'
  if (direction === 'bearish') return 'Weak bearish'
  if (band === 'high') return 'Range conviction'
  if (band === 'developing') return 'Neutral developing'
  return 'No edge'
}

export function rowSignalQualityLabel(
  direction: SignalDirection,
  conviction: number | null
): string {
  const band = convictionBand(convictionPercent(conviction))
  if (band === 'high') return 'High quality'
  if (band === 'developing') return direction === 'neutral' ? 'Mixed quality' : 'Building quality'
  if (band === 'weak') return 'Weak quality'
  return 'No quality edge'
}
