import EmptyState from '@/components/ui/EmptyState'
import RetryButton from '@/components/ui/RetryButton'

export default function ResearchUnavailable({ ticker }: { ticker: string }) {
  return (
    <div>
      <EmptyState
        headingLevel="h1"
        title="Research data is temporarily unavailable"
        description={`Longbrunch could not load the current research data for ${ticker}.`}
        action={<RetryButton>Retry</RetryButton>}
      />
    </div>
  )
}
