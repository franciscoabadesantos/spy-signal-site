'use client'

import { useState } from 'react'
import { INVESTMENT_LENSES, type InvestmentLensKey } from '@/lib/investment-lens'
import PerspectiveDial from './PerspectiveDial'
import styles from './PerspectiveDialDemo.module.css'

export default function PerspectiveDialDemo({ initialValue }: { initialValue: InvestmentLensKey }) {
  const [value, setValue] = useState(initialValue)
  const selected = INVESTMENT_LENSES.find((lens) => lens.key === value) ?? INVESTMENT_LENSES[0]

  return (
    <div className={`container-lg ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Interaction study</p>
          <h1>Perspective dial</h1>
        </div>
        <PerspectiveDial initialValue={initialValue} onCommit={setValue} />
      </header>

      <section className={styles.context} aria-labelledby="demo-context-title">
        <div className={styles.marketField} aria-hidden="true">
          <span className={styles.orbitOne} />
          <span className={styles.orbitTwo} />
          <span className={styles.signalLine} />
        </div>
        <div className={styles.contextCopy}>
          <p id="demo-context-title">Committed perspective</p>
          <strong data-committed-lens="">{selected.label}</strong>
        </div>
      </section>

      <div className={styles.instructions}>
        <span>Drag or swipe</span>
        <span>Trackpad</span>
        <span>Arrow keys</span>
        <span>Home / End</span>
      </div>
    </div>
  )
}
