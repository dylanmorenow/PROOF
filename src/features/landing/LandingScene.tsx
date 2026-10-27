// Sign-in scene: a dotted globe facing Indonesia, the four candidate hubs with live links,
// floating hexagonal "proof seals", and PIP orbiting the globe. Lazy-loaded with three.js.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Crystal } from '@/pip/PipCanvas'
import { INDONESIA, LAND } from './globe.generated'

const R = 1.6
const D = Math.PI / 180
const FOCUS = { lat: -2, lon: 118 }
const HUBS = [
  { lat: 1.13, lon: 104.05 },
  { lat: -7.25, lon: 112.75 },
  { lat: -1.27, lon: 116.83 },
  { lat: -0.88, lon: 131.25 },
]
const LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 3],
]

function ll(lat: number, lon: number, r = R) {
  const phi = (90 - lat) * D
  const th = (lon + 180) * D
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th))
}

/* ───────────── dotted land ───────────── */

const dotVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    float facing = dot(n, normalize(-mv.xyz));
    float reveal = smoothstep(aSeed, aSeed + 0.12, uReveal);
    vAlpha = reveal * mix(0.08, 1.0, smoothstep(-0.15, 0.55, facing));
    vColor = aColor;
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.6 + aSeed * 60.0);
    gl_PointSize = aSize * twinkle * uPixelRatio * (6.0 / -mv.z) * (0.6 + 0.4 * reveal);
    gl_Position = projectionMatrix * mv;
  }
`
const dotFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.3, d) * vAlpha);
  }
`

function Dots({ reveal }: { reveal: React.RefObject<number> }) {
  const gl = useThree((s) => s.gl)
  const { geometry, material } = useMemo(() => {
    const focus = ll(FOCUS.lat, FOCUS.lon).normalize()
    const n = LAND.length / 2 + INDONESIA.length / 2
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const seed = new Float32Array(n)
    const land = new THREE.Color('#7f97a8')
    const indo = new THREE.Color('#1592a8')
    let i = 0
    const add = (arr: Float32Array, c: THREE.Color, s: number, r: number) => {
      for (let k = 0; k < arr.length; k += 2, i++) {
        const v = ll(arr[k], arr[k + 1], r)
        pos.set([v.x, v.y, v.z], i * 3)
        col.set([c.r, c.g, c.b], i * 3)
        size[i] = s
        // Reveal spreads outward from Indonesia.
        seed[i] = Math.acos(THREE.MathUtils.clamp(v.clone().normalize().dot(focus), -1, 1)) / Math.PI
      }
    }
    add(LAND, land, 3.4, R)
    add(INDONESIA, indo, 4.6, R * 1.004)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPixelRatio: { value: gl.getPixelRatio() } },
    })
    return { geometry: g, material: m }
  }, [gl])
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uReveal.value = reveal.current
  })
  return <points geometry={geometry} material={material} />
}

/* ───────────── atmosphere rim ───────────── */

