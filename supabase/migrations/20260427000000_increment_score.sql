-- Atomic score increment — avoids client-side read-then-write race condition.
-- Run this in the Supabase SQL editor before deploying validate-scores API route.
CREATE OR REPLACE FUNCTION increment_player_score(p_player_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE players SET score = score + 1 WHERE id = p_player_id;
$$;
