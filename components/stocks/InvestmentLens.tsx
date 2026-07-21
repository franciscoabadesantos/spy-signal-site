'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import {
  INVESTMENT_LENSES,
  type InvestmentLensKey,
} from '@/lib/investment-lens'
import styles from './InvestmentLens.module.css'

type InvestmentLensSelectorProps = {
  value: InvestmentLensKey
  onChange: (value: InvestmentLensKey) => void
}

export function InvestmentLensSelector({ value, onChange }: InvestmentLensSelectorProps) {
  const instrumentRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const programmaticScrollRef = useRef(false)
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerRef = useRef<{ id: number; x: number; y: number; scrollLeft: number; dragging: boolean } | null>(null)
  const groupId = useId()
  const valueIndex = INVESTMENT_LENSES.findIndex((lens) => lens.key === value)
  const [previewIndex, setPreviewIndex] = useState(Math.max(0, valueIndex))
  const [expanded, setExpanded] = useState(false)
  const [interacting, setInteracting] = useState(false)

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current
    const option = optionRefs.current[index]
    if (!viewport || !option) return
    const resolvedBehavior = behavior === 'smooth' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : behavior
    programmaticScrollRef.current = true
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current)
    const left = option.offsetLeft - viewport.clientWidth / 2 + option.offsetWidth / 2
    viewport.scrollTo({ left, behavior: resolvedBehavior })
    programmaticTimerRef.current = setTimeout(() => {
      programmaticScrollRef.current = false
    }, resolvedBehavior === 'auto' ? 60 : 520)
  }, [])

  const nearestIndex = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return 0
    const center = viewport.scrollLeft + viewport.clientWidth / 2
    let nearest = 0
    let distance = Number.POSITIVE_INFINITY
    optionRefs.current.forEach((option, index) => {
      if (!option) return
      const nextDistance = Math.abs(option.offsetLeft + option.offsetWidth / 2 - center)
      if (nextDistance < distance) {
        distance = nextDistance
        nearest = index
      }
    })
    return nearest
  }, [])

  const commitIndex = useCallback((index: number) => {
    const next = INVESTMENT_LENSES[index]
    if (next && next.key !== value) onChange(next.key)
  }, [onChange, value])

  const settleToNearest = useCallback(() => {
    const index = nearestIndex()
    setPreviewIndex(index)
    scrollToIndex(index)
    commitIndex(index)
    setInteracting(false)
  }, [commitIndex, nearestIndex, scrollToIndex])

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => scrollToIndex(Math.max(0, valueIndex), 'auto'))
    return () => window.cancelAnimationFrame(frame)
  }, [scrollToIndex, valueIndex])

  useEffect(() => {
    setPreviewIndex(Math.max(0, valueIndex))
  }, [valueIndex])

  useEffect(() => {
    if (!expanded) return
    const closeOutside = (event: globalThis.PointerEvent) => {
      if (!instrumentRef.current?.contains(event.target as Node)) {
        setPreviewIndex(Math.max(0, valueIndex))
        setExpanded(false)
      }
    }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPreviewIndex(Math.max(0, valueIndex))
      setExpanded(false)
      readoutRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [expanded, valueIndex])

  useEffect(() => () => {
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current)
  }, [])

  function reveal() {
    setExpanded(true)
    window.requestAnimationFrame(() => scrollToIndex(Math.max(0, valueIndex), 'auto'))
  }

  function selectIndex(index: number) {
    const clamped = Math.max(0, Math.min(INVESTMENT_LENSES.length - 1, index))
    setPreviewIndex(clamped)
    scrollToIndex(clamped)
    commitIndex(clamped)
    setInteracting(false)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    setExpanded(true)
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    const deltaX = event.clientX - pointer.x
    const deltaY = event.clientY - pointer.y
    if (!pointer.dragging && Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      pointer.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setInteracting(true)
    }
    if (!pointer.dragging) return
    event.preventDefault()
    event.currentTarget.scrollLeft = pointer.scrollLeft - deltaX
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointerRef.current = null
    if (pointer.dragging) settleToNearest()
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0
    if (Math.abs(horizontalDelta) < 12) return
    event.preventDefault()
    const direction = horizontalDelta > 0 ? 1 : -1
    selectIndex(nearestIndex() + direction)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let nextIndex = valueIndex
    if (event.key === 'ArrowRight') nextIndex += 1
    else if (event.key === 'ArrowLeft') nextIndex -= 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = INVESTMENT_LENSES.length - 1
    else return
    event.preventDefault()
    const clamped = Math.max(0, Math.min(INVESTMENT_LENSES.length - 1, nextIndex))
    setPreviewIndex(clamped)
    scrollToIndex(clamped)
    commitIndex(clamped)
    optionRefs.current[clamped]?.focus()
  }

  return (
    <div ref={instrumentRef} className={styles.instrument} data-expanded={expanded ? 'true' : 'false'} data-interacting={interacting ? 'true' : 'false'}>
      <button ref={readoutRef} type="button" className={styles.readout} aria-expanded={expanded} aria-controls={groupId} onClick={reveal}>
        <span>Perspective</span>
        <strong>{INVESTMENT_LENSES[previewIndex]?.label ?? 'Trade'}</strong>
      </button>
      <div className={styles.mask} aria-hidden={expanded ? undefined : 'true'}>
        <div
          id={groupId}
          ref={viewportRef}
          role="radiogroup"
          aria-label="Investment perspective"
          className={styles.viewport}
          onScroll={() => {
            if (!expanded || programmaticScrollRef.current) return
            const index = nearestIndex()
            if (index !== previewIndex) setPreviewIndex(index)
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        >
          <span className={styles.edgeSpace} aria-hidden="true" />
          {INVESTMENT_LENSES.map((lens, index) => {
            const distance = Math.abs(index - previewIndex)
            return (
              <button
                key={lens.key}
                ref={(node) => { optionRefs.current[index] = node }}
                type="button"
                role="radio"
                tabIndex={expanded && value === lens.key ? 0 : -1}
                aria-checked={value === lens.key}
                data-preview-active={previewIndex === index ? 'true' : 'false'}
                data-distance={Math.min(2, distance)}
                className={styles.option}
                onClick={() => selectIndex(index)}
              >
                <span className={styles.fullLabel}>{lens.label}</span>
                <span className={styles.compactLabel}>{lens.compactLabel}</span>
              </button>
            )
          })}
          <span className={styles.edgeSpace} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default function InvestmentLens({ ticker }: { ticker: string }) {
  const [value, setValue] = useState<InvestmentLensKey>('trade')
  const router = useRouter()
  const pathname = usePathname()

  function update(valueNext: InvestmentLensKey) {
    setValue(valueNext)
    const params = new URLSearchParams(window.location.search)
    params.set('lens', valueNext)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-caption uppercase tracking-[0.18em] text-content-muted">{ticker} · Perspective</p>
          <h1 className="mt-2 text-page-title text-content-primary">Investment Lens</h1>
        </div>
        <InvestmentLensSelector value={value} onChange={update} />
      </div>
      <section className="grid gap-5 border-b border-[var(--color-border)] pb-8 md:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="text-caption uppercase tracking-[0.14em] text-[var(--color-accent)]">Lens score</p>
          <h2 className="mt-2 text-section-title text-content-primary">Pending integration</h2>
          <p className="mt-3 max-w-xl text-body-sm text-content-secondary">The final scoring contract requires canonical inputs, coverage and confidence. No score is calculated in the frontend.</p>
        </div>
        <div className="border-l border-[var(--color-border)] pl-5">
          <p className="text-caption uppercase tracking-[0.14em] text-content-muted">Methodology</p>
          <Link href={`/stocks/${ticker}/methodology`} className="action-link mt-3 inline-flex">Review scoring contract →</Link>
        </div>
      </section>
    </main>
  )
}
