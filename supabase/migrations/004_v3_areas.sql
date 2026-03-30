-- =============================================================
-- Migration 004: V3 — Multi-área, OP, Gasto de Estructura
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- ── 1. profiles: agregar área principal y áreas permitidas ───────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS area_principal   TEXT,
  ADD COLUMN IF NOT EXISTS areas_permitidas JSONB DEFAULT '[]'::jsonb;

-- ── 2. projects: agregar nuevos campos ───────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS area                   TEXT,
  ADD COLUMN IF NOT EXISTS op_numero              TEXT,
  ADD COLUMN IF NOT EXISTS otro_proveedor_gasto   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gasto_estructura_pct   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gasto_estructura_valor NUMERIC DEFAULT 0;

-- ── 3. Migrar ws → otro_proveedor_gasto en registros existentes ──────────────
UPDATE public.projects
SET otro_proveedor_gasto = COALESCE(ws, 0)
WHERE COALESCE(otro_proveedor_gasto, 0) = 0
  AND COALESCE(ws, 0) > 0;

-- ── 4. Asignar área por defecto a proyectos existentes ───────────────────────
-- Todos los proyectos históricos pertenecían a Creatividad (origen del dashboard)
UPDATE public.projects
SET area = 'Creatividad'
WHERE area IS NULL;

-- ── 5. Índices para los nuevos filtros ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_area     ON public.projects(area)     WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_projects_op       ON public.projects(op_numero) WHERE NOT deleted AND op_numero IS NOT NULL;

-- ── 6. Actualizar perfiles de usuarios con áreas ─────────────────────────────

-- Matias Scigliano: DEV (rol='DEV' ya bypass todo en código)
UPDATE public.profiles SET
  area_principal   = NULL,
  areas_permitidas = '["Creatividad", "Producción", "Trade", "Finanzas"]'::jsonb
WHERE email = 'mscigliano@american-ads.com';

-- Nahuel Fernandez: Admin, Creatividad
UPDATE public.profiles SET
  area_principal   = 'Creatividad',
  areas_permitidas = '["Creatividad"]'::jsonb
WHERE email = 'nfernandez@american-ads.com';

-- Axel Sangiacomo: Lector, Producción + Creatividad
UPDATE public.profiles SET
  area_principal   = NULL,
  areas_permitidas = '["Producción", "Creatividad"]'::jsonb
WHERE email = 'asangiacomo@american-ads.com';

-- Liliana Robles: Admin, Trade
UPDATE public.profiles SET
  area_principal   = 'Trade',
  areas_permitidas = '["Trade"]'::jsonb
WHERE email = 'lrobles@american-ads.com';

-- Diego Pozueta: Admin, Producción
UPDATE public.profiles SET
  area_principal   = 'Producción',
  areas_permitidas = '["Producción"]'::jsonb
WHERE email = 'dpozueta@american-ads.com';

-- Sofia Seeber: Admin, Finanzas (ve todas las áreas)
UPDATE public.profiles SET
  area_principal   = 'Finanzas',
  areas_permitidas = '["Finanzas", "Creatividad", "Producción", "Trade"]'::jsonb
WHERE email = 'sseeber@american-ads.com';

-- Andrea Becerra: Admin, Finanzas (ve todas las áreas)
UPDATE public.profiles SET
  area_principal   = 'Finanzas',
  areas_permitidas = '["Finanzas", "Creatividad", "Producción", "Trade"]'::jsonb
WHERE email = 'abecerra@american-ads.com';

-- =============================================================
-- NUEVA POLICY RLS OPCIONAL (no ejecutar hasta confirmar):
-- Permite que Admin solo edite proyectos de su área principal.
-- Por ahora se aplica a nivel UI. Descomentar si se desea
-- reforzar también a nivel de base de datos.
-- =============================================================
--
-- DROP POLICY IF EXISTS "projects: Admin y DEV pueden editar" ON public.projects;
-- CREATE POLICY "projects: Admin y DEV pueden editar"
--   ON public.projects FOR UPDATE
--   USING (
--     public.get_user_rol() = 'DEV'
--     OR (
--       public.get_user_rol() = 'Admin'
--       AND (
--         area = (SELECT area_principal FROM public.profiles WHERE id = auth.uid())
--         OR area IS NULL
--       )
--     )
--   );
--
-- DROP POLICY IF EXISTS "projects: Admin y DEV pueden crear" ON public.projects;
-- CREATE POLICY "projects: Admin y DEV pueden crear"
--   ON public.projects FOR INSERT
--   WITH CHECK (
--     public.get_user_rol() = 'DEV'
--     OR (
--       public.get_user_rol() = 'Admin'
--       AND (
--         area = (SELECT area_principal FROM public.profiles WHERE id = auth.uid())
--         OR area IS NULL
--       )
--     )
--   );

-- =============================================================
-- NOTAS:
-- 1. El campo ws NO se elimina — se mantiene por compatibilidad.
--    El campo activo desde ahora es otro_proveedor_gasto.
-- 2. gasto_estructura_pct y _valor solo son editables por Finanzas
--    (regla aplicada en UI; RLS opcional arriba).
-- 3. Ejecutar DESPUÉS de tener usuarios en auth.users y profiles.
-- =============================================================
