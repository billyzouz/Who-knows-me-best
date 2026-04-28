'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Room } from '@/lib/types'
import { Avatar, Badge, Btn, FloatingShapes, GlassPanel, Label, PulsingDot, Sparkles, T } from '@/components/ui'
import { motion } from 'framer-motion'

const AMBER = '#f59e0b'

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isDrinking, setIsDrinking] = useState(false)
  const [isTod, setIsTod] = useState(false)
  const [todDifficulty, setTodDifficulty] = useState('mixte')
  const wasKickedRef = useRef(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    const tok = sessionStorage.getItem(`token_${code}`)
    setMyId(id)
    setMyToken(tok)
    let channel: ReturnType<typeof supabase.channel> | null = null
    let iAmHost = false
    let gameStarted = false

    async function init() {
      const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
      if (!roomData) { router.push('/'); return }
      if (roomData.status === 'questions') { gameStarted = true; router.push(`/room/${code}/questions`); return }
      if (roomData.status === 'playing') { gameStarted = true; router.push(`/room/${code}/play`); return }
      if (roomData.status === 'playing_tod' || roomData.status === 'tod_finished') { gameStarted = true; router.push(`/room/${code}/truth-or-dare`); return }
      if (roomData.status === 'finished') { gameStarted = true; router.push(`/room/${code}/results`); return }
      const drinking = roomData.mode === 'drinking'
      const tod = roomData.mode?.startsWith('tod')
      setIsDrinking(drinking)
      setIsTod(tod)
      sessionStorage.setItem(`mode_${code}`, drinking ? 'drinking' : (tod ? roomData.mode : 'classic'))
      setRoom(roomData)
      const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
      setPlayers(p ?? [])
      iAmHost = (p ?? []).find(pl => pl.id === id)?.is_host ?? false
      setLoading(false)

      supabase.getChannels().filter(c => c.topic === `realtime:lobby_${code}`).forEach(c => supabase.removeChannel(c))
      channel = supabase.channel(`lobby_${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async (payload) => {
          if ((payload as any).eventType === 'DELETE') {
            const deletedId = (payload.old as any).id
            if (deletedId === id) {
              wasKickedRef.current = true
              sessionStorage.clear()
              sessionStorage.setItem('kicked_message', 'Vous avez été retiré du salon.')
              router.push('/')
              return
            }
            const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
            setPlayers(p ?? [])
            return
          }
          const changed = payload.new as any
          if (changed?.room_id !== roomData.id) return
          const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
          setPlayers(p ?? [])
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
          const updated = payload.new as Room
          if (updated.id !== roomData.id) return
          if (updated.status === 'questions') { gameStarted = true; router.push(`/room/${code}/questions`) }
          if (updated.status === 'playing') { gameStarted = true; router.push(`/room/${code}/play`) }
          if (updated.status === 'playing_tod' || updated.status === 'tod_finished') { gameStarted = true; router.push(`/room/${code}/truth-or-dare`) }
          if (updated.status === 'finished') { gameStarted = true; router.push(`/room/${code}/results`) }
        })
        .subscribe()
    }
    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
      if (!wasKickedRef.current && !gameStarted && !iAmHost && id && tok) {
        const body = JSON.stringify({ action: 'leave_room', playerId: id, token: tok })
        navigator.sendBeacon('/api/game-action', new Blob([body], { type: 'application/json' }))
      }
    }
  }, [code, router])

  async function kickPlayer(targetId: string) {
    if (!myId || !myToken) return
    await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kick_player', playerId: myId, token: myToken, targetId }),
    })
  }

  async function startPhase() {
    if (!room || !myId || !myToken) return
    if (isTod) {
      await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_tod', playerId: myId, token: myToken, difficulty: todDifficulty }),
      })
    } else {
      await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_question_phase', playerId: myId, token: myToken }),
      })
    }
  }

  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const EMPTY_SLOTS = Math.max(0, 6 - players.length)

  const accentColor = isDrinking ? AMBER : T.purple

  return (
    <div className="lobby-page">
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
      <FloatingShapes density="dense" />

      <div className="lobby-layout fade-up">

        {/* LEFT / TOP: Code reveal */}
        <GlassPanel glow={accentColor} style={{ padding: 'clamp(28px, 4vw, 56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Sparkles count={18} />
          <Label color={accentColor} style={{ marginBottom: 14 }}>{isTod ? '🎲 Action ou Vérité' : (isDrinking ? '🍺 Salon Quiz à Boire' : 'Salon en attente')}</Label>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>Partage ce code à tes potes</p>

          <div className="lobby-code-size" style={{
            fontFamily: 'monospace', fontWeight: 900, fontSize: 58,
            letterSpacing: '0.15em', lineHeight: 1,
            background: `linear-gradient(135deg, #fff 0%, ${accentColor} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 24,
          }}>
            {code}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              onClick={copyCode}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              style={{
                padding: '10px 20px', borderRadius: 100,
                background: copied ? `${accentColor}22` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? accentColor : 'rgba(255,255,255,0.12)'}`,
                color: copied ? accentColor : T.muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {copied ? '✓ Copié !' : '📋 Copier le code'}
            </motion.button>
          </div>

          <div style={{
            marginTop: 36, padding: '16px 20px',
            background: `${accentColor}11`, borderRadius: 14,
            border: `1px dashed ${accentColor}44`,
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <PulsingDot color={T.green} />
            <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>En attente que le host lance</span>
          </div>
        </GlassPanel>

        {/* RIGHT / BOTTOM: Players list */}
        <GlassPanel style={{ padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <Label>Joueurs connectés</Label>
              <p style={{ fontWeight: 800, fontSize: 28, color: '#fff', margin: '4px 0 0' }}>{players.length}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(34,197,94,0.1)', borderRadius: 100, border: '1px solid rgba(34,197,94,0.25)' }}>
              <PulsingDot color={T.green} />
              <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>EN DIRECT</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {players.map((p, i) => (
              <div key={p.id} className="fade-up" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animationDelay: `${i * 0.08}s`,
              }}>
                <Avatar name={p.name} index={i} size={40} ring={p.is_host ? T.yellow : undefined} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                    {p.is_host ? 'Host de la partie' : 'Joueur'}
                    {p.id === myId && !p.is_host && ' · toi'}
                  </p>
                </div>
                {p.is_host && <span style={{ fontSize: 18 }}>👑</span>}
                {p.id === myId && !p.is_host && <Badge color={accentColor}>toi</Badge>}
                {isHost && p.id !== myId && (
                  <motion.button
                    onClick={() => kickPlayer(p.id)}
                    whileTap={{ scale: 0.88 }}
                    title="Exclure ce joueur"
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#f87171', borderRadius: 8, width: 28, height: 28,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontFamily: 'inherit', flexShrink: 0, lineHeight: 1,
                    }}
                  >
                    ✕
                  </motion.button>
                )}
              </div>
            ))}
            {/* Empty slot indicators (desktop only) */}
            {Array.from({ length: EMPTY_SLOTS }).map((_, i) => (
              <div key={`empty-${i}`} className="desktop-only" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                border: '1px dashed rgba(255,255,255,0.07)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                <span style={{ fontSize: 13, color: T.faint, fontStyle: 'italic' }}>En attente...</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            {isHost ? (
              <>
                <Btn variant={isTod ? undefined : (isDrinking ? 'yellow' : 'primary')} onClick={startPhase} disabled={players.length < 2} style={isTod ? { background: `linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)` } : undefined}>
                  {players.length < 2 ? 'En attente de joueurs...' : (isTod ? '🎲 Lancer Action ou Vérité !' : (isDrinking ? '🍺 Commencer la soirée !' : '🚀 Commencer la partie !'))}
                </Btn>
                {isTod && (
                  <div style={{ marginTop: 24 }}>
                    <Label style={{ marginBottom: 8, display: 'block', textAlign: 'center' }}>Difficulté</Label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {['soft', 'medium', 'hard', 'mixte'].map(d => (
                        <button
                          key={d}
                          onClick={() => setTodDifficulty(d)}
                          style={{
                            padding: '6px 14px', borderRadius: 100, border: `1px solid ${todDifficulty === d ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                            background: todDifficulty === d ? 'rgba(6,182,212,0.15)' : 'transparent',
                            color: todDifficulty === d ? '#06b6d4' : T.muted,
                            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s'
                          }}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ textAlign: 'center', color: T.muted, fontSize: 14 }}>
                En attente que le host lance la partie...
              </p>
            )}
            <p style={{ textAlign: 'center', color: T.faint, fontSize: 12, marginTop: 10 }}>
              Partage le code à tes potes pour qu'ils rejoignent
            </p>
          </div>
        </GlassPanel>

      </div>
    </div>
  )
}
