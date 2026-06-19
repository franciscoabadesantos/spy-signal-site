export const BRAND_NAME = 'Longbrunch'

export const BRAND_DESCRIPTION =
  'AI-driven weekly SPY signals built for one clear decision before the open.'

// Where "ask us anything" messages are sent. Change this to your real inbox.
export const CONTACT_EMAIL = 'hello@longbrunch.com'

export const MARKETING_NAV_ITEMS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Performance', href: '/performance' },
  { label: 'Method', href: '/method' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
] as const

export const FOOTER_SECONDARY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Join the lounge', href: '/sign-up' },
] as const

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: 'When is the signal sent?',
    answer: 'Every Sunday before the market opens so the decision is made before the week begins.',
  },
  {
    question: 'What does the signal show?',
    answer: 'Direction, confidence, market bias, and the weekly tape behind the call.',
  },
  {
    question: 'Is this built for intraday trading?',
    answer: 'No. The product is intentionally tuned for calm weekly execution rather than constant flipping.',
  },
] as const
