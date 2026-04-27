import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const { gameStateId, questionId, overrides, callerPlayerId } = await req.json()

  if (!gameStateId || !questionId || !overrides || !callerPlayerId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Verify caller is the current subject in validating phase
  const { data: gs, error: gsError } = await supabaseAdmin
    .from('game_state')
    .select('current_subject_id, phase')
    .eq('id', gameStateId)
    .single()

  if (gsError || !gs) {
    return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })
  }
  if (gs.current_subject_id !== callerPlayerId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (gs.phase !== 'validating') {
    return NextResponse.json({ error: 'Phase incorrecte' }, { status: 400 })
  }

  const { data: allGuesses, error: guessError } = await supabaseAdmin
    .from('guesses')
    .select('id, player_id')
    .eq('question_id', questionId)

  if (guessError || !allGuesses) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des réponses' }, { status: 500 })
  }

  // Batch update guesses correctness
  const correctPlayerIds: string[] = []
  for (const g of allGuesses) {
    const correct = overrides[g.id] ?? false
    await supabaseAdmin.from('guesses').update({ is_correct: correct }).eq('id', g.id)
    if (correct) correctPlayerIds.push(g.player_id)
  }

  // Atomic score increments via SQL function
  for (const playerId of correctPlayerIds) {
    await supabaseAdmin.rpc('increment_player_score', { p_player_id: playerId })
  }

  // Advance phase to reveal
  await supabaseAdmin
    .from('game_state')
    .update({ phase: 'reveal', updated_at: new Date().toISOString() })
    .eq('id', gameStateId)

  return NextResponse.json({ ok: true })
}
