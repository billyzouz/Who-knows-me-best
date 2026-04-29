'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { GameState, Guess, Player, Question, Room } from '@/lib/types'
import { Avatar, Btn, FloatingShapes, GlassPanel, Inp, Label, Sparkles, T } from '@/components/ui'
import { motion } from 'framer-motion'

export default function PlayPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [myGuess, setMyGuess] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingGuess, setSubmittingGuess] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [guessError, setGuessError] = useState('')
  const [validationOverrides, setValidationOverrides] = useState<Record<string, boolean>>({})
  const [drinkingMode, setDrinkingMode] = useState(false)

  const GUESS_TIMER = 30
  const [timeLeft, setTimeLeft] = useState(GUESS_TIMER)
  const timerFiredRef = useRef(false)
  const guessingStartRef = useRef<number | null>(null)

  const gameStateRef = useRef<GameState | null>(null)
  const playersRef = useRef<Player[]>([])
  const questionsRef = useRef<Question[]>([])

  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { questionsRef.current = questions }, [questions])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'guessing') {
      setTimeLeft(GUESS_TIMER)
      timerFiredRef.current = false
      guessingStartRef.current = null
      return
    }
    // Initialize start time only once per guessing phase entry
    if (guessingStartRef.current === null) {
      const parsed = new Date(gameState.updated_at).getTime()
      const elapsed = isNaN(parsed) ? Infinity : (Date.now() - parsed) / 1000
      // Only trust DB timestamp if it's recent (less than GUESS_TIMER seconds ago)
      guessingStartRef.current = (elapsed >= 0 && elapsed < GUESS_TIMER) ? parsed : Date.now()
    }
    const start = guessingStartRef.current
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const left = Math.max(0, GUESS_TIMER - elapsed)
      setTimeLeft(left)
      return left
    }
    tick()
    const interval = setInterval(() => {
      const left = tick()
      if (left <= 0) clearInterval(interval)
    }, 500)
    return () => clearInterval(interval)
  }, [gameState?.phase, gameState?.updated_at])

  const loadGuesses = useCallback(async (questionId: string): Promise<Guess[]> => {
    const { data } = await supabase.from('guesses').select().eq('question_id', questionId)
    const fetched = data ?? []
    setGuesses(fetched)
    return fetched
  }, [])

  function getCurrentQuestion(gs: GameState, p: Player[], q: Question[]): Question | null {
    const subjectQuestions = q.filter(x => x.author_id === gs.current_subject_id)
    return subjectQuestions[gs.current_question_idx] ?? null
  }

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
      if (roomData.status !== 'playing') { router.push(`/room/${code}`); return }
      const drinking = roomData.mode === 'drinking'
      setDrinkingMode(drinking)
      sessionStorage.setItem(`mode_${code}`, drinking ? 'drinking' : 'classic')
      setRoom(roomData)
      const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
      const { data: q } = await supabase.from('questions').select().eq('room_id', roomData.id).order('created_at')
      const { data: gs } = await supabase.from('game_state').select().eq('room_id', roomData.id).single()
      setPlayers(p ?? []); setQuestions(q ?? []); setGameState(gs)
      if (gs) {
        const currentQ = getCurrentQuestion(gs, p ?? [], q ?? [])
        if (currentQ) await loadGuesses(currentQ.id)
      }
      setLoading(false)

      supabase.getChannels().filter(c => c.topic === `realtime:play_${code}`).forEach(c => supabase.removeChannel(c))
      
      const channelName = `play_${code}`
      const existingChannels = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}`)
      for (const ch of existingChannels) {
        await supabase.removeChannel(ch)
      }

      channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async (payload) => {
          // Détection d'expulsion
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as any).id === id) {
            sessionStorage.clear()
            sessionStorage.setItem('kicked_message', 'Vous avez été retiré du salon.')
            window.location.href = '/'
            return
          }
          const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
          setPlayers(p ?? [])
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, async (payload) => {
          const changedId = (payload.new as any)?.id
          if (!changedId) return
          const { data: gs } = await supabase.from('game_state').select().eq('id', changedId).single()
          if (!gs || gs.room_id !== roomData.id) return
          
          setGuesses([]); setMyGuess(''); setGameState(gs)
          const { data: p } = await supabase.from('players').select().eq('room_id', gs.room_id).order('created_at')
          const { data: q } = await supabase.from('questions').select().eq('room_id', gs.room_id).order('created_at')
          setPlayers(p ?? []); setQuestions(q ?? [])
          const currentQ = getCurrentQuestion(gs, p ?? [], q ?? [])
          if (currentQ) {
            const fetchedGuesses = await loadGuesses(currentQ.id)
            if (gs.phase === 'validating') {
              const overrides: Record<string, boolean> = {}
              for (const g of fetchedGuesses) overrides[g.id] = normalize(g.guess) === normalize(currentQ.answer)
              setValidationOverrides(overrides)
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guesses' }, async (payload) => {
          const gs = gameStateRef.current
          if (!gs) return
          const currentQ = getCurrentQuestion(gs, playersRef.current, questionsRef.current)
          if (!currentQ) return
          const changedQId = (payload.new as any)?.question_id
          if (changedQId && changedQId !== currentQ.id) return
          await loadGuesses(currentQ.id)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
          const r = payload.new as Room
          if (r.id !== roomData.id) return
          if (r.status === 'finished') router.push(`/room/${code}/results`)
        })
        .subscribe()
    }
    init()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [code, router, loadGuesses])

  function normalize(s: string) {
    return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  }

  const myIdRef = useRef<string | null>(null)
  const myTokenRef = useRef<string | null>(null)
  const isSubjectRef = useRef(false)
  const mountTimeRef = useRef(Date.now())
  useEffect(() => { myIdRef.current = myId }, [myId])
  useEffect(() => { myTokenRef.current = myToken }, [myToken])

  useEffect(() => {
    if (!gameState) return
    const id = sessionStorage.getItem(`player_${code}`)
    isSubjectRef.current = id === gameState.current_subject_id
  }, [gameState?.current_subject_id, code])

  useEffect(() => {
    if (timeLeft > 0 || timerFiredRef.current) return
    if (!isSubjectRef.current) return
    if (Date.now() - mountTimeRef.current < 1500) return
    timerFiredRef.current = true
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'guessing') return
    const id = myIdRef.current
    const tok = myTokenRef.current
    if (!id || !tok) return
    fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start_validating', playerId: id, token: tok, gameStateId: gs.id }),
    })
  }, [timeLeft])

  async function advanceToGuessing() {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    const res = await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance_to_guessing', playerId: myId, token: myToken, gameStateId: gameState.id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.error('advance_to_guessing failed', res.status, body)
      alert(`Erreur ${res.status}: ${body.error ?? 'inconnue'}`)
    }
    setActioning(false)
  }

  async function submitGuess() {
    setGuessError('')
    if (!myId || !myToken || !gameState) { setGuessError('Erreur inattendue, recharge la page'); return }
    if (!myGuess.trim()) return
    const currentQ = getCurrentQuestion(gameState, players, questions)
    if (!currentQ) { setGuessError('Erreur inattendue, recharge la page'); return }
    setSubmittingGuess(true)
    const res = await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_guess', playerId: myId, token: myToken, gameStateId: gameState.id, guess: myGuess.trim() }),
    })
    if (!res.ok) { const { error } = await res.json(); setGuessError(error ?? 'Erreur'); setSubmittingGuess(false); return }
    setGuesses(prev => {
      const filtered = prev.filter(g => g.player_id !== myId)
      return [...filtered, { id: 'optimistic', question_id: currentQ.id, player_id: myId, guess: myGuess.trim(), is_correct: false, created_at: '' }]
    })
    setSubmittingGuess(false)
  }

  async function startValidating() {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    const currentQ = getCurrentQuestion(gameState, players, questions)
    if (!currentQ) { setActioning(false); return }
    const { data: allGuesses } = await supabase.from('guesses').select().eq('question_id', currentQ.id)
    if (!allGuesses) { setActioning(false); return }
    const overrides: Record<string, boolean> = {}
    for (const g of allGuesses) overrides[g.id] = normalize(g.guess) === normalize(currentQ.answer)
    setValidationOverrides(overrides)
    await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start_validating', playerId: myId, token: myToken, gameStateId: gameState.id }),
    })
    setActioning(false)
  }

  async function validateAndScore() {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    const currentQ = getCurrentQuestion(gameState, players, questions)
    if (!currentQ) { setActioning(false); return }
    const res = await fetch('/api/validate-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameStateId: gameState.id,
        questionId: currentQ.id,
        overrides: validationOverrides,
        callerPlayerId: myId,
        callerToken: myToken,
      }),
    })
    if (!res.ok) console.error('validate-scores error', await res.text())
    setActioning(false)
  }

  async function nextQuestion() {
    if (!gameState || !myId || !myToken || actioning) return
    setActioning(true)
    await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'next_question', playerId: myId, token: myToken, gameStateId: gameState.id }),
    })
    setActioning(false)
  }

  if (loading || !gameState) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const currentQuestion = getCurrentQuestion(gameState, players, questions)
  const currentSubject = players.find(p => p.id === gameState.current_subject_id)
  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false
  const isSubject = myId === gameState.current_subject_id
  const myGuessSubmitted = guesses.some(g => g.player_id === myId)
  const nonSubjectPlayers = players.filter(p => p.id !== gameState.current_subject_id)
  const allGuessed = nonSubjectPlayers.length > 0 && nonSubjectPlayers.every(p => guesses.some(g => g.player_id === p.id))
  const subjectQuestions = questions.filter(q => q.author_id === gameState.current_subject_id)
  const subjectIndex = players.findIndex(p => p.id === gameState.current_subject_id)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const AMBER = '#f59e0b'
  const accentColor = drinkingMode ? AMBER : T.purple
  const phaseColor = { answering: accentColor, guessing: T.yellow, validating: T.green, reveal: T.pink }
  const phaseLabel = { answering: 'Répondre', guessing: 'Deviner', validating: 'Validation', reveal: 'Révélation' }

  const timerColor = timeLeft > 10 ? T.yellow : timeLeft > 5 ? '#f97316' : '#ef4444'
  const timerRadius = 22
  const timerCircum = 2 * Math.PI * timerRadius
  const timerDash = timerCircum * (timeLeft / GUESS_TIMER)
  function TimerRing() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width={56} height={56} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={28} cy={28} r={timerRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
          <circle cx={28} cy={28} r={timerRadius} fill="none" stroke={timerColor} strokeWidth={4}
            strokeDasharray={timerCircum} strokeDashoffset={timerCircum - timerDash}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }} />
        </svg>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 28, color: timerColor, minWidth: 28, lineHeight: 1, transform: 'translateY(1px)' }}>
          {timeLeft}
        </span>
      </div>
    )
  }

  if (!currentQuestion) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Question introuvable...</div>
  )

  return (
    <div className="game-page">
      {drinkingMode && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 800px 600px at 20% 30%, rgba(245,158,11,0.18), transparent 55%),
              radial-gradient(ellipse 700px 500px at 80% 70%, rgba(249,115,22,0.15), transparent 55%),
              radial-gradient(ellipse 500px 400px at 50% 90%, rgba(251,146,60,0.1), transparent 60%)
            `,
          }}
        />
      )}
      <FloatingShapes density="sparse" />

      <div className="game-inner" style={{ position: 'relative', zIndex: 2 }}>

        {/* Top bar */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Label color={phaseColor[gameState.phase]}>{phaseLabel[gameState.phase]}</Label>
            <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
              · Joueur {subjectIndex + 1}/{players.length} · Q{gameState.current_question_idx + 1}/{subjectQuestions.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {players.map(p => (
              <div key={p.id} style={{ width: 8, height: 8, borderRadius: '50%', background: p.id === gameState.current_subject_id ? accentColor : T.faint, boxShadow: p.id === gameState.current_subject_id ? `0 0 10px ${accentColor}` : 'none' }} />
            ))}
          </div>
        </div>

        {/* 3-column layout */}
        <div className="game-layout">

          {/* LEFT: Scores sidebar */}
          <GlassPanel className="desktop-only" style={{ padding: 20 }}>
            <Label style={{ marginBottom: 14 }}>Joueurs · Scores</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedPlayers.map(p => {
                const idx = players.indexOf(p)
                const isCurrent = p.id === gameState.current_subject_id
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14,
                    background: isCurrent ? `${accentColor}18` : 'rgba(255,255,255,0.03)',
                    border: isCurrent ? `1px solid ${accentColor}44` : '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <Avatar name={p.name} index={idx} size={34} ring={isCurrent ? accentColor : undefined} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>
                        {p.name}{isCurrent && <span style={{ color: accentColor, fontSize: 11, marginLeft: 6 }}>répond</span>}
                      </p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 17, color: T.yellow }}>{p.score}</span>
                  </div>
                )
              })}
            </div>
          </GlassPanel>

          {/* CENTER: Main game area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Subject card */}
            <GlassPanel style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              {currentSubject && <Avatar name={currentSubject.name} index={players.indexOf(currentSubject)} size={56} ring={accentColor} />}
              <div style={{ flex: 1 }}>
                <Label>Tour de</Label>
                <h2 style={{ fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#fff', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
                  {isSubject ? "C'est ton tour !" : currentSubject?.name}
                </h2>
              </div>
              <div style={{ padding: '6px 14px', background: `${T.yellow}18`, borderRadius: 100, border: `1px solid ${T.yellow}44`, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: T.yellow, fontWeight: 700 }}>Q{gameState.current_question_idx + 1}/{subjectQuestions.length}</span>
              </div>
            </GlassPanel>

            {/* Big question card */}
            <GlassPanel glow={accentColor} style={{ padding: 'clamp(24px, 3vw, 44px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <Sparkles count={10} />
              <p style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.14em' }}>La question</p>
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(20px, 3vw, 38px)', color: '#fff', lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0 }}>
                {currentQuestion.text}
              </h1>
            </GlassPanel>

            {/* ANSWERING phase */}
            {gameState.phase === 'answering' && isSubject && (
              <>
                <GlassPanel glow={T.green} style={{ padding: 28, textAlign: 'center' }}>
                  <Label color={T.green} style={{ marginBottom: 10 }}>Ta réponse secrète 🤫</Label>
                  <p style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 36px)', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{currentQuestion.answer}</p>
                  <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>Personne d'autre ne la voit encore</p>
                </GlassPanel>
                <Btn onClick={advanceToGuessing} disabled={actioning}>{actioning ? '...' : 'Les autres peuvent deviner →'}</Btn>
              </>
            )}
            {gameState.phase === 'answering' && !isSubject && (
              <GlassPanel style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>⏳</div>
                <p style={{ fontSize: 16, color: T.muted, fontWeight: 600 }}>
                  <strong style={{ color: '#fff' }}>{currentSubject?.name}</strong> prépare sa réponse secrète...
                </p>
              </GlassPanel>
            )}

            {/* GUESSING phase — subject view */}
            {gameState.phase === 'guessing' && isSubject && (
              <>
                <GlassPanel style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Label>Les autres devinent...</Label>
                    <TimerRing />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nonSubjectPlayers.map(p => {
                      const done = guesses.some(g => g.player_id === p.id)
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14,
                          background: done ? T.greenDim : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${done ? T.green + '44' : T.border}`,
                          transition: 'all 0.2s',
                        }}>
                          <Avatar name={p.name} index={players.indexOf(p)} size={32} />
                          <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{p.name}</span>
                          <span style={{ fontSize: 13, color: done ? T.green : T.faint, fontWeight: 700 }}>{done ? '✓ a répondu' : '...'}</span>
                        </div>
                      )
                    })}
                  </div>
                </GlassPanel>
                {(allGuessed || timeLeft === 0) && <Btn variant="yellow" onClick={startValidating} disabled={actioning}>{actioning ? '...' : 'Révéler la réponse !'}</Btn>}
              </>
            )}

            {/* GUESSING phase — guesser: not submitted */}
            {gameState.phase === 'guessing' && !isSubject && !myGuessSubmitted && (
              <GlassPanel style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Label>{timeLeft > 0 ? 'Ta devinette' : 'Temps écoulé !'}</Label>
                  <TimerRing />
                </div>
                {timeLeft > 0 ? (
                  <>
                    <Inp placeholder="Ta réponse..." value={myGuess} onChange={e => setMyGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitGuess()} autoFocus maxLength={80} />
                    {guessError && <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0' }}>{guessError}</p>}
                    <div style={{ marginTop: 14 }}>
                      <Btn onClick={submitGuess} disabled={submittingGuess || !myGuess.trim()}>{submittingGuess ? '...' : 'Envoyer ma réponse →'}</Btn>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: T.muted, marginTop: 8 }}>Le sujet va révéler la réponse...</p>
                )}
              </GlassPanel>
            )}

            {/* GUESSING phase — guesser: submitted */}
            {gameState.phase === 'guessing' && !isSubject && myGuessSubmitted && (
              <GlassPanel glow={T.green} style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <TimerRing />
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, color: T.green, margin: 0 }}>Réponse envoyée !</p>
                <p style={{ fontSize: 14, color: T.muted, marginTop: 6 }}>En attente des autres joueurs...</p>
              </GlassPanel>
            )}

            {/* VALIDATING phase — subject */}
            {gameState.phase === 'validating' && isSubject && (
              <>
                <GlassPanel glow={T.green} style={{ padding: 24, textAlign: 'center' }}>
                  <Label color={T.green} style={{ marginBottom: 8 }}>Bonne réponse</Label>
                  <p style={{ fontWeight: 900, fontSize: 32, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{currentQuestion.answer}</p>
                </GlassPanel>
                <GlassPanel style={{ padding: 24 }}>
                  <Label style={{ marginBottom: 14 }}>Valide ou refuse chaque réponse</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {guesses.filter(g => g.player_id !== myId).map(g => {
                      const player = players.find(p => p.id === g.player_id)
                      const correct = validationOverrides[g.id] ?? false
                      return (
                        <div key={g.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14,
                          background: correct ? T.greenDim : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${correct ? T.green + '55' : T.border}`, transition: 'all 0.2s',
                        }}>
                          <Avatar name={player?.name ?? '?'} index={player ? players.indexOf(player) : 0} size={36} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{player?.name}</p>
                            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>→ {g.guess}</p>
                          </div>
                          <motion.button
                            onClick={() => setValidationOverrides(prev => ({ ...prev, [g.id]: !correct }))}
                            whileTap={{ scale: 0.88 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.12 }}
                            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: correct ? T.green : 'rgba(255,255,255,0.1)', color: correct ? '#001a08' : T.faint, fontSize: 18, fontWeight: 900, cursor: 'pointer', boxShadow: correct ? `0 4px 14px ${T.green}55` : 'none', fontFamily: 'inherit' }}
                          >{correct ? '✓' : '✗'}</motion.button>
                        </div>
                      )
                    })}
                  </div>
                </GlassPanel>
                <Btn variant="green" onClick={validateAndScore} disabled={actioning}>{actioning ? '...' : 'Valider les scores →'}</Btn>
              </>
            )}

            {/* VALIDATING phase — non-subject */}
            {gameState.phase === 'validating' && !isSubject && (
              <GlassPanel style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
                <p style={{ fontSize: 16, color: T.muted, fontWeight: 600 }}>
                  <strong style={{ color: '#fff' }}>{currentSubject?.name}</strong> valide les réponses...
                </p>
              </GlassPanel>
            )}

            {/* REVEAL phase */}
            {gameState.phase === 'reveal' && (
              <>
                <GlassPanel glow={T.green} style={{ padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <Sparkles count={16} />
                  <Label color={T.green} style={{ marginBottom: 8 }}>Bonne réponse</Label>
                  <p style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{currentQuestion.answer}</p>
                </GlassPanel>

                <GlassPanel style={{ padding: 24 }}>
                  <Label style={{ marginBottom: 14 }}>Résultats du tour</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nonSubjectPlayers.map(p => {
                      const guess = guesses.find(g => g.player_id === p.id)
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14,
                          background: guess?.is_correct ? T.greenDim : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${guess?.is_correct ? T.green + '55' : T.border}`,
                        }}>
                          <Avatar name={p.name} index={players.indexOf(p)} size={36} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{p.name}</p>
                            <p style={{ fontSize: 13, color: guess?.is_correct ? T.green : T.muted, margin: '2px 0 0' }}>{guess?.guess ?? '—'}</p>
                          </div>
                          {guess?.is_correct
                            ? <span style={{ background: T.green, color: '#001a08', borderRadius: 100, padding: '4px 12px', fontWeight: 800, fontSize: 12 }}>+1 PT</span>
                            : <span style={{ color: T.faint, fontSize: 20 }}>✗</span>
                          }
                          {drinkingMode && (
                            <span style={{
                              background: guess?.is_correct ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.12)',
                              border: `1px solid ${guess?.is_correct ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.25)'}`,
                              color: guess?.is_correct ? '#f59e0b' : '#f87171',
                              borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                            }}>
                              {guess?.is_correct ? '🍻 +2 gorgées' : '🥃 bois 1'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </GlassPanel>

                {/* Mobile scores */}
                <GlassPanel className="mobile-only" style={{ padding: 20 }}>
                  <Label style={{ marginBottom: 12 }}>Scores</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sortedPlayers.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={p.name} index={players.indexOf(p)} size={28} />
                        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{p.name}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: i === 0 ? T.yellow : accentColor }}>{p.score} pt{p.score !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </GlassPanel>

                {isSubject ? (
                  <Btn onClick={nextQuestion} disabled={actioning}>{actioning ? '...' : 'Suivant →'}</Btn>
                ) : (
                  <p style={{ textAlign: 'center', color: T.muted, fontSize: 14 }}>En attente du sujet...</p>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Activity + scores sidebar (desktop only) */}
          <GlassPanel className="desktop-only" style={{ padding: 20 }}>
            <Label style={{ marginBottom: 14 }}>Activité</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guesses.slice(-4).reverse().map((g, i) => {
                const p = players.find(pl => pl.id === g.player_id)
                return (
                  <div key={g.id + i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accentColor}22`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>✏️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#fff', margin: 0 }}><strong>{p?.name ?? '?'}</strong> a répondu</p>
                      <p style={{ fontSize: 11, color: T.faint, margin: '2px 0 0' }}>à l'instant</p>
                    </div>
                  </div>
                )
              })}
              {guesses.length === 0 && (
                <p style={{ fontSize: 13, color: T.faint, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Rien encore...</p>
              )}

            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  )
}
