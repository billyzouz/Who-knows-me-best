'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FloatingShapes, T } from '@/components/ui'

const CARDS = [
  {
    href: '/quiz',
    emoji: '🧠',
    title: 'Quiz Classique',
    tagline: 'Qui me connaît le mieux ?',
    desc: '2-12 joueurs • 15-30 min',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    glow: 'rgba(139,92,246,0.55)',
    border: 'rgba(139,92,246,0.35)',
    badge: null,
  },
  {
    href: '/party',
    emoji: '🍻',
    title: 'Pack Soirée',
    tagline: 'Les jeux qui font maaaaal',
    desc: '3 modes • 18+',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #ec4899 100%)',
    glow: 'rgba(29,78,216,0.55)',
    border: 'rgba(29,78,216,0.35)',
    badge: 'Nouveau',
  },
]

export default function HubPage() {
  const router = useRouter()

  return (
    <div className="home-layout" style={{ gap: 0 }}>
      <FloatingShapes density="sparse" />

      <div className="fade-up" style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 3 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div
            className="wobble"
            style={{ fontSize: 52, display: 'inline-block', marginBottom: 16 }}
          >
            🕹️
          </motion.div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 6vw, 48px)', color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Choisis ton jeu
          </h1>
          <p style={{ color: T.muted, fontSize: 15, marginTop: 12, fontWeight: 500 }}>
            Le quiz entre potes, en mode classique ou soirée 🎉
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          width: '100%',
        }}>
          {CARDS.map((card, i) => (
            <motion.div
              key={card.href}
              onClick={() => router.push(card.href)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -6, boxShadow: `0 24px 64px ${card.glow}` }}
              style={{
                borderRadius: 24,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                border: `1px solid ${card.border}`,
                padding: '32px 28px',
                cursor: 'pointer',
                boxShadow: `0 8px 32px ${card.glow.replace('0.55', '0.2')}, inset 0 1px 0 rgba(255,255,255,0.07)`,
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}
            >
              {/* Gradient glow background */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.07,
                background: card.gradient,
                borderRadius: 24,
              }} />

              {/* Badge */}
              {card.badge && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'linear-gradient(135deg, #1d4ed8, #ec4899)',
                  borderRadius: 100, padding: '4px 10px',
                  fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.05em',
                }}>
                  {card.badge}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: card.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, flexShrink: 0,
                boxShadow: `0 12px 32px ${card.glow}`,
              }}>
                {card.emoji}
              </div>

              {/* Text */}
              <div style={{ position: 'relative', flex: 1 }}>
                <h2 style={{ fontWeight: 900, fontSize: 24, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {card.title}
                </h2>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '6px 0 0' }}>
                  {card.tagline}
                </p>
              </div>

              {/* Footer */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  {card.desc}
                </span>
                <motion.div
                  whileHover={{ x: 3 }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: card.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#fff', fontWeight: 900,
                    boxShadow: `0 4px 14px ${card.glow}`,
                  }}
                >
                  →
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
