'use client'

import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type {
  AtlasCommunity,
  AtlasEdge,
  AtlasNode,
  AtlasPosition,
  RelationshipAtlas,
  RelationshipAtlasDetail,
} from '@/lib/network'
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

function CameraRig({ focus, reducedMotion, mobile }: { focus: AtlasPosition | null; reducedMotion: boolean; mobile: boolean }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3())
  const desired = useMemo(
    () => new THREE.Vector3(
      (focus?.x ?? 0) + (mobile ? 0 : focus ? 1.1 : 0),
      (focus?.y ?? 0) + (focus ? 0.45 : 0.35),
      (focus?.z ?? 0) + (focus ? (mobile ? 10.2 : 8.6) : (mobile ? 19 : 16.5)),
    ),
    [focus, mobile],
  )
  const target = useMemo(() => new THREE.Vector3(focus?.x ?? 0, focus?.y ?? 0, focus?.z ?? 0), [focus])

  useFrame((_state, delta) => {
    const amount = reducedMotion ? 1 : 1 - Math.exp(-delta * 3.6)
    camera.position.lerp(desired, amount)
    lookAt.current.lerp(target, amount)
    camera.lookAt(lookAt.current)
  })
  return null
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
  const radius = 0.82 + Math.min(1.35, Math.log2(community.memberCount + 1) * 0.18)
  const color = sectorColor(community.dominantSector)
  const alpha = dimmed ? 0.015 : selected ? 0.105 : 0.035 + community.averageConfidence * 0.035
  return (
    <group position={vector(community.position)}>
      <mesh
        onClick={(event) => { event.stopPropagation(); onSelect(community) }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
        scale={[1.28, 0.72, 0.58]}
      >
        <sphereGeometry args={[radius, 28, 18]} />
        <meshBasicMaterial color={color} transparent opacity={alpha} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[1.3, 0.73, 0.6]}>
        <sphereGeometry args={[radius, 22, 14]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.2 : dimmed ? 0.018 : 0.07} wireframe depthWrite={false} />
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
  reducedMotion,
  onSelect,
}: {
  node: AtlasNode
  active: boolean
  contextual: boolean
  reducedMotion: boolean
  onSelect: (node: AtlasNode) => void
}) {
  const color = sectorColor(node.sector)
  const radius = nodeRadius(node)
  const visibleLabel = active || node.centrality > 0.62 || node.bridgeScore > 0.58
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
      {visibleLabel ? (
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

function AtlasCommunityLinks({ atlas, selectedId }: { atlas: RelationshipAtlas; selectedId: string | null }) {
  const positions = useMemo(() => new Map(atlas.communities.map((item) => [item.id, item.position])), [atlas.communities])
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
  const nodes = useMemo(() => {
    const merged = new Map<string, AtlasNode>()
    for (const node of atlas.landmarks.slice(0, mobile ? 72 : 120)) merged.set(node.symbol, node)
    for (const node of detail?.nodes ?? []) merged.set(node.symbol, node)
    for (const node of neighborhood?.nodes ?? []) merged.set(node.symbol, node)
    return [...merged.values()]
  }, [atlas.landmarks, detail?.nodes, mobile, neighborhood?.nodes])
  const edges = useMemo(() => {
    const merged = new Map<string, AtlasEdge>()
    for (const edge of [...atlas.backbone, ...(detail?.edges ?? []), ...(neighborhood?.edges ?? [])]) {
      const key = [edge.source, edge.target].sort().join(':')
      const current = merged.get(key)
      if (!current || edge.score > current.score) merged.set(key, edge)
    }
    return [...merged.values()].sort((left, right) => right.score - left.score).slice(0, mobile ? 120 : 260)
  }, [atlas.backbone, detail?.edges, neighborhood?.edges, mobile])
  const positions = useMemo(() => new Map(nodes.map((node) => [node.symbol, node.position])), [nodes])
  const activeNode = nodes.find((node) => node.symbol === activeSymbol) ?? null
  const focus = activeNode?.position ?? selected?.position ?? null

  return (
    <>
      <color attach="background" args={['#f3efe6']} />
      <fog attach="fog" args={['#f3efe6', 13.5, 30]} />
      <ambientLight intensity={1.75} />
      <directionalLight position={[4, 8, 10]} intensity={1.35} color="#ffffff" />
      <pointLight position={[-8, -2, 5]} intensity={9} distance={23} color="#63b8b0" />
      <AmbientDust reducedMotion={reducedMotion} />
      <CameraRig focus={focus} reducedMotion={reducedMotion} mobile={mobile} />

      <AtlasCommunityLinks atlas={atlas} selectedId={selectedCommunityId} />
      {atlas.communities.map((community, index) => (
        <CommunityField
          key={community.id}
          community={community}
          selected={community.id === selectedCommunityId}
          dimmed={Boolean(selectedCommunityId && community.id !== selectedCommunityId)}
          showLabel={community.id === selectedCommunityId || index < (mobile ? 6 : 11)}
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
          reducedMotion={reducedMotion}
          onSelect={onSelectNode}
        />
      ))}

      <OrbitControls
        target={focus ? vector(focus) : [0, 0, 0]}
        enablePan={false}
        enableZoom
        enableRotate={!mobile}
        enableDamping={!reducedMotion}
        dampingFactor={0.045}
        autoRotate={false}
        minDistance={6}
        maxDistance={23}
        minPolarAngle={Math.PI * 0.33}
        maxPolarAngle={Math.PI * 0.67}
        minAzimuthAngle={mobile ? -0.15 : -Infinity}
        maxAzimuthAngle={mobile ? 0.15 : Infinity}
      />
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
