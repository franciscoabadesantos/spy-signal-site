import { redirect } from 'next/navigation'

type LegacyAiResearchPageProps = {
  params: Promise<{ id: string }>
}

export default async function LegacyAiResearchPage({ params }: LegacyAiResearchPageProps) {
  const { id } = await params
  redirect(`/dashboard/research/${id}`)
}
