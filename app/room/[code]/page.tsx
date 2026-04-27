'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Room } from '@/lib/types'
import { Avatar, Badge, Btn, FloatingShapes, GlassPanel, Label, PulsingDot, Sparkles, T } from '@/components/ui'

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    setMyId(id)
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
      if (!roomData) { router.push('/'); return }
      if (roomData.status === 'questions') { router.push(`/room/${code}/questions`); return }
      if (roomData.status === 'playing') { router.push(`/room/${code}/play`); return }
      if (roomData.status === 'finished') { router.push(`/room/${code}/results`); return }
      setRoom(roomData)
      const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
      setPlayers(p ?? [])
      setLoading(false)

      channel = supabase.channel(`lobby_${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomData.id}` }, async () => {
          const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
          setPlayers(p ?? [])
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}` }, (payload) => {
          const updated = payload.new as Room
          if (updated.status === 'questions') router.push(`/room/${code}/questions`)
          if (updated.status === 'playing') router.push(`/room/${code}/play`)
        })
        .subscribe()
    }
    init()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [code, router])

  async function startQuestionPhase() {
    if (!room) return
    await supabase.from('rooms').update({ status: 'questions' }).eq('id', room.id)
  }

  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>
  )

  const EMPTY_SLOTS = Math.max(0, 6 - players.length)

  return (
    <div className="lobby-page">
      <FloatingShapes density="dense" />

      <div className="lobby-layout fade-up">

        {/* LEFT / TOP: Code reveal */}
        <GlassPanel glow={T.purple} style={{ padding: 'clamp(28px, 4vw, 56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Sparkles count={18} />
          <Label style={{ marginBottom: 14 }}>Salon en attente</Label>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>Partage ce code à tes potes</p>

          <div className="lobby-code-size" style={{
            fontFamily: 'monospace', fontWeight: 900, fontSize: 58,
            letterSpacing: '0.15em', lineHeight: 1,
            background: `linear-gradient(135deg, #fff 0%, ${T.purple} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 24,
          }}>
            {code}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={copyCode}
              style={{
                padding: '10px 20px', borderRadius: 100,
                background: copied ? T.purpleDim : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? T.purple : 'rgba(255,255,255,0.12)'}`,
                color: copied ? T.purple : T.muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copié !' : '📋 Copier le code'}
            </button>
          </div>

          <div style={{
            marginTop: 36, padding: '16px 20px',
            background: 'rgba(139,92,246,0.08)', borderRadius: 14,
            border: `1px dashed ${T.purple}44`,
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
                {p.id === myId && !p.is_host && <Badge color={T.purple}>toi</Badge>}
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
              <Btn onClick={startQuestionPhase} disabled={players.length < 2}>
                {players.length < 2 ? 'En attente de joueurs...' : '🚀 Commencer la partie !'}
              </Btn>
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
