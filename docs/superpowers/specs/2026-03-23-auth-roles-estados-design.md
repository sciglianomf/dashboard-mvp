# Dashboard — Auth, Roles, Estados y Gestión de Usuarios

**Fecha:** 2026-03-23
**Proyecto:** Innovación & Creatividad — Dashboard Ejecutivo
**Stack:** React + Express + SQLite

---

## 1. Contexto

El dashboard existente tiene CRUD funcional con diseño Dark Obsidian, backend Express con fuente de datos Excel, y un selector de rol manual sin autenticación real. Este spec cubre la incorporación de:

- Login obligatorio con JWT httpOnly
- Roles reales desde base de datos
- Estado global obligatorio del dashboard (Presupuestado / Realizado)
- KPIs filtrados por estado
- Gráfico comparativo año anterior por trimestre
- Campo Elemento como combobox
- Columna Estado por registro
- Gestión de usuarios (solo DEV)

---

## 2. Migración de roles

El codebase existente usa los strings `GERENTE`, `JEFE`, `DEV`. Estos se reemplazan por completo:

| Rol anterior | Rol nuevo | Descripción |
|-------------|-----------|-------------|
| `GERENTE` | *(eliminado)* | — |
| `JEFE` | `Admin` | Puede agregar, modificar y eliminar |
| `DEV` | `DEV` | Acceso total, gestión de usuarios |
| *(ninguno)* | `Lector` | Solo visualización |

**Todos los archivos que referencian `'JEFE'` o `'GERENTE'` deben actualizarse a `'Admin'`.** Los archivos afectados son: `App.jsx`, `ProjectsTable.jsx`, `ProjectModal.jsx`.

---

## 3. Backend

### 3.1 Nuevas dependencias

```
better-sqlite3
bcryptjs
jsonwebtoken
cookie-parser
```

### 3.2 Base de datos SQLite

**Ubicación:** `data/app.db` (directorio raíz del proyecto, fuera de `backend/` y `frontend/`).

**Tabla `users`:**

| Campo | Tipo | Detalle |
|-------|------|---------|
| id | INTEGER PK AUTOINCREMENT | |
| nombre | TEXT NOT NULL | Nombre real |
| email | TEXT UNIQUE NOT NULL | Email corporativo |
| password_hash | TEXT NOT NULL | bcrypt del PIN de 4 dígitos (salt rounds: 10) |
| rol | TEXT NOT NULL | `Lector` \| `Admin` \| `DEV` |

**Seed inicial** (ejecutado al arrancar si la tabla está vacía):

| Nombre | Email | Rol | PIN |
|--------|-------|-----|-----|
| Matias Scigliano | mscigliano@american-ads.com | DEV | 3108 |
| Nahuel Fernandez | nfernandez@american-ads.com | Admin | 2026 |
| Axel Sangiacomo | asangiacomo@american-ads.com | Lector | 2026 |

### 3.3 Variables de entorno requeridas

El servidor debe fallar con error explícito al arrancar si `JWT_SECRET` no está definido:

```js
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
```

Archivo `.env` en `backend/`:
```
JWT_SECRET=cambiar_en_produccion
```

Archivo `.env.example` en `backend/`:
```
JWT_SECRET=your_secret_here
```

### 3.4 Configuración CORS

El `server.js` debe actualizar CORS para soportar cookies de credenciales:

```js
app.use(cors({
  origin: 'http://localhost:5173',  // origen del cliente Vite en desarrollo
  credentials: true
}));
```

Sin esto, el navegador rechazará las cookies httpOnly en requests cross-origin.

### 3.5 Endpoints de autenticación

| Método | Ruta | Descripción | Auth requerida |
|--------|------|-------------|----------------|
| POST | `/api/auth/login` | Valida email + PIN, devuelve JWT en cookie httpOnly | No |
| POST | `/api/auth/logout` | Limpia la cookie | No |
| GET | `/api/auth/me` | Devuelve usuario actual desde token | Sí |

