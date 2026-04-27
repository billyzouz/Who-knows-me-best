import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const { action, playerId, token, ...params } = await req.json()

  if (!action || !playerId || !token) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { data: player, error: playerError } = await supabaseAdmin
    .from('players')
    .select('id, room_id, is_host')
    .eq('id', playerId)
    .eq('token', token)
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  switch (action) {
    case 'start_question_phase': {
      if (!player.is_host) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      await supabaseAdmin.from('rooms').update({ status: 'questions' }).eq('id', player.room_id)
      break
    }

    case 'start_game': {
      if (!player.is_host) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      const { data: players } = await supabaseAdmin.from('players').select().eq('room_id', player.room_id).order('created_at')
      if (!players || players.length < 2) return NextResponse.json({ error: 'Pas assez de joueurs' }, { status: 400 })
      const { data: questions } = await supabaseAdmin.from('questions').select('author_id').eq('room_id', player.room_id)
      const MIN_QUESTIONS = 3
      for (const p of players) {
        const count = questions?.filter((q: any) => q.author_id === p.id).length ?? 0
        if (count < MIN_QUESTIONS) return NextResponse.json({ error: 'Pas assez de questions' }, { status: 400 })
      }
      await supabaseAdmin.from('game_state').insert({ room_id: player.room_id, current_subject_id: players[0].id, current_question_idx: 0, phase: 'answering' })
      await supabaseAdmin.from('rooms').update({ status: 'playing' }).eq('id', player.room_id)
      break
    }

    case 'advance_to_guessing': {
      const { gameStateId } = params
      const { data: gs } = await supabaseAdmin.from('game_state').select('current_subject_id').eq('id', gameStateId).single()
      if (!gs || gs.current_subject_id !== playerId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      await supabaseAdmin.from('game_state').update({ phase: 'guessing', updated_at: new Date().toISOString() }).eq('id', gameStateId)
      break
    }

    case 'start_validating': {
      const { gameStateId } = params
      const { data: gs } = await supabaseAdmin.from('game_state').select('current_subject_id').eq('id', gameStateId).single()
      if (!gs || gs.current_subject_id !== playerId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      await supabaseAdmin.from('game_state').update({ phase: 'validating', updated_at: new Date().toISOString() }).eq('id', gameStateId)
      break
    }

    case 'next_question': {
      const { gameStateId } = params
      const { data: gs } = await supabaseAdmin.from('game_state').select().eq('id', gameStateId).single()
      if (!gs) return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })
      if (!player.is_host && gs.current_subject_id !== playerId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      const { data: allPlayers } = await supabaseAdmin.from('players').select().eq('room_id', gs.room_id).order('created_at')
      const { data: allQuestions } = await supabaseAdmin.from('questions').select().eq('room_id', gs.room_id).order('created_at')
      if (!allPlayers || !allQuestions) return NextResponse.json({ error: 'Données manquantes' }, { status: 500 })
      if (gs.phase !== 'reveal') return NextResponse.json({ ok: true })
      const subjectQuestions = allQuestions.filter((q: any) => q.author_id === gs.current_subject_id)
      const nextIdx = gs.current_question_idx + 1
      if (nextIdx < subjectQuestions.length) {
        const { data: advanced } = await supabaseAdmin.from('game_state').update({ current_question_idx: nextIdx, phase: 'answering', updated_at: new Date().toISOString() }).eq('id', gameStateId).eq('phase', 'reveal').select().single()
        if (!advanced) return NextResponse.json({ ok: true })
      } else {
        const subjectIndex = allPlayers.findIndex((p: any) => p.id === gs.current_subject_id)
        const nextSubjectIndex = subjectIndex + 1
        if (nextSubjectIndex < allPlayers.length) {
          const { data: advanced } = await supabaseAdmin.from('game_state').update({ current_subject_id: allPlayers[nextSubjectIndex].id, current_question_idx: 0, phase: 'answering', updated_at: new Date().toISOString() }).eq('id', gameStateId).eq('phase', 'reveal').select().single()
          if (!advanced) return NextResponse.json({ ok: true })
        } else {
          await supabaseAdmin.from('rooms').update({ status: 'finished' }).eq('id', gs.room_id).neq('status', 'finished')
        }
      }
      break
    }

    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
