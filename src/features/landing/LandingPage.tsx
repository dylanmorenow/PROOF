import { ArrowRight, Check, Lock, Mail } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/app/store'
import { activeWorkOrders, onTimeDelivery, periodWindow, scopeWorkOrders } from '@/data/selectors'
import { CountUp } from '@/motion/useCountUp'
import { canRender3D, usePip } from '@/pip/pipStore'
import { Seal } from '@/ui/Seal'

const LandingScene = lazy(() => import('./LandingScene'))

const EMAIL = 'hendra.wijaya@mahakam.example'
const LINES = ['Every operation.', 'Every milestone.', 'Every proof.']
const ease = [0.22, 1, 0.36, 1] as const

type Phase = 'idle' | 'verifying' | 'leaving'

export function LandingPage() {
  const reduce = !!useReducedMotion()
  const signIn = useApp((s) => s.signIn)
  const dataset = useApp((s) => s.dataset)
  const [phase, setPhase] = useState<Phase>('idle')
  const [email, setEmail] = useState(reduce ? EMAIL : '')
  const [password, setPassword] = useState(reduce ? 'proofroom' : '')
  const [use3D] = useState(canRender3D)

  const stats = useMemo(() => {
    const active = activeWorkOrders(dataset, 'all')
    return [
      { value: active.length, label: 'active operations', format: (n: number) => String(Math.round(n)) },
      { value: new Set(active.map((a) => a.regionId)).size, label: 'regional hubs', format: (n: number) => String(Math.round(n)) },
      { value: onTimeDelivery(scopeWorkOrders(dataset, 'all'), periodWindow('30d')).pct ?? 0, label: 'on-time delivery', format: (n: number) => `${n.toFixed(1)}%` },
    ]
  }, [dataset])

  // The demo account types itself in.
  useEffect(() => {
    if (reduce) return
    let i = 0
    let p = 0
    const id = setInterval(() => {
      if (i < EMAIL.length) setEmail(EMAIL.slice(0, ++i))
      else if (p < 9) setPassword('proofroom'.slice(0, ++p))
      else clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [reduce])

  const enter = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (phase !== 'idle') return
    setEmail(EMAIL)
    setPassword('proofroom')
    setPhase('verifying')
    setTimeout(() => {
      setPhase('leaving')
      usePip.getState().react('celebrating', 1600)
    }, reduce ? 0 : 650)
    setTimeout(signIn, reduce ? 150 : 1750)
  }

  const leaving = phase === 'leaving'

  return (
    <motion.div className="fixed inset-0 overflow-hidden bg-bg-0" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      {/* Ambient light drifting behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="landing-blob absolute -top-[20%] -left-[10%] size-[70vmax] rounded-full bg-[radial-gradient(circle,rgb(118_207_218/.32),transparent_60%)]" />
        <div className="landing-blob absolute -right-[15%] -bottom-[25%] size-[65vmax] rounded-full bg-[radial-gradient(circle,rgb(18_124_145/.18),transparent_60%)] [animation-delay:-9s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(18_38_61/.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(18_38_61/.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] bg-[size:56px_56px]" />
      </div>

      {/* Three.js scene */}
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
        {use3D && (
          <Suspense fallback={null}>
            <LandingScene leaving={leaving} reduce={reduce} />
          </Suspense>
        )}
      </motion.div>

      {/* Content */}
      <motion.main
        className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 md:justify-center md:px-[7vw] md:pb-0"
        animate={leaving ? { opacity: 0, y: -24, filter: 'blur(6px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="w-full max-w-[600px]">
          <motion.div className="hidden items-center gap-2.5 md:flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Seal size={32} />
            <span className="text-[18px] font-semibold tracking-[-0.01em]">PROOF Room</span>
          </motion.div>

          <h1 className="type-display mt-6 text-[36px] leading-[1.04] md:mt-8 md:text-[58px]" aria-label={LINES.join(' ')}>
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  className={i === 2 ? 'block bg-[linear-gradient(90deg,#127C91,#3FA9BB,#127C91)] bg-[length:200%_100%] bg-clip-text text-transparent [animation:sheen_6s_linear_infinite]' : 'block'}
                  initial={reduce ? false : { y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="mt-4 text-[17px] text-text-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }}>
            The command center for verifiable energy operations.
          </motion.p>

          <motion.form
            onSubmit={enter}
            className="mt-8 max-w-[420px] rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_-20px_rgb(18_38_61/.35)] backdrop-blur-2xl backdrop-saturate-150"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.55, type: 'spring', bounce: 0, duration: 0.7 }}
          >
            <Field icon={<Mail className="size-4" />} label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="off" className="w-full bg-transparent text-[15px] outline-none" aria-label="Email" />
              {email.length < EMAIL.length && phase === 'idle' && !reduce && <span className="caret" aria-hidden="true" />}
            </Field>
            <Field icon={<Lock className="size-4" />} label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="off" className="w-full bg-transparent text-[15px] tracking-[.2em] outline-none" aria-label="Password" />
            </Field>
            <MagneticButton phase={phase} />
          </motion.form>
        </div>

        {/* Live figures from the same dataset as the app */}
        <motion.dl className="mt-10 hidden gap-10 md:flex [@media(max-height:760px)]:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
          {stats.map((s, i) => (
            <div key={s.label}>
              <dd className="type-display text-[28px] tabular">
                <CountUp value={s.value} format={s.format} delay={1 + i * 0.15} />
              </dd>
              <dt className="text-[13px] text-text-2">{s.label}</dt>
            </div>
          ))}
        </motion.dl>
      </motion.main>

      {/* Veil that hands over to the app */}
      <AnimatePresence>
        {leaving && <motion.div className="absolute inset-0 z-20 bg-bg-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.75, duration: 0.45 }} />}
      </AnimatePresence>
    </motion.div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 flex h-12 items-center gap-3 rounded-[14px] border border-line bg-white/80 px-4 text-text-1 transition-shadow focus-within:ring-2 focus-within:ring-cyan/40">
      <span className="text-text-3" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      <span className="relative flex flex-1 items-center">{children}</span>
    </label>
  )
}

/** Sign-in button that leans toward the cursor and wakes PIP. */
function MagneticButton({ phase }: { phase: Phase }) {
  const ref = useRef<HTMLButtonElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 300, damping: 20 })
  const y = useSpring(my, { stiffness: 300, damping: 20 })
  const setMood = usePip((s) => s.setMood)
  return (
    <motion.button
      ref={ref}
      type="submit"
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        mx.set((e.clientX - r.left - r.width / 2) * 0.12)
        my.set((e.clientY - r.top - r.height / 2) * 0.3)
      }}
      onMouseEnter={() => setMood('attentive')}
      onMouseLeave={() => (mx.set(0), my.set(0), setMood('idle'))}
      whileTap={{ scale: 0.97 }}
      className="relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-teal text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgb(18_124_145/.8)] transition-colors hover:bg-[#0f6b7d]"
    >
      <span className="landing-shine pointer-events-none absolute inset-0" aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'idle' ? (
          <motion.span key="idle" className="flex items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            Sign in <ArrowRight className="size-4" />
          </motion.span>
        ) : phase === 'verifying' ? (
          <motion.span key="busy" className="size-5 rounded-full border-2 border-white/40 border-t-white" initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} transition={{ rotate: { repeat: Infinity, duration: 0.7, ease: 'linear' } }} />
        ) : (
          <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}>
            <Check className="size-5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
