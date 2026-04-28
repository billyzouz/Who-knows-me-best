'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { GameState, Guess, Player, Room } from '@/lib/types'
import { Avatar, Btn, FloatingShapes, GlassPanel, Label, Sparkles, T } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { TOD_QUESTIONS, TODQuestion } from '@/constants/tod-questions'

const CYAN = '#06b6d4'
const BLUE = '#3b82f6'

export default function TruthOrDareGamePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  
  // Le choix révélé pour le tour en cours (stocké dans guesses)
  const [revealedChoice, setRevealedChoice] = useState<Guess | null>(null)

  const loadChoice = useCallback(async (gsId: string) => {
    const { data } = await supabase.from('guesses').select().eq('question_id', gsId).maybeSingle()
    setRevealedChoice(data)
  }, [])

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    const tok = sessionStorage.getItem(`token_${code}`)
    setMyId(id)
    setMyToken(tok)
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
      if (!roomData) { router.push('/'); return }
      if (roomData.status === 'finished') { router.push(`/room/${code}/results`); return }
      if (roomData.status !== 'playing_tod') { router.push(`/room/${code}`); return }
      
      setRoom(roomData)
      const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
      const { data: gs } = await supabase.from('game_state').select().eq('room_id', roomData.id).single()
      setPlayers(p ?? []); setGameState(gs)
      
      if (gs && gs.phase === 'reveal') {
        await loadChoice(gs.id)
      }
      setLoading(false)

      supabase.getChannels().filter(c => c.topic === `realtime:tod_${code}`).forEach(c => supabase.removeChannel(c))
      channel = supabase.channel(`tod_${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, async (payload) => {
          const gs = payload.new as GameState
          if (gs.room_id !== roomData.id) return
          setGameState(gs)
          if (gs.phase === 'reveal') {
            await loadChoice(gs.id)
          } else {
            setRevealedChoice(null)
          }
          const { data: p } = await supabase.from('players').select().eq('room_id', gs.room_id).order('created_at')
          setPlayers(p ?? [])
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guesses' }, async (payload) => {
          // Update immediately when someone makes a choice
          const newGuess = payload.new as Guess
          setRevealedChoice(newGuess)
        })
        .subscribe()
    }
    init()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [code, router, loadChoice])

  const difficulty = room?.mode?.split(':')[1] || 'mixte'
  
  // Filtrage local pour la performance
  const filteredQuestions = TOD_QUESTIONS.filter(q => difficulty === 'mixte' || q.level === difficulty)

  async function selectCard(type: 'truth' | 'action') {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    
    // Tirage d'une carte au hasard parmi le type choisi
    const options = filteredQuestions.filter(q => q.type === type)
    const choice = options[Math.floor(Math.random() * options.length)] || TOD_QUESTIONS.find(q => q.type === type)
    
    await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tod_submit_choice', playerId: myId, token: myToken, gameStateId: gameState.id, choiceId: choice!.id }),
    })
    setActioning(false)
  }

  async function nextTurn() {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tod_pass_turn', playerId: myId, token: myToken, gameStateId: gameState.id }),
    })
    setActioning(false)
  }

  if (loading || !gameState) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const currentSubject = players.find(p => p.id === gameState.current_subject_id)
  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false
  const isSubject = myId === gameState.current_subject_id

  const revealedQuestion = revealedChoice ? TOD_QUESTIONS.find(q => q.id === revealedChoice.guess) : null

  return (
    <div className="game-page" style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 800px 600px at 20% 30%, rgba(6, 182, 212, 0.2), transparent 55%),
            radial-gradient(ellipse 700px 500px at 80% 70%, rgba(59, 130, 246, 0.18), transparent 55%),
            radial-gradient(ellipse 500px 400px at 50% 90%, rgba(14, 165, 233, 0.12), transparent 60%)
          `,
        }}
      />
      <FloatingShapes density="sparse" />

      <div className="game-inner" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Top bar */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Label color={CYAN}>Action ou Vérité</Label>
            <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
              · {difficulty.toUpperCase()}
            </span>
          </div>
          {isHost && (
            <Btn variant="ghost" onClick={nextTurn} disabled={actioning} style={{ padding: '6px 12px', fontSize: 12 }}>
              Passer le tour ⏭
            </Btn>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
          
          <GlassPanel style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
            {currentSubject && <Avatar name={currentSubject.name} index={players.indexOf(currentSubject)} size={56} ring={CYAN} />}
            <div style={{ flex: 1 }}>
              <Label>Tour de</Label>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#fff', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
                {isSubject ? "C'est ton tour !" : currentSubject?.name}
              </h2>
            </div>
          </GlassPanel>

          <AnimatePresence mode="wait">
            {gameState.phase === 'answering' ? (
              <motion.div
                key="choosing"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ width: '100%' }}
              >
                {isSubject ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                    <motion.button
                      onClick={() => selectCard('truth')}
                      disabled={actioning}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '40px 20px', borderRadius: 24, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)', color: '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                      }}
                    >
                      <span style={{ fontSize: 48 }}>🤫</span>
                      <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em' }}>VÉRITÉ</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => selectCard('action')}
                      disabled={actioning}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '40px 20px', borderRadius: 24, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)', color: '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                      }}
                    >
                      <span style={{ fontSize: 48 }}>🔥</span>
                      <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em' }}>ACTION</span>
                    </motion.button>
                  </div>
                ) : (
                  <GlassPanel glow={CYAN} style={{ padding: 48, textAlign: 'center', width: '100%' }}>
                    <div className="wobble" style={{ fontSize: 48, marginBottom: 16, display: 'inline-block' }}>🤔</div>
                    <h3 style={{ fontSize: 20, color: '#fff', margin: 0, fontWeight: 800 }}>Suspense...</h3>
                    <p style={{ fontSize: 16, color: T.muted, fontWeight: 500, marginTop: 12 }}>
                      <strong style={{ color: CYAN }}>{currentSubject?.name}</strong> est en train de choisir son destin...
                    </p>
                  </GlassPanel>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="reveal"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                style={{ width: '100%', perspective: 1000 }}
              >
                <GlassPanel glow={revealedQuestion?.type === 'truth' ? '#8b5cf6' : '#ef4444'} style={{ padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <Sparkles count={15} />
                  <Label color={revealedQuestion?.type === 'truth' ? '#8b5cf6' : '#ef4444'} style={{ marginBottom: 20 }}>
                    {revealedQuestion?.type === 'truth' ? 'VÉRITÉ' : 'ACTION'}
                  </Label>
                  <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 4vw, 42px)', color: '#fff', lineHeight: 1.3, letterSpacing: '-0.02em', margin: 0 }}>
                    {revealedQuestion?.text ?? '???'}
                  </h1>
                  
                  <div style={{ marginTop: 40, padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: 12, display: 'inline-block' }}>
                    <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 14 }}>❌ Refus : Bois 2 gorgées !</span>
                  </div>
                </GlassPanel>

                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  {isHost ? (
                    <Btn onClick={nextTurn} disabled={actioning} style={{ background: `linear-gradient(135deg, ${CYAN} 0%, ${BLUE} 100%)` }}>
                      {actioning ? '...' : 'Tour Suivant →'}
                    </Btn>
                  ) : (
                    <p style={{ color: T.muted, fontSize: 14 }}>Le host va passer au tour suivant...</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
