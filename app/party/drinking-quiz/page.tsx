'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlassPanel, T } from '@/components/ui'

// TODO: Quiz à boire share le moteur de /quiz (même flow create/join + /room/[code]/*).
// La différence : room créée avec mode='drinking'. Côté scoring, bonne réponse = distribue X gorgées,
// mauvaise = bois X gorgées. Implémenter via colonne `mode` sur table `rooms` + flag dans game_state.

export default function DrinkingQuizPage() {
  const router = useRouter()

  const rules = [
    { icon: '✅', text: 'Bonne réponse', outcome: 'Tu distribues 2 gorgées' },
    { icon: '❌', text: 'Mauvaise réponse', outcome: 'Tu bois 1 gorgée' },
    { icon: '🎯', text: 'Meilleur score', outcome: 'Distribue tout le stock' },
    { icon: '💀', text: 'Zéro bonnes', outcome: 'Shot obligatoire 🫡' },
  ]

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <motion.button
          onClick={() => router.push('/party')}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 32, display: 'block', fontFamily: 'inherit' }}
        >
          ← Pack Soirée
        </motion.button>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍺</div>
          <h1 style={{ fontWeight: 900, fontSize: 32, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Quiz à boire
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 8 }}>
            Connais-moi… ou bois
          </p>
        </div>

        {/* Rules preview */}
        <GlassPanel style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 14 }}>
            Règles du jeu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map(r => (
              <div key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{r.text}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}> → {r.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Coming soon CTA */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          style={{
            borderRadius: 20, padding: '18px 24px', textAlign: 'center',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
            boxShadow: '0 8px 32px rgba(29,78,216,0.4)',
            cursor: 'default', opacity: 0.65,
          }}
        >
          <p style={{ fontWeight: 800, fontSize: 17, color: '#fff', margin: 0 }}>En développement 🔧</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
            Bientôt disponible — le moteur est prêt
          </p>
        </motion.div>
      </div>
    </div>
  )
}
