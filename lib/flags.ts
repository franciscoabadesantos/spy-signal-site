/**
 * Feature flags. Model-signal surfaces (stance, conviction, signal history,
 * regime) currently render placeholder data — no public models exist yet — so
 * they stay hidden until NEXT_PUBLIC_ENABLE_MODEL_SIGNALS is set. When off,
 * gated surfaces render nothing (no teasers, no fake data).
 */

function flagEnabled(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

export function modelSignalsEnabled(): boolean {
  return flagEnabled(process.env.NEXT_PUBLIC_ENABLE_MODEL_SIGNALS)
}

export function labShowcaseEnabled(): boolean {
  return flagEnabled(process.env.NEXT_PUBLIC_ENABLE_LAB_SHOWCASE)
}
