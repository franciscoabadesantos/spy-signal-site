'use client'

import { Html, Instance, Instances, Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type {
  AtlasCommunity,
  AtlasEdge,
  AtlasNode,
  AtlasPosition,
  RelationshipAtlas,
  RelationshipAtlasDetail,
} from '@/lib/network-atlas'
import {
  buildMarketUniverseScene,
  marketUniverseEdgeEndpointKey,
  marketUniverseNodeKey,
  type MarketUniverseLevel,
  type SceneCommunity,
  type SceneNode,
} from '@/lib/market-universe-layout'
import { marketRegionColor, normalizeMarketRegion } from '@/lib/network-regions'
import styles from './MarketUniverse.module.css'

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function vector(position: AtlasPosition): [number, number, number] {
  return [position.x, position.y, position.z]
}

function endpointPosition(
  positions: Map<string, AtlasPosition>,
  communityId: string,
  symbol: string,
): AtlasPosition | undefined {
  return positions.get(marketUniverseEdgeEndpointKey(communityId, symbol))
}

function stableUnit(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function cameraFrame(
  communities: SceneCommunity[],
  key: string,
): CameraFrame {
  if (!communities.length) return { center: { x: 0, y: 0, z: 0 }, radius: 6, key }
  // Open on the whole economy, framed to fit every field. The map reads as a
  // single territory on launch, then is explored by panning and zooming — rather
  // than dropping the viewer into one landing field.
  let cx = 0
  let cy = 0
  let cz = 0
  for (const community of communities) {
    cx += community.position.x
    cy += community.position.y
    cz += community.position.z
  }
  const count = communities.length
  const center = { x: cx / count, y: cy / count, z: cz / count }
  let radius = 1
  for (const community of communities) {
    const spread = Math.hypot(community.position.x - center.x, community.position.y - center.y) + community.sceneRadius
    radius = Math.max(radius, spread)
  }
  return { center, radius, key }
}

type CameraFrame = {
  center: AtlasPosition
  radius: number
  key: string
}

function CameraRig({
  frame,
  reducedMotion,
  mobile,
}: {
  frame: CameraFrame
  reducedMotion: boolean
  mobile: boolean
}) {
  const { camera } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const initialized = useRef(false)
  const lastLandedKey = useRef<string | null>(null)
  const transition = useRef<{
    active: boolean
    elapsed: number
    duration: number
    fromPosition: THREE.Vector3
    toPosition: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    onComplete?: () => void
  } | null>(null)

  // Fit the whole economy in view on landing. A fixed assumed aspect (rather
  // than the live viewport) keeps the framing stable and avoids re-landing the
  // camera on every resize.
  const perspectiveFov = (camera as THREE.PerspectiveCamera).fov ?? 42
  const verticalFov = (perspectiveFov * Math.PI) / 180
  const assumedAspect = mobile ? 0.72 : 1.6
  const fitVertical = frame.radius / Math.tan(verticalFov / 2)
  const fitHorizontal = frame.radius / (Math.tan(verticalFov / 2) * assumedAspect)
  const initialDistance = Math.max(fitVertical, fitHorizontal) * (mobile ? 1.18 : 1.04)

  useLayoutEffect(() => {
    // Land the camera only on first mount and when the view/window changes —
    // never on the scene rebuilds that a selection or a zoom-triggered detail
    // load causes. Re-landing on every rebuild is what yanked the camera back to
    // a fixed area instead of letting the viewer freely zoom where they liked.
    if (initialized.current && lastLandedKey.current === frame.key) return
    lastLandedKey.current = frame.key
    const target = new THREE.Vector3(frame.center.x, frame.center.y, frame.center.z)
    // Read as a map: look at the correlation plane almost face-on. A small,
    // fixed y-lift keeps a hint of 2.5D depth (fog layering the z axis) without
    // the oblique framing that made the old free-orbit scene feel like a globe.
    const destination = new THREE.Vector3(
      target.x,
      target.y + initialDistance * 0.05,
      frame.center.z + initialDistance,
    )
    const immediate = !initialized.current || reducedMotion
    initialized.current = true
    const fromTarget = controls.current?.target.clone() ?? target.clone()
    transition.current = {
      active: !immediate,
      elapsed: 0,
      duration: 0.78,
      fromPosition: camera.position.clone(),
      toPosition: destination,
      fromTarget,
      toTarget: target,
    }
    if (immediate) {
      camera.position.copy(destination)
      controls.current?.target.copy(target)
      camera.lookAt(target)
      controls.current?.update()
    }
  }, [camera, frame.center.x, frame.center.y, frame.center.z, frame.key, initialDistance, mobile, reducedMotion])

  useFrame((_state, delta) => {
    const current = transition.current
    if (!current?.active) return
    current.elapsed += delta
    const progress = clamp(current.elapsed / current.duration)
    const eased = 1 - Math.pow(1 - progress, 4)
    camera.position.lerpVectors(current.fromPosition, current.toPosition, eased)
    if (controls.current) {
      controls.current.target.lerpVectors(current.fromTarget, current.toTarget, eased)
      controls.current.update()
    } else {
      camera.lookAt(current.toTarget)
    }
    if (progress >= 1) {
      current.active = false
      current.onComplete?.()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan
      panSpeed={0.9}
      screenSpacePanning
      enableZoom
      // A map, not a globe: drag pans, wheel/pinch zooms, but the view stays
      // locked face-on to the correlation plane. Rotation is what made the old
      // scene disorienting and hard to read.
      enableRotate={false}
      // Remap inputs to a map scheme. OrbitControls defaults LEFT=rotate; with
      // rotation disabled that made left-drag a no-op (the "can't drag" bug).
      // Left OR right drag pans; wheel/middle dollies; one finger pans, two
      // fingers pinch-zoom and pan.
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
      enableDamping={!reducedMotion}
      dampingFactor={0.045}
      autoRotate={false}
      zoomToCursor={!mobile}
      onStart={() => { if (transition.current) transition.current.active = false }}
      minDistance={mobile ? 3.6 : 2.8}
      maxDistance={mobile ? 44 : 68}
    />
  )
}

// Soft radial-gradient territory glow behind each field. This is what fills the
// space between the dots and makes the economy read as continuous, overlapping
// regions rather than scattered clusters. One camera-facing sprite per field.
let sharedFieldGlowTexture: THREE.Texture | null = null
function fieldGlowTexture(): THREE.Texture {
  if (sharedFieldGlowTexture) return sharedFieldGlowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  sharedFieldGlowTexture = new THREE.CanvasTexture(canvas)
  return sharedFieldGlowTexture
}

function FieldGlow({ community, hovered, selected }: {
  community: SceneCommunity
  hovered: boolean
  selected: boolean
}) {
  const texture = useMemo(() => fieldGlowTexture(), [])
  // Most communities carry no dominant region yet, which would render an
  // invisible slate glow; fall back to a soft warm tint so every field still
  // reads as a territory.
  const region = normalizeMarketRegion(community.dominantRegion)
  const color = region === 'unknown' ? '#b9c2b0' : marketRegionColor(community.dominantRegion)
  const scale = community.sceneRadius * (selected ? 6.4 : 5.6)
  const opacity = selected ? 0.36 : hovered ? 0.32 : 0.28
  return (
    <sprite scale={[scale, scale, 1]} renderOrder={-2}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </sprite>
  )
}

function FieldCloud({ community, level, reducedMotion, hovered }: {
  community: SceneCommunity
  level: MarketUniverseLevel
  reducedMotion: boolean
  hovered: boolean
}) {
  const ref = useRef<THREE.Points>(null)
  const radius = community.sceneRadius
  const color = marketRegionColor(community.dominantRegion)
  const positions = useMemo(() => {
    const count = level === 'economy'
      ? Math.round(clamp(radius * 34, 72, 146))
      : Math.round(clamp(radius * 28, 90, 166))
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const longitude = stableUnit(`${community.id}:${index}:longitude`) * Math.PI * 2
      const latitude = (stableUnit(`${community.id}:${index}:latitude`) - 0.5) * Math.PI
      const distance = radius * (0.24 + Math.pow(stableUnit(`${community.id}:${index}:distance`), 0.7) * 0.72)
      values[index * 3] = Math.cos(longitude) * Math.cos(latitude) * distance
      values[index * 3 + 1] = Math.sin(latitude) * distance * 0.7
      values[index * 3 + 2] = Math.sin(longitude) * Math.cos(latitude) * distance * 0.9
    }
    return values
  }, [community.id, level, radius])
  useFrame(({ clock }, delta) => {
    if (!ref.current || reducedMotion) return
    ref.current.rotation.y += delta * (hovered ? 0.032 : 0.012)
    ref.current.rotation.x += delta * 0.003
    const attribute = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let index = 0; index < attribute.count; index += 1) {
      const phase = stableUnit(`${community.id}:${index}:motion`) * Math.PI * 2
      const x = positions[index * 3] ?? 0
      const y = positions[index * 3 + 1] ?? 0
      const z = positions[index * 3 + 2] ?? 0
      const sway = Math.sin(clock.elapsedTime * 0.19 + phase) * radius * 0.022
      attribute.setXYZ(index, x + sway, y + Math.cos(clock.elapsedTime * 0.16 + phase) * radius * 0.014, z)
    }
    attribute.needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled renderOrder={-1}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial
        color={color}
        size={level === 'economy' ? 0.042 : 0.035}
        transparent
        opacity={hovered ? 0.24 : level === 'economy' ? 0.11 : 0.07}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function AmbientDust({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(210 * 3)
    let seed = 91
    const random = () => {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1)
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61)
      return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296
    }
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (random() - 0.5) * 62
      values[index + 1] = (random() - 0.5) * 38
      values[index + 2] = (random() - 0.5) * 36
    }
    return values
  }, [])
  useFrame((_state, delta) => {
    if (!reducedMotion && pointsRef.current) pointsRef.current.rotation.y += delta * 0.004
  })
  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#6d8194" size={0.025} transparent opacity={0.1} depthWrite={false} />
    </points>
  )
}

