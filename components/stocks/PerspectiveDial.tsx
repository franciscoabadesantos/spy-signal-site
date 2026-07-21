'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  INVESTMENT_LENSES,
  parseInvestmentLens,
  type InvestmentLensKey,
} from '@/lib/investment-lens'
import styles from './PerspectiveDial.module.css'

type PerspectiveDialProps = {
  initialValue?: InvestmentLensKey
  onCommit?: (value: InvestmentLensKey) => void
}

type PointerSession = {
  id: number
  pointerType: string
  startX: number
  startY: number
  startScrollLeft: number
  dragging: boolean
}

const LAST_INDEX = INVESTMENT_LENSES.length - 1
const SETTLE_SAMPLE_MS = 34
const SETTLE_STABLE_SAMPLES = 3
const SETTLE_TIMEOUT_MS = 800

function clampIndex(index: number) {
  return Math.max(0, Math.min(LAST_INDEX, index))
}

export default function PerspectiveDial({
  initialValue = 'medium',
  onCommit,
}: PerspectiveDialProps) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const groupName = useId()
  const viewportId = useId()
  const instrumentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLLabelElement | null>>([])
  const pointerRef = useRef<PointerSession | null>(null)
  const suppressClickRef = useRef(false)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const pendingCommitRef = useRef<number | null>(null)
  const gestureActiveRef = useRef(false)
  const userScrollIntentRef = useRef(false)
  const suppressFocusExpansionRef = useRef(false)
  const committedValueRef = useRef<InvestmentLensKey>(initialValue)
  const [value, setValue] = useState<InvestmentLensKey>(initialValue)
  const [previewIndex, setPreviewIndex] = useState(() =>
    Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === initialValue)),
  )
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [dragging, setDragging] = useState(false)

  const valueIndex = Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === value))
  const expanded = hovered || focusWithin || pinned || dragging
  const displayIndex = expanded ? previewIndex : valueIndex

  useEffect(() => {
    committedValueRef.current = value
  }, [value])

  useEffect(() => {
    instrumentRef.current?.setAttribute('data-hydrated', 'true')
  }, [])

  const nearestIndex = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return valueIndex

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2
    let nearest = valueIndex
    let nearestDistance = Number.POSITIVE_INFINITY

    optionRefs.current.forEach((option, index) => {
      if (!option) return
      const optionCenter = option.offsetLeft + option.offsetWidth / 2
      const distance = Math.abs(optionCenter - viewportCenter)
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    })

    return nearest
  }, [valueIndex])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current
    const option = optionRefs.current[index]
    if (!viewport || !option) return

    const left = option.offsetLeft - viewport.clientWidth / 2 + option.offsetWidth / 2
    if (reduceMotion || behavior === 'auto') {
      const previousScrollBehavior = viewport.style.scrollBehavior
      viewport.style.scrollBehavior = 'auto'
      viewport.scrollLeft = left
      void viewport.offsetWidth
      viewport.style.scrollBehavior = previousScrollBehavior
      return
    }
    viewport.scrollTo({
      left,
      behavior,
    })
  }, [reduceMotion])

  const updateUrl = useCallback((nextValue: InvestmentLensKey) => {
    const params = new URLSearchParams(window.location.search)
    params.set('lens', nextValue)
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`)
  }, [pathname])

  const commitIndex = useCallback((index: number) => {
    const nextValue = INVESTMENT_LENSES[clampIndex(index)].key
    pendingCommitRef.current = null
    setPreviewIndex(index)

    if (nextValue === committedValueRef.current) return
    committedValueRef.current = nextValue
    setValue(nextValue)
    updateUrl(nextValue)
    onCommit?.(nextValue)
  }, [onCommit, updateUrl])

  const settle = useCallback(() => {
    if (gestureActiveRef.current) return
    const index = nearestIndex()
    setPreviewIndex(index)
    setDragging(false)
    if (pendingCommitRef.current !== null || userScrollIntentRef.current) commitIndex(index)
    userScrollIntentRef.current = false
  }, [commitIndex, nearestIndex])

  const queueSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    const viewport = viewportRef.current
    if (!viewport || reduceMotion) {
      settleTimerRef.current = setTimeout(settle, 0)
      return
    }

    let lastScrollLeft = viewport.scrollLeft
    let stableSamples = 0
    const startedAt = performance.now()
    const sample = () => {
      const currentViewport = viewportRef.current
      if (!currentViewport) return
      const scrollLeft = currentViewport.scrollLeft
      stableSamples = Math.abs(scrollLeft - lastScrollLeft) < 0.5 ? stableSamples + 1 : 0
      lastScrollLeft = scrollLeft

      if (stableSamples >= SETTLE_STABLE_SAMPLES || performance.now() - startedAt >= SETTLE_TIMEOUT_MS) {
        settleTimerRef.current = null
        settle()
        return
      }
      settleTimerRef.current = setTimeout(sample, SETTLE_SAMPLE_MS)
    }

    settleTimerRef.current = setTimeout(sample, SETTLE_SAMPLE_MS)
  }, [reduceMotion, settle])

  const requestIndex = useCallback((index: number, focus = false) => {
    const nextIndex = clampIndex(index)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = null
    pendingCommitRef.current = null
    userScrollIntentRef.current = false
    setPreviewIndex(nextIndex)
    setPinned(true)
    if (focus) optionRefs.current[nextIndex]?.querySelector('input')?.focus({ preventScroll: true })
    scrollToIndex(nextIndex)
    commitIndex(nextIndex)
  }, [commitIndex, scrollToIndex])

  const reveal = useCallback(() => {
    setPinned(true)
    window.requestAnimationFrame(() => scrollToIndex(valueIndex, 'auto'))
  }, [scrollToIndex, valueIndex])

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => scrollToIndex(valueIndex, 'auto'))
    return () => window.cancelAnimationFrame(frame)
  }, [scrollToIndex, valueIndex])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const recenter = () => scrollToIndex(
      pendingCommitRef.current ?? Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === committedValueRef.current)),
      'auto',
    )
    const observer = new ResizeObserver(recenter)
    observer.observe(viewport)
    optionRefs.current.forEach((option) => {
      if (option) observer.observe(option)
    })
    return () => observer.disconnect()
  }, [scrollToIndex])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleScrollEnd = () => settle()
    if ('onscrollend' in viewport) {
      viewport.addEventListener('scrollend', handleScrollEnd)
      return () => viewport.removeEventListener('scrollend', handleScrollEnd)
    }
    return undefined
  }, [settle])

  useEffect(() => {
    const handleOutside = (event: globalThis.PointerEvent) => {
      if (instrumentRef.current?.contains(event.target as Node)) return
      const committedIndex = Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === committedValueRef.current))
      setPinned(false)
      setHovered(false)
      setFocusWithin(false)
      setPreviewIndex(committedIndex)
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || !expanded) return
      const committedIndex = Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === committedValueRef.current))
      setPinned(false)
      setHovered(false)
      setFocusWithin(false)
      setPreviewIndex(committedIndex)
      scrollToIndex(committedIndex, 'auto')
      suppressFocusExpansionRef.current = true
      triggerRef.current?.focus()
    }
    const handlePopState = () => {
      const nextValue = parseInvestmentLens(new URLSearchParams(window.location.search).get('lens'))
      const index = INVESTMENT_LENSES.findIndex((lens) => lens.key === nextValue)
      const changed = nextValue !== committedValueRef.current
      committedValueRef.current = nextValue
      setValue(nextValue)
      setPreviewIndex(index)
      if (changed) onCommit?.(nextValue)
      window.requestAnimationFrame(() => scrollToIndex(index, 'auto'))
    }

    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('popstate', handlePopState)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [expanded, onCommit, scrollToIndex, valueIndex])

  useEffect(() => () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current)
  }, [])

  function handleScroll() {
    if (!expanded) return
    if (scrollFrameRef.current) return
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null
      setPreviewIndex(nearestIndex())
    })
    if (!('onscrollend' in (viewportRef.current ?? {}))) queueSettle()
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    reveal()
    gestureActiveRef.current = true
    pointerRef.current = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    const deltaX = event.clientX - pointer.startX
    const deltaY = event.clientY - pointer.startY

    if (!pointer.dragging && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
      pointer.dragging = true
      userScrollIntentRef.current = true
      suppressClickRef.current = true
      if (pointer.pointerType !== 'touch') event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    if (!pointer.dragging) return

    if (pointer.pointerType === 'touch') return

    event.preventDefault()
    event.currentTarget.scrollLeft = pointer.startScrollLeft - deltaX
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    gestureActiveRef.current = false
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) {
      userScrollIntentRef.current = false
      if (reduceMotion || !('onscrollend' in event.currentTarget)) queueSettle()
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pointerRef.current = null
    if (!pointer.dragging) {
      userScrollIntentRef.current = false
      return
    }

    const index = nearestIndex()
    pendingCommitRef.current = index
    userScrollIntentRef.current = false
    setPreviewIndex(index)
    if (pointer.pointerType !== 'touch') scrollToIndex(index)
    queueSettle()
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const focusedIndex = optionRefs.current.findIndex((option) => option?.contains(document.activeElement))
    const origin = focusedIndex >= 0 ? focusedIndex : valueIndex
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = origin + 1
    else if (event.key === 'ArrowLeft') nextIndex = origin - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = LAST_INDEX
    else if ((event.key === 'Enter' || event.key === ' ') && focusedIndex >= 0) nextIndex = focusedIndex

    if (nextIndex === null) return
    event.preventDefault()
    requestIndex(nextIndex, true)
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setFocusWithin(false)
  }

  return (
    <div className={styles.stage}>
      <div
        ref={instrumentRef}
        className={styles.instrument}
        data-perspective-dial=""
        data-expanded={expanded ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        data-preview={INVESTMENT_LENSES[previewIndex].key}
        data-value={value}
        data-hydrated="false"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) setHovered(true)
        }}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => {
          if (suppressFocusExpansionRef.current) {
            suppressFocusExpansionRef.current = false
            return
          }
          setFocusWithin(true)
        }}
        onBlurCapture={handleBlur}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget || event.propertyName !== 'width' || !expanded) return
          const targetIndex = pendingCommitRef.current ?? valueIndex
          setPreviewIndex(targetIndex)
          scrollToIndex(targetIndex, 'auto')
          if (pendingCommitRef.current !== null) queueSettle()
        }}
      >
        <span className={styles.vessel} aria-hidden="true" />
        <button
          ref={triggerRef}
          type="button"
          className={styles.readout}
          aria-expanded={expanded}
          aria-controls={viewportId}
          onClick={() => {
            if (expanded && pinned) {
              setPinned(false)
              setHovered(false)
              setFocusWithin(false)
              const committedIndex = Math.max(0, INVESTMENT_LENSES.findIndex((lens) => lens.key === committedValueRef.current))
              setPreviewIndex(committedIndex)
              scrollToIndex(committedIndex, 'auto')
            } else {
              reveal()
            }
          }}
        >
          <span className={styles.eyebrow}>Perspective</span>
          <span className={styles.readoutValue}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={INVESTMENT_LENSES[displayIndex].key}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.14 }}
              >
                {INVESTMENT_LENSES[displayIndex].label}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sr-only" data-perspective-announcement="" aria-live="polite">
            Perspective selected: {INVESTMENT_LENSES[valueIndex].label}
          </span>
        </button>

        <div
          className={styles.dialShell}
          aria-hidden={expanded ? undefined : 'true'}
          inert={expanded ? undefined : true}
        >
          <span className={styles.centerLens} data-perspective-center="" aria-hidden="true" />
          <div
            ref={viewportRef}
            id={viewportId}
            className={styles.viewport}
            data-perspective-viewport=""
            role="radiogroup"
            aria-label="Investment perspective"
            onScroll={handleScroll}
            onWheel={(event) => {
              if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
                userScrollIntentRef.current = true
              }
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyboard}
          >
            <span className={styles.edgeSpace} aria-hidden="true" />
            {INVESTMENT_LENSES.map((lens, index) => {
              const distance = Math.min(2, Math.abs(previewIndex - index))
              return (
                <label
                  key={lens.key}
                  ref={(node) => { optionRefs.current[index] = node }}
                  className={styles.option}
                  data-lens-option={lens.key}
                  data-preview-active={previewIndex === index ? 'true' : 'false'}
                  data-distance={distance}
                  onClick={(event) => {
                    if (suppressClickRef.current) {
                      event.preventDefault()
                      suppressClickRef.current = false
                      return
                    }
                    if (event.target instanceof HTMLInputElement) return
                    event.preventDefault()
                    requestIndex(index, true)
                  }}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={lens.key}
                    checked={value === lens.key}
                    tabIndex={expanded && value === lens.key ? 0 : -1}
                    onChange={() => requestIndex(index)}
                  />
                  {previewIndex === index ? (
                    <motion.span
                      layoutId={`${groupName}-active`}
                      className={styles.activeTrace}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className={styles.optionLabel}>{lens.label}</span>
                </label>
              )
            })}
            <span className={styles.edgeSpace} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
