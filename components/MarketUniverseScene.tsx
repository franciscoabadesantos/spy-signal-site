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
import styles from './MarketUniverse.module.css'

const PALETTE = ['#4f7cf7', '#dd5b9b', '#19a79a', '#e4a537', '#7a6df0', '#72b97d', '#7395b9'] as const

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function colorFor(value: string): string {
  return PALETTE[hash(value) % PALETTE.length]
}

function vector(position: AtlasPosition): [number, number, number] {
  return [position.x, position.y, position.z]
}

function CameraRig({ focus, reducedMotion }: { focus: AtlasPosition | null; reducedMotion: boolean }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3())
  const desired = useMemo(
    () => new THREE.Vector3(focus?.x ?? 0, (focus?.y ?? 0) + 0.6, (focus?.z ?? 0) + (focus ? 8.2 : 17)),
    [focus],
  )
  const target = useMemo(() => new THREE.Vector3(focus?.x ?? 0, focus?.y ?? 0, focus?.z ?? 0), [focus])

  useFrame((_state, delta) => {
    const amount = reducedMotion ? 1 : 1 - Math.exp(-delta * 3.8)
    camera.position.lerp(desired, amount)
    lookAt.current.lerp(target, amount)
    camera.lookAt(lookAt.current)
  })
  return null
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
      values[index] = (random() - 0.5) * 30
      values[index + 1] = (random() - 0.5) * 20
      values[index + 2] = (random() - 0.5) * 16
    }
    return values
  }, [])
  useFrame((_state, delta) => {
    if (!reducedMotion && pointsRef.current) pointsRef.current.rotation.y += delta * 0.006
  })
  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#6d8194" size={0.028} transparent opacity={0.2} depthWrite={false} />
    </points>
  )
}

function CommunityOrb({
  community,
  selected,
  dimmed,
  onSelect,
}: {
  community: AtlasCommunity
  selected: boolean
  dimmed: boolean
  onSelect: (community: AtlasCommunity) => void
}) {
  const color = colorFor(community.dominantSector || community.label)
  const radius = 0.28 + Math.min(0.78, Math.log2(community.memberCount + 1) * 0.12)
  const opacity = dimmed ? 0.12 : 0.32 + community.averageConfidence * 0.62
  return (
    <group position={vector(community.position)}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect(community)
        }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
        scale={selected ? 1.12 : 1}
      >
        <sphereGeometry args={[radius, 30, 30]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.34 : 0.12}
          transparent
          opacity={opacity}
          roughness={0.22}
          metalness={0.02}
          transmission={0.18}
          depthWrite={opacity > 0.22}
        />
      </mesh>
      <mesh scale={selected ? 1.62 : 1.38}>
        <sphereGeometry args={[radius, 22, 22]} />
        <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.015 : 0.055} depthWrite={false} />
      </mesh>
      {!dimmed ? (
        <Html center distanceFactor={12} position={[0, -radius - 0.22, 0]} className={styles.sceneLabel}>
          <span>{community.label}</span>
          <small>{community.memberCount}</small>
        </Html>
      ) : null}
    </group>
  )
}

function CompanyOrb({ node, active, onSelect }: { node: AtlasNode; active: boolean; onSelect: (node: AtlasNode) => void }) {
  const color = colorFor(node.sector || node.communityId)
  const radius = 0.12 + Math.min(0.26, node.importance * 0.2)
  return (
    <group position={vector(node.position)}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect(node)
        }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
        scale={active ? 1.35 : 1}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.5 : 0.18}
          roughness={0.28}
          transparent
          opacity={active ? 1 : 0.76}
        />
      </mesh>
      {(active || node.importance > 0.58) ? (
        <Html center distanceFactor={10} position={[0, -radius - 0.14, 0]} className={styles.sceneLabel}>
          <span>{node.symbol}</span>
        </Html>
      ) : null}
    </group>
  )
}

