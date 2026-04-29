'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Room } from '@/lib/types'
import { Avatar, Btn, Confetti, FloatingShapes, GlassPanel, Label, Sparkles, T } from '@/components/ui'
import { motion } from 'framer-motion'

const AMBER = '#f59e0b'

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrinking, setIsDrinking] = useState(false)
  const celebrationSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      celebrationSound.current = new Audio('/sounds/celebration.mp3')
    }
  }, [])

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    let pollInterval: NodeJS.Timeout
    let currentRoomId: string | null = null

    const fetchPlayers = async () => {
      if (!currentRoomId) return
      const { data: p } = await supabase.from('players').select().eq('room_id', currentRoomId).order('score', { ascending: false })
      const list = p ?? []
      setPlayers(list)

      // Polling de secours pour le retour au Lobby
      const { data: r } = await supabase.from('rooms').select('status').eq('id', currentRoomId).single()
      if (r && r.status === 'waiting') {
        router.push(`/room/${code}`)
        return
      }
      
      // Vérification d'expulsion par absence
      if (id && list.length > 0) {
        if (!list.some(pl => pl.id === id)) {
          sessionStorage.clear()
          sessionStorage.setItem('kicked_message', 'Vous avez été retiré du salon.')
          window.location.href = '/'
          return
        }
      }
    }

    async function init() {
      const { data: room, error: roomErr } = await supabase.from('rooms').select().eq('code', code).single()
      if (roomErr || !room) { router.push('/'); return }
      
      const drinking = room.mode === 'drinking'
      setIsDrinking(drinking)
      sessionStorage.setItem(`mode_${code}`, drinking ? 'drinking' : 'classic')
      currentRoomId = room.id
      
      await fetchPlayers()
      setLoading(false)

      // Celebration sound
      if (celebrationSound.current) {
        celebrationSound.current.currentTime = 0
        celebrationSound.current.play().catch(() => {})
      }

      // Fallback polling (2s pour plus de réactivité)
      pollInterval = setInterval(fetchPlayers, 2000)

      const channelName = `results_${code}`
      const existingChannels = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}`)
      for (const ch of existingChannels) {
        await supabase.removeChannel(ch)
      }

      const channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async (payload) => {
          // Détection d'expulsion
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as any).id === id) {
            sessionStorage.clear()
            sessionStorage.setItem('kicked_message', 'Vous avez été retiré du salon.')
            window.location.href = '/'
            return
          }
          await fetchPlayers()
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
          const r = payload.new as Room
          if (r.id === currentRoomId && (r.status as string) === 'waiting') {
            router.push(`/room/${code}`)
          }
        })
        .on('broadcast', { event: 'sync' }, () => {
          console.log("Results: Sync broadcast received")
          fetchPlayers()
        })
        .subscribe()
    }

    const handleFocus = () => fetchPlayers()
    window.addEventListener('focus', handleFocus)
    
    init()
    
    return () => {
      if (pollInterval) clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [code, router])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const medals = ['🥇', '🥈', '🥉']
  const podiumH = [200, 150, 110]
  const podiumColor = [T.yellow, '#cbd5e1', '#cd7f32']
  const top3 = players.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const visToReal = [1, 0, 2]

  const accentColor = isDrinking ? AMBER : T.purple

  // Loser(s) for drinking mode
  const minScore = players.length > 0 ? Math.min(...players.map(p => p.score)) : 0
  const losers = players.filter(p => p.score === minScore)
  // Only show cul sec if loser is not also the winner (edge case: 1 player)
  const showCulSec = isDrinking && players.length > 1 && losers[0]?.id !== top3[0]?.id
  const culSecName = losers.length === 1
    ? losers[0].name
    : losers.map(p => p.name).join(' & ')

  return (
    <div className="results-page">
      {isDrinking && (
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
      <Confetti count={48} />
      <FloatingShapes density="dense" />

      <div className="results-inner fade-up" style={{ position: 'relative', zIndex: 3 }}>

        {/* Hero header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 10 }}>🏆</div>
          <Label color={isDrinking ? AMBER : T.yellow} style={{ marginBottom: 8 }}>{isDrinking ? '🍺 Soirée terminée !' : 'Partie terminée'}</Label>
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(28px, 5vw, 64px)', letterSpacing: '-0.04em', margin: 0,
            background: isDrinking
              ? `linear-gradient(135deg, ${AMBER} 0%, #f97316 50%, #ef4444 100%)`
              : `linear-gradient(135deg, ${T.yellow} 0%, ${T.pink} 50%, ${T.purple} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {top3[0]?.name} gagne !
          </h1>
          <p style={{ color: T.muted, fontSize: 16, marginTop: 8 }}>
            {isDrinking ? '🎯 Distribue un gage aux perdants !' : 'connaît mieux les autres que personne d\'autre 👀'}
          </p>
        </div>

        {/* Podium */}
        <GlassPanel style={{ padding: 'clamp(24px, 4vw, 48px)', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <Sparkles count={20} />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(16px, 3vw, 40px)' }}>
            {podiumOrder.map((p, visIdx) => {
              if (!p) return null
              const realIdx = visToReal[visIdx]
              const pIdx = players.indexOf(p)
              const isFirst = realIdx === 0
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: isFirst ? 36 : 24 }}>{medals[realIdx]}</span>
                  <Avatar name={p.name} index={pIdx} size={isFirst ? 72 : 52} ring={podiumColor[realIdx]} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 800, fontSize: isFirst ? 18 : 14, color: '#fff', margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>{p.score} pts</p>
                  </div>
                  <div style={{
                    width: isFirst ? 'clamp(80px, 14vw, 160px)' : 'clamp(64px, 10vw, 120px)',
                    height: podiumH[realIdx],
                    background: `linear-gradient(180deg, ${podiumColor[realIdx]}33 0%, ${podiumColor[realIdx]}11 100%)`,
                    border: `2px solid ${podiumColor[realIdx]}55`,
                    borderRadius: '16px 16px 0 0',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 16,
                    boxShadow: `0 0 32px ${podiumColor[realIdx]}22`,
                  }}>
                    <span style={{ fontWeight: 900, fontSize: isFirst ? 'clamp(32px, 5vw, 48px)' : 'clamp(24px, 3vw, 36px)', color: podiumColor[realIdx] }}>
                      {realIdx + 1}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassPanel>

        {/* Cul sec banner — drinking mode only */}
        {showCulSec && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              textAlign: 'center', marginBottom: 28,
              padding: '18px 24px', borderRadius: 20,
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <p style={{ fontWeight: 900, fontSize: 'clamp(18px, 3vw, 26px)', color: '#f87171', margin: 0, letterSpacing: '-0.01em' }}>
              💀 {culSecName}, CUL SEC !&nbsp;&nbsp;🍺
            </p>
          </motion.div>
        )}

        {/* Leaderboard + replay */}
        <div className="results-leaderboard">

          {/* Full leaderboard */}
          <GlassPanel style={{ padding: 'clamp(20px, 3vw, 32px)' }}>
            <Label style={{ marginBottom: 18 }}>Classement complet</Label>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                  borderBottom: i < players.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{ fontWeight: 800, fontSize: 20, width: 32, color: i === 0 ? T.yellow : T.muted }}>
                    {i < 3 ? medals[i] : `${i + 1}.`}
                  </span>
                  <Avatar name={p.name} index={i} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
                      {p.score} bonne{p.score !== 1 ? 's' : ''} réponse{p.score !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: i === 0 ? T.yellow : accentColor }}>
                    {p.score}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Replay */}
          <GlassPanel glow={accentColor} style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
            <Label color={accentColor} style={{ marginBottom: 12 }}>{isDrinking ? '🍻 Encore une soirée ?' : 'Encore une partie ?'}</Label>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
              {isDrinking ? 'Garde la même équipe, sortez les verres !' : 'Garde la même équipe ou recommence avec de nouveaux potes.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn variant={isDrinking ? 'yellow' : 'pink'} onClick={() => router.push(isDrinking ? '/party/drinking-quiz' : '/quiz')}>{isDrinking ? '🍺 Rejouer' : '🎉 Rejouer'}</Btn>
              <Btn variant="ghost" onClick={() => router.push('/')} style={{ fontSize: 14, padding: '12px 16px' }}>Changer de jeu</Btn>
            </div>
          </GlassPanel>

        </div>

      </div>
    </div>
  )
}
