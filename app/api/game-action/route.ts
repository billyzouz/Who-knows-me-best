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
      await supabaseAdmin.from('game_state').insert({ room_id: player.room_id, current_subject_id: players[0].id, current_question_idx: 0, phase: 'answering', updated_at: new Date().toISOString() })
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

    case 'submit_guess': {
      const { gameStateId, guess } = params
      if (!guess || typeof guess !== 'string' || !guess.trim()) return NextResponse.json({ error: 'Réponse manquante' }, { status: 400 })
      const { data: gs } = await supabaseAdmin.from('game_state').select('current_subject_id, current_question_idx, phase, room_id').eq('id', gameStateId).single()
      if (!gs) return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })
      if (gs.room_id !== player.room_id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      if (gs.phase !== 'guessing') return NextResponse.json({ error: 'Phase incorrecte' }, { status: 400 })
      if (gs.current_subject_id === playerId) return NextResponse.json({ error: 'Le sujet ne peut pas deviner' }, { status: 400 })
      const { data: questions } = await supabaseAdmin.from('questions').select().eq('room_id', player.room_id).order('created_at')
      const subjectQuestions = (questions ?? []).filter((q: any) => q.author_id === gs.current_subject_id)
      const currentQuestion = subjectQuestions[gs.current_question_idx]
      if (!currentQuestion) return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
      await supabaseAdmin.from('guesses').upsert(
        { question_id: currentQuestion.id, player_id: playerId, guess: guess.trim(), is_correct: false },
        { onConflict: 'question_id,player_id' }
      )
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

    case 'start_tod': {
      const { difficulty = 'mixte' } = params
      if (!player.is_host) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      const { data: players } = await supabaseAdmin.from('players').select().eq('room_id', player.room_id).order('created_at')
      if (!players || players.length < 2) return NextResponse.json({ error: 'Pas assez de joueurs' }, { status: 400 })
      
      // Générer une séquence où chaque joueur passe exactement 3 fois
      const baseIds = players.map(p => p.id)
      let sequence: string[] = []
      for (let i = 0; i < 3; i++) {
        sequence = sequence.concat(baseIds)
      }
      
      // Mélange (Shuffle) de Fisher-Yates
      for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]]
      }

      // Création du game_state initial pour ToD avec la séquence mélangée
      await supabaseAdmin.from('game_state').insert({ 
        room_id: player.room_id, 
        current_subject_id: sequence[0], 
        current_question_idx: 0, 
        phase: 'answering',
        player_sequence: sequence,
        total_rounds: sequence.length,
        updated_at: new Date().toISOString() 
      })
      await supabaseAdmin.from('rooms').update({ status: 'playing_tod', mode: `tod:${difficulty}` }).eq('id', player.room_id)
      break
    }

    case 'tod_submit_choice': {
      const { gameStateId, choiceId } = params
      const { data: gs } = await supabaseAdmin.from('game_state').select('current_subject_id').eq('id', gameStateId).single()
      if (!gs || gs.current_subject_id !== playerId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      
      // Enregistre le choix dans guesses (question_id = gameStateId pour lier au tour)
      await supabaseAdmin.from('guesses').upsert(
        { question_id: gameStateId, player_id: playerId, guess: choiceId, is_correct: true },
        { onConflict: 'question_id,player_id' }
      )
      await supabaseAdmin.from('game_state').update({ phase: 'reveal', updated_at: new Date().toISOString() }).eq('id', gameStateId)
      break
    }

    case 'tod_pass_turn': {
      const { gameStateId } = params
      const { data: gs } = await supabaseAdmin.from('game_state').select().eq('id', gameStateId).single()
      if (!gs) return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })
      if (!player.is_host && gs.current_subject_id !== playerId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      
      const { data: allPlayers } = await supabaseAdmin.from('players').select().eq('room_id', gs.room_id).order('created_at')
      if (!allPlayers) return NextResponse.json({ error: 'Données manquantes' }, { status: 500 })
      
      const nextIdx = gs.current_question_idx + 1
      const totalRounds = gs.total_rounds || (allPlayers.length * 3)
      const sequence = gs.player_sequence || allPlayers.map((p: any) => p.id) // Fallback si pas de séquence (ne devrait pas arriver)
      
      // On supprime l'ancien guess pour ce gameState pour faire place nette pour le prochain tour
      await supabaseAdmin.from('guesses').delete().eq('question_id', gameStateId)
      
      if (nextIdx >= totalRounds) {
        // Fin de la séquence, on termine la partie ToD
        await supabaseAdmin.from('rooms').update({ status: 'tod_finished' }).eq('id', gs.room_id)
      } else {
        // On passe au joueur suivant dans la séquence
        const nextSubjectId = sequence[nextIdx] ?? allPlayers[0].id
        await supabaseAdmin.from('game_state').update({ 
          current_subject_id: nextSubjectId, 
          current_question_idx: nextIdx, 
          phase: 'answering', 
          updated_at: new Date().toISOString() 
        }).eq('id', gameStateId)
      }
      break
    }

    case 'reset_tod_room': {
      if (!player.is_host) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      // On remet la room en 'waiting' et on nettoie l'état de jeu
      await supabaseAdmin.from('rooms').update({ status: 'waiting', mode: 'classic' }).eq('id', player.room_id)
      await supabaseAdmin.from('game_state').delete().eq('room_id', player.room_id)
      break
    }

    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
