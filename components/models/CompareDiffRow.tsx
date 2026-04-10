type CompareDiffRowProps = {
  label: string
  left: React.ReactNode
  right: React.ReactNode
  changed?: boolean
}

export default function CompareDiffRow({
  label,
  left,
  right,
  changed = false,
}: CompareDiffRowProps) {
  return (
    <div
      className={`grid grid-cols-[150px_1fr_1fr] gap-2 rounded-[var(--radius-md)] border px-3 py-2 ${
        changed ? 'signal-bg-warn' : 'border-border bg-surface-card'
      }`}
    >
      <div className="text-label-md text-content-secondary">{label}</div>
      <div className="numeric-tabular text-content-primary">{left}</div>
      <div className="numeric-tabular text-content-primary">{right}</div>
    </div>
  )
}

