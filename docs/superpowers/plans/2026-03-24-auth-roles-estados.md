# Auth, Roles y Estados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mandatory login (JWT + httpOnly cookie), real roles (Lector/Admin/DEV), global dashboard state filter (Presupuestado/Realizado), a 5th KPI card, quarterly year-over-year chart, and DEV-only user management to the existing React+Express dashboard.

**Architecture:** SQLite stores users with bcrypt-hashed PINs; Express issues JWT in httpOnly cookies; all API routes are protected by middleware; React consumes user/session from AuthContext and passes a global `estado` filter to every data query.

**Tech Stack:** better-sqlite3, bcryptjs, jsonwebtoken, cookie-parser, react-router-dom, recharts (already installed)

**Spec:** `docs/superpowers/specs/2026-03-23-auth-roles-estados-design.md`

---

## File Map

### New — Backend
| File | Responsibility |
|------|----------------|
| `backend/db.js` | Open SQLite DB, create `users` table, seed 3 initial users |
| `backend/middleware/auth.js` | `requireAuth(req,res,next)` and `requireRole(...roles)` factory |
| `backend/routes/auth.js` | POST /login, POST /logout, GET /me |
| `backend/routes/users.js` | GET/POST/PUT/DELETE /users (DEV only) |
| `backend/.env` | JWT_SECRET=dev_secret_change_in_prod |
| `backend/.env.example` | JWT_SECRET=your_secret_here |

### New — Frontend
| File | Responsibility |
|------|----------------|
| `frontend/src/utils/api.js` | Axios instance with withCredentials + 401 interceptor |
| `frontend/src/context/AuthContext.jsx` | User session state, login(), logout() |
| `frontend/src/router.jsx` | Route definitions + ProtectedRoute wrapper |
| `frontend/src/pages/Login.jsx` | Login screen (email + 4-digit PIN) |
| `frontend/src/pages/UsersPage.jsx` | User management table (DEV only) |
| `frontend/src/components/UserModal.jsx` | Create/edit user modal |
| `frontend/src/components/ComparativoChart.jsx` | Q1-Q4 grouped bar chart vs previous year |

### Modified — Backend
| File | What changes |
|------|-------------|
| `backend/server.js` | Add dotenv, cookie-parser, CORS credentials, mount new routes, protect existing routes, JWT_SECRET guard |
| `backend/services/excelParser.js` | Add `estado`/`elemento` defaults, filter summary by estado, add comparativoAnual, add elemento filter to getProjects |

### Modified — Frontend
| File | What changes |
|------|-------------|
| `frontend/src/main.jsx` | Wrap in BrowserRouter, render Router component |
| `frontend/src/App.jsx` | Add estado global state, update header (greeting + estado selector + logout + users link), add 5th KPI, add ComparativoChart, pass estado everywhere |
| `frontend/src/hooks/useData.js` | Use api.js instance, pass estado to summary/projects, add elemento filter param |
| `frontend/src/components/ProjectsTable.jsx` | Add estado badge column, elemento column, fix delete permission (Admin+DEV), remove JEFE references |
| `frontend/src/components/ProjectModal.jsx` | Add estado <select> field, add elemento combobox (datalist), remove JEFE references |
| `frontend/src/components/Charts.jsx` | Accept and display data already filtered by estado (no internal change needed, just prop wiring) |
| `frontend/src/components/ExportButtons.jsx` | Accept `estado` prop, show "Vista: X" in PDF header |

---

## Task 1: Backend — SQLite DB + User Seed

**Files:**
- Create: `backend/db.js`
- Create: `backend/.env`
- Create: `backend/.env.example`

- [ ] **Step 1.1: Install dependencies**

```bash
cd /Users/matias/Dasboard/backend
npm install better-sqlite3 bcryptjs jsonwebtoken cookie-parser dotenv
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 1.1b: Ensure `data/` directory exists**

```bash
mkdir -p /Users/matias/Dasboard/data
```

- [ ] **Step 1.2: Create `.env`**

```
# backend/.env
JWT_SECRET=dev_secret_change_in_prod
```

- [ ] **Step 1.3: Create `.env.example`**

```
# backend/.env.example
JWT_SECRET=your_secret_here
```

- [ ] **Step 1.4: Create `backend/db.js`**

```js
// backend/db.js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/app.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('Lector', 'Admin', 'DEV'))
  )
`);

const SEED_USERS = [
  { nombre: 'Matias Scigliano', email: 'mscigliano@american-ads.com', pin: '3108', rol: 'DEV' },
  { nombre: 'Nahuel Fernandez', email: 'nfernandez@american-ads.com', pin: '2026', rol: 'Admin' },
  { nombre: 'Axel Sangiacomo', email: 'asangiacomo@american-ads.com', pin: '2026', rol: 'Lector' },
];

const count = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
if (count === 0) {
  const insert = db.prepare('INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)');
  for (const u of SEED_USERS) {
    const hash = bcrypt.hashSync(u.pin, 10);
    insert.run(u.nombre, u.email, hash, u.rol);
  }
  console.log('DB: seed users created');
}

module.exports = db;
```

- [ ] **Step 1.5: Verify DB creates correctly**

```bash
cd /Users/matias/Dasboard/backend
node -e "require('./db'); console.log('DB OK')"
```

Expected output: `DB: seed users created` then `DB OK`. File `data/app.db` should now exist.

```bash
ls -la /Users/matias/Dasboard/data/app.db
```

- [ ] **Step 1.6: Add `.gitignore` entries at project root**

Create or append to `/Users/matias/Dasboard/.gitignore`:

```
backend/.env
data/app.db
```

