import { redirect } from 'next/navigation'

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' ? value : null
}

function normalizeTicker(raw: string | null): string {
  const value = raw?.trim().toUpperCase() ?? ''
  if (!value) return 'SPY'
  if (!/^[A-Z0-9.\-]{1,10}$/.test(value)) return 'SPY'
  return value
}

export default async function LegacyPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const ticker = normalizeTicker(firstParam(resolvedSearchParams.ticker))
  redirect(`/stocks/${ticker}/performance`)
}
