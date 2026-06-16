'use client'

import { useEffect, useId, useMemo, useState } from 'react'
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
  marketCap?: number | null
  marketCapLabel?: string | null
}

type Point = {
  x: number
  y: number
}

const COOL_BLUE: [number, number, number] = [74, 166, 255]
const COOL_GREEN: [number, number, number] = [183, 255, 81]
const HOT_AMBER: [number, number, number] = [255, 171, 74]
const HOT_RED: [number, number, number] = [255, 79, 69]
const CHALK: [number, number, number] = [245, 247, 255]

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp01(amount)
}

function easeOutCubic(value: number): number {
  const x = clamp01(value)
  return 1 - (1 - x) ** 3
}

function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  amount: number
): [number, number, number] {
  const t = clamp01(amount)
  return [
    Math.round(lerp(from[0], to[0], t)),
    Math.round(lerp(from[1], to[1], t)),
    Math.round(lerp(from[2], to[2], t)),
  ]
}

function rgba(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`
}

function smoothClosedPath(points: Point[], tension = 1): string {
  const count = points.length
  if (count < 3) return ''

  const safeTension = Math.max(0, Math.min(1.35, tension))
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let index = 0; index < count; index += 1) {
    const p0 = points[(index - 1 + count) % count]
    const p1 = points[index]
    const p2 = points[(index + 1) % count]
    const p3 = points[(index + 2) % count]

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * safeTension
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * safeTension
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * safeTension
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * safeTension

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return `${path} Z`
}

function orbitNoise(angle: number, seed: number, time: number): number {
  return (
    Math.sin(angle * 1.9 + seed * 1.7 + time * 0.28) * 0.52 +
    Math.cos(angle * 4.7 - seed * 2.3 - time * 0.18) * 0.3 +
    Math.sin(angle * 7.2 + seed * 0.9 + time * 0.12) * 0.18
  )
}

function orbitPoint({
  angle,
  center,
  radiusX,
  radiusY,
  irregularity,
  pull,
  time,
  seed,
}: {
  angle: number
  center: number
  radiusX: number
  radiusY: number
  irregularity: number
  pull: number
  time: number
  seed: number
}): Point {
  const noise = orbitNoise(angle, seed, time)
  const drag = 1 - pull * (0.1 + 0.08 * (0.5 + 0.5 * Math.sin(angle * 2 - time * 0.55)))
  const scribbleX = Math.sin(angle * 8 + seed * 1.4 + time * 0.35) * irregularity * radiusX * 0.045
  const scribbleY = Math.cos(angle * 6.4 - seed * 1.1 - time * 0.28) * irregularity * radiusY * 0.06
  const rotatedAngle = angle + Math.sin(angle * 2.5 + seed * 0.6) * irregularity * 0.11

  return {
    x: center + Math.cos(rotatedAngle) * radiusX * (1 + noise * irregularity * 0.11) * drag + scribbleX,
    y: center + Math.sin(angle) * radiusY * (1 + noise * irregularity * 0.14) * drag + scribbleY,
  }
}

function buildOrbitPath({
  center,
  radiusX,
  radiusY,
  irregularity,
  pull,
  time,
  seed,
}: {
  center: number
  radiusX: number
  radiusY: number
  irregularity: number
  pull: number
  time: number
  seed: number
}): string {
  const points: Point[] = []
  const steps = 54

  for (let index = 0; index < steps; index += 1) {
    const angle = (Math.PI * 2 * index) / steps
    points.push(
      orbitPoint({
        angle,
        center,
        radiusX,
        radiusY,
        irregularity,
        pull,
        time,
        seed,
      })
    )
  }

  return smoothClosedPath(points, 0.82)
}

function normalizeMarketCap(value: number | null | undefined): number | null {
  if (!Number.isFinite(value) || !value || value <= 0) return null
  return clamp01((Math.log10(value) - 8.5) / 4.2)
}

function massDescriptor(value: number): string {
  if (value >= 0.78) return 'heavy core'
  if (value >= 0.56) return 'stable mass'
  if (value >= 0.34) return 'light body'
  return 'fragile body'
}

function trendDescriptor(value: number): string {
  if (value >= 0.72) return 'wide orbit'
  if (value >= 0.52) return 'held orbit'
  if (value >= 0.36) return 'tight orbit'
  return 'collapsed orbit'
}

function stabilityDescriptor(value: number): string {
  if (value >= 0.72) return 'smooth'
  if (value >= 0.52) return 'mostly smooth'
  if (value >= 0.34) return 'wobbling'
  return 'jittering'
}

function momentumDescriptor(value: number): string {
  if (value >= 0.74) return 'fast'
  if (value >= 0.54) return 'active'
  if (value >= 0.38) return 'steady'
  return 'slow'
}

function riskDescriptor(value: number): string {
  if (value >= 0.72) return 'hot'
  if (value >= 0.5) return 'charged'
  if (value >= 0.3) return 'warm'
  return 'cool'
}

function yieldDescriptor(value: number): string {
  if (value >= 0.72) return 'strong pull'
  if (value >= 0.5) return 'firm pull'
  if (value >= 0.32) return 'loose pull'
  return 'weak pull'
}

export default function SystemProfileBlob({
  dimensions,
  className,
  compact = false,
  marketCap = null,
  marketCapLabel = null,
}: SystemProfileBlobProps) {
  const [clock, setClock] = useState({ time: 0, intro: 0 })
  const gradientSeed = useId()

  useEffect(() => {
    let frame = 0
    const started = performance.now()

    const tick = (now: number) => {
      const elapsed = (now - started) / 1000
      setClock({
        time: elapsed,
        intro: easeOutCubic(Math.min(1, elapsed / 1.1)),
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
      hint: byLabel.get(label)?.hint,
    }))
  }, [dimensions])

  const scoreByLabel = new Map(ordered.map((dimension) => [dimension.label, dimension.score]))
  const trend = (scoreByLabel.get('Trend') ?? 50) / 100
  const momentum = (scoreByLabel.get('Momentum') ?? 50) / 100
  const riskControl = (scoreByLabel.get('Risk') ?? 50) / 100
  const yieldValue = (scoreByLabel.get('Yield') ?? 50) / 100
  const stability = (scoreByLabel.get('Stability') ?? 50) / 100
  const riskHeat = 1 - riskControl
  const capMass = normalizeMarketCap(marketCap)
  const mass = capMass ?? clamp01(0.44 + stability * 0.18 - riskHeat * 0.12)
  const fragility = clamp01((1 - stability) * 0.52 + (1 - mass) * 0.34 + riskHeat * 0.22)

  const size = compact ? 264 : 420
  const center = size / 2
  const maxRadius = compact ? 92 : 154
  const orbitRadiusX = lerp(maxRadius * 0.38, maxRadius * 0.9, trend) * clock.intro
  const orbitRadiusY = orbitRadiusX * lerp(0.72, 0.94, 1 - yieldValue * 0.28)
  const coreRadius = lerp(compact ? 16 : 20, compact ? 30 : 38, mass)
  const pull = lerp(0.04, 0.28, yieldValue)
  const irregularity = lerp(0.04, 0.46, fragility)
  const angularSpeed = lerp(0.6, 2.15, momentum) * lerp(1.06, 0.76, mass)
  const baseAngle = clock.time * angularSpeed
  const cleanEnergy = clamp01(momentum * 0.45 + trend * 0.22 + stability * 0.33)
  const orbitBrokenness = clamp01(riskHeat * 0.5 + (1 - stability) * 0.42 + (1 - mass) * 0.24)
  const trailStrength = clamp01(momentum * 0.55 + riskHeat * 0.45)

  const coolGlow = mixRgb(COOL_BLUE, COOL_GREEN, clamp01(cleanEnergy * 0.9))
  const hotGlow = mixRgb(HOT_AMBER, HOT_RED, clamp01(riskHeat * 0.92))
  const orbitGlow = mixRgb(coolGlow, hotGlow, clamp01(riskHeat * 0.74))
  const particleGlow = mixRgb(coolGlow, hotGlow, clamp01(riskHeat * 0.88))
  const coreGlow = mixRgb(COOL_BLUE, HOT_AMBER, clamp01(riskHeat * 0.6 + yieldValue * 0.2))

  const orbitPaths = [0.25, 1.15, 2.05].map((seed, index) =>
    buildOrbitPath({
      center,
      radiusX: orbitRadiusX * (1 + index * 0.016),
      radiusY: orbitRadiusY * (1 - index * 0.012),
      irregularity: irregularity * (1 + index * 0.12),
      pull,
      time: clock.time,
      seed,
    })
  )

  const particle = orbitPoint({
    angle: baseAngle,
    center,
    radiusX: orbitRadiusX,
    radiusY: orbitRadiusY,
    irregularity: irregularity * 1.08,
    pull,
    time: clock.time,
    seed: 0.82,
  })

  const trail = Array.from({ length: compact ? 12 : 18 }, (_, index) => {
    const progress = index / (compact ? 12 : 18)
    const angle = baseAngle - progress * lerp(0.85, 2.2, trailStrength)
    const point = orbitPoint({
      angle,
      center,
      radiusX: orbitRadiusX,
      radiusY: orbitRadiusY,
      irregularity: irregularity * (1 + progress * 0.12),
      pull,
      time: clock.time - progress * 0.16,
      seed: 0.82,
    })

    return {
      ...point,
      radius: lerp(compact ? 1.4 : 1.8, compact ? 4.8 : 6.4, 1 - progress),
      opacity: (1 - progress) * lerp(0.18, 0.56, trailStrength),
    }
  })

  const sparkCount = compact ? 0 : Math.round(lerp(0, 7, clamp01(riskHeat * 0.72 + fragility * 0.44 - 0.38)))
  const sparks = Array.from({ length: sparkCount }, (_, index) => {
    const sparkAngle = baseAngle + index * ((Math.PI * 2) / Math.max(1, sparkCount)) + Math.sin(clock.time * 2 + index) * 0.35
    const length = lerp(8, 20, clamp01(riskHeat * 0.8 + momentum * 0.2)) * (0.72 + (index % 3) * 0.15)
    return {
      x1: particle.x + Math.cos(sparkAngle) * 4,
      y1: particle.y + Math.sin(sparkAngle) * 4,
      x2: particle.x + Math.cos(sparkAngle) * length,
      y2: particle.y + Math.sin(sparkAngle) * length,
      opacity: 0.16 + ((index + 1) / Math.max(1, sparkCount)) * 0.42,
    }
  })

  const massText = marketCapLabel ?? massDescriptor(mass)
  const orbitText = trendDescriptor(trend)
  const heatText = riskDescriptor(riskHeat)
  const pullText = yieldDescriptor(yieldValue)
  const motionText = momentumDescriptor(momentum)
  const smoothText = stabilityDescriptor(stability)
  const orbitDasharray =
    orbitBrokenness > 0.34
      ? `${lerp(compact ? 20 : 34, compact ? 9 : 14, orbitBrokenness).toFixed(1)} ${lerp(compact ? 5 : 7, compact ? 16 : 22, orbitBrokenness).toFixed(1)}`
      : undefined

  return (
    <div
      className={cn(
        'relative mx-auto aspect-square w-full overflow-hidden rounded-[28px] border border-white/10',
        compact ? 'max-w-[240px]' : 'max-w-[420px]',
        className
      )}
      style={{
        background:
          'radial-gradient(circle at 50% 46%, rgba(183,255,81,0.08), transparent 18%), radial-gradient(circle at 52% 52%, rgba(55,130,255,0.12), transparent 34%), linear-gradient(180deg, rgba(5,8,14,0.98), rgba(2,4,11,0.98) 58%, rgba(0,0,0,0.98))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 80px rgba(0,0,0,0.28)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 14%, rgba(55,130,255,0.18), transparent 20%), radial-gradient(circle at 82% 76%, rgba(255,171,74,0.14), transparent 24%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 30px 30px, 30px 30px',
          maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 82%)',
        }}
      />
      {!compact ? (
        <div className="pointer-events-none absolute left-4 top-3 z-10 text-[12px] uppercase tracking-[0.32em] text-white/55">
          <span className="font-semibold text-[rgba(183,255,81,0.92)]">lb/</span> signal orbit
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-[1] h-full w-full"
        role="img"
        aria-label="Animated signal orbit showing trend, momentum, risk, yield, stability, and mass."
      >
        <defs>
          <filter id={`${gradientSeed}-glow`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation={compact ? 3 : 4.5} />
          </filter>
          <filter id={`${gradientSeed}-softGlow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={compact ? 10 : 14} />
          </filter>
          <radialGradient id={`${gradientSeed}-coreFill`} cx="50%" cy="46%" r="62%">
            <stop offset="0%" stopColor={rgba(CHALK, 0.94)} />
            <stop offset="26%" stopColor={rgba(coreGlow, 0.86)} />
            <stop offset="68%" stopColor={rgba(coreGlow, 0.22)} />
            <stop offset="100%" stopColor="rgba(3,7,16,0.04)" />
          </radialGradient>
          <radialGradient id={`${gradientSeed}-particleFill`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={rgba(CHALK, 1)} />
            <stop offset="34%" stopColor={rgba(particleGlow, 0.98)} />
            <stop offset="100%" stopColor={rgba(particleGlow, 0.18)} />
          </radialGradient>
        </defs>

        <g opacity={compact ? 0.38 : 0.54}>
          <circle cx={center} cy={center} r={maxRadius * 0.96} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <circle cx={center} cy={center} r={maxRadius * 0.72} fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth={1} />
          <circle cx={center} cy={center} r={maxRadius * 0.48} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        </g>

        <circle
          cx={center}
          cy={center}
          r={coreRadius * 2.4}
          fill={rgba(coreGlow, 0.18 + yieldValue * 0.18)}
          filter={`url(#${gradientSeed}-softGlow)`}
        />
        <circle cx={center} cy={center} r={coreRadius} fill={`url(#${gradientSeed}-coreFill)`} />
        <circle
          cx={center}
          cy={center}
          r={coreRadius + 5}
          fill="none"
          stroke={rgba(coreGlow, 0.76)}
          strokeWidth={compact ? 1.4 : 1.8}
          strokeDasharray={compact ? '9 6' : '14 8'}
        />
        <path
          d={buildOrbitPath({
            center,
            radiusX: coreRadius * 1.45,
            radiusY: coreRadius * 1.28,
            irregularity: 0.08 + yieldValue * 0.06,
            pull: 0.16 + yieldValue * 0.18,
            time: clock.time * 0.8,
            seed: 3.1,
          })}
          fill="none"
          stroke={rgba(coreGlow, 0.42)}
          strokeWidth={compact ? 1.1 : 1.5}
          strokeDasharray={compact ? '8 5' : '11 6'}
        />

        {orbitPaths.map((path, index) => (
          <path
            key={`orbit-${index}`}
            d={path}
            fill="none"
            stroke={rgba(orbitGlow, index === 0 ? 0.88 : 0.48 - index * 0.08)}
            strokeWidth={compact ? (index === 0 ? 2.1 : 1.15) : index === 0 ? 2.8 : 1.35}
            strokeDasharray={index === 0 ? orbitDasharray : compact ? '7 6' : '11 9'}
            filter={index === 0 ? `url(#${gradientSeed}-glow)` : undefined}
          />
        ))}

        {trail.map((point, index) => (
          <circle
            key={`trail-${index}`}
            cx={point.x}
            cy={point.y}
            r={point.radius}
            fill={rgba(particleGlow, point.opacity)}
          />
        ))}

        {sparks.map((spark, index) => (
          <line
            key={`spark-${index}`}
            x1={spark.x1}
            y1={spark.y1}
            x2={spark.x2}
            y2={spark.y2}
            stroke={rgba(hotGlow, spark.opacity)}
            strokeWidth={1.25}
            strokeLinecap="round"
          />
        ))}

        <circle cx={particle.x} cy={particle.y} r={compact ? 12 : 16} fill={rgba(particleGlow, 0.22)} filter={`url(#${gradientSeed}-softGlow)`} />
        <circle cx={particle.x} cy={particle.y} r={compact ? 6.2 : 8.2} fill={`url(#${gradientSeed}-particleFill)`} />
        <circle cx={particle.x} cy={particle.y} r={compact ? 2.6 : 3.2} fill={rgba(CHALK, 0.98)} />

        {!compact ? (
          <g
            fontFamily='"Bradley Hand", "Comic Sans MS", cursive'
            fill="rgba(245,247,255,0.88)"
            style={{ textShadow: '0 0 12px rgba(255,255,255,0.18)' }}
          >
            <text x={24} y={64} fontSize="18" fill={rgba(CHALK, 0.92)}>
              real signal
            </text>
            <path d={`M 30 70 Q 46 78 74 74`} fill="none" stroke={rgba(HOT_AMBER, 0.85)} strokeWidth={2} strokeLinecap="round" />

            <text x={size - 122} y={76} fontSize="16" fill={rgba(coolGlow, 0.92)}>
              {motionText}
            </text>
            <text x={size - 124} y={94} fontSize="12" fill="rgba(245,247,255,0.64)">
              momentum {Math.round(momentum * 100)}
            </text>
            <path d={`M ${size - 150} 102 Q ${size - 132} 112 ${size - 120} 128`} fill="none" stroke={rgba(coolGlow, 0.54)} strokeWidth={1.6} strokeLinecap="round" />

            <text x={size - 126} y={center + 10} fontSize="16" fill={rgba(hotGlow, 0.94)}>
              {heatText}
            </text>
            <text x={size - 126} y={center + 28} fontSize="12" fill="rgba(245,247,255,0.64)">
              risk heat
            </text>
            <path d={`M ${size - 128} ${center + 34} Q ${size - 106} ${center + 38} ${particle.x.toFixed(1)} ${(particle.y + 8).toFixed(1)}`} fill="none" stroke={rgba(hotGlow, 0.58)} strokeWidth={1.6} strokeLinecap="round" />

            <text x={26} y={size - 52} fontSize="16" fill={rgba(COOL_GREEN, 0.94)}>
              {pullText}
            </text>
            <text x={26} y={size - 34} fontSize="12" fill="rgba(245,247,255,0.64)">
              yield gravity
            </text>
            <path d={`M 88 ${size - 58} Q 116 ${size - 72} ${center - 12} ${center + coreRadius + 12}`} fill="none" stroke={rgba(COOL_GREEN, 0.54)} strokeWidth={1.6} strokeLinecap="round" />

            <text x={size - 152} y={size - 54} fontSize="16" fill={rgba(CHALK, 0.9)}>
              {massText}
            </text>
            <text x={size - 152} y={size - 36} fontSize="12" fill="rgba(245,247,255,0.64)">
              mass / liquidity
            </text>
            <path d={`M ${size - 132} ${size - 60} Q ${size - 116} ${size - 84} ${center + 10} ${center + 18}`} fill="none" stroke={rgba(CHALK, 0.42)} strokeWidth={1.6} strokeLinecap="round" />

            <text x={28} y={center - 20} fontSize="15" fill={rgba(orbitGlow, 0.88)}>
              {orbitText}
            </text>
            <text x={28} y={center - 2} fontSize="12" fill="rgba(245,247,255,0.64)">
              trend path
            </text>

            <text x={30} y={center + 94} fontSize="15" fill={rgba(CHALK, 0.76)}>
              {smoothText}
            </text>
            <text x={30} y={center + 112} fontSize="12" fill="rgba(245,247,255,0.64)">
              stability
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  )
}