- [ ] **Step 1.7: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/db.js backend/.env.example backend/package.json backend/package-lock.json .gitignore
git commit -m "feat: add SQLite DB with users table and seed data"
```

---

## Task 2: Backend — Auth Middleware

**Files:**
- Create: `backend/middleware/auth.js`

- [ ] **Step 2.1: Create middleware directory and file**

```bash
mkdir -p /Users/matias/Dasboard/backend/middleware
```

- [ ] **Step 2.2: Write `backend/middleware/auth.js`**

```js
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, nombre, email, rol }
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Sesión inválida o expirada' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'No autenticado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: 'Sin permisos para esta acción' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
```

- [ ] **Step 2.3: Verify syntax**

```bash
cd /Users/matias/Dasboard/backend
node -e "const m = require('./middleware/auth'); console.log(typeof m.requireAuth, typeof m.requireRole)"
```

Expected: `function function`

- [ ] **Step 2.4: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/middleware/auth.js
git commit -m "feat: add requireAuth and requireRole middleware"
```

---

## Task 3: Backend — Auth Routes

**Files:**
- Create: `backend/routes/auth.js`

- [ ] **Step 3.1: Create routes directory**

```bash
mkdir -p /Users/matias/Dasboard/backend/routes
```

- [ ] **Step 3.2: Write `backend/routes/auth.js`**

```js
// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_DOMAIN = '@american-ads.com';
const PIN_REGEX = /^\d{4}$/;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, pin } = req.body;

  if (!email || !email.endsWith(ALLOWED_DOMAIN)) {
    return res.status(401).json({ success: false, error: 'Dominio no autorizado. Solo @american-ads.com' });
  }
  if (!pin || !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN inválido. Debe ser exactamente 4 dígitos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const valid = bcrypt.compareSync(pin, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ success: true, data: payload });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
```

- [ ] **Step 3.3: Verify syntax**

```bash
cd /Users/matias/Dasboard/backend
node -e "require('./routes/auth'); console.log('auth routes OK')"
```

Expected: `auth routes OK`

- [ ] **Step 3.4: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/routes/auth.js
git commit -m "feat: add auth routes (login, logout, me)"
```

---

## Task 4: Backend — Users Routes

**Files:**
- Create: `backend/routes/users.js`

- [ ] **Step 4.1: Write `backend/routes/users.js`**

```js
// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const PIN_REGEX = /^\d{4}$/;
const VALID_ROLES = ['Lector', 'Admin', 'DEV'];

// All users routes require DEV role
router.use(requireAuth, requireRole('DEV'));

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, nombre, email, rol FROM users ORDER BY id').all();
  res.json({ success: true, data: users });
});

