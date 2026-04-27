'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Btn, FloatingShapes, GlassPanel, Inp, Label, T } from '@/components/ui'
import { motion } from 'framer-motion'

// TODO: implémenter via colonne `mode='drinking'` sur table `rooms` pour que
// tous les joueurs (y compris ceux qui rejoignent sans passer par cette page) voient le mode soirée.

const AMBER = '#f59e0b'
const AMBER_DIM = 'rgba(245,158,11,0.15)'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function DrinkingQuizPage() {
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
      sessionStorage.setItem(`mode_${roomCode}`, 'drinking')
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
      sessionStorage.setItem(`mode_${roomCode}`, 'drinking')
      router.push(`/room/${roomCode}`)
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(20px, 4vh, 48px) 20px',
      paddingBottom: 'max(clamp(20px, 4vh, 48px), env(safe-area-inset-bottom))',
    }}>
      {/* Amber neon overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 800px 600px at 20% 30%, rgba(245,158,11,0.2), transparent 55%),
            radial-gradient(ellipse 700px 500px at 80% 70%, rgba(249,115,22,0.18), transparent 55%),
            radial-gradient(ellipse 500px 400px at 50% 90%, rgba(251,146,60,0.12), transparent 60%)
          `,
        }}
      />

      <div className="fade-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 3 }}>

        {/* Mobile header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vh, 40px)' }}>
          <div className="wobble" style={{ fontSize: 'clamp(36px, 5vh, 52px)', display: 'inline-block', marginBottom: 10 }}>🍺</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 4vh, 36px)', color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Quiz à Boire
          </h1>
          <p style={{ color: AMBER, fontSize: 14, marginTop: 8, fontWeight: 600 }}>
            Connais-moi… ou bois 🥃
          </p>
        </div>

        <GlassPanel glow={AMBER} style={{ padding: 'clamp(22px, 4vw, 40px)' }}>

          {mode === 'home' && (
            <>
              <motion.button
                onClick={() => router.push('/party')}
                whileTap={{ scale: 0.96 }}
                style={{ background: 'none', border: 'none', color: T.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20, display: 'block', fontFamily: 'inherit' }}
              >
                ← Pack Soirée
              </motion.button>

              {/* Rules recap */}
              <div style={{ background: AMBER_DIM, border: `1px solid ${AMBER}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, margin: '0 0 10px' }}>Règles</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['✅', 'Bonne réponse → distribue 2 gorgées'],
                    ['❌', 'Mauvaise réponse → bois 1 gorgée'],
                    ['🎯', 'Meilleur score → distribue un gage'],
                    ['💀', 'Zéro bonne → cul sec 🥃'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 15 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn variant="yellow" onClick={() => setMode('create')}>🍺 Créer un salon</Btn>
                <Btn variant="ghost" onClick={() => setMode('join')}>Rejoindre une partie</Btn>
              </div>
            </>
          )}

          {mode === 'create' && (
            <>
              <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: AMBER, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block', fontFamily: 'inherit' }}>← Retour</button>
              <h2 style={{ fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Créer un salon</h2>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px' }}>Tu seras le host de la partie</p>
              <Label color={AMBER} style={{ marginBottom: 8, display: 'block' }}>Ton prénom</Label>
              <Inp placeholder="Ex : Alex" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createRoom()} autoFocus maxLength={20} />
              {error && <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
              <div style={{ marginTop: 20 }}>
                <Btn variant="yellow" onClick={createRoom} disabled={loading || !name.trim()}>{loading ? 'Création...' : 'Créer le salon →'}</Btn>
              </div>
            </>
          )}

          {mode === 'join' && (
            <>
              <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: AMBER, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block', fontFamily: 'inherit' }}>← Retour</button>
              <h2 style={{ fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Rejoindre une partie</h2>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px' }}>Demande le code à ton host</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Label color={AMBER} style={{ marginBottom: 8, display: 'block' }}>Ton prénom</Label>
                  <Inp placeholder="Ex : Sam" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={20} />
                </div>
                <div>
                  <Label color={AMBER} style={{ marginBottom: 8, display: 'block' }}>Code du salon</Label>
                  <Inp placeholder="AB12CD" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && joinRoom()} mono maxLength={6} />
                </div>
                {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
                <Btn variant="yellow" onClick={joinRoom} disabled={loading || !name.trim() || code.length < 6}>{loading ? 'Connexion...' : 'Rejoindre →'}</Btn>
              </div>
            </>
          )}

        </GlassPanel>
      </div>
    </div>
  )
}
