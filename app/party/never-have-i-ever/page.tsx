'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/components/ui'

const CARDS = [
  // Soft
  { text: "…dormi dans les transports et loupé mon arrêt", level: 'soft' },
  { text: "…menti sur mon âge pour rentrer quelque part", level: 'soft' },
  { text: "…regardé une série entière en une journée", level: 'soft' },
  { text: "…envoyé un message à la mauvaise personne", level: 'soft' },
  { text: "…chanté à tue-tête seul(e) dans ma voiture", level: 'soft' },
  { text: "…oublié le prénom de quelqu'un à qui je venais de me présenter", level: 'soft' },
  { text: "…commandé de la nourriture juste pour ne pas cuisiner", level: 'soft' },
  { text: "…fait semblant d'être occupé(e) pour éviter quelqu'un", level: 'soft' },
  // Fun
  { text: "…pris quelqu'un en photo sans qu'il le sache", level: 'fun' },
  { text: "…stalké l'ex d'un(e) ami(e) sur les réseaux", level: 'fun' },
  { text: "…inventé une excuse pour ne pas sortir alors que j'avais rien à faire", level: 'fun' },
  { text: "…liké accidentellement une vieille photo en scrollant trop loin", level: 'fun' },
  { text: "…fait croire que j'avais vu un film sans l'avoir vu", level: 'fun' },
  { text: "…glissé sur une peau de banane pour de vrai", level: 'fun' },
  { text: "…répondu 'toi aussi' quand le serveur m'a dit 'bon appétit'", level: 'fun' },
  { text: "…pleuré devant un film Disney", level: 'fun' },
  { text: "…fait du ghosting à quelqu'un que je connaissais IRL", level: 'fun' },
  // Spicy
  { text: "…embrassé un(e) ami(e) d'ami(e) que je venais de rencontrer", level: 'spicy' },
  { text: "…dragué quelqu'un juste pour voir si ça marchait", level: 'spicy' },
  { text: "…menti à mes parents sur où j'étais la nuit", level: 'spicy' },
  { text: "…envoyé un texto ivre que j'ai regretté le lendemain", level: 'spicy' },
  { text: "…flirté avec quelqu'un en couple", level: 'spicy' },
  { text: "…dansé sur une table", level: 'spicy' },
  { text: "…embrassé plus de 3 personnes dans la même soirée", level: 'spicy' },
  { text: "…rencontré quelqu'un sur une appli et pas avoué que c'est comme ça qu'on s'est connus", level: 'spicy' },
]

const LEVEL_CONFIG = {
  soft:  { label: 'Soft',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  fun:   { label: 'Fun',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  spicy: { label: 'Épicé', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NeverHaveIEverPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'game' | 'end'>('intro')
  const [deck, setDeck] = useState<typeof CARDS>([])
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const start = useCallback(() => {
    setDeck(shuffle(CARDS))
    setIndex(0)
    setPhase('game')
  }, [])

  const next = useCallback(() => {
    if (index >= deck.length - 1) { setPhase('end'); return }
    setDirection(1)
    setIndex(i => i + 1)
  }, [index, deck.length])

  const prev = useCallback(() => {
    if (index === 0) return
    setDirection(-1)
    setIndex(i => i - 1)
  }, [index])

  const card = deck[index]
  const level = card ? LEVEL_CONFIG[card.level as keyof typeof LEVEL_CONFIG] : null
  const progress = deck.length > 0 ? ((index + 1) / deck.length) * 100 : 0

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Back */}
        <motion.button
          onClick={() => phase === 'intro' ? router.push('/party') : setPhase('intro')}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'block', fontFamily: 'inherit' }}
        >
          ← {phase === 'intro' ? 'Pack Soirée' : 'Menu'}
        </motion.button>

        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🤭</div>
                <h1 style={{ fontWeight: 900, fontSize: 34, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Je n'ai jamais</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10 }}>Les aveux qui changent tout</p>
              </div>

              <GlassPanel style={{ padding: 24, marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ec4899', margin: '0 0 16px' }}>Règles</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['🃏', `${CARDS.length} cartes mélangées, 3 niveaux`],
                    ['🍺', 'Tu l\'as fait → tu bois une gorgée'],
                    ['😇', 'Tu ne l\'as jamais fait → les autres boivent'],
                    ['🔄', 'Chaque partie est différente'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20, width: 28, flexShrink: 0, textAlign: 'center' }}>{icon}</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Level legend */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
                {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
                  <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.color}44`, borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: cfg.color }}>
                    {cfg.label}
                  </div>
                ))}
              </div>

              <motion.button
                onClick={start}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -2 }}
                style={{
                  width: '100%', padding: '17px 20px', minHeight: 56,
                  borderRadius: 28, border: 'none',
                  background: 'linear-gradient(135deg, #be185d 0%, #9333ea 100%)',
                  color: '#fff', fontWeight: 800, fontSize: 17,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 8px 28px rgba(236,72,153,0.45)',
                }}
              >
                Lancer le jeu 🤭
              </motion.button>
            </motion.div>
          )}

          {/* ── GAME ── */}
          {phase === 'game' && card && level && (
            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Carte {index + 1} / {deck.length}</span>
                  <div style={{ background: level.bg, border: `1px solid ${level.color}44`, borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: level.color }}>
                    {level.label}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 4 }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #be185d, #9333ea)' }}
                  />
                </div>
              </div>

              {/* Card */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={index}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -60 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div style={{
                    borderRadius: 28,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    border: `1.5px solid ${level.color}33`,
                    boxShadow: `0 12px 48px ${level.color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    padding: '40px 32px',
                    minHeight: 220,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', gap: 16,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Glow wash */}
                    <div style={{ position: 'absolute', inset: 0, background: level.bg, borderRadius: 28, opacity: 0.6 }} />
                    <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: level.color, margin: 0, position: 'relative' }}>
                      Je n'ai jamais…
                    </p>
                    <p style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em', position: 'relative' }}>
                      {card.text}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <motion.button
                  onClick={prev}
                  disabled={index === 0}
                  whileTap={index > 0 ? { scale: 0.94 } : undefined}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: index === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    fontWeight: 700, fontSize: 15, cursor: index === 0 ? 'default' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ←
                </motion.button>
                <motion.button
                  onClick={next}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  style={{
                    flex: 3, padding: '14px', borderRadius: 20, border: 'none',
                    background: 'linear-gradient(135deg, #be185d 0%, #9333ea 100%)',
                    color: '#fff', fontWeight: 800, fontSize: 15,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 6px 20px rgba(236,72,153,0.35)',
                  }}
                >
                  {index >= deck.length - 1 ? 'Terminer ✓' : 'Suivant →'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── END ── */}
          {phase === 'end' && (
            <motion.div key="end" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontWeight: 900, fontSize: 30, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Toutes les cartes !</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10, marginBottom: 36 }}>
                Vous avez survécu… ou presque.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.button
                  onClick={start}
                  whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }}
                  style={{ width: '100%', padding: '17px', borderRadius: 28, border: 'none', background: 'linear-gradient(135deg, #be185d 0%, #9333ea 100%)', color: '#fff', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(236,72,153,0.4)' }}
                >
                  Rejouer 🔄
                </motion.button>
                <motion.button
                  onClick={() => router.push('/party')}
                  whileTap={{ scale: 0.96 }}
                  style={{ width: '100%', padding: '14px', borderRadius: 28, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Changer de jeu
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