function AtlasLinks({ atlas, selectedId }: { atlas: RelationshipAtlas; selectedId: string | null }) {
  const positions = useMemo(() => new Map(atlas.communities.map((item) => [item.id, item.position])), [atlas.communities])
  const strongest = Math.max(...atlas.links.map((link) => link.strength), 1)
  return atlas.links.slice(0, 44).map((link) => {
    const source = positions.get(link.source)
    const target = positions.get(link.target)
    if (!source || !target) return null
    const active = selectedId === link.source || selectedId === link.target
    const normalized = Math.sqrt(link.strength / strongest)
    const opacity = active ? 0.5 : (0.025 + link.confidence * 0.16) * (selectedId ? 0.22 : 1)
    return (
      <Line
        key={`${link.source}:${link.target}`}
        points={[vector(source), vector(target)]}
        color={active ? '#168f86' : '#75909d'}
        lineWidth={active ? 1.1 + normalized * 1.5 : 0.25 + normalized * 0.7}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    )
  })
}

function DetailLinks({ detail, activeSymbol }: { detail: RelationshipAtlasDetail; activeSymbol: string | null }) {
  const positions = useMemo(() => new Map(detail.nodes.map((item) => [item.symbol, item.position])), [detail.nodes])
  const strongest = Math.max(...detail.edges.map((edge) => edge.score), 0.01)
  return detail.edges.map((edge: AtlasEdge) => {
    const source = positions.get(edge.source)
    const target = positions.get(edge.target)
    if (!source || !target) return null
    const active = activeSymbol === edge.source || activeSymbol === edge.target
    const prominence = Math.sqrt(edge.score / strongest)
    const opacity = active ? 0.74 : 0.025 + Math.pow(edge.confidence, 2) * 0.28
    return (
      <Line
        key={`${edge.source}:${edge.target}`}
        points={[vector(source), vector(target)]}
        color={edge.strength < 0 ? '#b46f87' : active ? '#168f86' : '#8198a7'}
        lineWidth={active ? 1.2 + prominence * 1.7 : 0.28 + prominence * 1.05}
        dashed={detail.view === 'timing'}
        dashSize={0.12}
        gapSize={0.08}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    )
  })
}

function Universe({
  atlas,
  detail,
  selectedCommunityId,
  activeSymbol,
  reducedMotion,
  mobile,
  onSelectCommunity,
  onSelectNode,
}: MarketUniverseSceneProps) {
  const selected = atlas.communities.find((community) => community.id === selectedCommunityId) ?? null
  return (
    <>
      <color attach="background" args={['#f3efe6']} />
      <fog attach="fog" args={['#f3efe6', 13, 29]} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[4, 8, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-8, -2, 5]} intensity={12} distance={24} color="#63b8b0" />
      <AmbientDust reducedMotion={reducedMotion} />
      <CameraRig focus={selected?.position ?? null} reducedMotion={reducedMotion} />

      {detail ? (
        <>
          <DetailLinks detail={detail} activeSymbol={activeSymbol} />
          {detail.nodes.map((node) => (
            <CompanyOrb key={node.symbol} node={node} active={node.symbol === activeSymbol} onSelect={onSelectNode} />
          ))}
        </>
      ) : (
        <>
          <AtlasLinks atlas={atlas} selectedId={selectedCommunityId} />
          {atlas.communities.map((community) => (
            <CommunityOrb
              key={community.id}
              community={community}
              selected={community.id === selectedCommunityId}
              dimmed={Boolean(selectedCommunityId && community.id !== selectedCommunityId)}
              onSelect={onSelectCommunity}
            />
          ))}
        </>
      )}

      <OrbitControls
        target={selected ? vector(selected.position) : [0, 0, 0]}
        enablePan={false}
        enableZoom
        enableRotate={!mobile}
        enableDamping={!reducedMotion}
        dampingFactor={0.045}
        autoRotate={!reducedMotion && !selectedCommunityId && !mobile}
        autoRotateSpeed={0.18}
        minDistance={5.8}
        maxDistance={23}
        minPolarAngle={Math.PI * 0.31}
        maxPolarAngle={Math.PI * 0.69}
      />
    </>
  )
}

export type MarketUniverseSceneProps = {
  atlas: RelationshipAtlas
  detail: RelationshipAtlasDetail | null
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
      camera={{ position: [0, 0.6, 17], fov: 42, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => { document.body.style.cursor = '' }}
    >
      <Universe {...props} />
    </Canvas>
  )
}
