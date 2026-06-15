import type { Metadata } from 'next'
import FaqPage from '@/components/marketing/FaqPage'

export const metadata: Metadata = {
  title: 'FAQ | Longbrunch',
  description: 'Frequently asked questions about the Longbrunch product and workflow.',
}

export default function Faq() {
  return <FaqPage />
}
