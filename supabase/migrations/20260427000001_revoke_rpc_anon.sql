-- Prevent anon/authenticated roles from calling increment_player_score directly.
-- Only the service role (API routes) should be able to call this function.
REVOKE EXECUTE ON FUNCTION increment_player_score(uuid) FROM anon, authenticated;
