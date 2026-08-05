'use client'

import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import { sectorColor } from '@/lib/network-regions'
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
  const objects = communities.map((community) => ({ position: community.position, radius: community.sceneRadius }))
  if (!objects.length) return { center: { x: 0, y: 0, z: 0 }, key }
  // Enter through a stable systemic field, rather than fitting the bounding
  // box of the whole economy. It is an atlas landing point, not a selection.
  const landing = [...communities].sort((left, right) => (
    right.bridgeCount * 1.2 + right.memberCount + right.averageConfidence * 24
    - left.bridgeCount * 1.2 - left.memberCount - left.averageConfidence * 24
  ))[0]!
  return { center: landing.position, key }
}

type CameraFrame = {
  center: AtlasPosition
  key: string
}

function CameraRig({
  frame,
  communities,
  hoveredCommunity,
  reducedMotion,
  mobile,
  onLodCandidate,
}: {
  frame: CameraFrame
  communities: SceneCommunity[]
  hoveredCommunity: AtlasCommunity | null
  reducedMotion: boolean
  mobile: boolean
  onLodCandidate: (community: AtlasCommunity) => void
}) {
  const { camera } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const initialized = useRef(false)
  const lastLodCandidate = useRef<string | null>(null)
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

  // This is a world-navigation camera, not a fit-to-selection camera. The
  // distance is intentionally independent of the bounding box so growing the
  // atlas makes it feel larger rather than simply shrinking it on screen.
  const initialDistance = mobile ? 8.4 : 8.8

  useLayoutEffect(() => {
    const target = new THREE.Vector3(frame.center.x, frame.center.y, frame.center.z)
    const destination = new THREE.Vector3(
      target.x + initialDistance * (mobile ? 0.05 : 0.1),
      target.y + initialDistance * 0.08,
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

  function handleCameraEnd() {
    if (!controls.current || transition.current?.active) return
    const distance = camera.position.distanceTo(controls.current.target)
    // Semantic detail is only requested when the camera is actually near a
    // field. This keeps level-of-detail tied to navigation through the world,
    // not to a click, selected inspector, or arbitrary control target.
    if (distance > (mobile ? 9.2 : 8.4)) {
      lastLodCandidate.current = null
      return
    }
    const target = controls.current.target
    const candidate = hoveredCommunity
      ? communities.find((community) => community.id === hoveredCommunity.id)
      : communities
        .map((community) => ({ community, distance: target.distanceTo(new THREE.Vector3(...vector(community.position))) }))
        .sort((left, right) => left.distance - right.distance)[0]?.community
    if (!candidate) return
    const physicalDistance = camera.position.distanceTo(new THREE.Vector3(...vector(candidate.position)))
    const activationDistance = candidate.sceneRadius * (mobile ? 2.15 : 2.45) + (mobile ? 2.4 : 2.8)
    if (physicalDistance > activationDistance || lastLodCandidate.current === candidate.id) return
    lastLodCandidate.current = candidate.id
    onLodCandidate(candidate)
  }

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
      panSpeed={0.48}
      enableZoom
      enableRotate
      enableDamping={!reducedMotion}
      dampingFactor={0.045}
      autoRotate={false}
      zoomToCursor={!mobile}
      onStart={() => { if (transition.current) transition.current.active = false }}
      onEnd={handleCameraEnd}
      minDistance={mobile ? 3.6 : 2.8}
      maxDistance={mobile ? 44 : 68}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.8}
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
    />
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
  const color = sectorColor(community.dominantSector)
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
      <FieldCloud community={community} level={level} reducedMotion={reducedMotion} hovered={hovered || selected} />
      <mesh scale={selected ? 1.2 : hovered ? 1.1 : 1}>
        <sphereGeometry args={[0.13 + radius * 0.04, 18, 18]} />
        <meshBasicMaterial
          color={sectorColor(community.dominantSector)}
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

function VolatilityHalo({ node, radius, reducedMotion, active }: {
  node: AtlasNode
  radius: number
  reducedMotion: boolean
  active: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const volatility = node.volatility === null ? 0 : clamp(node.volatility / 0.8)
  const reach = clamp(node.centrality || node.importance)
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return
    const pulse = 1 + Math.sin(clock.elapsedTime * (0.45 + volatility * 0.7) + node.symbol.length) * (0.012 + volatility * 0.028)
    ref.current.scale.setScalar(pulse)
  })
  return (
    <mesh ref={ref} scale={1}>
      <sphereGeometry args={[radius * (1.38 + reach * 0.72 + volatility * 0.2), 18, 18]} />
      <meshBasicMaterial
        color={sectorColor(node.sector)}
        transparent
        opacity={active ? 0.13 : 0.025 + reach * 0.045 + volatility * 0.035}
        depthWrite={false}
      />
    </mesh>
  )
}

function CompanyNode({
  node,
  active,
  contextual,
  layer,
  showLabel,
  reducedMotion,
  onSelect,
  onHover,
}: {
  node: SceneNode
  active: boolean
  contextual: boolean
  layer: 'overview' | 'field' | 'focus'
  showLabel: boolean
  reducedMotion: boolean
  onSelect: (node: AtlasNode) => void
  onHover?: (node: AtlasNode | null) => void
}) {
  const color = sectorColor(node.sector)
  const radius = node.sceneRadius
  const opacity = active
    ? 1
    : layer === 'overview' && contextual
      ? 0.16 + clamp(node.centrality) * 0.1
      : contextual
        ? 0.46
        : 0.62 + clamp(node.centrality) * 0.3
  const motionRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!motionRef.current || reducedMotion) return
    const phase = stableUnit(`${node.symbol}:${node.communityId}:motion`) * Math.PI * 2
    const energy = 0.018 + clamp(node.centrality) * 0.024
    motionRef.current.position.set(
      Math.sin(clock.elapsedTime * 0.34 + phase) * energy,
      Math.cos(clock.elapsedTime * 0.28 + phase) * energy * 0.75,
      Math.sin(clock.elapsedTime * 0.22 + phase) * energy * 0.5,
    )
    motionRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.5 + phase) * (0.012 + clamp(node.importance) * 0.018))
  })
  return (
    <group
      position={vector(node.position)}
      onClick={(event) => { event.stopPropagation(); onSelect(node) }}
      onPointerEnter={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; onHover?.(node) }}
      onPointerLeave={() => { document.body.style.cursor = ''; onHover?.(null) }}
    >
      <group ref={motionRef}>
        <VolatilityHalo node={node} radius={radius} reducedMotion={reducedMotion} active={active} />
        <mesh scale={active ? 1.25 : layer === 'overview' && contextual ? 0.84 : 1}>
          <sphereGeometry args={[radius, 22, 22]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 0.42 : 0.09 + node.centrality * 0.12}
            roughness={0.3}
            metalness={0.01}
            transparent
            opacity={opacity}
            depthWrite={opacity > 0.5}
          />
        </mesh>
        {node.bridgeScore > 0.5 ? (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 1.58, 0.012 + node.bridgeScore * 0.01, 8, 36]} />
            <meshBasicMaterial color="#168f86" transparent opacity={0.18 + node.bridgeScore * 0.28} depthWrite={false} />
          </mesh>
        ) : null}
      </group>
      {showLabel ? (
        <Html center distanceFactor={10.5} position={[0, -radius - 0.13, 0]} className={styles.sceneLabel}>
          <button type="button" onClick={() => onSelect(node)} aria-label={`Focus ${node.name}`}>
            <span>{node.symbol}</span>
            {active ? <small>{node.country || node.sector || ''}</small> : null}
          </button>
        </Html>
      ) : null}
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

