'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/components/ui'
import { NHIE_QUESTIONS, type NhieLevel } from '@/constants/nhie-questions'

const QUESTIONS_PER_GAME = 20

const MODE_CONFIG = {
  soft: {
    label: 'Soft',
    emoji: '😇',
    desc: 'Questions innocentes pour briser la glace',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    shadow: 'rgba(34,197,94,0.4)',
  },
  medium: {
    label: 'Medium',
    emoji: '😏',
    desc: 'Un peu plus osé, ça commence à chauffer',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    shadow: 'rgba(245,158,11,0.4)',
  },
  hard: {
    label: 'Hard',
    emoji: '🔥',
    desc: 'Réservé aux âmes courageuses',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
    shadow: 'rgba(236,72,153,0.4)',
  },
  mix: {
    label: 'Mix Total',
    emoji: '🎲',
    desc: 'Tout mélangé — du soft au hard',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    shadow: 'rgba(167,139,250,0.4)',
  },
} as const

type Mode = keyof typeof MODE_CONFIG

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickQuestions(mode: Mode) {
  const pool = mode === 'mix'
    ? NHIE_QUESTIONS
    : NHIE_QUESTIONS.filter(q => q.level === (mode as NhieLevel))
  return shuffle(pool).slice(0, QUESTIONS_PER_GAME)
}

export default function NeverHaveIEverPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'select' | 'game' | 'end'>('select')
  const [mode, setMode] = useState<Mode>('soft')
  const [deck, setDeck] = useState<typeof NHIE_QUESTIONS>([])
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const startMode = useCallback((m: Mode) => {
    setMode(m)
    setDeck(pickQuestions(m))
    setIndex(0)
    setPhase('game')
  }, [])

  const replay = useCallback(() => {
    setDeck(pickQuestions(mode))
    setIndex(0)
    setPhase('game')
  }, [mode])

  const next = useCallback(() => {
    if (index >= QUESTIONS_PER_GAME - 1) { setPhase('end'); return }
    setDirection(1)
    setIndex(i => i + 1)
  }, [index])

  const prev = useCallback(() => {
    if (index === 0) return
    setDirection(-1)
    setIndex(i => i - 1)
  }, [index])

  const card = deck[index]
  const cfg = MODE_CONFIG[mode]
  const cardLevel = card ? MODE_CONFIG[card.level] ?? cfg : cfg
  const progress = ((index + 1) / QUESTIONS_PER_GAME) * 100

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
          onClick={() => phase === 'select' ? router.push('/party') : setPhase('select')}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'block', fontFamily: 'inherit' }}
        >
          ← {phase === 'select' ? 'Pack Soirée' : 'Changer de mode'}
        </motion.button>

        <AnimatePresence mode="wait">

          {/* ── SELECT ── */}
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🤭</div>
                <h1 style={{ fontWeight: 900, fontSize: 34, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Je n'ai jamais</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10 }}>Choisis ton niveau de honte</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([key, m]) => (
                  <motion.button
                    key={key}
                    onClick={() => startMode(key)}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -3 }}
                    style={{
                      width: '100%', padding: '20px 24px',
                      borderRadius: 24, border: `1.5px solid ${m.color}44`,
                      background: m.bg, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 16,
                      textAlign: 'left',
                      boxShadow: `0 4px 24px ${m.shadow}22`,
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 36, flexShrink: 0 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 18, color: m.color, margin: 0 }}>{m.label}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0', fontWeight: 500 }}>{m.desc}</p>
                    </div>
                    <span style={{ fontSize: 20, color: m.color, opacity: 0.6 }}>→</span>
                  </motion.button>
                ))}
              </div>

              <GlassPanel style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🍺</span>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>
                    Tu l'as fait → tu bois. Tu ne l'as jamais fait → tu es innocent(e), tu ne bois pas. {QUESTIONS_PER_GAME} cartes par partie.
                  </p>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {/* ── GAME ── */}
          {phase === 'game' && card && (
            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

              {/* Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Carte {index + 1} / {QUESTIONS_PER_GAME}</span>
                  <div style={{ background: cardLevel.bg, border: `1px solid ${cardLevel.color}44`, borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: cardLevel.color }}>
                    {cardLevel.label}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 4 }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', borderRadius: 100, background: cfg.gradient }}
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
                    border: `1.5px solid ${cardLevel.color}33`,
                    boxShadow: `0 12px 48px ${cardLevel.color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    padding: '40px 32px',
                    minHeight: 220,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', gap: 16,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: cardLevel.bg, borderRadius: 28, opacity: 0.6 }} />
                    <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: cardLevel.color, margin: 0, position: 'relative' }}>
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
                    background: cfg.gradient,
                    color: '#fff', fontWeight: 800, fontSize: 15,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 6px 20px ${cfg.shadow}55`,
                  }}
                >
                  {index >= QUESTIONS_PER_GAME - 1 ? 'Terminer ✓' : 'Suivant →'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── END ── */}
          {phase === 'end' && (
            <motion.div key="end" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontWeight: 900, fontSize: 30, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Partie terminée !</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10, marginBottom: 12 }}>
                {QUESTIONS_PER_GAME} cartes jouées en mode <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 36 }}>
                Vous avez survécu… ou presque.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.button
                  onClick={replay}
                  whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }}
                  style={{ width: '100%', padding: '17px', borderRadius: 28, border: 'none', background: cfg.gradient, color: '#fff', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 28px ${cfg.shadow}55` }}
                >
                  Rejouer en {cfg.label} 🔄
                </motion.button>
                <motion.button
                  onClick={() => setPhase('select')}
                  whileTap={{ scale: 0.96 }}
                  style={{ width: '100%', padding: '14px', borderRadius: 28, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Changer de mode
                </motion.button>
                <motion.button
                  onClick={() => router.push('/party')}
                  whileTap={{ scale: 0.96 }}
                  style={{ width: '100%', padding: '12px', borderRadius: 28, border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
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
