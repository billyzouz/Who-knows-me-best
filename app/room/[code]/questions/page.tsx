'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Question, Room } from '@/lib/types'
import { Avatar, Btn, FloatingShapes, GlassPanel, Inp, Label, ProgressBar, T } from '@/components/ui'

const MIN_QUESTIONS = 2
const MAX_QUESTIONS = 4

const EXAMPLE_QUESTIONS = [
  'Mon premier groupe préféré ?',
  'Mon film honteux que je rewatch ?',
  'Le métier que je voulais faire à 10 ans ?',
  'Ma plus grande peur irrationnelle ?',
  'Mon plat de réconfort ultime ?',
]

export default function QuestionsPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myQuestions, setMyQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    setMyId(id)

    async function init() {
      const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
      if (!roomData) { router.push('/'); return }
      if (roomData.status === 'playing') { router.push(`/room/${code}/play`); return }
      if (roomData.status === 'finished') { router.push(`/room/${code}/results`); return }
      setRoom(roomData)
      const { data: p } = await supabase.from('players').select().eq('room_id', roomData.id).order('created_at')
      setPlayers(p ?? [])
      const { data: q } = await supabase.from('questions').select().eq('room_id', roomData.id)
      setAllQuestions(q ?? [])
      if (id) setMyQuestions((q ?? []).filter((x: Question) => x.author_id === id))
      setLoading(false)
    }
    init()

    const channel = supabase.channel(`questions_${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, async () => {
        const { data: roomData } = await supabase.from('rooms').select().eq('code', code).single()
        if (!roomData) return
        const { data: q } = await supabase.from('questions').select().eq('room_id', roomData.id)
        setAllQuestions(q ?? [])
        const myIdNow = sessionStorage.getItem(`player_${code}`)
        if (myIdNow) setMyQuestions((q ?? []).filter((x: Question) => x.author_id === myIdNow))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
        const updated = payload.new as Room
        if (updated.status === 'playing') router.push(`/room/${code}/play`)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [code, router])

  async function addQuestion() {
    if (!text.trim() || !answer.trim() || !room || !myId) return
    if (myQuestions.length >= MAX_QUESTIONS) return
    setSubmitting(true)
    const { data } = await supabase.from('questions').insert({ room_id: room.id, author_id: myId, text: text.trim(), answer: answer.trim() }).select().single()
    if (data) {
      setMyQuestions(prev => [...prev, data])
      setAllQuestions(prev => [...prev, data])
      setText(''); setAnswer('')
      setTimeout(() => textInputRef.current?.focus(), 50)
    }
    setSubmitting(false)
  }

  async function deleteQuestion(id: string) {
    await supabase.from('questions').delete().eq('id', id)
    setMyQuestions(prev => prev.filter(q => q.id !== id))
    setAllQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function startGame() {
    if (!room) return
    const { data: playersData } = await supabase.from('players').select().eq('room_id', room.id).order('created_at')
    if (!playersData || playersData.length === 0) return
    const firstSubject = playersData[0]
    await supabase.from('game_state').insert({ room_id: room.id, current_subject_id: firstSubject.id, current_question_idx: 0, phase: 'answering' })
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id)
  }

  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.is_host ?? false
  const canStartGame = isHost && players.length >= 2 && players.every(p => allQuestions.filter(q => q.author_id === p.id).length >= MIN_QUESTIONS)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: T.muted }}>Chargement...</div>

  return (
    <div className="questions-page">
      <FloatingShapes density="sparse" />

      <div className="questions-inner" style={{ position: 'relative', zIndex: 2 }}>

        {/* Header — desktop: flex row with launch button, mobile: centered */}
        <div className="questions-header fade-up">
          <div>
            <Label style={{ marginBottom: 6 }}>Phase 1 sur 2</Label>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 44px)', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Tes questions sur toi
            </h2>
            <p style={{ color: T.muted, fontSize: 14, marginTop: 6 }}>
              Ajoute {MIN_QUESTIONS}–{MAX_QUESTIONS} questions auxquelles tes potes vont deviner la réponse.
            </p>
          </div>
          {isHost && (
            <div className="desktop-only">
              <Btn variant="green" onClick={startGame} disabled={!canStartGame} style={{ width: 'auto', padding: '14px 28px', fontSize: 15 }}>
                {canStartGame ? 'Lancer la partie ! 🚀' : `En attente (min ${MIN_QUESTIONS}/joueur)`}
              </Btn>
            </div>
          )}
        </div>

        {/* 3-column grid (desktop) / stacked (mobile) */}
        <div className="questions-layout">

          {/* LEFT: Progress panel */}
          <GlassPanel style={{ padding: 20 }}>
            <Label style={{ marginBottom: 16 }}>Progression</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {players.map((p, i) => {
                const count = allQuestions.filter(q => q.author_id === p.id).length
                const done = count >= MIN_QUESTIONS
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.name} index={i} size={26} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: done ? '#fff' : T.muted }}>
                          {p.name}{p.id === myId ? ' (toi)' : ''}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: done ? T.green : T.faint, fontWeight: 700 }}>
                        {count}/{MIN_QUESTIONS} {done ? '✓' : ''}
                      </span>
                    </div>
                    <ProgressBar value={count} max={MIN_QUESTIONS} color={done ? T.green : T.purple} />
                  </div>
                )
              })}
            </div>
          </GlassPanel>

          {/* CENTER: My questions + add form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myQuestions.map((q, i) => (
              <GlassPanel key={q.id} glow={T.purple} style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, color: '#fff',
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{q.text}</p>
                  <p style={{ fontSize: 13, color: T.purple, margin: '4px 0 0', fontWeight: 600 }}>→ {q.answer}</p>
                </div>
                <button onClick={() => deleteQuestion(q.id)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, width: 30, height: 30, color: T.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
              </GlassPanel>
            ))}

            {myQuestions.length < MAX_QUESTIONS && (
              <GlassPanel glow={T.purple} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Label>Nouvelle question</Label>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: T.muted, fontWeight: 700 }}>{myQuestions.length + 1} / {MAX_QUESTIONS}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Inp
                    inputRef={textInputRef}
                    placeholder="La question (ex : Mon surnom d'enfance ?)"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('answer-input')?.focus()}
                    autoFocus
                    maxLength={120}
                  />
                  <Inp
                    id="answer-input"
                    placeholder="Ta réponse secrète"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addQuestion()}
                    maxLength={80}
                  />
                  <Btn onClick={addQuestion} disabled={submitting || !text.trim() || !answer.trim()}>
                    {submitting ? '...' : '+ Ajouter cette question'}
                  </Btn>
                </div>
              </GlassPanel>
            )}

            {myQuestions.length >= MAX_QUESTIONS && (
              <GlassPanel style={{ padding: 16, textAlign: 'center', background: 'rgba(34,197,94,0.06)', border: `1px solid ${T.green}33` }}>
                <span style={{ fontSize: 14, color: T.green, fontWeight: 700 }}>✓ Maximum atteint ({MAX_QUESTIONS} questions)</span>
              </GlassPanel>
            )}

            {/* Mobile: launch button */}
            {isHost && (
              <div className="mobile-only">
                <Btn variant="green" onClick={startGame} disabled={!canStartGame}>
                  {canStartGame ? 'Lancer la partie ! 🚀' : `En attente (min ${MIN_QUESTIONS}/joueur)`}
                </Btn>
              </div>
            )}
            {!isHost && myQuestions.length >= MIN_QUESTIONS && (
              <p style={{ textAlign: 'center', color: T.muted, fontSize: 13 }}>
                En attente que le host lance la partie...
              </p>
            )}
          </div>

          {/* RIGHT: Tips panel (desktop only) */}
          <GlassPanel className="desktop-only" style={{ padding: 24 }}>
            <Label style={{ marginBottom: 14 }}>💡 Inspiration</Label>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Pose des questions sur des trucs que <strong style={{ color: '#fff' }}>seuls tes proches savent</strong>. Évite les "ma couleur préférée".
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAMPLE_QUESTIONS.map((ex, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13, color: T.muted, fontStyle: 'italic',
                }}>"{ex}"</div>
              ))}
            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  )
}
