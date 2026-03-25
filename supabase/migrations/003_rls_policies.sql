-- =============================================================
-- Migration 003: Row Level Security (RLS)
-- Ejecutar DESPUÉS de las migraciones 001 y 002
-- =============================================================
-- Asegura que cada usuario solo pueda hacer lo que su rol permite.
-- RLS es la capa de seguridad en Supabase (reemplaza requireAuth/requireRole de Express).
-- =============================================================

-- ── Helper: obtener el rol del usuario autenticado ───────────
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid()
$$;

-- =============================================================
-- RLS en profiles
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede ver y editar solo su propio perfil
CREATE POLICY "profiles: usuario ve el suyo"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: usuario edita el suyo"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- DEV puede ver y gestionar todos los perfiles
CREATE POLICY "profiles: DEV ve todos"
  ON public.profiles FOR SELECT
  USING (public.get_user_rol() = 'DEV');

CREATE POLICY "profiles: DEV gestiona todos"
  ON public.profiles FOR ALL
  USING (public.get_user_rol() = 'DEV');

-- =============================================================
-- RLS en projects
-- =============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer proyectos no eliminados
CREATE POLICY "projects: cualquier autenticado puede leer"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND NOT deleted
  );

-- Admin y DEV pueden insertar proyectos
CREATE POLICY "projects: Admin y DEV pueden crear"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.get_user_rol() IN ('Admin', 'DEV')
  );

-- Admin y DEV pueden actualizar proyectos
CREATE POLICY "projects: Admin y DEV pueden editar"
  ON public.projects FOR UPDATE
  USING (
    public.get_user_rol() IN ('Admin', 'DEV')
  );

-- Solo DEV puede eliminar (hard delete)
CREATE POLICY "projects: solo DEV puede eliminar"
  ON public.projects FOR DELETE
  USING (
    public.get_user_rol() = 'DEV'
  );

-- =============================================================
-- NOTAS:
-- 1. Ejecutar este script DESPUÉS de tener usuarios en auth.users
-- 2. El soft delete (campo `deleted = true`) se maneja vía UPDATE,
--    no via DELETE — así cualquier Admin puede hacer soft delete.
-- 3. Si querés que el DELETE físico sea via Admin también,
--    cambiá la policy de DELETE arriba.
-- =============================================================
