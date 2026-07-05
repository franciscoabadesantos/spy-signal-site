export const BRAND_NAME = 'Longbrunch'

export const BRAND_DESCRIPTION =
  'See how companies move together, what themes connect them, and what the data says — in plain language.'

// Provisional brand line pending owner sign-off (see docs/VOICE.md).
export const BRAND_TAGLINE = 'See what surrounds a company.'

// Where "ask us anything" messages are sent. Change this to your real inbox.
export const CONTACT_EMAIL = 'hello@longbrunch.com'

export const MARKETING_NAV_ITEMS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Method', href: '/method' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
] as const

export const FOOTER_SECONDARY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Become a member', href: '/sign-up' },
] as const

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: 'What is included in membership?',
    answer: 'Membership covers full ticker coverage, the relationship map and correlation network, watchlists and alerts, and deeper research surfaces as they ship.',
  },
  {
    question: 'Do I create an account first?',
    answer: 'Yes. If you are not signed in, the current access flow starts with account creation before you continue into the product workspace.',
  },
  {
    question: 'Is this an intraday alert service?',
    answer: 'No. The product is built around signal monitoring, market context, watchlists, and research workflows rather than a chatty intraday feed.',
  },
] as const