**Login — validaciones en backend:**
- Email debe terminar en `@american-ads.com` → 401 `"Dominio no autorizado"`
- PIN debe pasar regex `/^\d{4}$/` → 400 `"PIN inválido"`
- Email no encontrado o PIN incorrecto → 401 `"Credenciales incorrectas"` (mensaje genérico, no distinguir entre los dos casos)
- JWT firmado con `JWT_SECRET`, expiración 8 horas
- Cookie: `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`

**Respuesta de `/api/auth/me`:**
```json
{ "id": 1, "nombre": "Matias Scigliano", "email": "mscigliano@american-ads.com", "rol": "DEV" }
```
Nunca incluir `password_hash` en respuestas de API.

### 3.6 Endpoints de gestión de usuarios

Todos requieren rol `DEV`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Lista todos los usuarios (sin password_hash) |
| POST | `/api/users` | Crea usuario nuevo |
| PUT | `/api/users/:id` | Edita usuario (contraseña: si se omite el campo, no se modifica) |
| DELETE | `/api/users/:id` | Elimina usuario |

**Regla de auto-eliminación:** `DELETE /api/users/:id` debe verificar en el backend que `id !== req.user.id`. Si coinciden → 403 `"No podés eliminar tu propio usuario"`. Esta validación debe existir en el backend independientemente del comportamiento del frontend.

### 3.7 Middleware

- `requireAuth` — verifica JWT en cookie; 401 si ausente o inválido. Cualquier 401 en el frontend debe disparar redirect a `/login`.
- `requireRole(...roles)` — verifica que `req.user.rol` esté en la lista; 403 si no
- Rutas GET `/api/projects` y `/api/summary`: protegidas con `requireAuth`
- Rutas POST/PUT/DELETE `/api/projects`: protegidas con `requireRole('Admin', 'DEV')`
- Rutas `/api/users`: protegidas con `requireRole('DEV')`

### 3.8 Modelo de proyecto — campos nuevos

Los proyectos incorporan dos campos nuevos en el overlay JSON:

| Campo | Tipo | Default |
|-------|------|---------|
| `estado` | `Presupuestado` \| `Realizado` | `Presupuestado` |
| `elemento` | string | `""` |

**Política para registros existentes del Excel:** los registros leídos del Excel que no tengan `estado` en el overlay JSON recibirán automáticamente `estado: "Presupuestado"`. Esto significa que al arrancar el sistema por primera vez, todos los registros históricos estarán en estado `Presupuestado` y el usuario DEV/Admin podrá cambiarlos manualmente a `Realizado` según corresponda.

Al crear un proyecto nuevo vía API, `estado` se inicializa siempre en `Presupuestado`.

### 3.9 API de summary — contrato completo

**Endpoint:** `GET /api/summary?estado=Presupuestado|Realizado`

El filtro `estado` se aplica **antes** de pasar los proyectos a `getSummary`. El route handler filtra el array de proyectos por `estado` y luego llama `getSummary(filteredProjects)`. Esto garantiza que `byCliente`, `byCampaña`, todos los KPIs **y `comparativoAnual`** solo reflejen proyectos del estado seleccionado. Es decir, en la vista "Realizado" el gráfico comparativo muestra solo proyectos realizados de ambos años; en "Presupuestado" solo los presupuestados. Esta es una decisión de diseño consciente: el usuario siempre ve datos coherentes con el estado global seleccionado.

**Respuesta adicional para el gráfico comparativo:**

```json
{
  "totalProjects": 42,
  "totalTarifa": 1500000,
  "totalProd": 800000,
  "totalMargenAbs": 700000,
  "margenPct": 46.7,
  "byCliente": [...],
  "byCampaña": [...],
  "años": [2024, 2025, 2026],
  "comparativoAnual": {
    "añoActual": 2026,
    "añoAnterior": 2025,
    "actual": { "Q1": 300000, "Q2": 450000, "Q3": 200000, "Q4": 0 },
    "anterior": { "Q1": 250000, "Q2": 380000, "Q3": 310000, "Q4": 420000 }
  }
}
```

