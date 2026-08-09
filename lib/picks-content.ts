/**
 * Reading identity and editorial copy for the picks pages.
 *
 * Deliberately free of `server-only`: the slug map and the copy are needed by both
 * Server Components and any client surface that links to a reading. Nothing here is
 * privileged — the gate lives in `lib/picks-access.ts`.
 *
 * The three readings come from the scorecard audit's finding F1: one score cannot
 * answer three questions, because the readings measure different things rather than
 * weighting the same things differently. What each one measures and ignores below is
 * taken from `finance-feature-store/feature_store/readings.py`, not invented here.
 */

export type PickReadingKey = 'longTerm' | 'income' | 'shortTerm'

export const PICK_READING_KEYS = ['longTerm', 'income', 'shortTerm'] as const

export type PickReadingSlug = 'long-term' | 'income' | 'short-term'

/**
 * Each reading is a real route under app/(app)/picks/, not a slug parsed at render
 * time. A dynamic segment could only reject an unknown slug during render, by which
 * point a force-dynamic response has started streaming and `notFound()` produces the
 * 404 body under a 200 status. Static routes make a wrong path miss the router.
 */
export const PICK_READING_TO_SLUG: Record<PickReadingKey, PickReadingSlug> = {
  longTerm: 'long-term',
  income: 'income',
  shortTerm: 'short-term',
}

export type PickReadingContent = {
  key: PickReadingKey
  slug: PickReadingSlug
  label: string
  /** Editorial page title. */
  headline: string
  /** One line under the headline. */
  subtitle: string
  /** The reader this list is for, in their own terms. */
  reader: string
  measures: { label: string; detail: string; weight: string | null }[]
  ignores: string
  /** Why that omission is deliberate. */
  ignoresReason: string
  /** Anything specific to this reading a reader should know. */
  note: string | null
}

export const PICK_READING_CONTENT: Record<PickReadingKey, PickReadingContent> = {
  longTerm: {
    key: 'longTerm',
    slug: 'long-term',
    label: 'Long term',
    headline: 'Built to be owned for years.',
    subtitle: 'Ranked on the balance sheet, the price against peers, and whether the growth is real.',
    reader: 'For deciding where to put money and leave it.',
    measures: [
      { label: 'Financial health', detail: 'Leverage, return on equity and margins', weight: '40%' },
      { label: 'Price versus peers', detail: 'Valuation multiples ranked inside the sector', weight: '35%' },
      { label: 'Growth', detail: 'Revenue and earnings growth year over year', weight: '25%' },
    ],
    ignores: 'Momentum',
    ignoresReason:
      'What a stock did over the last sixty-five sessions says nothing about whether the business is worth owning for a decade, and counting it would let a rally paper over a broken balance sheet.',
    note: null,
  },
  income: {
    key: 'income',
    slug: 'income',
    label: 'Income',
    headline: 'Paid while you wait.',
    subtitle: 'Ranked on the yield, whether the cash actually covers it, and whether it has ever been cut.',
    reader: 'For leaving money somewhere safe and growing, and being paid along the way.',
    measures: [
      { label: 'Yield', detail: 'Trailing annual yield', weight: null },
      { label: 'Cover', detail: 'Whether earnings and free cash flow pay for the payout', weight: null },
      { label: 'Record', detail: 'Consecutive years of payments, and any cuts', weight: null },
    ],
    ignores: 'Growth and momentum',
    ignoresReason:
      'Someone buying for income is not buying for the move. Momentum here is noise against the question being asked.',
    note: 'Companies that pay no dividend are absent rather than ranked last. Not paying is not a poor income investment — it is not an income investment, and listing hundreds of them would bury the ones this page exists to find. These three parts also carry no fixed weights, because they do not substitute for each other: a yield nothing pays for is not offset by a long record.',
  },
  shortTerm: {
    key: 'shortTerm',
    slug: 'short-term',
    label: 'Short term',
    headline: 'Where the movement is.',
    subtitle: 'Ranked on trend, momentum measured per unit of volatility, and how much is trading.',
    reader: 'For taking risk and following volatility over weeks, not years.',
    measures: [
      { label: 'Trend', detail: 'Price against its long moving average', weight: '40%' },
      { label: 'Momentum', detail: 'Recent return, measured per unit of volatility', weight: '35%' },
      { label: 'Participation', detail: 'Volume against its own normal', weight: '25%' },
    ],
    ignores: 'Value and financial health',
    ignoresReason:
      'Over weeks, what a company is worth does not move the price — flow does. This reading barely touches the axes the other two are built on, which is why it cannot be expressed as a reweighting of them.',
    note: null,
  },
}

/**
 * The scores behind these lists come from hand-drawn, uncalibrated curves. The
 * ordering is trustworthy; the number is not. Shown wherever a score is.
 */
export const PICK_SCORE_CAVEAT =
  'Scores rank companies against each other. They are not marks out of a hundred.'
