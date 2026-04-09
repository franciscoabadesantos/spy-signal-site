'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type SystemProfileBlobDimension = {
  label: 'Trend' | 'Momentum' | 'Risk' | 'Yield' | 'Stability'
  score: number
  hint?: string
}

type SystemProfileBlobProps = {
  dimensions: SystemProfileBlobDimension[]
  className?: string
  compact?: boolean
}

type Point = {
  x: number
  y: number
}

type MotionState = {
  x: number
  y: number
  vx: number
  vy: number
  energy: number
  phase: number
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const radians = (Math.PI / 180) * angleDeg
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function smoothClosedPath(points: Point[], tension = 1): string {
  const n = points.length
  if (n < 3) return ''

  const t = Math.max(0, Math.min(1.25, tension))
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let index = 0; index < n; index += 1) {
    const p0 = points[(index - 1 + n) % n]
    const p1 = points[index]
    const p2 = points[(index + 1) % n]
    const p3 = points[(index + 2) % n]

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * t
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * t
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * t
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * t

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return `${path} Z`
}

function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - (1 - x) ** 3
}

export default function SystemProfileBlob({
  dimensions,
  className,
  compact = false,
}: SystemProfileBlobProps) {
  const [morphProgress, setMorphProgress] = useState(0)
  const [hovered, setHovered] = useState(false)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const hoveredRef = useRef(false)
  const [motion, setMotion] = useState<MotionState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    energy: 0,
    phase: 0,
  })
  const gradientSeed = useId()

  useEffect(() => {
    let frame = 0
    const started = performance.now()
    const durationMs = 800

    const step = (timestamp: number) => {
      const elapsed = timestamp - started
      const progress = Math.min(1, elapsed / durationMs)
      setMorphProgress(easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    hoveredRef.current = hovered
  }, [hovered])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(2, (now - previous) / 16.67)
      previous = now

      setMotion((previousMotion) => {
        const target = hoveredRef.current ? pointerTargetRef.current : { x: 0, y: 0 }
        const spring = hoveredRef.current ? 0.2 : 0.14
        const damping = hoveredRef.current ? 0.78 : 0.86
        const maxVelocity = hoveredRef.current ? 0.26 : 0.18

        let vx = (previousMotion.vx + (target.x - previousMotion.x) * spring * dt) * damping
        let vy = (previousMotion.vy + (target.y - previousMotion.y) * spring * dt) * damping

        vx = Math.max(-maxVelocity, Math.min(maxVelocity, vx))
        vy = Math.max(-maxVelocity, Math.min(maxVelocity, vy))

        const x = previousMotion.x + vx * dt
        const y = previousMotion.y + vy * dt
        const speed = Math.sqrt(vx * vx + vy * vy)
        const energy = Math.max(0, Math.min(1, speed * 6.2 + Math.abs(x) * 0.24 + Math.abs(y) * 0.24))

        return {
          x,
          y,
          vx,
          vy,
          energy,
          phase: now / 1000,
        }
      })

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const ordered = useMemo(() => {
    const byLabel = new Map(dimensions.map((dimension) => [dimension.label, dimension]))
    const orderedLabels: SystemProfileBlobDimension['label'][] = [
      'Trend',
      'Momentum',
      'Risk',
      'Yield',
      'Stability',
    ]
    return orderedLabels.map((label) => ({
      label,
      score: clampScore(byLabel.get(label)?.score ?? 50),
    }))
  }, [dimensions])

  const size = compact ? 248 : 420
  const center = size / 2
  const maxRadius = compact ? 92 : 164
  const baseCircleRadius = maxRadius * 0.76
  const ringRadii = [maxRadius * 0.46, maxRadius * 0.72, maxRadius * 0.94]

  const scoreByLabel = new Map(ordered.map((dimension) => [dimension.label, dimension.score]))
  const trendScore = scoreByLabel.get('Trend') ?? 50
  const stabilityScore = scoreByLabel.get('Stability') ?? 50
  const riskScore = scoreByLabel.get('Risk') ?? 50
  const averageNormalized =
    ordered.reduce((sum, dimension) => sum + dimension.score, 0) / (ordered.length * 100)
  const trendStabilityStrength = Math.max(0, ((trendScore + stabilityScore) / 2 - 50) / 50)
  const riskWarmBias = 0.04 + Math.max(0, (riskScore - 50) / 50) * 0.16
  const axisEndpoints = ordered.map((_, index) =>
    polarToCartesian(center, center, maxRadius * 0.96, -90 + (360 / ordered.length) * index)
  )

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    pointerTargetRef.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    }
  }

  const animatedPoints = useMemo(() => {
    return ordered.map((dimension, index) => {
      const angle = -90 + (360 / ordered.length) * index
      const valueNormalized = dimension.score / 100
      const directionalBias = (valueNormalized - 0.5) * 0.24
      const mappedRadius = maxRadius * Math.max(0.36, Math.min(1.03, 0.45 + 0.55 * valueNormalized + directionalBias))
      const motionPulse =
        hovered && morphProgress > 0.99
          ? Math.sin(motion.phase * 5 + index * 1.3 + motion.x * 1.6 + motion.y * 1.2) *
            (0.008 + motion.energy * 0.012)
          : 0
      const targetRadius = mappedRadius * (1 + motionPulse)
      const radius = baseCircleRadius + (targetRadius - baseCircleRadius) * morphProgress
      return polarToCartesian(center, center, radius, angle)
    })
  }, [ordered, maxRadius, baseCircleRadius, morphProgress, hovered, motion, center])

  const baselinePoints = useMemo(() => {
    const baselineRadius = maxRadius * (0.45 + 0.55 * averageNormalized)
    return ordered.map((_, index) =>
      polarToCartesian(center, center, baselineRadius, -90 + (360 / ordered.length) * index)
    )
  }, [ordered, center, maxRadius, averageNormalized])
  const baselinePath = smoothClosedPath(baselinePoints, 0.72)

  const animatedPointByLabel = new Map(
    ordered.map((dimension, index) => [dimension.label, animatedPoints[index]] as const)
  )
  const riskPoint = animatedPointByLabel.get('Risk') ?? polarToCartesian(center, center, maxRadius * 0.8, 54)

  const pointerShiftX = motion.x * (compact ? 1.8 : 3.2)
  const pointerShiftY = motion.y * (compact ? 1.8 : 3.2)
  const pointerTilt = motion.vx * (compact ? 4.6 : 6.8) + motion.vy * (compact ? -1.4 : -2.4)
  const pointerScale = hovered ? 1.016 + motion.energy * 0.012 : 1

  const highlightX = center - maxRadius * 0.34 + motion.x * maxRadius * 0.1
  const highlightY = center - maxRadius * 0.34 + motion.y * maxRadius * 0.1
  const accentX = center + maxRadius * (0.12 + trendStabilityStrength * 0.2) + motion.x * maxRadius * 0.08
  const accentY = center - maxRadius * 0.08 + motion.y * maxRadius * 0.08

  const path = smoothClosedPath(animatedPoints, 0.72)

  return (
    <div
      className={cn(
        'relative mx-auto flex aspect-square w-full items-center justify-center p-4',
        compact ? 'max-w-[230px]' : 'max-w-[440px]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-[14%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.11)_0%,rgba(99,102,241,0.06)_46%,transparent_74%)]" />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="relative h-full w-full overflow-visible"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          pointerTargetRef.current = { x: 0, y: 0 }
        }}
        onPointerMove={onPointerMove}
      >
        <defs>
          <linearGradient id={`${gradientSeed}-body`} x1="10%" y1="12%" x2="90%" y2="88%">
            <stop offset="0%" stopColor="#5fa4f7" stopOpacity={0.94} />
            <stop offset="52%" stopColor="#575fd8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7448d5" stopOpacity={0.9} />
          </linearGradient>
          <radialGradient
            id={`${gradientSeed}-warmRisk`}
            gradientUnits="userSpaceOnUse"
            cx={riskPoint.x}
            cy={riskPoint.y}
            r={maxRadius * 0.78}
          >
            <stop offset="0%" stopColor={`rgba(251,146,60,${(riskWarmBias + motion.energy * 0.035).toFixed(3)})`} />
            <stop offset="48%" stopColor={`rgba(251,146,60,${(riskWarmBias * 0.38).toFixed(3)})`} />
            <stop offset="100%" stopColor="rgba(251,146,60,0)" />
          </radialGradient>
          <radialGradient
            id={`${gradientSeed}-highlight`}
            gradientUnits="userSpaceOnUse"
            cx={highlightX}
            cy={highlightY}
            r={maxRadius * 0.9}
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.40)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient
            id={`${gradientSeed}-accent`}
            gradientUnits="userSpaceOnUse"
            cx={accentX}
            cy={accentY}
            r={maxRadius * 0.82}
          >
            <stop
              offset="0%"
              stopColor={`rgba(125,211,252,${(0.2 + trendStabilityStrength * 0.2 + motion.energy * 0.08).toFixed(3)})`}
            />
            <stop offset="60%" stopColor="rgba(56,189,248,0.08)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          <linearGradient id={`${gradientSeed}-depth`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(30,64,175,0.00)" />
            <stop offset="100%" stopColor="rgba(30,41,59,0.25)" />
          </linearGradient>
          <filter id={`${gradientSeed}-glow`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation={hovered ? 3.1 : 2.2} result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                0 0 0 0 0.30
                0 0 0 0 0.42
                0 0 0 0 0.95
                0 0 0 0.13 0
              "
              result="tint"
            />
            <feMerge>
              <feMergeNode in="tint" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g>
          {ringRadii.map((radius, index) => (
            <circle
              key={`guide-ring-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(148,163,184,0.075)"
              strokeWidth={1}
            />
          ))}
          {axisEndpoints.map((axisPoint, index) => (
            <line
              key={`guide-axis-${index}`}
              x1={center}
              y1={center}
              x2={axisPoint.x}
              y2={axisPoint.y}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth={1}
            />
          ))}
        </g>

        <g
          style={{
            transformOrigin: 'center',
            transformBox: 'fill-box',
            transform: `translate(${pointerShiftX}px, ${pointerShiftY}px) rotate(${pointerTilt}deg) scale(${pointerScale})`,
            transition: 'transform 120ms ease-out',
          }}
        >
          <g className="system-blob-breathe">
            <path
              d={baselinePath}
              fill="none"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth={1.25}
              strokeDasharray="4 5"
            />
            <path d={path} fill={`url(#${gradientSeed}-body)`} filter={`url(#${gradientSeed}-glow)`} />
            <path d={path} fill={`url(#${gradientSeed}-warmRisk)`} />
            <path d={path} fill={`url(#${gradientSeed}-highlight)`} />
            <path d={path} fill={`url(#${gradientSeed}-accent)`} />
            <path d={path} fill={`url(#${gradientSeed}-depth)`} />
            <path d={path} fill="none" stroke="rgba(219,234,254,0.86)" strokeWidth={2.4} />
            {animatedPoints.map((point, index) => {
              const label = ordered[index]?.label
              const dotColor =
                label === 'Risk'
                  ? 'rgba(251,146,60,0.78)'
                  : 'rgba(191,219,254,0.8)'
              return (
                <g key={`anchor-${label ?? index}`}>
                  <circle cx={point.x} cy={point.y} r={3.4} fill="rgba(255,255,255,0.74)" />
                  <circle cx={point.x} cy={point.y} r={2.1} fill={dotColor} />
                </g>
              )
            })}
          </g>
        </g>
      </svg>
    </div>
  )
}