- `añoActual` = año más reciente con datos (o año calendario actual si no hay datos)
- `añoAnterior` = `añoActual - 1`
- Trimestres calculados por campo `año` del proyecto y mes (Q1: ene-mar, Q2: abr-jun, Q3: jul-sep, Q4: oct-dic). Si los proyectos solo tienen año sin mes (como es el caso del Excel actual), todos se asignan a Q1 de ese año. Esta es una limitación conocida: cuando el modelo de datos incorpore fechas mensuales, la lógica se actualizará.
- Métrica: suma de `tarifa` por trimestre

### 3.10 Endpoint de proyectos — filtro por elemento

`GET /api/projects` acepta el nuevo query param `elemento` (string, filtro por coincidencia parcial case-insensitive). La lista de params queda:

| Param | Tipo | Descripción |
|-------|------|-------------|
| `año` | string | Filtro por año |
| `cliente` | string | Búsqueda parcial |
| `sheet` | string | Filtro por campaña |
| `elemento` | string | Búsqueda parcial |

---

## 4. Frontend

### 4.1 Nueva dependencia

```
react-router-dom
```

### 4.2 Estructura de rutas

```
/login          → <Login />          (pública)
/               → <App />            (protegida)
/users          → <UsersPage />      (protegida, solo DEV)
```

### 4.3 `main.jsx` (modificado)

`main.jsx` debe envolver la app en `<BrowserRouter>` y reemplazar el render directo de `<App />` por el componente router:

```jsx
import { BrowserRouter } from 'react-router-dom'
import Router from './router'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>
)
```

### 4.4 AuthContext (`src/context/AuthContext.jsx`)

```js
{
  user: { id, nombre, email, rol } | null,
  loading: boolean,  // true mientras se verifica /api/auth/me al inicio
  login(email, pin): Promise<void>,  // lanza error si falla
  logout(): Promise<void>
}
```

- Al montar, llama `GET /api/auth/me` una sola vez y guarda el resultado en `user`
- `loading: true` durante esa verificación inicial (evita flash de login)
- `ProtectedRoute` consume `user` y `loading` del contexto — NO hace fetch propio
- Si `loading: false` y `user: null` → redirige a `/login`
- Todos los requests de API deben incluir `credentials: 'include'` (o usar un axios instance configurado con `withCredentials: true`)
- Cualquier respuesta 401 de la API dispara `logout()` y redirige a `/login`

### 4.5 Pantalla de Login (`src/pages/Login.jsx`)

- Diseño Dark Obsidian consistente con el dashboard
- Campo email (type email)
- Campo PIN (type password, maxLength 4, pattern `\d{4}`)
- Validación de dominio en cliente antes de enviar: mostrar error inline si no es `@american-ads.com`
- Mensaje de error inline si el servidor rechaza las credenciales
- Sin opción de registro
- Al autenticar exitosamente → navegar a `/`

### 4.6 Header actualizado

```
INNOVACIÓN & CREATIVIDAD    [Presupuestado ▼]   [↓ Export]   [Usuarios]   [Logout]
Hola, Matias · Estás viendo la vista de Presupuestado
DASHBOARD EJECUTIVO
```

- Selector de estado global: `Presupuestado` | `Realizado`, sin opción vacía, default `Presupuestado`
- Nombre del usuario viene del `AuthContext`
- Link "Usuarios" visible solo para rol `DEV`
- Botón Logout: llama `POST /api/auth/logout` → limpia contexto → navega a `/login`

### 4.7 Estado global del dashboard

- `useState('Presupuestado')` en `App.jsx`
- Pasado como prop a: KPICard section, Charts, ProjectsTable, useData hooks, ExportButtons
- Nunca puede quedar vacío (el `<select>` del header no tiene `<option value="">`)

### 4.8 KPIs (5 cards)

| Card | Campo API | Nota |
|------|-----------|------|
| Cantidad de registros | `totalProjects` | |
| Tarifa total | `totalTarifa` | Facturación |
| Costo de producción | `totalProd` | |
| Margen promedio | `margenPct` | Porcentaje |
| Ganancia neta | `totalMargenAbs` | SUM(tarifa - producción). Reemplaza el subtitle existente por card dedicada |

