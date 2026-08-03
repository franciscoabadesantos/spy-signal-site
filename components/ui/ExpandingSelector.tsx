'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
import { cn } from '@/lib/utils'
import styles from './ExpandingSelector.module.css'

export type ExpandingSelectorOption = {
  value: string
  label: string
}

type ExpandingSelectorProps = {
  label: string
  ariaLabel: string
  value: string
  options: readonly ExpandingSelectorOption[]
  onValueChange: (value: string) => void
  className?: string
}

type PointerSession = {
  id: number
  pointerType: string
  startX: number
  startY: number
  startScrollLeft: number
  dragging: boolean
}

export default function ExpandingSelector({
  label,
  ariaLabel,
  value,
  options,
  onValueChange,
  className,
}: ExpandingSelectorProps) {
  const reduceMotion = useReducedMotion()
  const groupName = useId()
  const viewportId = useId()
  const instrumentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLLabelElement | null>>([])
  const pointerRef = useRef<PointerSession | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)
  const [previewIndex, setPreviewIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [dragging, setDragging] = useState(false)

  const valueIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const lastIndex = Math.max(0, options.length - 1)
  const expanded = hovered || focusWithin || pinned || dragging
  const displayIndex = expanded ? previewIndex : valueIndex
  const displayOption = options[displayIndex] ?? options[0]

  const clampIndex = useCallback((index: number) => Math.max(0, Math.min(lastIndex, index)), [lastIndex])

  const nearestIndex = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return valueIndex
    const center = viewport.scrollLeft + viewport.clientWidth / 2
    let nearest = valueIndex
    let nearestDistance = Number.POSITIVE_INFINITY
    optionRefs.current.forEach((option, index) => {
      if (!option) return
      const distance = Math.abs(option.offsetLeft + option.offsetWidth / 2 - center)
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
    viewport.scrollTo({ left, behavior: reduceMotion ? 'auto' : behavior })
  }, [reduceMotion])

  const commitIndex = useCallback((index: number, focus = false) => {
    const nextIndex = clampIndex(index)
    const option = options[nextIndex]
    if (!option) return
    setPreviewIndex(nextIndex)
    scrollToIndex(nextIndex)
    if (option.value !== value) onValueChange(option.value)
    if (focus) optionRefs.current[nextIndex]?.querySelector('input')?.focus({ preventScroll: true })
  }, [clampIndex, onValueChange, options, scrollToIndex, value])

  const settle = useCallback(() => {
    const index = nearestIndex()
    setDragging(false)
    commitIndex(index)
  }, [commitIndex, nearestIndex])

  const queueSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(settle, reduceMotion ? 0 : 90)
  }, [reduceMotion, settle])

  const reveal = useCallback(() => {
    setPinned(true)
    window.requestAnimationFrame(() => scrollToIndex(valueIndex, 'auto'))
  }, [scrollToIndex, valueIndex])

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => scrollToIndex(valueIndex, 'auto'))
    return () => window.cancelAnimationFrame(frame)
  }, [scrollToIndex, valueIndex])

  useEffect(() => {
    setPreviewIndex(valueIndex)
  }, [valueIndex])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => scrollToIndex(valueIndex, 'auto'))
    observer.observe(viewport)
    optionRefs.current.forEach((option) => {
      if (option) observer.observe(option)
    })
    return () => observer.disconnect()
  }, [scrollToIndex, valueIndex])

  useEffect(() => {
    const close = (event: globalThis.PointerEvent) => {
      if (instrumentRef.current?.contains(event.target as Node)) return
      setPinned(false)
      setHovered(false)
      setFocusWithin(false)
      setPreviewIndex(valueIndex)
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || !expanded) return
      setPinned(false)
      setHovered(false)
      setFocusWithin(false)
      setPreviewIndex(valueIndex)
      scrollToIndex(valueIndex, 'auto')
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [expanded, scrollToIndex, valueIndex])

  useEffect(() => () => {
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
  }, [])

  function handleScroll() {
    if (!expanded || scrollFrameRef.current) return
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null
      setPreviewIndex(nearestIndex())
    })
    queueSettle()
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    reveal()
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
      suppressClickRef.current = true
      if (pointer.pointerType !== 'touch') event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    if (!pointer.dragging || pointer.pointerType === 'touch') return
    event.preventDefault()
    event.currentTarget.scrollLeft = pointer.startScrollLeft - deltaX
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointerRef.current = null
    if (pointer.dragging) queueSettle()
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
    else if (event.key === 'End') nextIndex = lastIndex
    else if ((event.key === 'Enter' || event.key === ' ') && focusedIndex >= 0) nextIndex = focusedIndex
    if (nextIndex === null) return
    event.preventDefault()
    setPinned(true)
    commitIndex(nextIndex, true)
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setFocusWithin(false)
  }

  if (!displayOption || options.length === 0) return null

  return (
    <div className={cn(styles.stage, className)}>
      <div
        ref={instrumentRef}
        className={styles.instrument}
        data-expanding-selector=""
        data-expanded={expanded ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        data-value={value}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) setHovered(true)
        }}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={handleBlur}
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
              setPreviewIndex(valueIndex)
            } else {
              reveal()
            }
          }}
        >
          <span className={styles.eyebrow}>{label}</span>
          <span className={styles.readoutValue}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={displayOption.value}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.14 }}
              >
                {displayOption.label}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sr-only" aria-live="polite">{label} selected: {options[valueIndex]?.label}</span>
        </button>

        <div className={styles.selectorShell} aria-hidden={expanded ? undefined : 'true'} inert={expanded ? undefined : true}>
          <span className={styles.centerWindow} aria-hidden="true" />
          <div
            ref={viewportRef}
            id={viewportId}
            className={styles.viewport}
            role="radiogroup"
            aria-label={ariaLabel}
            onScroll={handleScroll}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyboard}
          >
            <span className={styles.edgeSpace} aria-hidden="true" />
            {options.map((option, index) => (
              <label
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node }}
                className={styles.option}
                data-preview-active={previewIndex === index ? 'true' : 'false'}
                data-distance={Math.min(2, Math.abs(previewIndex - index))}
                onClick={(event) => {
                  if (suppressClickRef.current) {
                    event.preventDefault()
                    return
                  }
                  if (event.target instanceof HTMLInputElement) return
                  event.preventDefault()
                  commitIndex(index, true)
                }}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={value === option.value}
                  tabIndex={expanded && value === option.value ? 0 : -1}
                  onChange={() => commitIndex(index)}
                />
                {previewIndex === index ? (
                  <motion.span
                    layoutId={`${groupName}-active`}
                    className={styles.activeTrace}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className={styles.optionLabel}>{option.label}</span>
              </label>
            ))}
            <span className={styles.edgeSpace} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