function CommunityField({
  community,
  level,
  selected,
  hovered,
  dimmed,
  showLabel,
  reducedMotion,
  onSelect,
  onHover,
}: {
  community: SceneCommunity
  level: MarketUniverseLevel
  selected: boolean
  hovered: boolean
  dimmed: boolean
  showLabel: boolean
  reducedMotion: boolean
  onSelect: (community: AtlasCommunity) => void
  onHover: (community: AtlasCommunity | null) => void
}) {
  const radius = community.sceneRadius
  const interactive = level === 'economy'
  return (
    <group position={vector(community.position)}>
      {level === 'economy' ? <FieldGlow community={community} hovered={hovered} selected={selected} /> : null}
      <FieldCloud community={community} level={level} reducedMotion={reducedMotion} hovered={hovered || selected} />
      <mesh scale={selected ? 1.2 : hovered ? 1.1 : 1}>
        <sphereGeometry args={[0.13 + radius * 0.04, 18, 18]} />
        <meshBasicMaterial
          color={marketRegionColor(community.dominantRegion)}
          transparent
          opacity={selected ? 0.48 : hovered ? 0.32 : 0.17}
          depthWrite={false}
        />
      </mesh>
      {interactive ? (
        <mesh
          onClick={(event) => { event.stopPropagation(); onSelect(community) }}
          onDoubleClick={(event) => { event.stopPropagation(); onSelect(community) }}
          onPointerEnter={() => { document.body.style.cursor = 'zoom-in'; onHover(community) }}
          onPointerLeave={() => { document.body.style.cursor = ''; onHover(null) }}
          scale={[1.18, 0.82, 1]}
        >
          <sphereGeometry args={[radius, 18, 14]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      ) : null}
      {!dimmed && showLabel ? (
        <Html center distanceFactor={level === 'economy' ? 12 : 14} position={[0, -radius * 0.88, 0]} className={styles.fieldLabel}>
          <button type="button" onClick={() => onSelect(community)}>
            <span>{community.label}</span>
            <small>{community.scopeLabel} · {community.memberCount} companies</small>
          </button>
        </Html>
      ) : null}
    </group>
  )
}

// Instanced overview layer. The economy view can carry hundreds of landmark
// nodes; rendering each as its own React mesh + useFrame does not scale, so the
// bodies and halos are drawn as two InstancedMesh batches (two draw calls) with
// per-instance color and scale. Per-instance opacity is not available on a
// shared material, so contextual nodes are faded by blending their color toward
// the paper background rather than by transparency.
const PAPER_COLOR = new THREE.Color('#f3efe6')

function nodeBodyColor(node: SceneNode, active: boolean, contextual: boolean): THREE.Color {
  const base = new THREE.Color(marketRegionColor(node.region))
  if (active) return base.lerp(new THREE.Color('#ffffff'), 0.14)
  // Grade prominence by relevance so systemic leaders read from a distance and
  // the long tail recedes toward the paper ground instead of forming a uniform
  // mass. Boundary/context nodes fade the most.
  const reach = clamp(node.centrality || node.importance)
  const fade = contextual ? 0.5 : 0.08 + (1 - reach) * 0.34
  return base.lerp(PAPER_COLOR, fade)
}

function NodeInstances({
  nodes,
  activeSymbol,
  layer,
  labelSymbols,
  isContextual,
  onSelect,
  onHover,
}: {
  nodes: SceneNode[]
  activeSymbol: string | null
  layer: 'overview' | 'field' | 'focus'
  labelSymbols: Set<string>
  isContextual: (node: SceneNode) => boolean
  onSelect: (node: AtlasNode) => void
  onHover?: (node: AtlasNode | null) => void
}) {
  const count = nodes.length
  // The overview fits the whole economy, so nodes are seen from far away; give
  // them more presence there than in the closer field/focus layers.
  const sizeBoost = layer === 'overview' ? 1.5 : 1
  const bridges = useMemo(() => nodes.filter((node) => node.bridgeScore > 0.5), [nodes])
  const labels = useMemo(() => nodes.filter((node) => labelSymbols.has(node.symbol)), [labelSymbols, nodes])
  const active = useMemo(() => nodes.find((node) => node.symbol === activeSymbol) ?? null, [activeSymbol, nodes])
  if (!count) return null
  return (
    <group>
      <Instances key={`halo:${count}`} limit={count} range={count} frustumCulled={false} renderOrder={0}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial transparent opacity={layer === 'overview' ? 0.09 : 0.1} depthWrite={false} />
        {nodes.map((node, index) => {
          const reach = clamp(node.centrality || node.importance)
          const volatility = node.volatility === null ? 0 : clamp(node.volatility / 0.8)
          return (
            <Instance
              key={`halo:${node.communityId}:${node.symbol}:${index}`}
              position={vector(node.position)}
              scale={node.sceneRadius * sizeBoost * (1.34 + reach * 0.72 + volatility * 0.2)}
              color={marketRegionColor(node.region)}
            />
          )
        })}
      </Instances>

      <Instances key={`body:${count}`} limit={count} range={count} frustumCulled={false} renderOrder={1}>
        <sphereGeometry args={[1, 22, 22]} />
        <meshStandardMaterial roughness={0.34} metalness={0.02} envMapIntensity={0.4} />
        {nodes.map((node, index) => {
          const isActive = node.symbol === activeSymbol
          const contextual = isContextual(node)
          const scale = node.sceneRadius * sizeBoost * (isActive ? 1.28 : contextual && layer === 'overview' ? 0.82 : 1)
          return (
            <Instance
              key={`body:${node.communityId}:${node.symbol}:${index}`}
              position={vector(node.position)}
              scale={scale}
              color={nodeBodyColor(node, isActive, contextual)}
              onClick={(event) => { event.stopPropagation(); onSelect(node) }}
              onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; onHover?.(node) }}
              onPointerOut={() => { document.body.style.cursor = ''; onHover?.(null) }}
            />
          )
        })}
      </Instances>

      {bridges.map((node, index) => (
        <mesh key={`bridge:${node.symbol}:${index}`} position={vector(node.position)} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[node.sceneRadius * 1.6, 0.012 + node.bridgeScore * 0.01, 8, 36]} />
          <meshBasicMaterial color="#168f86" transparent opacity={0.2 + node.bridgeScore * 0.26} depthWrite={false} />
        </mesh>
      ))}

      {active ? (
        <mesh position={vector(active.position)} renderOrder={2}>
          <sphereGeometry args={[active.sceneRadius * 3.4, 20, 20]} />
          <meshBasicMaterial color={marketRegionColor(active.region)} transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ) : null}

      {labels.map((node, index) => (
        <Html
          key={`label:${node.symbol}:${index}`}
          center
          distanceFactor={layer === 'overview' ? 11 : 10.5}
          position={[node.position.x, node.position.y - node.sceneRadius - 0.13, node.position.z]}
          className={styles.sceneLabel}
        >
          <button type="button" onClick={() => onSelect(node)} aria-label={`Focus ${node.name}`}>
            <span>{node.symbol}</span>
            {node.symbol === activeSymbol ? <small>{node.country || node.sector || ''}</small> : null}
          </button>
        </Html>
      ))}
    </group>
  )
}