La card "Margen" existente muestra `margenPct` como valor principal. El subtitle `formatARS(totalMargenAbs) + ' neto'` se elimina y se convierte en la quinta card "Ganancia neta" independiente. No hay datos duplicados.

Todos los KPIs filtrados por el `estado` global seleccionado vía `GET /api/summary?estado=...`.

### 4.9 Gráficos

1. **Comparativo año anterior** *(nuevo)* — `ComparativoChart.jsx`
   - Barras agrupadas por trimestre: Q1, Q2, Q3, Q4
   - Dos series: año actual (cyan `var(--accent)`) vs año anterior (gris `var(--text-muted)`)
   - Métrica: tarifa total por trimestre
   - Datos: `summary.comparativoAnual`
   - Layout: fila completa (span 2 columnas) encima de los otros dos gráficos

2. **Facturación por cliente** — `Charts.jsx` → `ClientesChart` (existente, recibe `estado` global)

3. **Top campañas** — `Charts.jsx` → `CampañasChart` (existente, recibe `estado` global)

Los gráficos 2 y 3 siguen en el mismo archivo `Charts.jsx`. No se divide el archivo.

### 4.10 Filtros

- Año | Cliente | Campaña | Elemento
- El filtro Elemento usa el nuevo query param `elemento` de la API
- Trabajan sobre los proyectos ya filtrados por el estado global

### 4.11 Tabla principal

**Columnas:** Cliente | Campaña | Elemento | Producción | Tarifa | Margen | MG% | Estado | Acciones

**Campo Elemento:**
- Implementado como `<input list="elementos-list">` + `<datalist>` con opciones predefinidas
- Permite escritura libre si la opción no está en la lista
- Opciones predefinidas: definidas en una constante `ELEMENTOS_OPCIONES` en el frontend (a completar con valores reales del negocio — se puede dejar como array vacío por ahora, editable por el DEV)

**Campo Estado (badge por fila):**
- `Presupuestado` → badge gris (`var(--text-muted)`, borde sutil)
- `Realizado` → badge cyan (`var(--accent)`, borde `var(--accent)`)
- Editable solo desde el modal de edición

**Botón "+ Agregar nuevo":** visible solo para `Admin` y `DEV`

**Acciones por fila:**
- `Lector`: columna Acciones oculta
- `Admin` / `DEV`: botones Editar y Eliminar

### 4.12 Gestión de usuarios (`src/pages/UsersPage.jsx`)

- Solo accesible para rol `DEV` (protegida en router)
- Tabla: Nombre | Email | Rol | Acciones
- Botón "+ Nuevo usuario" arriba a la derecha
- Modal `UserModal.jsx`: campos nombre, email, PIN (4 dígitos), rol
- Al editar: campo PIN con placeholder "Dejar vacío para no cambiar" — si se envía vacío, el backend no modifica el hash
- Botón Eliminar deshabilitado para el propio usuario (con tooltip "No podés eliminar tu propio usuario")
- Backend también rechaza auto-eliminación (ver sección 3.6)

### 4.12b Campo `situacion` vs `estado` en el modal

El `ProjectModal.jsx` existente tiene un campo `situacion` (texto libre, línea ~221). Este campo es independiente del nuevo campo `estado` (Presupuestado/Realizado):

- `situacion` → se mantiene como campo libre de texto (estado descriptivo interno del proyecto, ej: "en producción", "pausado")
- `estado` → nuevo campo `<select>` con dos opciones fijas: `Presupuestado` | `Realizado`

Ambos coexisten en el modal y en el modelo de datos.

### 4.12c Instancia axios compartida

Crear `frontend/src/utils/api.js` con una instancia axios configurada:

