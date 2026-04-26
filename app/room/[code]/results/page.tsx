'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/lib/types'
import { Avatar, Btn, Confetti, FloatingShapes, GlassPanel, Label, Sparkles, T } from '@/components/ui'

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: room } = await supabase.from('rooms').select().eq('code', code).single()
      if (!room) { router.push('/'); return }
      const { data: p } = await supabase.from('players').select().eq('room_id', room.id).order('score', { ascending: false })
      setPlayers(p ?? [])
      setLoading(false)
    }
    init()
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

  return (
    <div className="results-page">
      <Confetti count={48} />
      <FloatingShapes density="dense" />

      <div className="results-inner fade-up" style={{ position: 'relative', zIndex: 3 }}>

        {/* Hero header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 10 }}>🏆</div>
          <Label color={T.yellow} style={{ marginBottom: 8 }}>Partie terminée</Label>
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(28px, 5vw, 64px)', letterSpacing: '-0.04em', margin: 0,
            background: `linear-gradient(135deg, ${T.yellow} 0%, ${T.pink} 50%, ${T.purple} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {top3[0]?.name} gagne !
          </h1>
          <p style={{ color: T.muted, fontSize: 16, marginTop: 8 }}>
            connaît mieux les autres que personne d'autre 👀
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
                  <span style={{ fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: i === 0 ? T.yellow : T.purple }}>
                    {p.score}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Replay */}
          <GlassPanel glow={T.purple} style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
            <Label style={{ marginBottom: 12 }}>Encore une partie ?</Label>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
              Garde la même équipe ou recommence avec de nouveaux potes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn variant="pink" onClick={() => router.push('/')}>🎉 Rejouer</Btn>
              <Btn variant="ghost" onClick={() => router.push('/')} style={{ fontSize: 14, padding: '12px 16px' }}>Nouveau salon</Btn>
            </div>
          </GlassPanel>

        </div>

      </div>
    </div>
  )
}
