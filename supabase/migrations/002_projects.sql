-- =============================================================
-- Migration 002: Projects
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================
-- Tabla principal de proyectos. Reemplaza:
--   - data/innovacion-creatividad.xlsx (fuente Excel)
--   - data/projects-local.json (overrides y proyectos locales)
-- Todos los proyectos del Excel se importarán en la Fase 2.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.projects (
  -- Identificación
  id              TEXT PRIMARY KEY,         -- sha256 hash (Excel) o UUID (nuevos)
  source          TEXT NOT NULL DEFAULT 'supabase'
                    CHECK (source IN ('excel', 'local', 'edited', 'supabase')),

  -- Clasificación temporal
  fecha           DATE,
  año             INTEGER,

  -- Clasificación de negocio
  cliente         TEXT,
  campaña         TEXT,
  sheet           TEXT,                     -- nombre de hoja Excel (agrupa campañas)
  estado          TEXT NOT NULL DEFAULT 'Presupuestado'
                    CHECK (estado IN ('Presupuestado', 'Realizado')),

  -- Descripción del elemento
  foto_ref        TEXT,
  formato         TEXT,
  elemento        TEXT,
  cantidad        NUMERIC DEFAULT 0,
  detalle         TEXT,
  elemento_dueno  TEXT,
  ubicacion       TEXT,
  situacion       TEXT,
  realizacion     TEXT,
  fecha_campaña   TEXT,
  observaciones   TEXT,

  -- Financiero
  costo_inn       NUMERIC DEFAULT 0,
  costo_placa_pai NUMERIC DEFAULT 0,
  costo_lona      NUMERIC DEFAULT 0,
  confi_pct       NUMERIC DEFAULT 0,
  ws              NUMERIC DEFAULT 0,
  total_prod      NUMERIC DEFAULT 0,       -- calculado: suma de costos
  tarifa          NUMERIC DEFAULT 0,
  mark_up         NUMERIC DEFAULT 0,
  margen_pct      NUMERIC DEFAULT 0,
  margen_abs      NUMERIC DEFAULT 0,       -- calculado: tarifa - total_prod

  -- Pagos
  op_adelanto_cliente TEXT,
  op_saldo_cliente    TEXT,

  -- Auditoría
  deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);

-- Índices para los filtros más usados
CREATE INDEX IF NOT EXISTS idx_projects_estado   ON public.projects(estado) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_projects_año      ON public.projects(año)    WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_projects_cliente  ON public.projects(cliente) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_projects_sheet    ON public.projects(sheet)  WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_projects_deleted  ON public.projects(deleted);

-- Trigger updated_at (reutiliza la función del migration 001)
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- NOTA sobre snake_case:
-- Los campos del Excel usaban camelCase (costoInn, markUp, etc.)
-- En Postgres usamos snake_case (costo_inn, mark_up, etc.)
-- El script de importación (a crear en Fase 2) hace la conversión.
-- =============================================================
