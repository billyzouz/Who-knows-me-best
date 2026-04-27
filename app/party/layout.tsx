'use client'
import { motion } from 'framer-motion'

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Electric neon overlay — additive layer above the purple aurora */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 900px 700px at 15% 40%, rgba(29,78,216,0.35), transparent 55%),
            radial-gradient(ellipse 700px 600px at 85% 55%, rgba(219,39,119,0.3), transparent 55%),
            radial-gradient(ellipse 500px 400px at 50% 95%, rgba(99,102,241,0.25), transparent 60%)
          `,
        }}
      />
      {children}
    </>
  )
}