// A field's extra members (beyond its always-visible landmarks), loaded on
// approach and rendered in the overview's OWN coordinates. The whole batch fades
// in by camera proximity to the field, so the field grows denser in place as you
// near it — no separate overlay, no re-projection. One InstancedMesh per loaded
// field; invisible and non-interactive until you are close enough to matter.
function ProximityField({
  community,
  members,
  activeSymbol,
  mobile,
  onSelect,
  onHover,
}: {
  community: SceneCommunity
  members: SceneNode[]
  activeSymbol: string | null
  mobile: boolean
  onSelect: (node: AtlasNode) => void
  onHover?: (node: AtlasNode | null) => void
}) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const center = useMemo(
    () => new THREE.Vector3(community.position.x, community.position.y, community.position.z),
    [community.position.x, community.position.y, community.position.z],
  )
  // Reveal is gated by TWO independent things so zooming in only fills in the
  // field you are actually over — not every field in the world. Raw eye-distance
  // conflated the two: dollying in shrinks the distance to every field at once.
  //  - height gate: how close the camera is to the correlation plane (zoom).
  //  - lateral gate: how centred this field is under the look-point (its XY
  //    offset from the camera), so fields off to the side stay hidden.
  const zoomNear = mobile ? 8 : 10
  const zoomFar = mobile ? 15 : 18
  const latNear = community.sceneRadius * 0.9
  const latFar = community.sceneRadius * 2 + 2
  useFrame(() => {
    const cam = camera.position
    const height = Math.abs(cam.z - center.z)
    const lateral = Math.hypot(cam.x - center.x, cam.y - center.y)
    const heightGate = clamp((zoomFar - height) / Math.max(0.001, zoomFar - zoomNear))
    const lateralGate = clamp((latFar - lateral) / Math.max(0.001, latFar - latNear))
    const raw = heightGate * lateralGate
    const eased = raw * raw * (3 - 2 * raw)
    if (groupRef.current) groupRef.current.visible = eased > 0.02
    if (material.current) material.current.opacity = eased
  })
  if (!members.length) return null
  return (
    <group ref={groupRef} visible={false}>
      <Instances
        key={`members:${community.id}:${members.length}`}
        limit={members.length}
        range={members.length}
        frustumCulled={false}
        renderOrder={1}
      >
        <sphereGeometry args={[1, 18, 18]} />
        <meshStandardMaterial ref={material} roughness={0.34} metalness={0.02} envMapIntensity={0.4} transparent opacity={0} depthWrite={false} />
        {members.map((node, index) => {
          const isActive = node.symbol === activeSymbol
          return (
            <Instance
              key={`member:${node.communityId}:${node.symbol}:${index}`}
              position={vector(node.position)}
              scale={node.sceneRadius * (isActive ? 1.28 : 1)}
              color={nodeBodyColor(node, isActive, false)}
              onClick={(event) => { event.stopPropagation(); onSelect(node) }}
              onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; onHover?.(node) }}
              onPointerOut={() => { document.body.style.cursor = ''; onHover?.(null) }}
            />
          )
        })}
      </Instances>
    </group>
  )
}

