export type ScorecardAxisKey = 'value' | 'potential' | 'health' | 'income' | 'momentum'

export type ScorecardOverall = {
  score: number | null
  grade: string
  label: string
}

export type ScorecardAxis = {
  key: ScorecardAxisKey
  label: string
  score: number | null
  available: boolean
  hint?: string | null
}

export type Scorecard = {
  asOf: string | null
  overall: ScorecardOverall
  axes: ScorecardAxis[]
}

export const SCORECARD_AXIS_ORDER: ScorecardAxisKey[] = [
  'value',
  'potential',
  'health',
  'income',
  'momentum',
]

export const SCORECARD_AXIS_LABELS: Record<ScorecardAxisKey, string> = {
  value: 'Value',
  potential: 'Potential',
  health: 'Health',
  income: 'Income',
  momentum: 'Momentum',
}

type Rgb = [number, number, number]

function clampScore(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, amount))
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount))
  return [
    Math.round(lerp(from[0], to[0], t)),
    Math.round(lerp(from[1], to[1], t)),
    Math.round(lerp(from[2], to[2], t)),
  ]
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0')
}

function rgbToHex([red, green, blue]: Rgb): string {
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

export function scoreColor(score: number | null | undefined): string {
  const clamped = clampScore(score)
  const red: Rgb = [226, 61, 46]
  const amber: Rgb = [217, 154, 11]
  const green: Rgb = [18, 183, 106]

  if (clamped <= 50) {
    return rgbToHex(mixRgb(red, amber, clamped / 50))
  }
  return rgbToHex(mixRgb(amber, green, (clamped - 50) / 50))
}

export function scoreGrade(score: number | null | undefined): string {
  const clamped = clampScore(score)
  if (clamped >= 85) return 'A'
  if (clamped >= 80) return 'A-'
  if (clamped >= 72) return 'B+'
  if (clamped >= 64) return 'B'
  if (clamped >= 56) return 'B-'
  if (clamped >= 48) return 'C+'
  if (clamped >= 40) return 'C'
  if (clamped >= 32) return 'C-'
  if (clamped >= 24) return 'D'
  return 'F'
}

export function scoreLabel(score: number | null | undefined): string {
  const clamped = clampScore(score)
  if (clamped >= 80) return 'Strong'
  if (clamped >= 64) return 'Solid'
  if (clamped >= 48) return 'Mixed'
  if (clamped >= 32) return 'Weak'
  return 'Fragile'
}

export function normalizeScorecard(raw: unknown): Scorecard | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  const overallRecord =
    record.overall && typeof record.overall === 'object' && !Array.isArray(record.overall)
      ? (record.overall as Record<string, unknown>)
      : null
  if (!overallRecord) return null

  const rawScore = overallRecord.score
  const overallScore =
    typeof rawScore === 'number' && Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : null
  const grade =
    typeof overallRecord.grade === 'string' && overallRecord.grade.trim()
      ? overallRecord.grade.trim().slice(0, 3)
      : scoreGrade(overallScore)
  const label =
    typeof overallRecord.label === 'string' && overallRecord.label.trim()
      ? overallRecord.label.trim().slice(0, 24)
      : scoreLabel(overallScore)

  const rawAxes = Array.isArray(record.axes) ? record.axes : []
  const axesByKey = new Map<ScorecardAxisKey, ScorecardAxis>()
  for (const item of rawAxes) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const axis = item as Record<string, unknown>
    const key = typeof axis.key === 'string' ? axis.key.trim().toLowerCase() : ''
    if (!SCORECARD_AXIS_ORDER.includes(key as ScorecardAxisKey)) continue
    const typedKey = key as ScorecardAxisKey
    const rawAxisScore = axis.score
    const axisScore =
      typeof rawAxisScore === 'number' && Number.isFinite(rawAxisScore)
        ? Math.max(0, Math.min(100, Math.round(rawAxisScore)))
        : null
    const available = axis.available === true && axisScore !== null
    axesByKey.set(typedKey, {
      key: typedKey,
      label:
        typeof axis.label === 'string' && axis.label.trim()
          ? axis.label.trim().slice(0, 28)
          : SCORECARD_AXIS_LABELS[typedKey],
      score: available ? axisScore : null,
      available,
      hint: typeof axis.hint === 'string' && axis.hint.trim() ? axis.hint.trim().slice(0, 160) : null,
    })
  }

  const axes = SCORECARD_AXIS_ORDER.map((key) => {
    const axis = axesByKey.get(key)
    if (axis) return axis
    return {
      key,
      label: SCORECARD_AXIS_LABELS[key],
      score: null,
      available: false,
      hint: 'No scorecard data available yet.',
    }
  })

  return {
    asOf: typeof record.asOf === 'string' && record.asOf.trim() ? record.asOf.trim() : null,
    overall: {
      score: overallScore,
      grade,
      label,
    },
    axes,
  }
}

export function buildFixtureScorecard(ticker: string, seedScore = 62): Scorecard {
  const score = Math.max(0, Math.min(100, Math.round(seedScore)))
  return {
    asOf: null,
    overall: {
      score,
      grade: scoreGrade(score),
      label: scoreLabel(score),
    },
    axes: [
      { key: 'value', label: 'Value', score: Math.max(0, Math.min(100, score - 5)), available: true },
      { key: 'potential', label: 'Potential', score: Math.max(0, Math.min(100, score + 3)), available: true },
      { key: 'health', label: 'Health', score: Math.max(0, Math.min(100, score + 8)), available: true },
      {
        key: 'income',
        label: 'Income',
        score: null,
        available: false,
        hint: `${ticker.toUpperCase()} income needs dividend data.`,
      },
      { key: 'momentum', label: 'Momentum', score: Math.max(0, Math.min(100, score + 14)), available: true },
    ],
  }
}

export function buildUnavailableScorecard(label = 'No data'): Scorecard {
  return {
    asOf: null,
    overall: {
      score: null,
      grade: '–',
      label,
    },
    axes: SCORECARD_AXIS_ORDER.map((key) => ({
      key,
      label: SCORECARD_AXIS_LABELS[key],
      score: null,
      available: false,
      hint: 'No scorecard data available yet.',
    })),
  }
}
