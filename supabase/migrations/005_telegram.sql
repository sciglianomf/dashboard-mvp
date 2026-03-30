-- Migration 005: Telegram bot sessions
-- Persiste sesiones autenticadas del bot. Solo accesible via service role.

CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id        BIGINT PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         TEXT,
  rol            TEXT,
  area_principal TEXT,
  areas_permitidas JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Solo el service role puede leer/escribir esta tabla
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Sin políticas públicas → solo service role bypassa RLS