function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
            gl_FragColor = vec4(0.07, 0.49, 0.57, f * 0.5);
          }`,
      }),
    [],
  )
  return (
    <>
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color="#f7fafb" />
      </mesh>
      <mesh material={material}>
        <sphereGeometry args={[R * 1.08, 64, 64]} />
      </mesh>
    </>
  )
}

/* ───────────── hubs and links ───────────── */

function Hubs({ reveal }: { reveal: React.RefObject<number> }) {
  const rings = useRef<THREE.Mesh[]>([])
  const pulses = useRef<THREE.Mesh[]>([])
  const points = useMemo(() => HUBS.map((h) => ll(h.lat, h.lon, R * 1.01)), [])
  const curves = useMemo(
    () =>
      LINKS.map(([a, b]) => {
        const p0 = points[a]
        const p2 = points[b]
        const lift = 1 + p0.distanceTo(p2) * 0.45
        const p1 = p0.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * lift)
        return new THREE.QuadraticBezierCurve3(p0, p1, p2)
      }),
    [points],
  )
  const tubes = useMemo(() => curves.map((c) => new THREE.TubeGeometry(c, 48, 0.006, 6, false)), [curves])

  useLayoutEffect(() => {
    rings.current.forEach((m, i) => m?.lookAt(points[i].clone().multiplyScalar(2)))
  }, [points])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const shown = THREE.MathUtils.clamp((reveal.current - 0.15) / 0.5, 0, 1)
    tubes.forEach((g) => g.setDrawRange(0, Math.floor((g.index?.count ?? 0) * shown)))
    rings.current.forEach((m, i) => {
      if (!m) return
      const p = (t * 0.55 + i * 0.25) % 1
      m.scale.setScalar((0.6 + p * 2.4) * shown)
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6
    })
    pulses.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.35 + i * 0.27) % 1
      m.position.copy(curves[i].getPoint(k))
      m.visible = shown > 0.98
    })
  })

  return (
    <group>
      {points.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.028, 16, 16]} />
            <meshBasicMaterial color="#127C91" />
          </mesh>
          <mesh ref={(m) => void (m && (rings.current[i] = m))}>
            <ringGeometry args={[0.03, 0.038, 32]} />
            <meshBasicMaterial color="#127C91" transparent side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#127C91" transparent opacity={0.55} />
        </mesh>
      ))}
      {curves.map((_, i) => (
        <mesh key={i} ref={(m) => void (m && (pulses.current[i] = m))}>
          <sphereGeometry args={[0.016, 12, 12]} />
          <meshBasicMaterial color="#3FA9BB" />
        </mesh>
      ))}
    </group>
  )
}

/* ───────────── floating proof seals ───────────── */

function Seals({ count = 34 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    let a = 7
    const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, () => ({
      r: 1.95 + rnd() * 0.8,
      theta: rnd() * Math.PI * 2,
      y: (rnd() - 0.5) * 2.6,
      speed: 0.04 + rnd() * 0.06,
      spin: (rnd() - 0.5) * 1.2,
      scale: 0.5 + rnd() * 0.9,
      phase: rnd() * 6,
    }))
  }, [count])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!mesh.current) return
    seeds.forEach((s, i) => {
      const a = s.theta + t * s.speed
      dummy.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.6 + s.phase) * 0.08, Math.sin(a) * s.r)
      dummy.rotation.set(t * s.spin * 0.5 + s.phase, t * s.spin, Math.PI / 2)
      dummy.scale.setScalar(s.scale)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.07, 0.07, 0.022, 6]} />
      <meshPhysicalMaterial color="#7fd3de" roughness={0.15} clearcoat={1} transparent opacity={0.55} envMapIntensity={1.2} flatShading />
    </instancedMesh>
  )
}

/* ───────────── rig: layout, parallax, intro and exit ───────────── */

function World({ leaving, reduce }: { leaving: boolean; reduce: boolean }) {
  const world = useRef<THREE.Group>(null)
  const globe = useRef<THREE.Group>(null)
  const pip = useRef<THREE.Group>(null)
  const reveal = useRef(reduce ? 1.2 : 0)
  const { camera, size, pointer } = useThree()
  const wide = size.width >= 900
  const baseY = -(FOCUS.lon + 90) * D

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (reveal.current < 1.2) reveal.current = Math.min(1.2, reveal.current + dt * 0.55)
    if (!world.current || !globe.current) return
    const k = Math.min(1, dt * (leaving ? 2.2 : 3))
    // Layout: globe sits right on wide screens, above the card on narrow ones; centred while entering.
    const tx = leaving ? 0 : wide ? 1.35 : 0
    const ty = leaving ? 0 : wide ? 0 : 2.35
    world.current.position.x += (tx - world.current.position.x) * k
    world.current.position.y += (ty - world.current.position.y) * k
    // Gentle sway around Indonesia plus pointer parallax.
    const sway = reduce || leaving ? 0 : Math.sin(t * 0.18) * 0.12
    globe.current.rotation.y += (baseY + sway + (leaving ? 0 : pointer.x * 0.18) - globe.current.rotation.y) * k
    globe.current.rotation.x += (0.05 + (leaving ? 0 : -pointer.y * 0.1) - globe.current.rotation.x) * k
    // Intro scale and the dive into Indonesia on sign-in.
    const s = 0.86 + 0.14 * Math.min(1, reveal.current)
    globe.current.scale.setScalar(s)
    // Narrow screens pull the camera back so the globe fits the top half.
    const cz = leaving ? 2.5 : wide ? 6.8 : 13.5
    camera.position.z += (cz - camera.position.z) * Math.min(1, dt * (leaving ? 1.6 : 2))
    if (pip.current) {
      const a = t * 0.3
      pip.current.position.set(Math.cos(a) * 2.05, 0.95 + Math.sin(t * 0.8) * 0.1, Math.sin(a) * 2.05)
      pip.current.lookAt(camera.position)
    }
  })

  return (
    <group ref={world}>
      <group ref={globe}>
        <Atmosphere />
        <Dots reveal={reveal} />
        <Hubs reveal={reveal} />
      </group>
      <Seals count={wide ? 34 : 18} />
      <group ref={pip} scale={0.24}>
        <Crystal />
      </group>
    </group>
  )
}

export default function LandingScene({ leaving, reduce }: { leaving: boolean; reduce: boolean }) {
  return (
    <Canvas flat dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 6.8], fov: 35 }} frameloop={reduce ? 'demand' : 'always'}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 3, 2]} scale={[4, 1, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#127C91" position={[-3, 0, 1]} scale={[1, 4, 1]} />
      </Environment>
      <World leaving={leaving} reduce={reduce} />
    </Canvas>
  )
}
