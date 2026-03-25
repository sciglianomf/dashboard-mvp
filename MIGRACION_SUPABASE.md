# Plan de Migración a Supabase

> Fecha: 2026-03-25
> Estado: Fase 0 completada (análisis + scaffolding base)

---

## 1. Análisis del proyecto actual

### Stack real (importante: NO es Next.js)

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + JSX + TailwindCSS |
| Backend | Express 5 (Node.js, CommonJS) en puerto 3001 |
| Auth | JWT en cookies httpOnly + bcryptjs |
| BD usuarios | SQLite via `better-sqlite3` → `data/app.db` |
| BD proyectos | Excel `data/innovacion-creatividad.xlsx` (lectura) + `data/projects-local.json` (escritura de overrides) |
| Roles | `Lector`, `Admin`, `DEV` |
| Proxy | Vite proxea `/api` → `http://localhost:3001` |

---

## 2. Entidades actuales

### 2.1 `users` (SQLite — `data/app.db`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `nombre` | TEXT NOT NULL | |
| `email` | TEXT UNIQUE NOT NULL | Solo `@american-ads.com` |
| `password_hash` | TEXT NOT NULL | bcrypt de un PIN de 4 dígitos |
| `rol` | TEXT CHECK | `Lector` \| `Admin` \| `DEV` |

Seed hardcodeado en `backend/db.js` con 3 usuarios iniciales.

---

### 2.2 `projects` (Excel + JSON local — sin DB relacional)

Datos leídos de `data/innovacion-creatividad.xlsx`, con overrides en `data/projects-local.json`.

| Campo | Tipo | Origen |
|-------|------|--------|
| `id` | string (sha256 hash o UUID) | generado |
| `fecha` | string ISO date \| null | col 0 |
| `año` | number | derivado de separador de año |
| `cliente` | string \| null | col 1 |
| `campaña` | string \| null | col 2 |
| `fotoRef` | string \| null | col 3 |
| `formato` | string \| null | col 4 |
| `elemento` | string \| null | col 5 |
| `cantidad` | number | col 6 |
| `costoInn` | number | col 7 |
| `costoPlacaPai` | number | col 8 |
| `costoLona` | number | col 9 |
| `confiPct` | number | col 10 |
| `ws` | number | col 11 |
| `totalProd` | number | col 12 (calculado también en backend) |
| `tarifa` | number | col 13 |
| `markUp` | number | col 14 |
| `margenPct` | number | col 15 |
| `margenAbs` | number | col 16 |
| `detalle` | string \| null | col 18 |
| `elementoDueno` | string \| null | col 19 |
| `ubicacion` | string \| null | col 20 |
| `situacion` | string \| null | col 22 |
| `realizacion` | string \| null | col 23 |
| `fechaCampaña` | string \| null | col 25 |
| `observaciones` | string \| null | col 26 |
| `opAdelantoCliente` | string \| null | col 27 |
| `opSaldoCliente` | string \| null | col 28 |
| `sheet` | string | nombre de hoja Excel (= campaña grouping) |
| `source` | `excel` \| `local` \| `edited` | origen del dato |
| `estado` | `Presupuestado` \| `Realizado` | filtro global |
| `createdAt` | ISO string | solo proyectos creados localmente |
| `updatedAt` | ISO string | solo proyectos editados |
| `deleted` | boolean | soft delete |
| `deletedAt` | ISO string | soft delete |

---

### 2.3 Entidades derivadas (no tienen tabla propia, se calculan en runtime)

- **`campaigns`** — distinct de `sheet` de los proyectos
- **`summary` / KPIs** — agregaciones sobre proyectos (`totalTarifa`, `totalProd`, `margenPct`, `byCliente`, `byCampaña`, `byAño`, `comparativoAnual`)

---

