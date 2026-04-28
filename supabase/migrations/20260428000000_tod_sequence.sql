-- Add columns to game_state for Truth or Dare player sequence and total rounds
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS player_sequence jsonb;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS total_rounds integer;
