import Skeleton from '@/components/ui/Skeleton'

export default function PicksLoading() {
  return (
    <div className="container-lg section-gap" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the ranking…</span>

      <div className="max-w-3xl">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-10 w-full max-w-[26rem]" />
        <Skeleton className="mt-3 h-4 w-full max-w-[34rem]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[280px] w-full rounded-[var(--radius-2xl)]" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[184px] w-full rounded-[var(--radius-2xl)]" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-72 w-full rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-52 w-full rounded-[var(--radius-2xl)]" />
        </div>
      </div>
    </div>
  )
}
