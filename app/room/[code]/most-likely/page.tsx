'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { GameState, Guess, Player, Room } from '@/lib/types'
import { Avatar, Btn, Confetti, FloatingShapes, GlassPanel, Label, Sparkles, T } from '@/components/ui'
import { ML_QUESTIONS, type MLQuestion } from '@/constants/most-likely-questions'
import { motion, AnimatePresence } from 'framer-motion'

const ORANGE = '#f97316'
const PINK = '#ec4899'
const GOLD = '#f59e0b'
const RED = '#ef4444'
const GREEN = '#22c55e'

interface RoundRecord {
  guesses: { playerId: string; targetId: string }[]
  winnerIds: string[]
}

interface GameStats {
  redFlag: Player | null
  judge: Player | null
  innocent: Player | null
}

function computeGameStats(history: RoundRecord[], players: Player[]): GameStats {
  const votesReceived: Record<string, number> = {}
  const roundsWon: Record<string, number> = {}
  for (const p of players) { votesReceived[p.id] = 0; roundsWon[p.id] = 0 }
  for (const round of history) {
    for (const { targetId } of round.guesses) {
      votesReceived[targetId] = (votesReceived[targetId] ?? 0) + 1
    }
    for (const id of round.winnerIds) {
      roundsWon[id] = (roundsWon[id] ?? 0) + 1
    }
  }
  const maxVotes = players.length > 0 ? Math.max(...players.map(p => votesReceived[p.id] ?? 0)) : 0
  const redFlag = maxVotes > 0 ? (players.find(p => (votesReceived[p.id] ?? 0) === maxVotes) ?? null) : null
  const maxWins = players.length > 0 ? Math.max(...players.map(p => roundsWon[p.id] ?? 0)) : 0
  const judge = maxWins > 0 ? (players.find(p => (roundsWon[p.id] ?? 0) === maxWins) ?? null) : null
  const minVotes = players.length > 0 ? Math.min(...players.map(p => votesReceived[p.id] ?? 0)) : 0
  const innocent = players.find(p => (votesReceived[p.id] ?? 0) === minVotes) ?? null
  return { redFlag, judge, innocent }
}

