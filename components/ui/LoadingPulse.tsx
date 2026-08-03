import type { CSSProperties } from 'react'
import styles from './LoadingPulse.module.css'

const POINTS = 7

export default function LoadingPulse({
  label,
  size = 'default',
}: {
  label: string
  size?: 'compact' | 'default'
}) {
  return (
    <span className={styles.root} data-loading-pulse="" data-size={size} role="status" aria-label={label}>
      <span className={styles.points} aria-hidden="true">
        {Array.from({ length: POINTS }, (_, index) => (
          <i
            className={styles.point}
            key={index}
            style={{ '--loading-point-index': index } as CSSProperties}
          />
        ))}
      </span>
    </span>
  )
}
