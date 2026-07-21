import type { Metadata } from 'next'
import FaqPage from '@/components/marketing/FaqPage'

export const metadata: Metadata = {
  title: 'FAQ | Longbrunch',
  description: 'Clear answers about Longbrunch signals, market data, features, accounts, and plans.',
}

export default function Faq() {
  return <FaqPage />
}