export default function MostLikelyPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats | null>(null)

  const [currentQuestion, setCurrentQuestion] = useState<MLQuestion | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const celebrationSound = useRef<HTMLAudioElement | null>(null)
  const voteSound = useRef<HTMLAudioElement | null>(null)
  const lastStatusRef = useRef<string | null>(null)
  const historyRef = useRef<RoundRecord[]>([])
  const lastAccumulatedIdxRef = useRef<number>(-1)
  const playersRef = useRef<Player[]>([])

  useEffect(() => { playersRef.current = players }, [players])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      celebrationSound.current = new Audio('/sounds/celebration.mp3')
      voteSound.current = new Audio('/sounds/flip.mp3')
    }
  }, [])

  // Accumulate round into history when entering reveal phase (covers non-host players)
  useEffect(() => {
    if (gameState?.phase !== 'reveal') return
    const idx = gameState.current_question_idx ?? 0
    if (lastAccumulatedIdxRef.current >= idx) return
    if (guesses.length === 0) return
    lastAccumulatedIdxRef.current = idx
    const vc: Record<string, number> = {}
    for (const g of guesses) { vc[g.guess] = (vc[g.guess] ?? 0) + 1 }
    const maxV = Math.max(...Object.values(vc), 0)
    const wIds = maxV > 0 ? Object.entries(vc).filter(([, c]) => c === maxV).map(([id]) => id) : []
    historyRef.current.push({
      guesses: guesses.map(g => ({ playerId: g.player_id, targetId: g.guess })),
      winnerIds: wIds,
    })
  }, [gameState?.phase, gameState?.current_question_idx, guesses])

  useEffect(() => {
    if (room?.status === 'ml_finished') {
      if (gameStats === null && historyRef.current.length > 0) {
        setGameStats(computeGameStats(historyRef.current, playersRef.current))
      }
      if (lastStatusRef.current !== 'ml_finished' && celebrationSound.current) {
        lastStatusRef.current = 'ml_finished'
        celebrationSound.current.currentTime = 0
        celebrationSound.current.play().catch(() => {})
      }
    } else {
      lastStatusRef.current = room?.status ?? null
    }
  }, [room?.status, gameStats])

  const loadQuestion = useCallback(async (gsId: string) => {
    const { data: q } = await supabase.from('questions').select('answer').eq('id', gsId).maybeSingle()
    if (q?.answer) {
      setCurrentQuestion(ML_QUESTIONS.find(mq => mq.id === q.answer) ?? null)
    }
  }, [])

  const loadGuesses = useCallback(async (gsId: string) => {
    const { data } = await supabase.from('guesses').select().eq('question_id', gsId)
    setGuesses(data ?? [])
  }, [])

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    const tok = sessionStorage.getItem(`token_${code}`)
    setMyId(id)
    setMyToken(tok)
    let pollInterval: NodeJS.Timeout
    let currentRoomId: string | null = null

    const fetchData = async () => {
      if (!currentRoomId) return
      const { data: p } = await supabase.from('players').select().eq('room_id', currentRoomId).order('created_at')
      const list = p ?? []
      setPlayers(list)

      const { data: r } = await supabase.from('rooms').select('status').eq('id', currentRoomId).single()
      if (r) {
        setRoom(prev => prev ? { ...prev, status: r.status } : null)
        if ((r.status as string) === 'waiting') {
          router.push(`/room/${code}`)
          return
        }
      }

      if (id && list.length > 0 && !list.some(pl => pl.id === id)) {
        sessionStorage.clear()
        sessionStorage.setItem('kicked_message', 'Vous avez été retiré du salon.')
        window.location.href = '/'
        return
      }

      const { data: gs } = await supabase.from('game_state').select().eq('room_id', currentRoomId).single()
      if (gs) {
        setGameState(gs)
        await loadQuestion(gs.id)
        await loadGuesses(gs.id)
      }
    }

    async function init() {
      const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
      if (!roomData) { router.push('/'); return }
      if (roomData.status !== 'playing_most_likely' && roomData.status !== 'ml_finished') {
        router.push(`/room/${code}`)
        return
      }

      setRoom(roomData)
      currentRoomId = roomData.id

      await fetchData()
      setLoading(false)

      pollInterval = setInterval(fetchData, 2000)

      const channelName = `ml_${code}`
      const existing = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}`)
      for (const ch of existing) await supabase.removeChannel(ch)

      channelRef.current = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async (payload) => {
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
          setGameState(gs)
          await loadQuestion(gs.id)
          if (gs.phase === 'answering') {
            setGuesses([])
          } else {
            await loadGuesses(gs.id)
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guesses' }, async (payload) => {
          const g = payload.new as Guess
          setGuesses(prev => {
            if (prev.some(x => x.id === g.id)) return prev
            if (voteSound.current) { voteSound.current.currentTime = 0; voteSound.current.play().catch(() => {}) }
            return [...prev, g]
          })
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'guesses' }, async () => {
          setGuesses([])
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
          const r = payload.new as Room
          if (r.id !== roomData.id) return
          setRoom(r)
          if (r.status === 'waiting') router.push(`/room/${code}`)
        })
        .on('broadcast', { event: 'sync' }, () => { fetchData() })
        .subscribe()
    }
    init()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [code, router, loadQuestion, loadGuesses])

  async function vote(targetPlayerId: string) {
    if (!gameState || !myId || !myToken || actioning) return
    if (myVote) return
    setActioning(true)
    try {
      await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_ml_vote',
          playerId: myId,
          token: myToken,
          gameStateId: gameState.id,
          targetPlayerId,
        }),
      })
      channelRef.current?.httpSend('sync', {})
    } catch (e) {
      console.error(e)
    } finally {
      setActioning(false)
    }
  }

  async function nextRound() {
    if (!gameState || !myId || !myToken || actioning) return

    // Eagerly accumulate before API deletes guesses from DB
    const idx = gameState.current_question_idx ?? 0
    if (lastAccumulatedIdxRef.current < idx) {
      lastAccumulatedIdxRef.current = idx
      const vc: Record<string, number> = {}
      for (const g of guesses) { vc[g.guess] = (vc[g.guess] ?? 0) + 1 }
      const maxV = guesses.length > 0 ? Math.max(...Object.values(vc)) : 0
      const wIds = maxV > 0 ? Object.entries(vc).filter(([, c]) => c === maxV).map(([id]) => id) : []
      historyRef.current.push({
        guesses: guesses.map(g => ({ playerId: g.player_id, targetId: g.guess })),
        winnerIds: wIds,
      })
    }

    const totalRounds = gameState.total_rounds ?? 20
    if (idx === totalRounds - 1) {
      setGameStats(computeGameStats(historyRef.current, playersRef.current))
    }

    setActioning(true)
    try {
      await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ml_next_round', playerId: myId, token: myToken, gameStateId: gameState.id }),
      })
      channelRef.current?.httpSend('sync', {})
    } catch (e) {
      console.error(e)
    } finally {
      setActioning(false)
    }
  }

  async function resetRoom() {
    if (!myId || !myToken || !room || actioning) return
    setActioning(true)
    setIsResetting(true)
    try {
      await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_ml_room', playerId: myId, token: myToken }),
      })
      router.push(`/room/${code}`)
    } catch (e) {
      console.error(e)
      setIsResetting(false)
      setActioning(false)
    }
  }

  if (isResetting || room?.status === 'waiting') return null

  if (loading || !gameState) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false
  const myVote = guesses.find(g => g.player_id === myId)?.guess ?? null
  const totalVotes = guesses.length

  const voteCounts: Record<string, number> = {}
  for (const g of guesses) {
    voteCounts[g.guess] = (voteCounts[g.guess] ?? 0) + 1
  }

  const maxVotesRound = guesses.length > 0 ? Math.max(...Object.values(voteCounts), 0) : 0
  const winnerIds = maxVotesRound > 0 ? Object.entries(voteCounts).filter(([, c]) => c === maxVotesRound).map(([id]) => id) : []

  const category = room?.mode?.split(':')[1] ?? 'mixte'
  const totalRounds = gameState.total_rounds ?? 20
  const currentIdx = gameState.current_question_idx ?? 0
  const isLastRound = currentIdx === totalRounds - 1

  return (
    <div className="game-page" style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 800px 600px at 20% 30%, rgba(249, 115, 22, 0.22), transparent 55%),
            radial-gradient(ellipse 700px 500px at 80% 70%, rgba(236, 72, 153, 0.18), transparent 55%),
            radial-gradient(ellipse 500px 400px at 50% 90%, rgba(249, 115, 22, 0.1), transparent 60%)
          `,
        }}
      />
      <FloatingShapes density="sparse" />

      <div className="game-inner" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top bar */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Label color={ORANGE}>☝️ Qui Pourrait...</Label>
            <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
              · {category.toUpperCase()}
            </span>
          </div>
          {room?.status !== 'ml_finished' && (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20 }}>
              {currentIdx + 1} / {totalRounds}
            </span>
          )}
        </div>

        {room?.status === 'ml_finished' ? (
          /* Stats screen */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, textAlign: 'center', overflowY: 'auto' }}>
            <Confetti count={48} />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <span style={{ fontSize: 64 }}>☝️</span>
            </motion.div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: '#fff', margin: 0 }}>Fin de la partie !</h1>
            <p style={{ color: T.muted, fontSize: 15, maxWidth: 380, margin: '0 auto' }}>On sait maintenant qui est qui dans ce groupe 🔥</p>

            {gameStats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 420 }}>

                {gameStats.redFlag && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <GlassPanel style={{ padding: '18px 20px', border: `1px solid ${RED}44` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 36 }}>🚩</span>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: RED, margin: '0 0 4px' }}>Red Flag</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{gameStats.redFlag.name}</p>
                          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Plus de votes reçus</p>
                        </div>
                        <Avatar name={gameStats.redFlag.name} index={players.indexOf(gameStats.redFlag)} size={44} ring={RED} />
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}

                {gameStats.judge && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlassPanel style={{ padding: '18px 20px', border: `1px solid ${GOLD}44` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 36 }}>⚖️</span>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>Juge Suprême</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{gameStats.judge.name}</p>
                          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Le plus souvent désigné coupable</p>
                        </div>
                        <Avatar name={gameStats.judge.name} index={players.indexOf(gameStats.judge)} size={44} ring={GOLD} />
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}

                {gameStats.innocent && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <GlassPanel style={{ padding: '18px 20px', border: `1px solid ${GREEN}44` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 36 }}>😇</span>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN, margin: '0 0 4px' }}>Innocent</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{gameStats.innocent.name}</p>
                          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Moins de votes reçus</p>
                        </div>
                        <Avatar name={gameStats.innocent.name} index={players.indexOf(gameStats.innocent)} size={44} ring={GREEN} />
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}

              </div>
            )}

            <div style={{ marginTop: 8 }}>
              {isHost ? (
                <Btn onClick={resetRoom} disabled={actioning} style={{ padding: '16px 32px', fontSize: 17, background: `linear-gradient(135deg, ${ORANGE} 0%, ${PINK} 100%)` }}>
                  {actioning ? '...' : 'Retourner au Lobby'}
                </Btn>
              ) : (
                <p style={{ color: T.muted, fontSize: 14, marginTop: 8 }}>En attente du créateur pour relancer une partie...</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%' }}>

            {/* Question card */}
            <GlassPanel glow={ORANGE} style={{ padding: '36px 28px', textAlign: 'center', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <Sparkles count={12} />
              <Label color={ORANGE} style={{ marginBottom: 16 }}>
                {currentQuestion?.level === 'hard' ? '🔥 HARD' : currentQuestion?.level === 'soft' ? '😇 SOFT' : '☝️ QUI POURRAIT...'}
              </Label>
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3.5vw, 38px)', color: '#fff', lineHeight: 1.3, letterSpacing: '-0.02em', margin: 0 }}>
                {currentQuestion?.text ?? 'Chargement...'}
              </h1>

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {players.map(p => (
                    <div key={p.id} style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: guesses.some(g => g.player_id === p.id) ? ORANGE : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
                  {totalVotes}/{players.length} {totalVotes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
            </GlassPanel>

            <AnimatePresence mode="wait">
              {gameState.phase === 'answering' ? (
                <motion.div
                  key="voting"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  style={{ width: '100%' }}
                >
                  {myVote ? (
                    <p style={{ textAlign: 'center', color: T.muted, fontSize: 14, marginBottom: 16 }}>
                      Vote enregistré ! En attente des autres...
                    </p>
                  ) : (
                    <p style={{ textAlign: 'center', color: T.muted, fontSize: 14, marginBottom: 16 }}>
                      Tape sur la personne qui correspond le plus 👇
                    </p>
                  )}
                  <div className="ml-player-grid">
                    {players.map((p, i) => {
                      const hasVoted = !!myVote
                      const isMyTarget = myVote === p.id
                      return (
                        <motion.button
                          key={p.id}
                          onClick={() => vote(p.id)}
                          disabled={hasVoted || actioning}
                          whileHover={!hasVoted && !actioning ? { scale: 1.04 } : undefined}
                          whileTap={!hasVoted && !actioning ? { scale: 0.96 } : undefined}
                          style={{
                            width: 140,
                            padding: '18px 12px',
                            borderRadius: 20,
                            border: `2px solid ${isMyTarget ? ORANGE : hasVoted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                            background: isMyTarget
                              ? `linear-gradient(135deg, rgba(249,115,22,0.25), rgba(236,72,153,0.2))`
                              : hasVoted ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                            cursor: hasVoted || actioning ? 'default' : 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                            opacity: hasVoted && !isMyTarget ? 0.45 : 1,
                            transition: 'all 0.2s',
                            boxShadow: isMyTarget ? `0 0 24px rgba(249,115,22,0.3)` : 'none',
                          }}
                        >
                          <Avatar name={p.name} index={i} size={48} ring={isMyTarget ? ORANGE : undefined} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: isMyTarget ? ORANGE : '#fff' }}>
                            {p.name}
                            {p.id === myId && <span style={{ color: T.muted, fontSize: 11 }}> (toi)</span>}
                          </span>
                          {isMyTarget && <span style={{ fontSize: 18 }}>🫵</span>}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ width: '100%' }}
                >
                  <div className="ml-player-grid" style={{ marginBottom: 24 }}>
                    {players
                      .slice()
                      .sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))
                      .map((p, i) => {
                        const count = voteCounts[p.id] ?? 0
                        const isWinner = winnerIds.includes(p.id)
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                              padding: '18px 12px',
                              borderRadius: 20,
                              border: `2px solid ${isWinner ? ORANGE : 'rgba(255,255,255,0.08)'}`,
                              background: isWinner
                                ? `linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.15))`
                                : 'rgba(255,255,255,0.04)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              boxShadow: isWinner ? `0 0 32px rgba(249,115,22,0.35)` : 'none',
                              position: 'relative',
                            }}
                          >
                            {isWinner && (
                              <span style={{ position: 'absolute', top: -12, fontSize: 22 }}>🏆</span>
                            )}
                            <Avatar name={p.name} index={players.indexOf(p)} size={52} ring={isWinner ? ORANGE : undefined} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? ORANGE : '#fff' }}>{p.name}</span>
                            <div style={{
                              padding: '4px 14px', borderRadius: 100,
                              background: isWinner ? `rgba(249,115,22,0.25)` : 'rgba(255,255,255,0.07)',
                              border: `1px solid ${isWinner ? ORANGE + '55' : 'transparent'}`,
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: isWinner ? ORANGE : T.muted }}>
                                {count} {count === 1 ? 'vote' : 'votes'}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>

                  {winnerIds.length > 0 && (
                    <GlassPanel glow={ORANGE} style={{ padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                        {winnerIds.length === 1
                          ? `🫵 ${players.find(p => p.id === winnerIds[0])?.name} doit boire !`
                          : `🫵 Égalité — ${winnerIds.map(id => players.find(p => p.id === id)?.name).join(' & ')} doivent boire !`
                        }
                      </span>
                    </GlassPanel>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    {isHost ? (
                      <Btn
                        onClick={nextRound}
                        disabled={actioning}
                        style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${PINK} 100%)` }}
                      >
                        {actioning ? '...' : isLastRound ? 'Voir les résultats 🏆' : 'Question Suivante →'}
                      </Btn>
                    ) : (
                      <p style={{ color: T.muted, fontSize: 14 }}>
                        {isLastRound ? 'En attente des résultats finaux...' : 'Le host va passer à la question suivante...'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </div>
  )
}
