-- =============================================================
-- Migration 001: Users & Profiles
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================
-- Esta migración extiende la tabla auth.users de Supabase
-- con un perfil público que almacena nombre y rol.
-- La autenticación (email + password/PIN) la maneja Supabase Auth.
-- =============================================================

-- Tabla pública de perfiles (una fila por cada auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  rol        TEXT NOT NULL DEFAULT 'Lector'
               CHECK (rol IN ('Lector', 'Admin', 'DEV')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: crear perfil automáticamente al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'Lector')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- Seed: Crear los 3 usuarios iniciales
-- OPCIÓN A (recomendada): hacerlo desde el dashboard de Supabase:
--   Authentication → Users → "Add user" con:
--     email: mscigliano@american-ads.com  password: 3108  metadata: {"nombre":"Matias Scigliano","rol":"DEV"}
--     email: nfernandez@american-ads.com  password: 2026  metadata: {"nombre":"Nahuel Fernandez","rol":"Admin"}
--     email: asangiacomo@american-ads.com password: 2026  metadata: {"nombre":"Axel Sangiacomo","rol":"Lector"}
--
-- OPCIÓN B: vía service_role key (no ejecutar con anon key):
-- SELECT auth.create_user(
--   '{"email":"mscigliano@american-ads.com","password":"3108","user_metadata":{"nombre":"Matias Scigliano","rol":"DEV"}}'::jsonb
-- );
-- =============================================================