## 3. Endpoints Express actuales

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/auth/login` | no | — | Login con email + PIN de 4 dígitos |
| POST | `/api/auth/logout` | no | — | Clear cookie JWT |
| GET | `/api/auth/me` | sí | any | Perfil del usuario logueado |
| GET | `/api/users` | sí | DEV | Listar usuarios |
| POST | `/api/users` | sí | DEV | Crear usuario |
| PUT | `/api/users/:id` | sí | DEV | Editar usuario |
| DELETE | `/api/users/:id` | sí | DEV | Eliminar usuario |
| GET | `/api/projects` | sí | any | Listar proyectos (con filtros) |
| POST | `/api/projects` | sí | Admin/DEV | Crear proyecto (local JSON) |
| PUT | `/api/projects/:id` | sí | Admin/DEV | Editar proyecto (local JSON override) |
| DELETE | `/api/projects/:id` | sí | Admin/DEV | Soft delete proyecto |
| GET | `/api/summary` | sí | any | KPIs y gráficos |
| GET | `/api/campaigns` | sí | any | Lista de campañas únicas |

---

## 4. Qué lógica puede eliminarse vs. qué mantener

### ❌ Puede eliminarse completamente (reemplazado por Supabase)

| Archivo | Por qué |
|---------|---------|
| `backend/db.js` | SQLite reemplazado por tabla `users` en Supabase Postgres |
| `backend/routes/auth.js` | Reemplazado por Supabase Auth (o Auth custom con Supabase) |
| `backend/middleware/auth.js` | Reemplazado por `supabase.auth.getUser()` + RLS |
| `backend/routes/users.js` | Reemplazado por queries directas a Supabase desde frontend |
| `backend/server.js` (parcial) | Los endpoints de users y auth se eliminan |
| `backend/node_modules/better-sqlite3` | No se necesita |
| `backend/node_modules/jsonwebtoken` | No se necesita (Supabase maneja sus propios JWT) |
| `backend/node_modules/bcryptjs` | No se necesita (Supabase Auth maneja passwords) |
| `data/app.db` | Migrado a Supabase |

### ⚠️ Mantener temporalmente (durante transición)

| Archivo | Por qué mantener | Cuándo eliminar |
|---------|-----------------|-----------------|
| `backend/server.js` | Sirve endpoints de proyectos y summary | Fase 4: cuando los datos de proyectos estén en Supabase |
| `backend/services/excelParser.js` | Única fuente de datos de proyectos | Fase 3: después de importar proyectos a Supabase |
| `data/innovacion-creatividad.xlsx` | Fuente de datos histórica | Fase 3: después de migrar datos |
| `data/projects-local.json` | Overrides y proyectos nuevos | Fase 3: después de migrar a Supabase |
| `frontend/src/utils/api.js` (axios) | Mientras Express siga activo | Fase 4: reemplazar por Supabase client |
| `frontend/src/context/AuthContext.jsx` | Lógica de auth funcional | Fase 2: refactorizar para usar Supabase Auth |

---

## 5. Consideración especial: Autenticación con PIN

El sistema actual usa **PIN de 4 dígitos** en lugar de contraseña, con restricción de dominio `@american-ads.com`.

**Supabase Auth no soporta PIN nativo**, por lo que hay dos opciones:

### Opción A (Recomendada): Supabase Auth + PIN como contraseña
- Crear usuarios en Supabase Auth con email + PIN como password
- Mantener la validación de dominio en el frontend/RLS
- Supabase maneja el JWT, refresh tokens, y sessions

### Opción B: Supabase como DB, auth custom
- Mantener la lógica JWT actual pero usar Supabase Postgres para `users`
- Más trabajo, menos beneficios

**→ Se recomienda Opción A.** El plan de migración implementa la Opción A.

---

## 6. Plan de migración por etapas

### Fase 0 — Scaffolding (COMPLETADA ✅)
- [x] Instalar `@supabase/supabase-js` en frontend
- [x] Crear `frontend/src/lib/supabase.js` (cliente Supabase)
- [x] Crear `.env.example` con variables Supabase
- [x] Crear estructura `supabase/migrations/` con SQL versionado
- [x] Documentar todo en este archivo

### Fase 1 — Supabase como BD de usuarios (reemplaza SQLite)
**Prerequisito:** Fase 0 completa + proyecto Supabase creado manualmente

Pasos:
1. Ejecutar `supabase/migrations/001_users.sql` en Supabase
2. Crear los 3 usuarios seed en Supabase Auth dashboard
3. Crear `frontend/src/lib/authService.js` con `signIn`/`signOut`/`getUser` usando Supabase
4. Refactorizar `AuthContext.jsx` para usar Supabase Auth
5. Eliminar endpoints `/api/auth/*` y `/api/users/*` de Express
6. Eliminar `backend/db.js`, `backend/routes/auth.js`, `backend/routes/users.js`
7. Eliminar dependencias: `better-sqlite3`, `jsonwebtoken`, `bcryptjs`

### Fase 2 — Importar proyectos a Supabase
**Prerequisito:** Fase 1 completa

Pasos:
1. Ejecutar `supabase/migrations/002_projects.sql` en Supabase
2. Crear script de importación `scripts/import-to-supabase.js` que:
   - Corre el parser Excel existente
   - Aplica overrides del JSON local
   - Inserta todos los proyectos en Supabase
3. Ejecutar import una sola vez
4. Verificar datos en Supabase dashboard

### Fase 3 — Frontend usa Supabase para proyectos
**Prerequisito:** Fase 2 completa

Pasos:
1. Crear `frontend/src/lib/projectsService.js` con funciones CRUD usando Supabase client
2. Refactorizar `useData.js` para usar Supabase en lugar de axios `/api/*`
3. Actualizar `ProjectModal.jsx` y `ProjectsTable.jsx` si es necesario
4. Eliminar endpoints `/api/projects`, `/api/summary`, `/api/campaigns` de Express
5. Mover lógica de `getSummary()` al frontend (era cálculo puro, no depende de DB)

### Fase 4 — Eliminar Express completamente
**Prerequisito:** Fase 3 completa + todo el frontend usa Supabase

Pasos:
1. Eliminar `backend/` completo
2. Eliminar `iniciar-dashboard.sh` o actualizarlo para solo correr el frontend
3. Agregar `vercel.json` para deploy
4. Deploy en Vercel

### Fase 5 — Row Level Security (RLS)
**Prerequisito:** Fase 4 completa

Pasos:
1. Activar RLS en tablas `profiles` y `projects`
2. Crear políticas RLS:
   - Lector: solo SELECT en projects
   - Admin: SELECT + INSERT + UPDATE en projects
   - DEV: todo acceso

---

## 7. Esquema SQL propuesto

Ver archivos en `supabase/migrations/`:
- `001_users_profiles.sql` — tabla `profiles` (extiende `auth.users`)
- `002_projects.sql` — tabla `projects` con todos los campos
- `003_rls_policies.sql` — Row Level Security

---

## 8. Pasos manuales que debes hacer en Supabase

### Antes de empezar la Fase 1

1. **Crear proyecto en Supabase**
   - Ir a [supabase.com](https://supabase.com) → New Project
   - Elegir región más cercana (recomendado: `South America (São Paulo)`)
   - Anotar: `Project URL` y `anon public key`

2. **Configurar variables de entorno**
   ```bash
   # Copiar .env.example a .env.local en /frontend
   cp .env.example frontend/.env.local
   # Completar con tus credenciales de Supabase
   ```

3. **Ejecutar migraciones SQL**
   - Ir al dashboard de Supabase → SQL Editor
   - Ejecutar en orden:
     1. `supabase/migrations/001_users_profiles.sql`
     2. `supabase/migrations/002_projects.sql`
     3. `supabase/migrations/003_rls_policies.sql`

4. **Crear usuarios seed en Supabase Auth**
   - Ir a Authentication → Users → Invite user
   - O ejecutar vía SQL (ver instrucciones en `001_users_profiles.sql`)
   - Usuarios a crear:
     - `mscigliano@american-ads.com` / PIN: `3108` / rol: `DEV`
     - `nfernandez@american-ads.com` / PIN: `2026` / rol: `Admin`
     - `asangiacomo@american-ads.com` / PIN: `2026` / rol: `Lector`

5. **Habilitar Email Auth sin confirmación** (para PINs)
   - Authentication → Providers → Email
   - Desactivar "Confirm email" (si querés login inmediato sin email de verificación)

---

## 9. Archivos creados en Fase 0

```
frontend/src/lib/supabase.js          ← cliente Supabase
supabase/migrations/001_users_profiles.sql
supabase/migrations/002_projects.sql
supabase/migrations/003_rls_policies.sql
.env.example                          ← variables de entorno (raíz del proyecto)
MIGRACION_SUPABASE.md                 ← este archivo
```