```js
import axios from 'axios'

const api = axios.create({ withCredentials: true })

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

Todos los hooks en `useData.js`, `AuthContext.jsx`, `UsersPage.jsx` deben importar y usar esta instancia en lugar de llamadas directas a `axios`.

### 4.13 Interceptor de 401

Toda la capa de fetch (o axios instance) debe incluir un interceptor que, ante cualquier respuesta HTTP 401, llame `logout()` del AuthContext y redirija a `/login`. Esto cubre tokens expirados (8 horas) sin que el usuario vea errores crypticos.

---

## 5. Permisos por rol

| Acción | Lector | Admin | DEV |
|--------|--------|-------|-----|
| Ver dashboard | ✓ | ✓ | ✓ |
| Agregar proyecto | — | ✓ | ✓ |
| Editar proyecto | — | ✓ | ✓ |
| Eliminar proyecto | — | ✓ | ✓ |
| Ver gestión usuarios | — | — | ✓ |
| Crear/editar/eliminar usuarios | — | — | ✓ |
| Cambiar contraseñas | — | — | ✓ |

---

## 6. Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- PIN validado con regex `/^\d{4}$/` en backend antes de intentar bcrypt.compare
- JWT en cookie httpOnly (no accesible por JS)
- Cookie `secure` activado automáticamente en `NODE_ENV === 'production'`
- Validación de dominio `@american-ads.com` en backend (no solo en frontend)
- Todas las rutas de API protegidas con middleware
- `JWT_SECRET` obligatorio en env, el servidor no arranca sin él
- CORS configurado con `credentials: true` y `origin` explícito
- Backend rechaza auto-eliminación de usuario independientemente del frontend
- No se expone `password_hash` en ninguna respuesta de API

---

## 7. Archivos a crear / modificar

### Nuevos
- `backend/.gitignore` (o agregar a raíz): incluir `backend/.env` y `data/app.db` en gitignore
- `backend/db.js` — inicialización SQLite, seed de usuarios
- `backend/middleware/auth.js` — requireAuth, requireRole
- `backend/routes/auth.js` — login, logout, me
- `backend/routes/users.js` — CRUD usuarios (solo DEV)
- `backend/.env` — JWT_SECRET
- `backend/.env.example` — JWT_SECRET placeholder
- `frontend/src/context/AuthContext.jsx` — estado global de sesión
- `frontend/src/utils/api.js` — instancia axios con withCredentials e interceptor 401
- `frontend/src/router.jsx` — configuración react-router-dom
- `frontend/src/pages/Login.jsx` — pantalla de login
- `frontend/src/pages/UsersPage.jsx` — gestión de usuarios
- `frontend/src/components/UserModal.jsx` — modal crear/editar usuario
- `frontend/src/components/ComparativoChart.jsx` — gráfico comparativo anual

### Modificados
- `backend/server.js` — cookie-parser, CORS con credentials, nuevas rutas, middleware global, guard JWT_SECRET. Agregar `requireAuth` a `GET /api/campaigns` también.
- `backend/services/excelParser.js` — campos estado/elemento con defaults, filtro estado en summary, comparativoAnual en respuesta, filtro elemento en getProjects
- `frontend/src/main.jsx` — BrowserRouter + Router component (mantener StrictMode existente)
- `frontend/src/App.jsx` — estado global, header con selector estado/logout/usuarios, 5 KPIs, ComparativoChart, AuthContext, filtro elemento
- `frontend/src/components/Charts.jsx` — recibe y aplica estado global
- `frontend/src/components/ProjectModal.jsx` — campos estado y elemento, roles Admin/DEV → reemplaza JEFE. Ver nota sobre situacion vs estado.
- `frontend/src/components/ProjectsTable.jsx` — columnas estado/elemento, permisos con Admin → reemplaza JEFE. Reemplazar `{p.situacion}` por badge de `{p.estado}`. Botón Eliminar visible para Admin Y DEV (no solo DEV como en el código actual).
- `frontend/src/components/ExportButtons.jsx` — recibe `estado` como prop; mostrarlo en el encabezado del PDF exportado ("Vista: Presupuestado / Realizado")
- `frontend/src/hooks/useData.js` — pasa estado global como query param a todas las llamadas; usar instancia axios compartida con `withCredentials: true` y el interceptor 401
