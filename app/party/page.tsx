'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { T } from '@/components/ui'

const GAMES = [
  {
    href: '/party/drinking-quiz',
    emoji: '🍺',
    title: 'Quiz à boire',
    desc: 'Connais-moi… ou bois',
    sub: 'Bonne réponse = tu distribues. Mauvaise = tu bois.',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
    glow: 'rgba(29,78,216,0.5)',
    badge: 'Disponible',
    badgeColor: '#22c55e',
    available: true,
  },
  {
    href: '/party/never-have-i-ever',
    emoji: '🤭',
    title: 'Je n\'ai jamais',
    desc: 'Révèle tes secrets',
    sub: 'Les aveux qui changent tout.',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
    glow: 'rgba(236,72,153,0.5)',
    badge: 'Bientôt',
    badgeColor: '#f59e0b',
    available: false,
  },
  {
    href: '/party/truth-or-dare',
    emoji: '🎲',
    title: 'Action ou Vérité',
    desc: 'Le classique ultime',
    sub: 'Courage ou confessions.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    glow: 'rgba(124,58,237,0.5)',
    badge: 'Bientôt',
    badgeColor: '#f59e0b',
    available: false,
  },
]

export default function PartyPage() {
  const router = useRouter()

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>

        {/* Back */}
        <motion.button
          onClick={() => router.push('/')}
          whileTap={{ scale: 0.96 }}
          whileHover={{ x: -2 }}
          transition={{ duration: 0.15 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
        >
          ← Accueil
        </motion.button>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div className="wobble" style={{ fontSize: 52, display: 'inline-block', marginBottom: 12 }}>🍻</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 7vw, 40px)', color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Pack Soirée
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10, fontWeight: 500 }}>
            Les jeux qui font maaaaal 🔥
          </p>
        </div>

        {/* Game cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GAMES.map((game, i) => (
            <motion.div
              key={game.href}
              onClick={() => game.available && router.push(game.href)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              whileTap={game.available ? { scale: 0.97 } : undefined}
              whileHover={game.available ? { y: -3, boxShadow: `0 16px 48px ${game.glow}` } : undefined}
              style={{
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)',
                padding: '20px 22px',
                cursor: game.available ? 'pointer' : 'default',
                opacity: game.available ? 1 : 0.6,
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Gradient accent strip */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: game.gradient, borderRadius: '20px 0 0 20px' }} />

              {/* Emoji icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: game.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, boxShadow: `0 8px 24px ${game.glow}`,
              }}>
                {game.emoji}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{game.title}</span>
                  <span style={{
                    background: `${game.badgeColor}22`, border: `1px solid ${game.badgeColor}44`,
                    color: game.badgeColor, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  }}>
                    {game.badge}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{game.desc}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>{game.sub}</p>
              </div>

              {game.available && (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, flexShrink: 0 }}>›</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
