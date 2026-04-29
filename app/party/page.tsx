'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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
    badge: 'Disponible',
    badgeColor: '#22c55e',
    available: true,
  },
  {
    href: '/party/truth-or-dare',
    emoji: '🎲',
    title: 'Action ou Vérité',
    desc: 'Le classique ultime',
    sub: 'Courage ou confessions.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    glow: 'rgba(124,58,237,0.5)',
    badge: 'Nouveau',
    badgeColor: '#06b6d4',
    available: true,
  },
  {
    href: '/party/most-likely',
    emoji: '🫵',
    title: 'Qui Pourrait...',
    desc: 'Votez pour le coupable',
    sub: 'Le plus de votes... boit !',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    glow: 'rgba(249,115,22,0.5)',
    badge: 'Nouveau',
    badgeColor: '#f97316',
    available: true,
  },
]

export default function PartyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Electric neon overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 900px 700px at 15% 40%, rgba(29,78,216,0.3), transparent 55%),
            radial-gradient(ellipse 700px 600px at 85% 55%, rgba(219,39,119,0.25), transparent 55%),
            radial-gradient(ellipse 500px 400px at 50% 95%, rgba(99,102,241,0.2), transparent 60%)
          `,
        }}
      />
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(20px, 4vh, 48px) 20px',
      paddingBottom: 'max(clamp(20px, 4vh, 48px), env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vh, 32px)' }}>

        {/* Back */}
        <motion.button
          onClick={() => router.push('/')}
          whileTap={{ scale: 0.96 }}
          whileHover={{ x: -2 }}
          transition={{ duration: 0.15 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', alignSelf: 'flex-start' }}
        >
          ← Accueil
        </motion.button>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div className="wobble" style={{ fontSize: 'clamp(36px, 5vh, 52px)', display: 'inline-block', marginBottom: 'clamp(6px, 1vh, 12px)' }}>🍻</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 4vh, 40px)', color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Pack Soirée
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(13px, 1.6vh, 15px)', marginTop: 'clamp(6px, 1vh, 10px)', fontWeight: 500 }}>
            Les jeux qui font maaaaal 🔥
          </p>
        </div>

        {/* Game cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vh, 16px)' }}>
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
                padding: 'clamp(14px, 2vh, 22px) 22px',
                cursor: game.available ? 'pointer' : 'default',
                opacity: game.available ? 1 : 0.6,
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: game.gradient, borderRadius: '20px 0 0 20px' }} />

              <div style={{
                width: 'clamp(40px, 5.5vh, 52px)', height: 'clamp(40px, 5.5vh, 52px)',
                borderRadius: 14, flexShrink: 0,
                background: game.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(20px, 2.8vh, 26px)', boxShadow: `0 8px 24px ${game.glow}`,
              }}>
                {game.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.8vh, 16px)', color: '#fff' }}>{game.title}</span>
                  <span style={{ background: `${game.badgeColor}22`, border: `1px solid ${game.badgeColor}44`, color: game.badgeColor, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                    {game.badge}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.5vh, 13px)', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{game.desc}</p>
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
    </div>
  )
}
