'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BigLogo, Btn, FloatingShapes, GlassPanel, Inp, Label, T } from '@/components/ui'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const roomCode = generateCode()
      const { data: room, error: roomErr } = await supabase.from('rooms').insert({ code: roomCode, status: 'waiting' }).select().single()
      if (roomErr) throw roomErr
      const { data: player, error: playerErr } = await supabase.from('players').insert({ room_id: room.id, name: name.trim(), is_host: true }).select().single()
      if (playerErr) throw playerErr
      await supabase.from('rooms').update({ host_id: player.id }).eq('id', room.id)
      sessionStorage.setItem(`player_${roomCode}`, player.id)
      sessionStorage.setItem(`token_${roomCode}`, player.token)
      router.push(`/room/${roomCode}`)
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  async function joinRoom() {
    if (!name.trim() || !code.trim()) return
    setLoading(true); setError('')
    try {
      const roomCode = code.trim().toUpperCase()
      const { data: room, error: roomErr } = await supabase.from('rooms').select().eq('code', roomCode).single()
      if (roomErr || !room) throw new Error('Salon introuvable')
      if (room.status !== 'waiting') throw new Error('Partie déjà commencée')
      const { data: player, error: playerErr } = await supabase.from('players').insert({ room_id: room.id, name: name.trim(), is_host: false }).select().single()
      if (playerErr) throw playerErr
      sessionStorage.setItem(`player_${roomCode}`, player.id)
      sessionStorage.setItem(`token_${roomCode}`, player.token)
      router.push(`/room/${roomCode}`)
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <div className="home-layout">
      <FloatingShapes density="dense" />

      {/* LEFT column — desktop hero (hidden on mobile) */}
      <div className="desktop-only" style={{ position: 'relative', zIndex: 3 }}>
        <BigLogo />
        <h1 style={{
          fontWeight: 900, fontSize: 'clamp(48px, 5vw, 72px)', color: '#fff',
          lineHeight: 0.95, letterSpacing: '-0.04em', marginTop: 36, marginBottom: 0,
        }}>
          Qui te connaît<br />
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            le mieux ?
          </span>
        </h1>
        <p style={{ fontSize: 16, color: T.muted, marginTop: 24, maxWidth: 440, lineHeight: 1.6 }}>
          Crée un salon, invite tes potes, et découvrez qui connaît vraiment qui à travers des questions piquées sur le vif. 🎉
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 40, alignItems: 'center' }}>
          {[['👥', '2-12 joueurs'], ['⏱️', '15-30 min'], ['🌐', 'Multi-device']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT column (desktop) / full width (mobile) */}
      <div className="fade-up" style={{ width: '100%', maxWidth: 440, margin: '0 auto', position: 'relative', zIndex: 3 }}>

        {/* Mobile-only header */}
        <div className="mobile-only" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="wobble" style={{ fontSize: 52, marginBottom: 12, display: 'inline-block' }}>🧠</div>
          <h1 style={{ fontWeight: 900, fontSize: 34, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Who knows<br />me best?
          </h1>
          <p style={{ color: T.purple, fontSize: 15, marginTop: 10, fontWeight: 500 }}>
            Le quiz entre potes 🎉
          </p>
        </div>

        <GlassPanel glow={T.purple} style={{ padding: 'clamp(24px, 4vw, 48px)' }}>

          {mode === 'home' && (
            <>
              <Label style={{ marginBottom: 12 }}>Prêt à jouer ?</Label>
              <h2 className="desktop-only" style={{ fontWeight: 800, fontSize: 36, color: '#fff', marginBottom: 32, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Lance la partie
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Btn onClick={() => setMode('create')}>✨ Créer un salon</Btn>
                <Btn variant="ghost" onClick={() => setMode('join')}>Rejoindre une partie</Btn>
              </div>
              <div className="desktop-only" style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                  💡 Un host crée le salon, partage le code à 6 chiffres, et tout le monde rejoint depuis son téléphone ou son PC.
                </p>
              </div>
            </>
          )}

          {mode === 'create' && (
            <>
              <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: T.purple, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block' }}>← Retour</button>
              <h2 style={{ fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Créer un salon</h2>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px' }}>Tu seras le host de la partie</p>
              <Label style={{ marginBottom: 8, display: 'block' }}>Ton prénom</Label>
              <Inp placeholder="Ex : Alex" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createRoom()} autoFocus maxLength={20} />
              {error && <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
              <div style={{ marginTop: 20 }}>
                <Btn onClick={createRoom} disabled={loading || !name.trim()}>{loading ? 'Création...' : 'Créer le salon →'}</Btn>
              </div>
            </>
          )}

          {mode === 'join' && (
            <>
              <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: T.purple, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block' }}>← Retour</button>
              <h2 style={{ fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Rejoindre une partie</h2>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px' }}>Demande le code à ton host</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Label style={{ marginBottom: 8, display: 'block' }}>Ton prénom</Label>
                  <Inp placeholder="Ex : Sam" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={20} />
                </div>
                <div>
                  <Label style={{ marginBottom: 8, display: 'block' }}>Code du salon</Label>
                  <Inp placeholder="AB12CD" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && joinRoom()} mono maxLength={6} />
                </div>
                {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
                <Btn onClick={joinRoom} disabled={loading || !name.trim() || code.length < 6}>{loading ? 'Connexion...' : 'Rejoindre →'}</Btn>
              </div>
            </>
          )}

        </GlassPanel>
      </div>
    </div>
  )
}
