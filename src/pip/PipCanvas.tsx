// PIP — PROOF Intelligence Partner. A double-terminated hexagonal crystal with a luminous core
// and a five-segment halo (one segment per letter of P.R.O.O.F.). Lazy-loaded; see PipLayer.
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { usePip, type PipMood } from './pipStore'

const CYAN = new THREE.Color('#76CFDA')
const GREEN = new THREE.Color('#4FBF8B')
const STEEL = new THREE.Color('#8EA4B5')
const WHITE = new THREE.Color('#e9fbfd')

function crystalGeometry() {
  // Lathe a profile with 6 radial segments → hexagonal bipyramid with a short prism waist.
  const profile = [new THREE.Vector2(0, -1.18), new THREE.Vector2(0.5, -0.36), new THREE.Vector2(0.5, 0.36), new THREE.Vector2(0, 1.18)]
  const g = new THREE.LatheGeometry(profile, 6)
  return g.toNonIndexed()
}

function Halo({ progress, mood }: { progress: number; mood: PipMood }) {
  const group = useRef<THREE.Group>(null)
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  const segments = useMemo(() => {
    const seg = (Math.PI * 2) / 5
    return [0, 1, 2, 3, 4].map((i) => {
      const g = new THREE.TorusGeometry(0.98, 0.022, 8, 40, seg - 0.2)
      g.rotateZ(i * seg)
      return g
    })
  }, [])
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (!group.current) return
    const speed = mood === 'attentive' ? 1.6 : mood === 'celebrating' ? 3.2 : mood === 'guiding' ? 0.6 : 0.35
    group.current.rotation.z += dt * speed
    const lit = Math.round(progress * 5)
    mats.current.forEach((m, i) => {
      const on = mood === 'celebrating' || i < lit
      const target = on ? 1 : 0.32 + Math.sin(t * 1.4 + i) * 0.04
      m.opacity += (target - m.opacity) * Math.min(1, dt * 6)
      m.color.lerp(mood === 'success' ? GREEN : on ? WHITE : CYAN, Math.min(1, dt * 5))
    })
  })
  return (
    <group rotation={[Math.PI / 2 - 0.32, 0, 0]}>
      <group ref={group}>
        {segments.map((g, i) => (
          <mesh key={i} geometry={g}>
            <meshBasicMaterial ref={(m) => void (m && (mats.current[i] = m))} color={CYAN} transparent opacity={0.35} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Crystal() {
  const { mood, progress, gaze } = usePip()
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const core = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useRef<THREE.Mesh>(null)
  const lens = useRef<THREE.Mesh>(null)
  const pulse = useRef<THREE.Mesh>(null)
  const pulseT = useRef(-1)
  const lastMood = useRef<PipMood>('idle')
  const geo = useMemo(crystalGeometry, [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo])
  const pointer = useRef(new THREE.Vector2())

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (!root.current || !body.current || !core.current) return
    if (mood !== lastMood.current) {
      if (mood === 'celebrating' || mood === 'success') pulseT.current = 0
      lastMood.current = mood
    }
    // Float and breathe
    const lift = mood === 'attentive' ? 0.1 : mood === 'success' ? 0.16 * Math.max(0, Math.sin(Math.min(1, pulseT.current) * Math.PI)) : 0
    root.current.position.y += (Math.sin(t * 1.55) * 0.06 + lift - root.current.position.y) * Math.min(1, dt * 4)
    // Spin the crystal slowly; faster when attentive
    const spin = mood === 'attentive' ? 1.1 : mood === 'celebrating' ? 2.4 : 0.32
    body.current.rotation.y += dt * spin
    // Tilt: toward cursor on hover, toward the spotlight while guiding, a small "no" sway when unavailable
    pointer.current.lerp(state.pointer, Math.min(1, dt * 4))
    let tx = 0
    let tz = 0
    if (mood === 'attentive') {
      tx = -pointer.current.y * 0.35
      tz = -pointer.current.x * 0.35
    } else if (mood === 'guiding' && gaze) {
      const rect = state.gl.domElement.getBoundingClientRect()
      const dx = (gaze.x - (rect.left + rect.width / 2)) / window.innerWidth
      const dy = (gaze.y - (rect.top + rect.height / 2)) / window.innerHeight
      tz = THREE.MathUtils.clamp(-dx * 0.9, -0.4, 0.4)
      tx = THREE.MathUtils.clamp(dy * 0.9, -0.35, 0.35)
    } else if (mood === 'unavailable') {
      tz = Math.sin(t * 9) * 0.12 * Math.max(0, 1 - (pulseT.current < 0 ? 0 : pulseT.current))
    }
    root.current.rotation.x += (tx - root.current.rotation.x) * Math.min(1, dt * 5)
    root.current.rotation.z += (tz - root.current.rotation.z) * Math.min(1, dt * 5)

    // Core light
    const breathe = 0.75 + Math.sin(t * 1.9) * 0.18
    const target = mood === 'success' ? GREEN : mood === 'unavailable' ? STEEL : mood === 'celebrating' ? WHITE : CYAN
    core.current.color.lerp(target, Math.min(1, dt * 5))
    const intensity = mood === 'attentive' || mood === 'guiding' ? 1.15 : mood === 'unavailable' ? 0.55 : breathe
    if (glow.current) {
      const s = 0.62 + intensity * 0.22
      glow.current.scale.setScalar(s)
      ;(glow.current.material as THREE.MeshBasicMaterial).opacity = 0.32 * intensity
      ;(glow.current.material as THREE.MeshBasicMaterial).color.copy(core.current.color)
    }
    // Lens: the gaze spot on the core, drifting toward what PIP is looking at
    if (lens.current) {
      const lx = mood === 'guiding' ? -tz * 0.4 : mood === 'attentive' ? pointer.current.x * 0.12 : 0
      const ly = mood === 'guiding' ? -tx * 0.4 : mood === 'attentive' ? pointer.current.y * 0.12 : 0
      lens.current.position.x += (lx - lens.current.position.x) * Math.min(1, dt * 6)
      lens.current.position.y += (ly - lens.current.position.y) * Math.min(1, dt * 6)
      const blink = Math.sin(t * 0.7) > 0.995 ? 0.15 : 1
      lens.current.scale.y += (blink - lens.current.scale.y) * Math.min(1, dt * 20)
    }
    // Expanding light ring for success / completion
    if (pulse.current) {
      if (pulseT.current >= 0) {
        pulseT.current += dt / (mood === 'celebrating' ? 1.4 : 1)
        const p = Math.min(1, pulseT.current)
        pulse.current.visible = p < 1
        pulse.current.scale.setScalar(1 + p * 1.6)
        ;(pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7
        ;(pulse.current.material as THREE.MeshBasicMaterial).color.copy(core.current.color)
      } else pulse.current.visible = false
    }
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial
            color="#a8eef5"
            transmission={1}
            thickness={0.9}
            roughness={0.12}
            ior={1.45}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            iridescence={0.35}
            iridescenceIOR={1.3}
            attenuationColor="#127C91"
            attenuationDistance={1.4}
            envMapIntensity={1.4}
            flatShading
            transparent
            opacity={0.96}
          />
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#bff3f8" transparent opacity={0.55} toneMapped={false} />
        </lineSegments>
      </group>
      {/* luminous core */}
      <mesh>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshBasicMaterial ref={core} color={CYAN} toneMapped={false} />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={lens} position={[0, 0, 0.19]}>
        <circleGeometry args={[0.065, 20]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={pulse} rotation={[Math.PI / 2 - 0.32, 0, 0]} visible={false}>
        <torusGeometry args={[0.98, 0.012, 6, 64]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <Halo progress={progress} mood={mood} />
    </group>
  )
}

export default function PipCanvas({ size, active }: { size: number; active: boolean }) {
  return (
    <Canvas
      style={{ width: size, height: size }}
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0.15, 3.6], fov: 34 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} color="#dff8fb" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={3} color="#9fe7ef" position={[0, 3, 2]} scale={[4, 1, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#127C91" position={[-3, 0, 1]} scale={[1, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[2.5, 1, 3]} scale={1.2} />
      </Environment>
      <Crystal />
    </Canvas>
  )
}