// POST /api/users
router.post('/', (req, res) => {
  const { nombre, email, pin, rol } = req.body;

  if (!nombre || !email || !pin || !rol) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
  }
  if (!email.endsWith('@american-ads.com')) {
    return res.status(400).json({ success: false, error: 'Dominio no autorizado' });
  }
  if (!PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN debe ser exactamente 4 dígitos' });
  }
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ success: false, error: 'Rol inválido' });
  }

  const hash = bcrypt.hashSync(pin, 10);
  try {
    const result = db.prepare('INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre, email, hash, rol);
    const user = db.prepare('SELECT id, nombre, email, rol FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, pin, rol } = req.body;

  if (!nombre || !email || !rol) {
    return res.status(400).json({ success: false, error: 'Nombre, email y rol son requeridos' });
  }
  if (!email.endsWith('@american-ads.com')) {
    return res.status(400).json({ success: false, error: 'Dominio no autorizado' });
  }
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ success: false, error: 'Rol inválido' });
  }
  if (pin && !PIN_REGEX.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN debe ser exactamente 4 dígitos' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

  if (pin) {
    const hash = bcrypt.hashSync(pin, 10);
    db.prepare('UPDATE users SET nombre=?, email=?, password_hash=?, rol=? WHERE id=?')
      .run(nombre, email, hash, rol, id);
  } else {
    db.prepare('UPDATE users SET nombre=?, email=?, rol=? WHERE id=?')
      .run(nombre, email, rol, id);
  }

  const updated = db.prepare('SELECT id, nombre, email, rol FROM users WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(403).json({ success: false, error: 'No podés eliminar tu propio usuario' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 4.2: Verify syntax**

```bash
cd /Users/matias/Dasboard/backend
node -e "require('./routes/users'); console.log('users routes OK')"
```

Expected: `users routes OK`

- [ ] **Step 4.3: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/routes/users.js
git commit -m "feat: add users CRUD routes (DEV only)"
```

---

## Task 5: Backend — server.js Wiring

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 5.1: Replace `backend/server.js`**

```js
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { parseExcel, getSummary, readLocalData, writeLocalData } = require('./services/excelParser');
const { requireAuth, requireRole } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

// Guard: fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Auth routes (public)
app.use('/api/auth', authRouter);

// Users routes (DEV only, protected inside router)
app.use('/api/users', usersRouter);

function getProjects() {
  return parseExcel();
}

// GET all projects
app.get('/api/projects', requireAuth, (req, res) => {
  try {
    const projects = getProjects();
    const { año, cliente, sheet, elemento } = req.query;
    let filtered = projects;
    if (año) filtered = filtered.filter(p => String(p.año) === año);
    if (cliente) filtered = filtered.filter(p => p.cliente && p.cliente.toLowerCase().includes(cliente.toLowerCase()));
    if (sheet) filtered = filtered.filter(p => p.sheet === sheet);
    if (elemento) filtered = filtered.filter(p => p.elemento && p.elemento.toLowerCase().includes(elemento.toLowerCase()));
    res.json({ success: true, data: filtered, total: filtered.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET summary / KPIs
app.get('/api/summary', requireAuth, (req, res) => {
  try {
    const { estado } = req.query;
    const projects = getProjects();
    const filtered = estado ? projects.filter(p => p.estado === estado) : projects;
    const summary = getSummary(filtered);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET campaigns
app.get('/api/campaigns', requireAuth, (req, res) => {
  try {
    const projects = getProjects();
    const campaigns = [...new Set(projects.map(p => p.sheet).filter(Boolean))].sort();
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create project
app.post('/api/projects', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const localData = readLocalData();
    const newProject = {
      ...req.body,
      estado: req.body.estado || 'Presupuestado',
      id: crypto.randomUUID(),
      source: 'local',
      createdAt: new Date().toISOString(),
    };
    localData.push(newProject);
    writeLocalData(localData);
    res.json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT edit project
app.put('/api/projects/:id', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const { id } = req.params;
    const localData = readLocalData();
    const existing = localData.findIndex(p => p.id === id);
    const update = { ...req.body, id, updatedAt: new Date().toISOString() };

    if (existing >= 0) {
      localData[existing] = { ...localData[existing], ...update };
    } else {
      localData.push(update);
    }
    writeLocalData(localData);
    res.json({ success: true, data: update });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE project (soft delete)
app.delete('/api/projects/:id', requireAuth, requireRole('Admin', 'DEV'), (req, res) => {
  try {
    const { id } = req.params;
    const localData = readLocalData();
    const existing = localData.findIndex(p => p.id === id);

    if (existing >= 0) {
      localData[existing].deleted = true;
      localData[existing].deletedAt = new Date().toISOString();
    } else {
      localData.push({ id, deleted: true, deletedAt: new Date().toISOString() });
    }
    writeLocalData(localData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
```

- [ ] **Step 5.2: Verify server syntax and starts without errors**

```bash
cd /Users/matias/Dasboard/backend
# Syntax check first
node --check server.js && echo "Syntax OK"

# Start and test
node server.js > /tmp/backend.log 2>&1 &
sleep 2
curl -s http://localhost:3001/api/summary | head -c 100
# Cleanup
kill $(lsof -ti:3001) 2>/dev/null || true
```

Expected curl output: `{"success":false,"error":"No autenticado"}` (401 — auth works).
If server fails to start, check: `cat /tmp/backend.log`

- [ ] **Step 5.3: Test login + domain rejection**

```bash
cd /Users/matias/Dasboard/backend
node server.js > /tmp/backend.log 2>&1 &
sleep 2

# Test valid login
curl -s -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mscigliano@american-ads.com","pin":"3108"}'

echo ""

# Test domain rejection
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@gmail.com","pin":"1234"}'

# Cleanup
kill $(lsof -ti:3001) 2>/dev/null || true
```

Expected first output: `{"success":true,"data":{"id":1,"nombre":"Matias Scigliano","email":"mscigliano@american-ads.com","rol":"DEV"}}`
Expected second output: `{"success":false,"error":"Dominio no autorizado. Solo @american-ads.com"}`

- [ ] **Step 5.5: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/server.js
git commit -m "feat: wire auth/users routes, protect all API endpoints, add CORS credentials"
```

---

## Task 6: Backend — excelParser: estado, elemento, comparativoAnual

**Files:**
- Modify: `backend/services/excelParser.js`

- [ ] **Step 6.1: Add `estado` default to `buildProject` AND fix overlay merge**

**Part A:** In `buildProject`, after the `source: 'excel'` line, add:

```js
estado: 'Presupuestado',
```

**Part B:** In `parseExcel()`, the overlay merge currently reads:
```js
return deriveCalculated({ ...p, ...local, id: p.id, source: 'edited' });
```

Replace it with (preserves `estado` from local overlay if set, otherwise falls back to Excel default):
```js
return deriveCalculated({
  ...p,
  ...local,
  id: p.id,
  source: 'edited',
  estado: local.estado || p.estado || 'Presupuestado',
});
```

This ensures existing overlay entries created before this change (which have no `estado` field) correctly default to `Presupuestado` instead of `undefined`.

- [ ] **Step 6.2: Add `comparativoAnual` to `getSummary`**

Replace the `getSummary` function with:

```js
function getSummary(projects) {
  const valid = projects.filter(p => p.tarifa > 0 || p.totalProd > 0);

  const totalTarifa = valid.reduce((s, p) => s + (p.tarifa || 0), 0);
  const totalProd = valid.reduce((s, p) => s + (p.totalProd || 0), 0);
  const totalMargenAbs = valid.reduce((s, p) => s + (p.margenAbs || 0), 0);
  const margenPct = totalTarifa > 0 ? (totalMargenAbs / totalTarifa) * 100 : 0;

  const byCliente = {};
  for (const p of valid) {
    const key = p.cliente || 'Sin cliente';
    if (!byCliente[key]) byCliente[key] = { cliente: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byCliente[key].tarifa += p.tarifa || 0;
    byCliente[key].totalProd += p.totalProd || 0;
    byCliente[key].margen += p.margenAbs || 0;
    byCliente[key].count++;
  }

  const byCampaña = {};
  for (const p of valid) {
    const key = p.sheet || p.campaña || 'Sin campaña';
    if (!byCampaña[key]) byCampaña[key] = { campaña: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byCampaña[key].tarifa += p.tarifa || 0;
    byCampaña[key].totalProd += p.totalProd || 0;
    byCampaña[key].margen += p.margenAbs || 0;
    byCampaña[key].count++;
  }

  const byAño = {};
  for (const p of valid) {
    const key = p.año || 'Sin año';
    if (!byAño[key]) byAño[key] = { año: key, tarifa: 0, totalProd: 0, margen: 0, count: 0 };
    byAño[key].tarifa += p.tarifa || 0;
    byAño[key].totalProd += p.totalProd || 0;
    byAño[key].margen += p.margenAbs || 0;
    byAño[key].count++;
  }

  const años = [...new Set(valid.map(p => p.año).filter(Boolean))].sort();

  // Comparative chart: current year vs previous year, grouped by quarter
  // NOTE: projects currently only have year (no month), so all are assigned Q1.
  // When monthly dates are available, update getQuarter() to use p.fecha.
  function getQuarter(p) {
    if (p.fecha) {
      const month = new Date(p.fecha).getMonth() + 1;
      if (month <= 3) return 'Q1';
      if (month <= 6) return 'Q2';
      if (month <= 9) return 'Q3';
      return 'Q4';
    }
    return 'Q1'; // fallback: no date info
  }

  const añoActual = años.length > 0 ? Math.max(...años) : new Date().getFullYear();
  const añoAnterior = añoActual - 1;
  const emptyQuarters = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  const actualByQ = { ...emptyQuarters };
  const anteriorByQ = { ...emptyQuarters };

  for (const p of valid) {
    if (p.año === añoActual) actualByQ[getQuarter(p)] += p.tarifa || 0;
    if (p.año === añoAnterior) anteriorByQ[getQuarter(p)] += p.tarifa || 0;
  }

  const comparativoAnual = {
    añoActual,
    añoAnterior,
    actual: actualByQ,
    anterior: anteriorByQ,
  };

  return {
    totalProjects: valid.length,
    totalTarifa,
    totalProd,
    totalMargenAbs,
    margenPct: Math.round(margenPct * 10) / 10,
    años,
    byCliente: Object.values(byCliente).sort((a, b) => b.tarifa - a.tarifa),
    byCampaña: Object.values(byCampaña).sort((a, b) => b.tarifa - a.tarifa),
    byAño: Object.values(byAño).sort((a, b) => a.año - b.año),
    comparativoAnual,
  };
}
```

- [ ] **Step 6.3: Verify summary includes comparativoAnual**

```bash
cd /Users/matias/Dasboard/backend
node server.js &
sleep 2

# Login first to get cookie
curl -s -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mscigliano@american-ads.com","pin":"3108"}'

# Fetch summary with cookie
curl -s -b /tmp/cookies.txt "http://localhost:3001/api/summary?estado=Presupuestado" | \
  node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const r=JSON.parse(d); console.log('comparativoAnual:', JSON.stringify(r.data.comparativoAnual)); })"

kill %1
```

Expected: JSON with `comparativoAnual` containing `añoActual`, `añoAnterior`, `actual`, `anterior` with Q1-Q4 keys.

- [ ] **Step 6.4: Commit**

```bash
cd /Users/matias/Dasboard
git add backend/services/excelParser.js
git commit -m "feat: add estado default, comparativoAnual to getSummary, elemento filter"
```

---

## Task 7: Frontend — Axios Instance with Auth

**Files:**
- Create: `frontend/src/utils/api.js`

- [ ] **Step 7.1: Create `frontend/src/utils/api.js`**

```js
// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Redirect to login on any 401 (expired token, etc.)
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

- [ ] **Step 7.2: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/utils/api.js
git commit -m "feat: add axios instance with withCredentials and 401 interceptor"
```

---

## Task 8: Frontend — AuthContext

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 8.1: Create `frontend/src/context/AuthContext.jsx`**

```jsx
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, pin) {
    const res = await api.post('/api/auth/login', { email, pin });
    setUser(res.data.data);
  }

  async function logout() {
    await api.post('/api/auth/logout');
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 8.2: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: add AuthContext with login/logout and session check"
```

---

## Task 9: Frontend — Router + main.jsx

**Files:**
- Create: `frontend/src/router.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 9.1: Install react-router-dom**

```bash
cd /Users/matias/Dasboard/frontend
npm install react-router-dom
```

- [ ] **Step 9.2: Create `frontend/src/router.jsx`**

```jsx
// frontend/src/router.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import App from './App';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, onlyRole }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Verificando sesión…</span>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (onlyRole && user.rol !== onlyRole) return <Navigate to="/" replace />;

  return children;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute onlyRole="DEV">
          <UsersPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 9.3: Update `frontend/src/main.jsx`**

**Important:** The `router.jsx` file calls `useAuth()`, which requires `AuthProvider` to be an ancestor in the React tree. The `AuthProvider` wrapping below is mandatory — without it the app will throw `"useAuth must be used inside AuthProvider"` at runtime.

Read the current file first, then replace with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Router from './router'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 9.4: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/router.jsx frontend/src/main.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add react-router-dom, ProtectedRoute, AuthProvider wiring in main.jsx"
```

---

## Task 10: Frontend — Login Page

**Files:**
- Create: `frontend/src/pages/Login.jsx`

- [ ] **Step 10.1: Create pages directory**

```bash
mkdir -p /Users/matias/Dasboard/frontend/src/pages
```

- [ ] **Step 10.2: Create `frontend/src/pages/Login.jsx`**

```jsx
// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALLOWED_DOMAIN = '@american-ads.com';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError('Solo se permiten emails @american-ads.com');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('El PIN debe ser exactamente 4 dígitos numéricos');
      return;
    }

    setLoading(true);
    try {
      await login(email, pin);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.1em' }}>
            INNOVACIÓN & CREATIVIDAD
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '4px' }}>
            DASHBOARD EJECUTIVO
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Email corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@american-ads.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--mono)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              PIN (4 dígitos)
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '20px',
                letterSpacing: '0.4em',
                fontFamily: 'var(--mono)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
            />
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--mono)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              background: loading ? 'rgba(0,212,255,0.1)' : 'var(--accent)',
              color: loading ? 'var(--accent)' : '#080C10',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              fontFamily: 'var(--mono)',
              fontWeight: '700',
              fontSize: '12px',
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '4px',
            }}
          >
            {loading ? 'VERIFICANDO…' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 10.3: Verify login page renders**

Start frontend dev server (if not already running) and open `http://localhost:5173/login` in the browser. You should see the Dark Obsidian login form with email and PIN fields.

- [ ] **Step 10.4: Test full login flow in browser**

1. Go to `http://localhost:5173/login`
2. Enter `mscigliano@american-ads.com` + `3108`
3. Should redirect to `/` (dashboard)
4. Try `hacker@gmail.com` + `1234` → should show "Solo se permiten emails @american-ads.com"
5. Try valid email with wrong PIN → should show "Credenciales incorrectas"

- [ ] **Step 10.5: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/pages/Login.jsx
git commit -m "feat: add Login page with email/PIN validation and Dark Obsidian design"
```

---

## Task 11: Frontend — useData.js with Estado + api.js

**Files:**
- Modify: `frontend/src/hooks/useData.js`

- [ ] **Step 11.1: Replace `frontend/src/hooks/useData.js`**

```js
// frontend/src/hooks/useData.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useSummary(estado, refreshKey = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/summary', { params: { estado } })
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [estado, refreshKey]);

  return { data, loading };
}

export function useProjects(filters = {}, refreshKey = 0) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.año) params.año = filters.año;
    if (filters.cliente) params.cliente = filters.cliente;
    if (filters.sheet) params.sheet = filters.sheet;
    if (filters.elemento) params.elemento = filters.elemento;

    api.get('/api/projects', { params })
      .then(res => setData(res.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters.año, filters.cliente, filters.sheet, filters.elemento, refreshKey]);

  return { data, loading };
}

export function useCampaigns(refreshKey = 0) {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get('/api/campaigns').then(res => setData(res.data.data)).catch(() => {});
  }, [refreshKey]);
  return data;
}
```

- [ ] **Step 11.2: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/hooks/useData.js
git commit -m "feat: update useData to use api.js, pass estado to summary, add elemento filter"
```

---

## Task 12: Frontend — ComparativoChart

**Files:**
- Create: `frontend/src/components/ComparativoChart.jsx`

- [ ] **Step 12.1: Create `frontend/src/components/ComparativoChart.jsx`**

```jsx
// frontend/src/components/ComparativoChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatARS } from '../utils/format';

export default function ComparativoChart({ data }) {
  if (!data) return null;

  const { añoActual, añoAnterior, actual, anterior } = data;

  const chartData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
    trimestre: q,
    [añoActual]: actual[q] || 0,
    [añoAnterior]: anterior[q] || 0,
  }));

  const containerStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
  };

  const titleStyle = {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyle}>
      <p style={titleStyle}>Comparativo anual — {añoAnterior} vs {añoActual}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="trimestre" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => v === 0 ? '0' : `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [formatARS(value), name]}
            contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--mono)', fontSize: '11px' }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey={String(añoAnterior)} fill="rgba(100,116,139,0.5)" radius={[4,4,0,0]} />
          <Bar dataKey={String(añoActual)} fill="var(--accent)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ComparativoChart.jsx
git commit -m "feat: add ComparativoChart with Q1-Q4 grouped bars (current vs previous year)"
```

---

## Task 13: Frontend — App.jsx (Header, Estado Global, KPIs, Charts)

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 13.1: Replace `frontend/src/App.jsx`**

```jsx
// frontend/src/App.jsx
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import KPICard from './components/KPICard';
import ProjectsTable from './components/ProjectsTable';
import { ClientesChart, CampañasChart } from './components/Charts';
import ComparativoChart from './components/ComparativoChart';
import ExportButtons from './components/ExportButtons';
import ProjectModal from './components/ProjectModal';
import { useSummary, useProjects, useCampaigns } from './hooks/useData';
import { useAuth } from './context/AuthContext';
import { formatARS } from './utils/format';

const ESTADOS = ['Presupuestado', 'Realizado'];

const selectStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid rgba(0,212,255,0.2)',
  borderRadius: '8px',
  padding: '7px 28px 7px 12px',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontFamily: 'var(--mono)',
  outline: 'none',
  cursor: 'pointer',
};

export default function App() {
  const { user, logout } = useAuth();
  const [estado, setEstado] = useState('Presupuestado');
  const [filters, setFilters] = useState({ año: '', cliente: '', sheet: '', elemento: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState(null);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const { data: summary, loading: loadingSum } = useSummary(estado, refreshKey);
  const { data: projects, loading: loadingProj } = useProjects(filters, refreshKey);
  const campaigns = useCampaigns(refreshKey);

  const años = summary?.años || [];
  const canEdit = user?.rol === 'Admin' || user?.rol === 'DEV';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Header */}
      <header style={{
        background: 'var(--bg-base)',
        borderBottom: '1px solid rgba(0,212,255,0.2)',
        padding: '14px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.05em' }}>
              {user ? `Hola, ${user.nombre.split(' ')[0]}` : 'INNOVACIÓN & CREATIVIDAD'}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '2px' }}>
              {user ? `Estás viendo la vista de ${estado}` : 'DASHBOARD EJECUTIVO'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Estado global selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Vista
              </span>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                style={selectStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              >
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <ExportButtons projects={projects} summary={summary} estado={estado} />

            {user?.rol === 'DEV' && (
              <Link
                to="/users"
                style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', textDecoration: 'none', padding: '7px 12px', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; }}
              >
                Usuarios
              </Link>
            )}

            <button
              onClick={logout}
              style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--mono)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* KPI Cards — 5 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {loadingSum ? (
            [...Array(5)].map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', height: '112px', opacity: 0.4 }} />
            ))
          ) : (
            <>
              <KPICard title="Proyectos" value={summary?.totalProjects || 0} subtitle="registros" />
              <KPICard title="Tarifa Total" value={formatARS(summary?.totalTarifa)} subtitle="facturación" accent />
              <KPICard title="Producción" value={formatARS(summary?.totalProd)} subtitle="costo total" />
              <KPICard title="Margen" value={`${summary?.margenPct || 0}%`} subtitle="promedio" />
              <KPICard title="Ganancia Neta" value={formatARS(summary?.totalMargenAbs)} subtitle="tarifa − producción" accent />
            </>
          )}
        </div>

        {/* Charts */}
        {!loadingSum && summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Comparativo — full width */}
            <ComparativoChart data={summary.comparativoAnual} />
            {/* Clientes + Campañas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <ClientesChart data={summary.byCliente} />
              <CampañasChart data={summary.byCampaña} />
            </div>
          </div>
        )}

        {/* Table section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Filters bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>
              Filtros
            </span>

            <select value={filters.año} onChange={e => setFilter('año', e.target.value)} style={selectStyle}>
              <option value="">Todos los años</option>
              {años.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select value={filters.sheet} onChange={e => setFilter('sheet', e.target.value)} style={selectStyle}>
              <option value="">Todas las campañas</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
              type="text"
              placeholder="Buscar cliente…"
              value={filters.cliente}
              onChange={e => setFilter('cliente', e.target.value)}
              style={{ ...selectStyle, width: '160px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
            />

            <input
              type="text"
              placeholder="Buscar elemento…"
              value={filters.elemento}
              onChange={e => setFilter('elemento', e.target.value)}
              style={{ ...selectStyle, width: '160px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
            />

            {(filters.año || filters.sheet || filters.cliente || filters.elemento) && (
              <button
                onClick={() => setFilters({ año: '', cliente: '', sheet: '', elemento: '' })}
                style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', textDecoration: 'underline' }}
              >
                limpiar
              </button>
            )}

            <div style={{ flex: 1 }} />
            {canEdit && (
              <button
                onClick={() => setModal({ project: null })}
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontFamily: 'var(--mono)',
                  fontWeight: '600',
                  border: '1px solid var(--accent)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#080C10'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
              >
                + NUEVO
              </button>
            )}
          </div>

          <ProjectsTable
            projects={projects}
            loading={loadingProj}
            role={user?.rol}
            onEdit={(p) => setModal({ project: p })}
            onRefresh={refresh}
          />
        </div>
      </main>

      <footer style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>
          INNOVACIÓN & CREATIVIDAD · DASHBOARD V2
        </p>
      </footer>

      {modal && (
        <ProjectModal
          project={modal.project}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 13.2: Verify in browser**

Open `http://localhost:5173`. You should see:
- "Hola, Matias" in the header
- "Estás viendo la vista de Presupuestado"
- Selector "Vista" with Presupuestado/Realizado
- 5 KPI cards
- Comparativo chart above Clientes+Campañas
- Logout button
- "Usuarios" link (visible for DEV user)

Switch to "Realizado" in the selector — KPIs and charts should update.

- [ ] **Step 13.3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/App.jsx
git commit -m "feat: update App with estado global, greeting header, 5 KPIs, ComparativoChart, logout"
```

---

## Task 14: Frontend — ProjectsTable (Estado Badge + Elemento + Permisos)

**Files:**
- Modify: `frontend/src/components/ProjectsTable.jsx`

- [ ] **Step 14.1: Update table columns and permissions**

In `ProjectsTable.jsx`, make these changes:

**a) Header row** — the current column order is `Campaña | Cliente | ...`. Swap these so the new order is:
`Cliente | Campaña | Elemento | Producción | Tarifa | Margen | MG% | Estado | Acciones`

In `<thead>`, reorder the `<th>` elements to match this order exactly.

**b) Body rows** — reorder `<td>` cells to match the new column order. For `p.elemento`, render `{p.elemento || '—'}`.

**c) Estado badge** — the existing Estado `<th>` header label is already "Estado", but its corresponding `<td>` cell still renders `{p.situacion || '—'}`. Replace that cell content with:

```jsx
<span style={{
  fontSize: '10px',
  fontFamily: 'var(--mono)',
  padding: '3px 8px',
  borderRadius: '4px',
  border: `1px solid ${p.estado === 'Realizado' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
  color: p.estado === 'Realizado' ? 'var(--accent)' : 'var(--text-muted)',
  background: p.estado === 'Realizado' ? 'rgba(0,212,255,0.08)' : 'transparent',
  whiteSpace: 'nowrap',
}}>
  {p.estado || 'Presupuestado'}
</span>
```

**d) Delete permission** — change the condition from `role === 'DEV'` to `role === 'Admin' || role === 'DEV'` everywhere it appears.

**e) Edit/Actions visibility** — use `role === 'Admin' || role === 'DEV'` to show the Acciones column. For `Lector`, hide the column entirely (don't render the `<td>` or `<th>`).

- [ ] **Step 14.2: Verify in browser**

1. Log in as `asangiacomo@american-ads.com` (Lector, PIN 2026) → no Acciones column, no "+ NUEVO" button
2. Log in as `nfernandez@american-ads.com` (Admin, PIN 2026) → Acciones column visible with Edit + Delete
3. Log in as `mscigliano@american-ads.com` (DEV, PIN 3108) → same as Admin + "Usuarios" link

- [ ] **Step 14.3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ProjectsTable.jsx
git commit -m "feat: update ProjectsTable with estado badge, elemento column, Admin delete permission"
```

---

## Task 15: Frontend — ProjectModal (Estado Select + Elemento Combobox)

**Files:**
- Modify: `frontend/src/components/ProjectModal.jsx`

- [ ] **Step 15.1: Add ELEMENTOS_OPCIONES constant at top of file**

```js
// At the top of ProjectModal.jsx, after imports:
const ELEMENTOS_OPCIONES = [
  'Cartel',
  'Banner',
  'Lona',
  'Placa PAI',
  'Rollup',
  'Vinilo',
  'Display',
  'Backdrop',
  'Bandera',
  'Señalética',
];
```

- [ ] **Step 15.2: Add `estado` to initial form state — two locations**

The modal has two places where field values are set. Add `estado` to **both**:

**Location 1 — the `EMPTY` constant** (top of file, around line 6). Add:
```js
estado: 'Presupuestado',
```

**Location 2 — the `useEffect` that populates from an existing project** (around line 62). Add alongside the existing field assignments:
```js
estado: project?.estado || 'Presupuestado',
```

Note: `elemento` already exists in both locations — only `estado` needs to be added.

- [ ] **Step 15.3: Add Estado `<select>` field to modal form**

```jsx
<div>
  <label style={labelStyle}>Estado</label>
  <select
    value={form.estado}
    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
    style={inputStyle}
  >
    <option value="Presupuestado">Presupuestado</option>
    <option value="Realizado">Realizado</option>
  </select>
</div>
```

- [ ] **Step 15.4: Replace Elemento `<input>` with combobox (`<input>` + `<datalist>`)**

```jsx
<div>
  <label style={labelStyle}>Elemento</label>
  <input
    list="elementos-opciones"
    value={form.elemento}
    onChange={e => setForm(f => ({ ...f, elemento: e.target.value }))}
    placeholder="Seleccioná o escribí un elemento"
    style={inputStyle}
  />
  <datalist id="elementos-opciones">
    {ELEMENTOS_OPCIONES.map(opt => <option key={opt} value={opt} />)}
  </datalist>
</div>
```

- [ ] **Step 15.5: Update any `role === 'JEFE'` references to `role === 'Admin'`**

Search the file for `'JEFE'` and replace with `'Admin'`.

- [ ] **Step 15.6: Verify in browser**

Open the modal (click Edit on any row or "+ NUEVO"):
- Estado dropdown shows "Presupuestado" / "Realizado"
- Elemento field shows dropdown suggestions when typing, but also accepts free text

- [ ] **Step 15.7: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ProjectModal.jsx
git commit -m "feat: add estado select and elemento combobox to ProjectModal"
```

---

## Task 16: Frontend — ExportButtons (Estado in PDF)

**Files:**
- Modify: `frontend/src/components/ExportButtons.jsx`

- [ ] **Step 16.1: Add `estado` prop and show in PDF header**

**Note:** The PDF is generated as an HTML string opened in a new window — there is no jsPDF involved. The changes are to the HTML template string.

**Change 1:** Add `estado` to the component and `exportToPDF` function signatures:

```jsx
// Line 30: change
function exportToPDF(projects, summary) {
// to:
function exportToPDF(projects, summary, estado) {

// Line 94: change
export default function ExportButtons({ projects, summary }) {
// to:
export default function ExportButtons({ projects, summary, estado }) {
```

**Change 2:** In the `exportToPDF` function, find the `.sub` paragraph (line 53):
```js
<p class="sub">Dashboard Ejecutivo · ${new Date().toLocaleDateString(...)}</p>
```
Replace with:
```js
<p class="sub">Dashboard Ejecutivo · ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })} · Vista: ${estado || 'Presupuestado'}</p>
```

**Change 3:** In the button's `onClick`, pass `estado`:
```jsx
// Line 107: change
onClick={() => exportToPDF(projects, summary)}
// to:
onClick={() => exportToPDF(projects, summary, estado)}
```

- [ ] **Step 16.2: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ExportButtons.jsx
git commit -m "feat: show estado label in PDF export header"
```

---

## Note: Charts.jsx requires NO code changes

`Charts.jsx` exports `ClientesChart` and `CampañasChart`. Both receive their data as props (`summary.byCliente`, `summary.byCampaña`). Since the backend now filters by `estado` before computing these values, the charts automatically reflect the correct state. No modification to `Charts.jsx` is needed.

---

## Task 17: Frontend — UsersPage + UserModal

**Files:**
- Create: `frontend/src/pages/UsersPage.jsx`
- Create: `frontend/src/components/UserModal.jsx`

- [ ] **Step 17.1: Create `frontend/src/components/UserModal.jsx`**

```jsx
// frontend/src/components/UserModal.jsx
import { useState } from 'react';
import api from '../utils/api';

const ROLES = ['Lector', 'Admin', 'DEV'];

export default function UserModal({ user, onClose, onSaved }) {
  const isNew = !user;
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    pin: '',
    rol: user?.rol || 'Lector',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) return setError('El nombre es requerido');
    if (!form.email.endsWith('@american-ads.com')) return setError('Solo emails @american-ads.com');
    if (isNew && !/^\d{4}$/.test(form.pin)) return setError('PIN debe ser 4 dígitos');
    if (form.pin && !/^\d{4}$/.test(form.pin)) return setError('PIN debe ser 4 dígitos');

    setLoading(true);
    try {
      const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
      if (form.pin) payload.pin = form.pin;

      if (isNew) {
        await api.post('/api/users', payload);
      } else {
        await api.put(`/api/users/${user.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(8,12,16,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle = {
    background: 'var(--bg-surface)', border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
  };
  const inputStyle = {
    width: '100%', background: 'var(--bg-base)', border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)',
    fontSize: '13px', fontFamily: 'var(--mono)', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)',
    letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '5px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--accent)', marginBottom: '24px', letterSpacing: '0.1em' }}>
          {isNew ? 'NUEVO USUARIO' : 'EDITAR USUARIO'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" required />
          </div>
          <div>
            <label style={labelStyle}>Email corporativo</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@american-ads.com" required />
          </div>
          <div>
            <label style={labelStyle}>PIN {!isNew && '(dejar vacío para no cambiar)'}</label>
            <input
              style={{ ...inputStyle, letterSpacing: form.pin ? '0.4em' : 'normal', fontSize: form.pin ? '18px' : '13px' }}
              type="password"
              value={form.pin}
              onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={isNew ? '••••' : 'Sin cambios'}
              maxLength={4}
            />
          </div>
          <div>
            <label style={labelStyle}>Rol</label>
            <select style={inputStyle} value={form.rol} onChange={e => set('rol', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--mono)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080C10', fontFamily: 'var(--mono)', fontWeight: '700', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando…' : (isNew ? 'Crear' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 17.2: Create `frontend/src/pages/UsersPage.jsx`**

```jsx
// frontend/src/pages/UsersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import UserModal from '../components/UserModal';

export default function UsersPage() {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { user } | { user: null }

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get('/api/users')
      .then(res => setUsers(res.data.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(u) {
    if (!window.confirm(`¿Eliminar a ${u.nombre}?`)) return;
    try {
      await api.delete(`/api/users/${u.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  const thStyle = {
    padding: '10px 14px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em',
    fontFamily: 'var(--mono)', color: 'var(--text-muted)', background: 'var(--bg-base)', fontWeight: '500', textAlign: 'left',
  };
  const tdStyle = { padding: '12px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header style={{ background: 'var(--bg-base)', borderBottom: '1px solid rgba(0,212,255,0.2)', padding: '14px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.05em' }}>
              Gestión de Usuarios
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '2px' }}>
              Solo accesible para DEV
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', textDecoration: 'none', padding: '7px 12px', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px' }}>
              ← Dashboard
            </Link>
            <button onClick={logout} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--mono)' }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => setModal({ user: null })}
            style={{ padding: '8px 16px', fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: '600', border: '1px solid var(--accent)', borderRadius: '8px', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#080C10'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
          >
            + Nuevo usuario
          </button>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Cargando usuarios…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>{u.nombre}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--mono)',
                        border: `1px solid ${u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(0,212,255,0.7)' : 'var(--text-muted)',
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setModal({ user: u })}
                          style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--mono)' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? 'No podés eliminar tu propio usuario' : ''}
                          style={{ fontSize: '11px', color: u.id === currentUser?.id ? 'var(--text-muted)' : '#ff4d6d', background: 'none', border: `1px solid ${u.id === currentUser?.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,77,109,0.2)'}`, borderRadius: '6px', padding: '4px 10px', cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--mono)', opacity: u.id === currentUser?.id ? 0.4 : 1 }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal && (
        <UserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 17.3: Verify UsersPage in browser**

1. Log in as DEV (`mscigliano@american-ads.com` / `3108`)
2. Click "Usuarios" in header → should navigate to `/users`
3. Table shows 3 initial users
4. Click "+ Nuevo usuario" → modal opens
5. Try to delete your own user → button disabled with tooltip
6. Try navigating to `/users` while logged in as Admin → should redirect to `/`

- [ ] **Step 17.4: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/pages/UsersPage.jsx frontend/src/components/UserModal.jsx
git commit -m "feat: add UsersPage and UserModal for DEV user management"
```

---

## Task 18: Final Integration Test

- [ ] **Step 18.1: Full flow verification**

With both backend (port 3001) and frontend (port 5173) running:

1. **Unauthenticated access**: Navigate to `http://localhost:5173` → should redirect to `/login`
2. **Domain block**: Try `hacker@gmail.com` + `1234` → "Solo se permiten emails @american-ads.com"
3. **Wrong PIN**: Try `mscigliano@american-ads.com` + `9999` → "Credenciales incorrectas"
4. **DEV login**: `mscigliano@american-ads.com` / `3108` → dashboard with "Hola, Matias" + "Usuarios" link
5. **Estado switch**: Toggle Presupuestado ↔ Realizado → KPIs and charts update
6. **Lector login**: `asangiacomo@american-ads.com` / `2026` → no "+ NUEVO", no Acciones column
7. **Admin login**: `nfernandez@american-ads.com` / `2026` → "+ NUEVO" visible, Acciones visible, no "Usuarios" link
8. **Create project**: As Admin, click "+ NUEVO", fill form → appears in table with badge "Presupuestado"
9. **Edit estado**: Edit a project, change estado to "Realizado" → badge turns cyan
10. **User management**: As DEV, go to `/users`, create a new test user, edit it, delete it (not your own)
11. **Logout**: Click "Salir" → redirected to `/login`, can't access dashboard without re-login

- [ ] **Step 18.2: Final commit**

```bash
cd /Users/matias/Dasboard
git add -A
git commit -m "feat: complete auth/roles/estados system — login, JWT, roles, estado global, user management"
```