function AtlasCommunityLinks({
  atlas,
  communities,
  selectedId,
}: {
  atlas: RelationshipAtlas
  communities: SceneCommunity[]
  selectedId: string | null
}) {
  const positions = useMemo(() => new Map(communities.map((item) => [item.id, item.position])), [communities])
  const visibleLinks = useMemo(
    () => [...atlas.links]
      .sort((left, right) => right.strength * right.confidence - left.strength * left.confidence)
      .slice(0, 48),
    [atlas.links],
  )
  const strongest = Math.max(...visibleLinks.map((link) => link.strength), 1)
  return visibleLinks.map((link, index) => {
    const source = positions.get(link.source)
    const target = positions.get(link.target)
    if (!source || !target) return null
    const active = selectedId === link.source || selectedId === link.target
    const normalized = Math.sqrt(link.strength / strongest)
    const midpoint: AtlasPosition = {
      x: (source.x + target.x) * 0.5,
      y: (source.y + target.y) * 0.5 + (stableUnit(`${link.source}:${link.target}:arc`) - 0.5) * 0.55,
      z: (source.z + target.z) * 0.5 + 0.35 + normalized * 0.45,
    }
    return (
      <Line
        key={`${link.source}:${link.target}:${index}`}
        points={[vector(source), vector(midpoint), vector(target)]}
        color={active ? '#168f86' : '#84949a'}
        lineWidth={0.42 + normalized * (active ? 1.65 : 1.05)}
        transparent
        opacity={(0.055 + Math.pow(link.confidence, 2) * 0.27) * (selectedId && !active ? 0.32 : 1)}
        depthWrite={false}
      />
    )
  })
}

