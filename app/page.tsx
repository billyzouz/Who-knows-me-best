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
    cta: 'Jouer →',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    glowColor: '#8b5cf6',
    borderIdle: 'rgba(139,92,246,0.25)',
    borderHover: 'rgba(139,92,246,0.7)',
    bgGlow: 'rgba(139,92,246,0.09)',
    shadowIdle: '0 8px 40px rgba(139,92,246,0.18)',
    shadowHover: '0 0 0 1px rgba(139,92,246,0.5), 0 24px 72px rgba(139,92,246,0.45)',
    badge: null,
  },
  {
    href: '/party',
    emoji: '🍻',
    title: 'Pack Soirée',
    tagline: 'Les jeux qui font maaaaal',
    desc: '3 modes • 18+',
    cta: 'Entrer →',
    gradient: 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)',
    glowColor: '#ec4899',
    borderIdle: 'rgba(236,72,153,0.3)',
    borderHover: 'rgba(236,72,153,0.75)',
    bgGlow: 'rgba(236,72,153,0.1)',
    shadowIdle: '0 8px 40px rgba(236,72,153,0.2)',
    shadowHover: '0 0 0 1px rgba(236,72,153,0.55), 0 24px 72px rgba(236,72,153,0.5)',
    badge: 'Nouveau',
  },
]

export default function HubPage() {
  const router = useRouter()

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2vh 24px',
    }}>
      <FloatingShapes density="sparse" />

      <div className="fade-up" style={{ width: '100%', maxWidth: 860, position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div className="wobble hub-emoji" style={{ fontSize: 40, display: 'inline-block', marginBottom: 10 }}>🕹️</div>
          <h1 className="hub-title" style={{ fontWeight: 900, fontSize: 'clamp(24px, 3.5vw, 44px)', color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Choisis ton jeu
          </h1>
          <p className="hub-sub" style={{ color: T.muted, fontSize: 14, marginTop: 8, fontWeight: 500 }}>
            Le quiz entre potes, en mode classique ou soirée 🎉
          </p>
        </div>

        {/* Cards */}
        <div className="hub-cards">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.href}
              onClick={() => router.push(card.href)}
              className="hub-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              whileTap={{ scale: 0.975 }}
              whileHover={{ scale: 1.03, boxShadow: card.shadowHover, borderColor: card.borderHover }}
              style={{
                borderRadius: 24,
                background: 'rgba(255,255,255,0.045)',
                backdropFilter: 'blur(32px) saturate(160%)',
                WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                border: `1.5px solid ${card.borderIdle}`,
                boxShadow: card.shadowIdle,
                padding: '22px 26px 20px',
                cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Gradient wash */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: card.bgGlow, pointerEvents: 'none' }} />
              {/* Top shine */}
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />

              {/* Badge */}
              {card.badge && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg, #db2777, #9333ea)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', boxShadow: '0 4px 12px rgba(236,72,153,0.4)' }}>
                  {card.badge}
                </div>
              )}

              {/* Icon */}
              <div className="hub-icon" style={{ width: 72, height: 72, borderRadius: 20, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, flexShrink: 0, boxShadow: `0 12px 32px ${card.glowColor}66`, marginBottom: 16, position: 'relative' }}>
                {card.emoji}
              </div>

              {/* Title */}
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(18px, 2vw, 24px)', color: '#fff', margin: 0, letterSpacing: '-0.02em', position: 'relative' }}>
                {card.title}
              </h2>

              {/* Tagline */}
              <p style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', position: 'relative' }}>
                {card.tagline}
              </p>

              {/* Desc pill */}
              <div style={{ marginTop: 12, position: 'relative' }}>
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                  {card.desc}
                </span>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* CTA */}
              <div className="hub-cta" style={{ marginTop: 16, width: '100%', position: 'relative', padding: '13px 20px', background: card.gradient, borderRadius: 14, fontWeight: 800, fontSize: 14, color: '#fff', boxShadow: `0 6px 20px ${card.glowColor}44` }}>
                {card.cta}
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
