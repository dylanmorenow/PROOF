import { AnimatePresence, motion } from 'motion/react'
import { LandingPage } from '@/features/landing/LandingPage'
import { useApp } from './store'
import { AppShell } from './AppShell'

/** Sign-in screen first; any Sign in enters the workspace at the requested page. */
export function Gate() {
  const signedIn = useApp((s) => s.signedIn)
  return (
    <AnimatePresence mode="wait">
      {signedIn ? (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <AppShell />
        </motion.div>
      ) : (
        <LandingPage key="landing" />
      )}
    </AnimatePresence>
  )
}