function SemanticDetailLayer({
  anchor,
  mobile,
  children,
}: {
  anchor: AtlasPosition
  mobile: boolean
  children: ReactNode
}) {
  const { camera } = useThree()
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    const distance = camera.position.distanceTo(new THREE.Vector3(...vector(anchor)))
    const near = mobile ? 5.6 : 4.6
    const far = mobile ? 12.8 : 10.8
    const raw = clamp((far - distance) / Math.max(0.001, far - near))
    const detail = raw * raw * (3 - 2 * raw)
    ref.current.visible = detail > 0.06
    ref.current.scale.setScalar(0.22 + detail * 0.78)
  })

  return (
    <group ref={ref} position={vector(anchor)}>
      <group position={[-anchor.x, -anchor.y, -anchor.z]}>{children}</group>
    </group>
  )
}

function Universe(props: MarketUniverseSceneProps) {
  const {
    atlas,
    detail,
    neighborhood,
    selectedCommunityId,
    lodCommunityId,
    lodDetail,
    activeSymbol,
    reducedMotion,
    mobile,
    onSelectCommunity,
    onSelectNode,
    onRequestLodCommunity,
  } = props
  const [hoveredCommunity, setHoveredCommunity] = useState<AtlasCommunity | null>(null)
  const scene = useMemo(
    () => buildMarketUniverseScene({
      atlas,
      detail,
      neighborhood,
      selectedCommunityId,
      lodCommunityId,
      lodDetail,
      activeSymbol,
      mobile,
    }),
    [activeSymbol, atlas, detail, lodCommunityId, lodDetail, mobile, neighborhood, selectedCommunityId],
  )
  const overviewPositions = useMemo(
    () => new Map(scene.overview.nodes.map((node) => [marketUniverseNodeKey(node), node.position])),
    [scene.overview.nodes],
  )
  const fieldPositions = useMemo(
    () => new Map(scene.field?.nodes.map((node) => [marketUniverseNodeKey(node), node.position]) ?? []),
    [scene.field?.nodes],
  )
  const companyPositions = useMemo(
    () => new Map(scene.company?.nodes.map((node) => [marketUniverseNodeKey(node), node.position]) ?? []),
    [scene.company?.nodes],
  )
  const fieldSymbols = useMemo(() => new Set(scene.field?.nodes.map((node) => node.symbol) ?? []), [scene.field?.nodes])
  // Selection layers decorate the persistent world; they must never become a
  // new camera frame. Reframing here is what made a zoomed-out user remain
  // visually locked to the last company or economic field.
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
      <CameraRig
        frame={frame}
        communities={scene.overview.communities}
        hoveredCommunity={hoveredCommunity}
        reducedMotion={reducedMotion}
        mobile={mobile}
        onLodCandidate={onRequestLodCommunity}
      />

      <AtlasCommunityLinks atlas={atlas} communities={scene.overview.communities} selectedId={selectedCommunityId ?? lodCommunityId} />
      {scene.overview.communities.map((community, index) => (
        <CommunityField
          key={community.id}
          community={community}
          level="economy"
          selected={community.id === selectedCommunityId || community.id === lodCommunityId}
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
      {scene.overview.edges.map((edge, index) => {
        const source = endpointPosition(overviewPositions, edge.sourceCommunityId, edge.source)
        const target = endpointPosition(overviewPositions, edge.targetCommunityId, edge.target)
        if (!source || !target) return null
        const active = activeSymbol === edge.source || activeSymbol === edge.target
        return (
          <RelationshipLine
            key={`${edge.source}:${edge.target}:${index}`}
            edge={edge}
            source={source}
            target={target}
            active={active}
            timing={atlas.view === 'timing'}
            ambientPulse={!active && index < (mobile ? 2 : 5) && (edge.confidence ?? 0) >= 0.7}
            reducedMotion={reducedMotion}
          />
        )
      })}
      {scene.overview.nodes.map((node, index) => (
        <CompanyNode
          key={`${node.communityId}:${node.symbol}:${index}`}
          node={node}
          active={node.symbol === activeSymbol}
          contextual={Boolean(node.context || node.isBoundary || fieldSymbols.has(node.symbol))}
          layer="overview"
          showLabel={scene.overview.labelSymbols.has(node.symbol) && !fieldSymbols.has(node.symbol)}
          reducedMotion={reducedMotion}
          onSelect={onSelectNode}
          onHover={(hoveredNode) => setHoveredCommunity(
            hoveredNode
              ? atlas.communities.find((community) => community.id === hoveredNode.communityId) ?? null
              : null,
          )}
        />
      ))}
      {scene.field ? (
        <SemanticDetailLayer anchor={scene.field.communities[0]?.position ?? { x: 0, y: 0, z: 0 }} mobile={mobile}>
          {scene.field.communities.map((community) => (
            <CommunityField
              key={`field:${community.id}`}
              community={community}
              level="field"
              selected={community.id === selectedCommunityId}
              hovered={community.id === hoveredCommunity?.id}
              dimmed={false}
              showLabel={false}
              reducedMotion={reducedMotion}
              onSelect={onSelectCommunity}
              onHover={setHoveredCommunity}
            />
          ))}
          {scene.field.edges.map((edge, index) => {
            const source = endpointPosition(fieldPositions, edge.sourceCommunityId, edge.source)
            const target = endpointPosition(fieldPositions, edge.targetCommunityId, edge.target)
            if (!source || !target) return null
            const active = activeSymbol === edge.source || activeSymbol === edge.target
            return <RelationshipLine key={`field:${edge.source}:${edge.target}:${index}`} edge={edge} source={source} target={target} active={active} timing={atlas.view === 'timing'} ambientPulse={!active && index < (mobile ? 2 : 5)} reducedMotion={reducedMotion} />
          })}
          {scene.field.nodes.filter((node) => !scene.company || node.symbol !== activeSymbol).map((node, index) => (
            <CompanyNode
              key={`field:${node.communityId}:${node.symbol}:${index}`}
              node={node}
              active={node.symbol === activeSymbol}
              contextual={Boolean(node.context || node.isBoundary)}
              layer="field"
              showLabel={Boolean(selectedCommunityId && scene.field?.labelSymbols.has(node.symbol))}
              reducedMotion={reducedMotion}
              onSelect={onSelectNode}
            />
          ))}
          {scene.company ? (
            <>
              {scene.company.edges.map((edge, index) => {
                const source = endpointPosition(companyPositions, edge.sourceCommunityId, edge.source)
                  ?? endpointPosition(fieldPositions, edge.sourceCommunityId, edge.source)
                  ?? endpointPosition(overviewPositions, edge.sourceCommunityId, edge.source)
                const target = endpointPosition(companyPositions, edge.targetCommunityId, edge.target)
                  ?? endpointPosition(fieldPositions, edge.targetCommunityId, edge.target)
                  ?? endpointPosition(overviewPositions, edge.targetCommunityId, edge.target)
                if (!source || !target) return null
                return <RelationshipLine key={`focus:${edge.source}:${edge.target}:${index}`} edge={edge} source={source} target={target} active timing={atlas.view === 'timing'} ambientPulse={false} reducedMotion={reducedMotion} />
              })}
              {scene.company.nodes.filter((node) => node.symbol === activeSymbol || !fieldSymbols.has(node.symbol)).map((node, index) => (
                <CompanyNode
                  key={`focus:${node.communityId}:${node.symbol}:${index}`}
                  node={node}
                  active={node.symbol === activeSymbol}
                  contextual={Boolean(node.context || node.isBoundary)}
                  layer="focus"
                  showLabel={Boolean(scene.company?.labelSymbols.has(node.symbol))}
                  reducedMotion={reducedMotion}
                  onSelect={onSelectNode}
                />
              ))}
            </>
          ) : null}
        </SemanticDetailLayer>
      ) : null}
    </>
  )
}

export type MarketUniverseSceneProps = {
  atlas: RelationshipAtlas
  detail: RelationshipAtlasDetail | null
  neighborhood: RelationshipAtlasDetail | null
  selectedCommunityId: string | null
  lodCommunityId: string | null
  lodDetail: RelationshipAtlasDetail | null
  activeSymbol: string | null
  reducedMotion: boolean
  mobile: boolean
  onSelectCommunity: (community: AtlasCommunity) => void
  onSelectNode: (node: AtlasNode) => void
  onRequestLodCommunity: (community: AtlasCommunity) => void
}

export default function MarketUniverseScene(props: MarketUniverseSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.8, 10.8], fov: 48, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => { document.body.style.cursor = '' }}
    >
      <Universe {...props} />
    </Canvas>
  )
}
