import type { Metadata } from 'next'
import HowItWorksPage from '@/components/marketing/HowItWorksPage'

export const metadata: Metadata = {
  title: 'How It Works | Longbrunch',
  description: 'See how Longbrunch turns the weekly tape into one clear pre-open decision.',
}

export default function HowItWorks() {
  return <HowItWorksPage />
}
