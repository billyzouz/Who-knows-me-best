'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassPanel } from '@/components/ui'

export default function NeverHaveIEverPage() {
  const router = useRouter()

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        <motion.button
          onClick={() => router.push('/party')}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 32, display: 'block', fontFamily: 'inherit' }}
        >
          ← Pack Soirée
        </motion.button>

        <div style={{ fontSize: 56, marginBottom: 16 }}>🤭</div>
        <h1 style={{ fontWeight: 900, fontSize: 32, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          Je n'ai jamais
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 8, marginBottom: 36 }}>
          Les aveux qui changent tout
        </p>

        <GlassPanel style={{ padding: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚧</div>
          <p style={{ fontWeight: 800, fontSize: 18, color: '#fff', margin: 0 }}>En développement</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '8px 0 0', lineHeight: 1.6 }}>
            Ce mode arrive bientôt.<br />Des cartes "Je n'ai jamais…" avec vote en temps réel.
          </p>
        </GlassPanel>
      </div>
    </div>
  )
}