function FlowPulse({ source, target, color, reducedMotion, phase, speed, opacity }: {
  source: AtlasPosition
  target: AtlasPosition
  color: string
  reducedMotion: boolean
  phase: number
  speed: number
  opacity: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const progress = reducedMotion ? 0.58 : (clock.elapsedTime * speed + phase) % 1
    ref.current.position.set(
      source.x + (target.x - source.x) * progress,
      source.y + (target.y - source.y) * progress,
      source.z + (target.z - source.z) * progress,
    )
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function RelationshipLine({
  edge,
  source,
  target,
  active,
  timing,
  ambientPulse,
  reducedMotion,
}: {
  edge: AtlasEdge
  source: AtlasPosition
  target: AtlasPosition
  active: boolean
  timing: boolean
  ambientPulse: boolean
  reducedMotion: boolean
}) {
  const strength = clamp(Math.abs(edge.strength))
  const confidence = edge.confidence === null ? null : clamp(edge.confidence)
  const color = edge.strength < 0 ? '#b56883' : active ? '#168f86' : '#718995'
  const opacity = confidence === null
    ? active ? 0.34 : 0.045
    : active
      ? 0.18 + Math.pow(confidence, 1.7) * 0.66
      : 0.012 + Math.pow(confidence, 2.25) * 0.21
  return (
    <>
      <Line
        renderOrder={2}
        points={[vector(source), vector(target)]}
        color={color}
        lineWidth={(active ? 1.25 : 0.18) + Math.pow(strength, 1.35) * (active ? 2.8 : 1.35)}
        dashed={timing}
        dashSize={0.11}
        gapSize={0.075}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
      {timing && active ? (
        <FlowPulse source={source} target={target} color={color} reducedMotion={reducedMotion} phase={0} speed={0.22} opacity={0.8} />
      ) : ambientPulse ? (
        <FlowPulse
          source={source}
          target={target}
          color={color}
          reducedMotion={reducedMotion}
          phase={stableUnit(`${edge.source}:${edge.target}:pulse`)}
          speed={0.07}
          opacity={0.32}
        />
      ) : null}
    </>
  )
}

// The overview edges are the ticker-to-ticker web that crosses between fields —
// each line runs between two actual companies, never between field centroids, so
// you can see which companies bridge sectors. Drawn as one batched LineSegments
// (a single draw call) regardless of edge count. Per-edge prominence is encoded
// in the vertex color (faint edges blend toward the paper background), since a
// shared line material has no per-segment opacity.
function overviewEdgeColor(edge: AtlasEdge): THREE.Color {
  const base = new THREE.Color(edge.strength < 0 ? '#b56883' : '#5f7a86')
  const strength = clamp(Math.abs(edge.strength))
  const confidence = edge.confidence === null ? strength : clamp(edge.confidence)
  const prominence = clamp(confidence * 0.6 + strength * 0.4)
  return base.lerp(PAPER_COLOR, 0.7 - Math.pow(prominence, 1.2) * 0.64)
}

function OverviewEdges({ edges, positions }: { edges: AtlasEdge[]; positions: Map<string, AtlasPosition> }) {
  const geometry = useMemo(() => {
    const points: number[] = []
    const colors: number[] = []
    for (const edge of edges) {
      const source = positions.get(marketUniverseEdgeEndpointKey(edge.sourceCommunityId, edge.source))
      const target = positions.get(marketUniverseEdgeEndpointKey(edge.targetCommunityId, edge.target))
      if (!source || !target) continue
      const color = overviewEdgeColor(edge)
      points.push(source.x, source.y, source.z, target.x, target.y, target.z)
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [edges, positions])
  useEffect(() => () => geometry.dispose(), [geometry])
  if (geometry.getAttribute('position').count === 0) return null
  return (
    <lineSegments geometry={geometry} renderOrder={1} frustumCulled={false}>
      <lineBasicMaterial vertexColors transparent opacity={0.85} depthWrite={false} />
    </lineSegments>
  )
}

function Universe(props: MarketUniverseSceneProps) {
  const {
    atlas,
    fieldDetails,
    selectedCommunityId,
    activeSymbol,
    reducedMotion,
    mobile,
    onSelectCommunity,
    onSelectNode,
  } = props
  const [hoveredCommunity, setHoveredCommunity] = useState<AtlasCommunity | null>(null)
  // One relevance-graded map: the persistent overview is the whole scene. There
  // is no separate re-projected cloud floated over the map. From afar you see
  // each field's landmarks; as the camera nears a field, its members (all loaded
  // up front) fade in *in place* — same coordinates, the field just grows denser
  // — rather than a layer laid on top. Selection drives the inspector.
  const scene = useMemo(
    () => buildMarketUniverseScene({
      atlas,
      detail: null,
      neighborhood: null,
      selectedCommunityId,
      fieldDetails,
      activeSymbol,
      mobile,
    }),
    [activeSymbol, atlas, fieldDetails, mobile, selectedCommunityId],
  )
  const overviewPositions = useMemo(
    () => new Map(scene.overview.nodes.map((node) => [marketUniverseNodeKey(node), node.position])),
    [scene.overview.nodes],
  )
  // Selection decorates the persistent world; it must never become a new camera
  // frame. Reframing here is what made a zoomed-out user remain visually locked
  // to the last company or economic field.
  const frame = useMemo(
    () => cameraFrame(scene.overview.communities, `${atlas.window}:${atlas.view}:${mobile ? 'mobile' : 'desktop'}`),
    [atlas.view, atlas.window, mobile, scene.overview.communities],
  )

  return (
    <>
      <color attach="background" args={['#f3efe6']} />
      <fog attach="fog" args={['#f3efe6', 22, 72]} />
      <ambientLight intensity={1.75} />
      <directionalLight position={[4, 8, 10]} intensity={1.35} color="#ffffff" />
      <pointLight position={[-8, -2, 5]} intensity={9} distance={36} color="#63b8b0" />
      <AmbientDust reducedMotion={reducedMotion} />
      <CameraRig frame={frame} reducedMotion={reducedMotion} mobile={mobile} />

      {scene.overview.communities.map((community, index) => (
        <CommunityField
          key={community.id}
          community={community}
          level="economy"
          selected={community.id === selectedCommunityId}
          hovered={community.id === hoveredCommunity?.id}
          dimmed={false}
          showLabel={index < (mobile ? 4 : 8)}
          reducedMotion={reducedMotion}
          onSelect={(community) => {
            setHoveredCommunity(community)
            onSelectCommunity(community)
          }}
          onHover={setHoveredCommunity}
        />
      ))}
      <OverviewEdges edges={scene.overview.edges} positions={overviewPositions} />
      {activeSymbol
        ? scene.overview.edges
          .filter((edge) => edge.source === activeSymbol || edge.target === activeSymbol)
          .slice(0, 14)
          .map((edge, index) => {
            const source = endpointPosition(overviewPositions, edge.sourceCommunityId, edge.source)
            const target = endpointPosition(overviewPositions, edge.targetCommunityId, edge.target)
            if (!source || !target) return null
            return (
              <RelationshipLine
                key={`active:${edge.source}:${edge.target}:${index}`}
                edge={edge}
                source={source}
                target={target}
                active
                timing={atlas.view === 'timing'}
                ambientPulse={false}
                reducedMotion={reducedMotion}
              />
            )
          })
        : null}
      <NodeInstances
        nodes={scene.overview.nodes}
        activeSymbol={activeSymbol}
        layer="overview"
        labelSymbols={scene.overview.labelSymbols}
        isContextual={(node) => Boolean(node.context || node.isBoundary)}
        onSelect={onSelectNode}
        onHover={(hoveredNode) => setHoveredCommunity(
          hoveredNode
            ? atlas.communities.find((community) => community.id === hoveredNode.communityId) ?? null
            : null,
        )}
      />
      {scene.overview.communities.map((community) => {
        const members = scene.overview.memberNodesByCommunity.get(community.id)
        if (!members?.length) return null
        return (
          <ProximityField
            key={`members:${community.id}`}
            community={community}
            members={members}
            activeSymbol={activeSymbol}
            mobile={mobile}
            onSelect={onSelectNode}
            onHover={(hoveredNode) => setHoveredCommunity(
              hoveredNode
                ? atlas.communities.find((item) => item.id === hoveredNode.communityId) ?? null
                : null,
            )}
          />
        )
      })}
    </>
  )
}

export type MarketUniverseSceneProps = {
  atlas: RelationshipAtlas
  fieldDetails: Map<string, RelationshipAtlasDetail>
  selectedCommunityId: string | null
  activeSymbol: string | null
  reducedMotion: boolean
  mobile: boolean
  onSelectCommunity: (community: AtlasCommunity) => void
  onSelectNode: (node: AtlasNode) => void
}

export default function MarketUniverseScene(props: MarketUniverseSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 10.8], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => { document.body.style.cursor = '' }}
    >
      <Universe {...props} />
    </Canvas>
  )
}
