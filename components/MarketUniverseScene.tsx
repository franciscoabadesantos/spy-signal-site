'use client'

import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
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
import { sectorColor } from '@/lib/network-regions'
import styles from './MarketUniverse.module.css'

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function vector(position: AtlasPosition): [number, number, number] {
  return [position.x, position.y, position.z]
}

function nodeRadius(node: AtlasNode): number {
  if (node.marketCap && node.marketCap > 0) {
    const normalized = clamp((Math.log10(node.marketCap) - 8.5) / 4)
    return 0.105 + Math.pow(normalized, 1.3) * 0.24
  }
  return 0.11 + clamp(node.centrality || node.importance) * 0.17
}

function communityRadius(community: AtlasCommunity): number {
  return 0.82 + Math.min(1.35, Math.log2(community.memberCount + 1) * 0.18)
}

function cameraFrame(
  communities: AtlasCommunity[],
  nodes: AtlasNode[],
  options: { focused: boolean; key: string },
): CameraFrame {
  const { focused, key } = options
  const objects = [
    ...communities.map((community) => ({ position: community.position, radius: communityRadius(community) })),
    ...nodes.map((node) => ({ position: node.position, radius: nodeRadius(node) })),
  ]
  if (!objects.length) return { center: { x: 0, y: 0, z: 0 }, radius: focused ? 3.2 : 7, focused, key }
  const minimum = new THREE.Vector3(Infinity, Infinity, Infinity)
  const maximum = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
  for (const item of objects) {
    minimum.min(new THREE.Vector3(
      item.position.x - item.radius,
      item.position.y - item.radius,
      item.position.z - item.radius,
    ))
    maximum.max(new THREE.Vector3(
      item.position.x + item.radius,
      item.position.y + item.radius,
      item.position.z + item.radius,
    ))
  }
  const center = minimum.clone().add(maximum).multiplyScalar(0.5)
  const radius = Math.max(
    focused ? 2.8 : 4.8,
    ...objects.map((item) => center.distanceTo(new THREE.Vector3(item.position.x, item.position.y, item.position.z)) + item.radius),
  )
  return { center: { x: center.x, y: center.y, z: center.z }, radius, focused, key }
}

type CameraFrame = {
  center: AtlasPosition
  radius: number
  key: string
  focused: boolean
}

function CameraRig({ frame, reducedMotion, mobile }: { frame: CameraFrame; reducedMotion: boolean; mobile: boolean }) {
  const { camera } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const transition = useRef<{
    active: boolean
    elapsed: number
    duration: number
    fromPosition: THREE.Vector3
    toPosition: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
  } | null>(null)

  useEffect(() => {
    const chromeOffset = mobile
      ? 0
      : frame.focused
        ? Math.min(2.4, 0.8 + frame.radius * 0.22)
        : -Math.min(2.25, 0.65 + frame.radius * 0.16)
    const target = new THREE.Vector3(frame.center.x + chromeOffset, frame.center.y, frame.center.z)
    const halfFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov * 0.5)
    const distance = clamp(
      (frame.radius / Math.max(Math.tan(halfFov), 0.2)) * (mobile ? 1.38 : 1.18),
      frame.focused ? 7.2 : 10,
      mobile ? 28 : 25,
    )
    const destination = new THREE.Vector3(
      target.x + distance * (mobile ? 0.045 : 0.085),
      target.y + distance * (frame.focused ? 0.055 : 0.035),
      frame.center.z + distance,
    )
    const fromTarget = controls.current?.target.clone() ?? target.clone()
    transition.current = {
      active: !reducedMotion,
      elapsed: 0,
      duration: frame.focused ? 0.52 : 0.68,
      fromPosition: camera.position.clone(),
      toPosition: destination,
      fromTarget,
      toTarget: target,
    }
    if (reducedMotion) {
      camera.position.copy(destination)
      controls.current?.target.copy(target)
      camera.lookAt(target)
      controls.current?.update()
    }
  }, [camera, frame.center.x, frame.center.y, frame.center.z, frame.focused, frame.key, frame.radius, mobile, reducedMotion])

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
    if (progress >= 1) current.active = false
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom
      enableRotate={!mobile}
      enableDamping={!reducedMotion}
      dampingFactor={0.045}
      autoRotate={false}
      minDistance={5.5}
      maxDistance={30}
      minPolarAngle={Math.PI * 0.33}
      maxPolarAngle={Math.PI * 0.67}
      minAzimuthAngle={mobile ? -0.15 : -Infinity}
      maxAzimuthAngle={mobile ? 0.15 : Infinity}
    />
  )
}

function AmbientDust({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(150 * 3)
    let seed = 91
    const random = () => {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1)
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61)
      return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296
    }
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (random() - 0.5) * 30
      values[index + 1] = (random() - 0.5) * 19
      values[index + 2] = (random() - 0.5) * 15
    }
    return values
  }, [])
  useFrame((_state, delta) => {
    if (!reducedMotion && pointsRef.current) pointsRef.current.rotation.y += delta * 0.004
  })
  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#6d8194" size={0.025} transparent opacity={0.12} depthWrite={false} />
    </points>
  )
}

function CommunityField({
  community,
  selected,
  dimmed,
  showLabel,
  onSelect,
}: {
  community: AtlasCommunity
  selected: boolean
  dimmed: boolean
  showLabel: boolean
  onSelect: (community: AtlasCommunity) => void
}) {
  const radius = communityRadius(community)
  const color = sectorColor(community.dominantSector)
  const alpha = dimmed ? 0.008 : selected ? 0.026 : 0.014 + community.averageConfidence * 0.018
  return (
    <group position={vector(community.position)}>
      <mesh
        renderOrder={-2}
        onClick={(event) => { event.stopPropagation(); onSelect(community) }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
        scale={[1.28, 0.72, 0.58]}
      >
        <sphereGeometry args={[radius, 28, 18]} />
        <meshBasicMaterial color={color} transparent opacity={alpha} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh renderOrder={-1} scale={[1.3, 0.73, 0.6]}>
        <sphereGeometry args={[radius, 22, 14]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.045 : dimmed ? 0.01 : 0.032} wireframe depthWrite={false} />
      </mesh>
      {!dimmed && showLabel ? (
        <Html center distanceFactor={13} position={[0, -radius * 0.77, 0]} className={styles.fieldLabel}>
          <button type="button" onClick={() => onSelect(community)}>
            <span>{community.label}</span>
            <small>{community.memberCount} · {community.dominantRegion || community.dominantCountry || 'global'}</small>
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
  showLabel,
  reducedMotion,
  onSelect,
}: {
  node: AtlasNode
  active: boolean
  contextual: boolean
  showLabel: boolean
  reducedMotion: boolean
  onSelect: (node: AtlasNode) => void
}) {
  const color = sectorColor(node.sector)
  const radius = nodeRadius(node)
  const opacity = active ? 1 : contextual ? 0.3 : 0.62 + clamp(node.centrality) * 0.3
  return (
    <group position={vector(node.position)}>
      <VolatilityHalo node={node} radius={radius} reducedMotion={reducedMotion} active={active} />
      <mesh
        onClick={(event) => { event.stopPropagation(); onSelect(node) }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
        scale={active ? 1.25 : 1}
      >
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

function FlowPulse({ source, target, color, reducedMotion }: {
  source: AtlasPosition
  target: AtlasPosition
  color: string
  reducedMotion: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const progress = reducedMotion ? 0.58 : (clock.elapsedTime * 0.22) % 1
    ref.current.position.set(
      source.x + (target.x - source.x) * progress,
      source.y + (target.y - source.y) * progress,
      source.z + (target.z - source.z) * progress,
    )
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
    </mesh>
  )
}

function RelationshipLine({
  edge,
  source,
  target,
  active,
  timing,
  reducedMotion,
}: {
  edge: AtlasEdge
  source: AtlasPosition
  target: AtlasPosition
  active: boolean
  timing: boolean
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
      {timing && active ? <FlowPulse source={source} target={target} color={color} reducedMotion={reducedMotion} /> : null}
    </>
  )
}

function AtlasCommunityLinks({
  atlas,
  communities,
  selectedId,
}: {
  atlas: RelationshipAtlas
  communities: AtlasCommunity[]
  selectedId: string | null
}) {
  const positions = useMemo(() => new Map(communities.map((item) => [item.id, item.position])), [communities])
  const strongest = Math.max(...atlas.links.map((link) => link.strength), 1)
  return atlas.links.slice(0, 80).map((link) => {
    const source = positions.get(link.source)
    const target = positions.get(link.target)
    if (!source || !target) return null
    const active = selectedId === link.source || selectedId === link.target
    const normalized = Math.sqrt(link.strength / strongest)
    return (
      <Line
        key={`${link.source}:${link.target}`}
        points={[vector(source), vector(target)]}
        color={active ? '#168f86' : '#84949a'}
        lineWidth={0.2 + normalized * (active ? 1.25 : 0.55)}
        transparent
        opacity={(0.018 + Math.pow(link.confidence, 2) * 0.1) * (selectedId && !active ? 0.35 : 1)}
        depthWrite={false}
      />
    )
  })
}

function Universe(props: MarketUniverseSceneProps) {
  const {
    atlas,
    detail,
    neighborhood,
    selectedCommunityId,
    activeSymbol,
    reducedMotion,
    mobile,
    onSelectCommunity,
    onSelectNode,
  } = props
  const selected = atlas.communities.find((community) => community.id === selectedCommunityId) ?? null
  const overviewCommunities = useMemo(
    () => atlas.communities.slice(0, mobile ? 16 : 24),
    [atlas.communities, mobile],
  )
  const visibleCommunities = useMemo(
    () => selected ? [selected] : overviewCommunities,
    [overviewCommunities, selected],
  )
  const nodes = useMemo(() => {
    if (neighborhood) return neighborhood.nodes.slice(0, mobile ? 18 : 32)
    if (detail) return detail.nodes.slice(0, mobile ? 34 : 72)
    if (selected) return []
    const visibleIds = new Set(overviewCommunities.map((community) => community.id))
    return atlas.landmarks
      .filter((node) => !node.communityId || visibleIds.has(node.communityId))
      .slice(0, mobile ? 18 : 36)
  }, [atlas.landmarks, detail, mobile, neighborhood, overviewCommunities, selected])
  const edges = useMemo(() => {
    const sourceEdges = neighborhood?.edges ?? detail?.edges ?? (selected ? [] : atlas.backbone)
    const visibleSymbols = new Set(nodes.map((node) => node.symbol))
    const merged = new Map<string, AtlasEdge>()
    for (const edge of sourceEdges) {
      if (!visibleSymbols.has(edge.source) || !visibleSymbols.has(edge.target)) continue
      const key = [edge.source, edge.target].sort().join(':')
      const current = merged.get(key)
      if (!current || edge.score > current.score) merged.set(key, edge)
    }
    const limit = neighborhood ? (mobile ? 28 : 48) : detail ? (mobile ? 56 : 96) : (mobile ? 32 : 48)
    return [...merged.values()].sort((left, right) => right.score - left.score).slice(0, limit)
  }, [atlas.backbone, detail, mobile, neighborhood, nodes, selected])
  const positions = useMemo(() => new Map(nodes.map((node) => [node.symbol, node.position])), [nodes])
  const activeNode = nodes.find((node) => node.symbol === activeSymbol) ?? null
  const labelSymbols = useMemo(() => {
    const count = mobile ? (selected ? 3 : 4) : (selected ? 5 : 7)
    const ranked = [...nodes]
      .filter((node) => !node.context && !node.isBoundary)
      .sort((left, right) => (
        right.centrality + right.bridgeScore * 0.65 + right.importance * 0.25
        - left.centrality - left.bridgeScore * 0.65 - left.importance * 0.25
      ))
      .slice(0, count)
      .map((node) => node.symbol)
    if (activeSymbol) ranked.push(activeSymbol)
    return new Set(ranked)
  }, [activeSymbol, mobile, nodes, selected])
  const frame = useMemo(
    () => cameraFrame(
      visibleCommunities,
      nodes,
      {
        focused: Boolean(selected || activeNode),
        key: `${atlas.window}:${atlas.view}:${selected?.id ?? 'global'}:${activeNode?.symbol ?? 'none'}:${nodes.length}`,
      },
    ),
    [activeNode, atlas.view, atlas.window, nodes, selected, visibleCommunities],
  )

  return (
    <>
      <color attach="background" args={['#f3efe6']} />
      <fog attach="fog" args={['#f3efe6', 13.5, 30]} />
      <ambientLight intensity={1.75} />
      <directionalLight position={[4, 8, 10]} intensity={1.35} color="#ffffff" />
      <pointLight position={[-8, -2, 5]} intensity={9} distance={23} color="#63b8b0" />
      <AmbientDust reducedMotion={reducedMotion} />
      <CameraRig frame={frame} reducedMotion={reducedMotion} mobile={mobile} />

      {!selected ? (
        <AtlasCommunityLinks atlas={atlas} communities={visibleCommunities} selectedId={selectedCommunityId} />
      ) : null}
      {visibleCommunities.map((community, index) => (
        <CommunityField
          key={community.id}
          community={community}
          selected={community.id === selectedCommunityId}
          dimmed={false}
          showLabel={community.id === selectedCommunityId || index < (mobile ? 4 : 8)}
          onSelect={onSelectCommunity}
        />
      ))}
      {edges.map((edge) => {
        const source = positions.get(edge.source)
        const target = positions.get(edge.target)
        if (!source || !target) return null
        const active = activeSymbol === edge.source || activeSymbol === edge.target
        return (
          <RelationshipLine
            key={`${edge.source}:${edge.target}`}
            edge={edge}
            source={source}
            target={target}
            active={active}
            timing={atlas.view === 'timing'}
            reducedMotion={reducedMotion}
          />
        )
      })}
      {nodes.map((node) => (
        <CompanyNode
          key={node.symbol}
          node={node}
          active={node.symbol === activeSymbol}
          contextual={node.context || node.isBoundary || Boolean(selectedCommunityId && node.communityId && node.communityId !== selectedCommunityId)}
          showLabel={labelSymbols.has(node.symbol)}
          reducedMotion={reducedMotion}
          onSelect={onSelectNode}
        />
      ))}
    </>
  )
}

export type MarketUniverseSceneProps = {
  atlas: RelationshipAtlas
  detail: RelationshipAtlasDetail | null
  neighborhood: RelationshipAtlasDetail | null
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
      camera={{ position: [0, 0.35, 16.5], fov: 42, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => { document.body.style.cursor = '' }}
    >
      <Universe {...props} />
    </Canvas>
  )
}
