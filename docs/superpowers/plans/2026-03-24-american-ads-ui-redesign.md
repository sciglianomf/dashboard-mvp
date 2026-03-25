# American ADS Gradient Tech UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the dashboard visual identity from cyan/Inter/JetBrains Mono to magenta/Anton/Archivo following the American ADS Gradient Tech design system, touching 12 frontend files with zero functional changes.

**Architecture:** This is a pure visual migration. All 12 files are modified in-place; no new files are created. Changes flow: (1) CSS design tokens first so every component picks up updated `var(--accent)`, `var(--border)`, etc. automatically; (2) components one at a time so each can be visually verified before moving on. No backend files are touched.

**Tech Stack:** React 18, Vite, Tailwind CSS v4 (utility classes kept where they exist), Recharts, Google Fonts (Anton + Archivo), inline React styles (project pattern).

---

## File Map

| File | Status | Changes |
|------|--------|---------|
| `frontend/src/index.css` | Modify | Font imports, 15 CSS token updates, scrollbar, select SVG |
| `frontend/src/components/KPICard.jsx` | Modify | Gradient bg, orb, bottom line, fonts, hover colors |
| `frontend/src/App.jsx` | Modify | Header gradient/blur, all cyan→magenta, + Nuevo button |
| `frontend/src/components/Charts.jsx` | Modify | CYAN_SHADES→PINK_SHADES, tooltip, ticks, cursor |
| `frontend/src/components/ComparativoChart.jsx` | Modify | Bar fills, font families throughout |
| `frontend/src/components/ProjectsTable.jsx` | Modify | Container/thead gradients, th/td styles, badges, buttons |
| `frontend/src/components/ProjectModal.jsx` | Modify | Dialog glow, input borders, button states, fonts |
| `frontend/src/pages/Login.jsx` | Modify | Card gradient + orb, fonts, button gradient, inputs |
| `frontend/src/pages/UsersPage.jsx` | Modify | Header, row hover, role badges, all cyan replacements |
| `frontend/src/components/UserModal.jsx` | Modify | Same as ProjectModal + fix Guardar button colors |
| `frontend/src/components/ExportButtons.jsx` | Modify | PDF template cyan replacements, button style |
| `frontend/src/router.jsx` | Modify | Single `var(--mono)` → `var(--sans)` |

---

## Verification Strategy

No automated test suite exists. Each task ends with:
1. A grep command verifying no old values remain in that file
2. After all tasks: full grep across the entire frontend to confirm zero cyan/mono leaks
3. Visual check via `npm run dev` at `http://localhost:5173`

---

## Task 1: CSS Design Tokens and Typography Foundation

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Replace the entire `index.css` with the updated version**

```css
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@300;400;600;700&display=swap');
@import "tailwindcss";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-base: #090910;
  --bg-surface: #0c0c14;
  --bg-surface-2: #111920;
  --border: rgba(255,106,185,0.15);
  --border-subtle: rgba(255,255,255,0.04);
  --border-accent: rgba(255,106,185,0.30);
  --accent: #FF6AB9;
  --accent-dim: rgba(255,106,185,0.08);
  --accent-gradient: linear-gradient(135deg, #FF6AB9, #e040a0);
  --text-primary: #E2E8F0;
  --text-muted: #6b7280;
  --text-secondary: #9ca3af;
  --positive: #34d399;
  --warning: #f59e0b;
  --negative: #FF4D6D;
  --sans: 'Archivo', system-ui, sans-serif;
  --display: 'Anton', sans-serif;
  --mono: 'Archivo', system-ui, sans-serif;
}

body {
  font-family: var(--sans);
  background-color: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: rgba(255,106,185,0.2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,106,185,0.4); }

/* Select native reset */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px !important;
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|JetBrains\|Inter\|4A6080\|00FF88\|0D1117\|080C10" /Users/matias/Dasboard/frontend/src/index.css
```

Expected: no output (zero matches).

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/index.css
git commit -m "feat: update CSS design tokens to American ADS Gradient Tech (magenta, Anton/Archivo)"
```

---

## Task 2: KPICard — Gradient Tech Card Style

**Files:**
- Modify: `frontend/src/components/KPICard.jsx`

- [ ] **Step 1: Replace the entire `KPICard.jsx` with the updated version**

```jsx
export default function KPICard({ title, value, subtitle, accent = false }) {
  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-300 group cursor-default overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.13) 0%, rgba(9,9,16,0.95) 100%)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(255,106,185,0.12), 0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'rgba(255,106,185,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Decorative orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: 65, height: 65,
        background: 'rgba(255,106,185,0.12)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '11px' }}
      >
        {title}
      </p>

      <p
        className="leading-none mb-2 tracking-tight"
        style={{
          fontFamily: 'var(--display)',
          fontSize: '30px',
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {value}
      </p>

      {subtitle && (
        <p style={{ color: '#FF6AB9', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 300 }}>
          {subtitle}
        </p>
      )}

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #FF6AB9, transparent)',
        borderRadius: '0 0 12px 12px',
      }} />
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|var(--mono)\|JetBrains\|text-3xl\|font-bold" /Users/matias/Dasboard/frontend/src/components/KPICard.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/KPICard.jsx
git commit -m "feat: KPICard Gradient Tech — gradient bg, orb, bottom accent line, Anton/Archivo fonts"
```

---

## Task 3: App.jsx — Header, Filters, Buttons

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Replace the entire `App.jsx` with the updated version**

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
  background: 'linear-gradient(135deg, rgba(255,106,185,0.12), rgba(9,9,16,0.95))',
  border: '1px solid rgba(255,106,185,0.35)',
  borderRadius: '8px',
  padding: '7px 28px 7px 12px',
  color: '#FF6AB9',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  fontWeight: 600,
  outline: 'none',
  cursor: 'pointer',
};

const filterSelectStyle = {
  background: 'rgba(255,106,185,0.05)',
  border: '1px solid rgba(255,106,185,0.15)',
  borderRadius: '8px',
  padding: '7px 28px 7px 12px',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
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
        background: 'linear-gradient(135deg, rgba(255,106,185,0.1) 0%, rgba(9,9,16,0.97) 60%)',
        borderBottom: '1px solid rgba(255,106,185,0.2)',
        padding: '14px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '19px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {user ? `Hola, ${user.nombre.split(' ')[0]}` : 'INNOVACIÓN & CREATIVIDAD'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 300, marginTop: '2px' }}>
              {user ? `Estás viendo la vista de ${estado}` : 'DASHBOARD EJECUTIVO'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Estado global selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Vista
              </span>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                style={selectStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.35)')}
              >
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <ExportButtons projects={projects} summary={summary} estado={estado} />

            {user?.rol === 'DEV' && (
              <Link
                to="/users"
                style={{ fontSize: '13px', color: '#FF6AB9', fontFamily: 'var(--sans)', fontWeight: 600, textDecoration: 'none', padding: '7px 12px', background: 'rgba(255,106,185,0.08)', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,106,185,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,106,185,0.08)'; }}
              >
                Usuarios
              </Link>
            )}

            <button
              onClick={logout}
              style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(255,106,185,0.3)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,106,185,0.3)'; }}
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>
              Filtros
            </span>

            <select value={filters.año} onChange={e => setFilter('año', e.target.value)} style={filterSelectStyle}>
              <option value="">Todos los años</option>
              {años.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select value={filters.sheet} onChange={e => setFilter('sheet', e.target.value)} style={filterSelectStyle}>
              <option value="">Todas las campañas</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
              type="text"
              placeholder="Buscar cliente…"
              value={filters.cliente}
              onChange={e => setFilter('cliente', e.target.value)}
              style={{ ...filterSelectStyle, width: '160px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            <input
              type="text"
              placeholder="Buscar elemento…"
              value={filters.elemento}
              onChange={e => setFilter('elemento', e.target.value)}
              style={{ ...filterSelectStyle, width: '160px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            {(filters.año || filters.sheet || filters.cliente || filters.elemento) && (
              <button
                onClick={() => setFilters({ año: '', cliente: '', sheet: '', elemento: '' })}
                style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'underline' }}
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
                  fontSize: '13px',
                  fontFamily: 'var(--sans)',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FF6AB9, #e040a0)',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
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
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.1em' }}>
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

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|JetBrains\|080C10" /Users/matias/Dasboard/frontend/src/App.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/App.jsx
git commit -m "feat: App.jsx — header Gradient Tech, magenta filters, gradient + Nuevo button"
```

---

## Task 4: Charts.jsx — Pink Shades and Tooltip

**Files:**
- Modify: `frontend/src/components/Charts.jsx`

- [ ] **Step 1: Replace the entire `Charts.jsx` with the updated version**

```jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { formatARS } from '../utils/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255,106,185,0.2)',
        fontFamily: 'var(--sans)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.name === 'Margen' ? 'var(--positive)' : 'var(--accent)' }}>
          {entry.name}: {formatARS(entry.value)}
        </p>
      ))}
    </div>
  );
}

const PINK_SHADES = [
  '#FF6AB9', '#F05EAA', '#E0529B', '#D0468C', '#C03A7D',
  '#B02E6E', '#A0225F', '#901650', '#800A41', '#700032',
];

export function ClientesChart({ data }) {
  const chartData = (data || [])
    .filter(c => c.cliente !== 'Sin cliente')
    .slice(0, 8)
    .map(c => ({
      name: c.cliente.length > 20 ? c.cliente.slice(0, 20) + '…' : c.cliente,
      Tarifa: c.tarifa,
      Margen: c.margen,
    }));

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest font-medium mb-5"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px' }}
      >
        Facturación por Cliente
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }} barGap={2}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            angle={-40}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,106,185,0.04)' }} />
          <Bar dataKey="Tarifa" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Margen" fill="var(--positive)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampañasChart({ data }) {
  const chartData = (data || []).slice(0, 10).map((c, i) => ({
    name: c.campaña.length > 18 ? c.campaña.slice(0, 18) + '…' : c.campaña,
    Tarifa: c.tarifa,
    color: PINK_SHADES[i % PINK_SHADES.length],
  }));

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest font-medium mb-5"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px' }}
      >
        Top Campañas
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => `$${(v/1e6).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,106,185,0.04)' }} />
          <Bar dataKey="Tarifa" radius={[0, 3, 3, 0]} maxBarSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|CYAN_SHADES\|4A6080\|var(--mono)\|0,212,255" /Users/matias/Dasboard/frontend/src/components/Charts.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/Charts.jsx
git commit -m "feat: Charts.jsx — PINK_SHADES, magenta tooltip/cursor, Archivo axis fonts"
```

---

## Task 5: ComparativoChart.jsx — Bar Colors and Fonts

**Files:**
- Modify: `frontend/src/components/ComparativoChart.jsx`

- [ ] **Step 1: Replace the entire `ComparativoChart.jsx` with the updated version**

```jsx
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
    fontFamily: 'var(--sans)',
    fontSize: '11px',
    fontWeight: 600,
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
          <XAxis dataKey="trimestre" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => v === 0 ? '0' : `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [formatARS(value), name]}
            contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '8px', fontFamily: 'var(--sans)', fontSize: '11px' }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--sans)', fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey={String(añoAnterior)} fill="rgba(255,106,185,0.3)" radius={[4,4,0,0]} />
          <Bar dataKey={String(añoActual)} fill="var(--accent)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|var(--mono)\|4A6080\|100,116,139" /Users/matias/Dasboard/frontend/src/components/ComparativoChart.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ComparativoChart.jsx
git commit -m "feat: ComparativoChart.jsx — magenta bar fills, Archivo fonts, magenta tooltip border"
```

---

## Task 6: ProjectsTable.jsx — Gradient Container, Typography, Badges, Buttons

**Files:**
- Modify: `frontend/src/components/ProjectsTable.jsx`

- [ ] **Step 1: Replace the entire `ProjectsTable.jsx` with the updated version**

```jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatARS, formatPct } from '../utils/format';

const PER_PAGE = 15;

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function ProjectsTable({ projects, loading, role, onEdit, onRefresh }) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [projects]);

  const total = projects.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const paginated = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete(project) {
    if (!window.confirm(`¿Eliminar "${project.cliente || project.sheet}"? Esta acción es reversible.`)) return;
    try {
      await api.delete(`/api/projects/${project.id}`);
      onRefresh();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  const thStyle = {
    padding: '13px 16px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'var(--sans)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-10 text-center text-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
          border: '1px solid rgba(255,106,185,0.15)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--sans)',
        }}
      >
        Cargando proyectos…
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
        border: '1px solid rgba(255,106,185,0.15)',
        borderRadius: '12px',
      }}
    >
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)',
              borderBottom: '1px solid rgba(255,106,185,0.15)',
            }}>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Campaña</th>
              <th style={thStyle}>Elemento</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Producción</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Tarifa</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Margen</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Mg%</th>
              <th style={thStyle}>Estado</th>
              {(role === 'Admin' || role === 'DEV') && <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => (
              <tr
                key={p.id || i}
                style={{ borderBottom: '1px solid rgba(255,106,185,0.06)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,106,185,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db', fontFamily: 'var(--sans)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.cliente || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#FF6AB9', fontFamily: 'var(--sans)', fontWeight: 600 }}>
                  {p.sheet}
                  {p.source === 'local' && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--positive)', border: '1px solid var(--positive)', borderRadius: '3px', padding: '1px 4px' }}>NEW</span>
                  )}
                  {p.source === 'edited' && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: '3px', padding: '1px 4px' }}>EDT</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.elemento || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '15px', color: '#e2e8f0', textAlign: 'right', fontFamily: 'var(--display)' }}>
                  {formatARS(p.totalProd)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '15px', color: '#e2e8f0', textAlign: 'right', fontFamily: 'var(--display)' }}>
                  {formatARS(p.tarifa)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '15px', color: 'var(--positive)', textAlign: 'right', fontFamily: 'var(--display)' }}>
                  {formatARS(p.margenAbs)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '15px',
                      fontFamily: 'var(--display)',
                      color: p.margenPct >= 0.35 ? 'var(--positive)' : p.margenPct >= 0.2 ? 'var(--warning)' : 'var(--negative)',
                    }}
                  >
                    {formatPct(p.margenPct)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {p.estado === 'Realizado' ? (
                    <span style={{
                      background: 'linear-gradient(135deg, rgba(255,106,185,0.15), rgba(255,106,185,0.05))',
                      border: '1px solid rgba(255,106,185,0.4)',
                      color: '#FF6AB9',
                      fontFamily: 'var(--sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.estado}
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.estado || 'Presupuestado'}
                    </span>
                  )}
                </td>
                {(role === 'Admin' || role === 'DEV') && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(p)}
                        title="Editar"
                        style={{
                          color: '#FF6AB9',
                          border: '1px solid rgba(255,106,185,0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          background: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--sans)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.6)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.25)')}
                      >
                        <PencilIcon /> Editar
                      </button>
                      {(role === 'Admin' || role === 'DEV') && (
                        <button
                          onClick={() => handleDelete(p)}
                          title="Eliminar"
                          style={{
                            color: '#ff4d6d',
                            border: '1px solid rgba(255,77,109,0.2)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            background: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--sans)',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.5)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.2)')}
                        >
                          <TrashIcon /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} de {total}
          </span>
          <div className="flex gap-2">
            {[
              { label: '←', action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
              { label: '→', action: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages },
            ].map(({ label, action, disabled }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--sans)',
                  border: '1px solid rgba(255,106,185,0.2)',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => !disabled && (e.target.style.borderColor = 'rgba(255,106,185,0.5)')}
                onMouseLeave={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|4A6080\|0D1117" /Users/matias/Dasboard/frontend/src/components/ProjectsTable.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ProjectsTable.jsx
git commit -m "feat: ProjectsTable.jsx — gradient container/thead, Anton numbers, magenta badges and buttons"
```

---

## Task 7: ProjectModal.jsx — Glow, Magenta Inputs, Gradient Button

**Files:**
- Modify: `frontend/src/components/ProjectModal.jsx`

- [ ] **Step 1: Replace the entire `ProjectModal.jsx` with the updated version**

```jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatARS, formatPct } from '../utils/format';

const ELEMENTOS_OPCIONES = [
  'Cartel', 'Banner', 'Lona', 'Placa PAI', 'Rollup',
  'Vinilo', 'Display', 'Backdrop', 'Bandera', 'Señalética',
];

const EMPTY = {
  cliente: '', campaña: '', elemento: '', formato: '',
  costoInn: '', costoPlacaPai: '', costoLona: '', ws: '', confiPct: '',
  tarifa: '', observaciones: '', situacion: '', estado: 'Presupuestado', año: new Date().getFullYear(),
};

function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '11px' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const labelStyle = {
  color: 'var(--text-muted)',
  fontFamily: 'var(--sans)',
  fontWeight: 600,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid rgba(255,106,185,0.2)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
    />
  );
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const isNew = !project?.id || project.source === undefined;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        cliente: project.cliente || '',
        campaña: project.campaña || '',
        elemento: project.elemento || '',
        formato: project.formato || '',
        costoInn: project.costoInn ?? '',
        costoPlacaPai: project.costoPlacaPai ?? '',
        costoLona: project.costoLona ?? '',
        ws: project.ws ?? '',
        confiPct: project.confiPct ?? '',
        tarifa: project.tarifa ?? '',
        observaciones: project.observaciones || '',
        situacion: project.situacion || '',
        estado: project?.estado || 'Presupuestado',
        año: project.año || new Date().getFullYear(),
      });
    }
  }, [project]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const num = (v) => parseFloat(v) || 0;
  const totalProd = num(form.costoInn) + num(form.costoPlacaPai) + num(form.costoLona) + num(form.ws) + num(form.confiPct);
  const margenAbs = num(form.tarifa) - totalProd;
  const margenPct = num(form.tarifa) > 0 ? margenAbs / num(form.tarifa) : 0;

  const isValid = form.cliente.trim() !== '' && num(form.tarifa) > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        costoInn: num(form.costoInn),
        costoPlacaPai: num(form.costoPlacaPai),
        costoLona: num(form.costoLona),
        ws: num(form.ws),
        confiPct: num(form.confiPct),
        tarifa: num(form.tarifa),
        año: parseInt(form.año),
        sheet: project?.sheet || form.campaña || 'Local',
      };
      if (isNew || !project?.id) {
        await api.post('/api/projects', payload);
      } else {
        await api.put(`/api/projects/${project.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(255,106,185,0.2)',
          maxHeight: '90vh',
          boxShadow: '0 0 60px rgba(255,106,185,0.12)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,106,185,0.15)' }}
        >
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: 'var(--accent)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '11px' }}
          >
            {isNew ? '+ Nuevo Proyecto' : 'Editar Proyecto'}
          </p>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.target.style.color = 'var(--text-muted)')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Cliente *">
              <Input value={form.cliente} onChange={set('cliente')} placeholder="Ej: Disney" />
              {!form.cliente.trim() && <p className="text-xs" style={{ color: 'var(--negative)' }}>Requerido</p>}
            </FieldGroup>
            <FieldGroup label="Campaña">
              <Input value={form.campaña} onChange={set('campaña')} placeholder="Ej: Mandalorian" />
            </FieldGroup>
            <FieldGroup label="Elemento">
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
            </FieldGroup>
            <FieldGroup label="Formato">
              <Input value={form.formato} onChange={set('formato')} placeholder="Ej: Mupi" />
            </FieldGroup>
          </div>

          <div
            className="h-px"
            style={{ background: 'var(--border-subtle)' }}
          />

          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '11px' }}
          >
            Costos (ARS)
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Costo Inn.', 'costoInn'],
              ['Costo Placa PAI', 'costoPlacaPai'],
              ['Costo Lona', 'costoLona'],
              ['WS', 'ws'],
              ['Confi $', 'confiPct'],
              ['Tarifa *', 'tarifa'],
            ].map(([label, key]) => (
              <FieldGroup key={key} label={label}>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder="0"
                />
              </FieldGroup>
            ))}
          </div>

          {/* Calculated preview */}
          <div
            className="rounded-xl p-4 grid grid-cols-3 gap-3"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
          >
            {[
              ['Total Prod.', formatARS(totalProd), 'var(--text-primary)'],
              ['Margen ARS', formatARS(margenAbs), margenAbs >= 0 ? 'var(--positive)' : 'var(--negative)'],
              ['Margen %', formatPct(margenPct), margenPct >= 0.3 ? 'var(--positive)' : margenPct >= 0 ? '#F59E0B' : 'var(--negative)'],
            ].map(([label, val, color]) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px' }}>{label}</p>
                <p style={{ color, fontFamily: 'var(--display)', fontSize: '16px' }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Situación">
              <Input value={form.situacion} onChange={set('situacion')} placeholder="Ej: En producción" />
            </FieldGroup>
            <FieldGroup label="Año">
              <Input type="number" value={form.año} onChange={set('año')} />
            </FieldGroup>
          </div>

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

          <FieldGroup label="Observaciones">
            <textarea
              value={form.observaciones}
              onChange={set('observaciones')}
              placeholder="Notas adicionales..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--sans)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
            />
          </FieldGroup>

          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--negative)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,106,185,0.15)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,106,185,0.2)',
              background: 'transparent',
              fontFamily: 'var(--sans)',
            }}
            onMouseEnter={e => (e.target.style.borderColor = 'rgba(255,106,185,0.4)')}
            onMouseLeave={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isValid ? 'linear-gradient(135deg, #FF6AB9, #e040a0)' : 'rgba(255,106,185,0.1)',
              color: isValid ? '#fff' : 'rgba(255,106,185,0.4)',
              border: isValid ? 'none' : '1px solid rgba(255,106,185,0.15)',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--sans)',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|080C10" /Users/matias/Dasboard/frontend/src/components/ProjectModal.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ProjectModal.jsx
git commit -m "feat: ProjectModal.jsx — magenta glow/inputs, gradient Guardar button, Archivo fonts"
```

---

## Task 8: Login.jsx — Gradient Card, Orb, Anton Title, Gradient Button

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

- [ ] **Step 1: Replace the entire `Login.jsx` with the updated version**

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
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255,106,185,0.08) 0%, rgba(9,9,16,1) 60%)',
        border: '1px solid rgba(255,106,185,0.2)',
        borderRadius: '14px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        overflow: 'hidden',
      }}>
        {/* Decorative orb */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: 150, height: 150,
          background: 'rgba(255,106,185,0.08)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '21px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            INNOVACIÓN & CREATIVIDAD
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 300, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            DASHBOARD EJECUTIVO
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
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
                border: '1px solid rgba(255,106,185,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
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
                border: '1px solid rgba(255,106,185,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '22px',
                letterSpacing: '0.4em',
                fontFamily: 'var(--sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--sans)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              background: loading ? 'rgba(255,106,185,0.1)' : 'linear-gradient(135deg, #FF6AB9, #e040a0)',
              color: loading ? 'var(--accent)' : '#fff',
              border: loading ? '1px solid rgba(255,106,185,0.3)' : 'none',
              borderRadius: '8px',
              fontFamily: 'var(--sans)',
              fontWeight: '700',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
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

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|080C10\|JetBrains" /Users/matias/Dasboard/frontend/src/pages/Login.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/pages/Login.jsx
git commit -m "feat: Login.jsx — gradient card, decorative orb, Anton title, magenta gradient button"
```

---

## Task 9: UsersPage.jsx — Header, Row Hover, Role Badges

**Files:**
- Modify: `frontend/src/pages/UsersPage.jsx`

- [ ] **Step 1: Replace the entire `UsersPage.jsx` with the updated version**

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
  const [modal, setModal] = useState(null);

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
    padding: '13px 16px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'var(--sans)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textAlign: 'left',
    background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)',
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: 'var(--sans)',
    color: '#d1d5db',
    borderBottom: '1px solid rgba(255,106,185,0.06)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.1) 0%, rgba(9,9,16,0.97) 60%)',
        borderBottom: '1px solid rgba(255,106,185,0.2)',
        padding: '14px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '19px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Gestión de Usuarios
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 300, marginTop: '2px' }}>
              Solo accesible para DEV
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', textDecoration: 'none', padding: '7px 12px', border: '1px solid rgba(255,106,185,0.3)', borderRadius: '8px' }}>
              ← Dashboard
            </Link>
            <button onClick={logout} style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(255,106,185,0.3)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => setModal({ user: null })}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontFamily: 'var(--sans)',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF6AB9, #e040a0)',
              color: '#fff',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            + Nuevo usuario
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
          border: '1px solid rgba(255,106,185,0.15)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '13px' }}>Cargando usuarios…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,106,185,0.15)' }}>
                  {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,106,185,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>{u.nombre}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--sans)',
                        fontWeight: 600,
                        border: `1px solid ${u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(255,106,185,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(255,106,185,0.7)' : 'var(--text-muted)',
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setModal({ user: u })}
                          style={{
                            fontSize: '12px',
                            color: '#FF6AB9',
                            background: 'none',
                            border: '1px solid rgba(255,106,185,0.25)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontFamily: 'var(--sans)',
                            fontWeight: 600,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.6)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.25)')}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? 'No podés eliminar tu propio usuario' : ''}
                          style={{
                            fontSize: '12px',
                            color: u.id === currentUser?.id ? 'var(--text-muted)' : '#ff4d6d',
                            background: 'none',
                            border: `1px solid ${u.id === currentUser?.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,77,109,0.2)'}`,
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--sans)',
                            fontWeight: 600,
                            opacity: u.id === currentUser?.id ? 0.4 : 1,
                          }}
                          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.5)')}
                          onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.2)')}
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

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|080C10" /Users/matias/Dasboard/frontend/src/pages/UsersPage.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/pages/UsersPage.jsx
git commit -m "feat: UsersPage.jsx — gradient header, magenta row hover, updated role badges and buttons"
```

---

## Task 10: UserModal.jsx — Magenta Borders, Gradient Button, Archivo Fonts

**Files:**
- Modify: `frontend/src/components/UserModal.jsx`

- [ ] **Step 1: Replace the entire `UserModal.jsx` with the updated version**

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
    background: 'var(--bg-surface)',
    border: '1px solid rgba(255,106,185,0.2)',
    boxShadow: '0 0 60px rgba(255,106,185,0.12)',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
  };
  const inputStyle = {
    width: '100%',
    background: 'var(--bg-base)',
    border: '1px solid rgba(255,106,185,0.2)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--sans)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--sans)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '5px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: '17px', color: 'var(--accent)', marginBottom: '24px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {isNew ? 'NUEVO USUARIO' : 'EDITAR USUARIO'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input
              style={inputStyle}
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Juan Pérez"
              required
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Email corporativo</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="usuario@american-ads.com"
              required
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
            />
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
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Rol</label>
            <select
              style={inputStyle}
              value={form.rol}
              onChange={e => set('rol', e.target.value)}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--sans)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px',
                background: 'transparent',
                border: '1px solid rgba(255,106,185,0.2)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.2)')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '9px',
                background: 'linear-gradient(135deg, #FF6AB9, #e040a0)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'var(--sans)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando…' : (isNew ? 'Crear' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|var(--mono)\|080C10" /Users/matias/Dasboard/frontend/src/components/UserModal.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/UserModal.jsx
git commit -m "feat: UserModal.jsx — magenta borders/glow, gradient Guardar button, Archivo fonts, white text"
```

---

## Task 11: ExportButtons.jsx — PDF Template and Button Styles

**Files:**
- Modify: `frontend/src/components/ExportButtons.jsx`

- [ ] **Step 1: Replace the entire `ExportButtons.jsx` with the updated version**

```jsx
import * as XLSX from 'xlsx';

function exportToExcel(projects) {
  const rows = projects.map(p => ({
    'Campaña': p.sheet,
    'Cliente': p.cliente || '',
    'Campaña (nombre)': p.campaña || '',
    'Elemento': p.elemento || '',
    'Formato': p.formato || '',
    'Cantidad': p.cantidad,
    'Costo Innovación': p.costoInn,
    'Costo Placa PAI': p.costoPlacaPai,
    'Costo Lona': p.costoLona,
    'Total Producción': p.totalProd,
    'Tarifa': p.tarifa,
    'Margen ARS': p.margenAbs,
    'Margen %': p.margenPct ? (p.margenPct * 100).toFixed(1) + '%' : '',
    'Situación': p.situacion || '',
    'Observaciones': p.observaciones || '',
    'Año': p.año,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Array(17).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
  XLSX.writeFile(wb, `inn-creatividad-${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportToPDF(projects, summary, estado) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Dashboard Innovación & Creatividad</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Archivo', sans-serif; background: #090910; color: #E2E8F0; padding: 32px; }
  h1 { font-family: 'Anton', sans-serif; font-size: 20px; color: #FF6AB9; margin-bottom: 4px; letter-spacing: 0.1em; }
  .sub { color: #6b7280; font-size: 12px; font-family: 'Archivo', sans-serif; margin-bottom: 28px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { background: linear-gradient(135deg, rgba(255,106,185,0.13), rgba(9,9,16,0.95)); border: 1px solid rgba(255,106,185,0.25); border-radius: 10px; padding: 14px; }
  .kpi-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Archivo', sans-serif; margin-bottom: 6px; }
  .kpi-value { font-size: 22px; font-family: 'Anton', sans-serif; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: rgba(255,106,185,0.08); text-align: left; padding: 8px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-family: 'Archivo', sans-serif; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .r { text-align: right; font-family: 'Anton', sans-serif; }
  .green { color: #34d399; }
  .pink { color: #FF6AB9; font-weight: 600; }
  .wrap { background: rgba(255,106,185,0.04); border: 1px solid rgba(255,106,185,0.15); border-radius: 12px; overflow: hidden; }
</style>
</head><body>
<h1>INNOVACIÓN & CREATIVIDAD</h1>
<p class="sub">Dashboard Ejecutivo · ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })} · Vista: ${estado || 'Presupuestado'}</p>
<div class="kpis">
  <div class="kpi"><div class="kpi-label">Proyectos</div><div class="kpi-value">${summary?.totalProjects || 0}</div></div>
  <div class="kpi"><div class="kpi-label">Tarifa Total</div><div class="kpi-value" style="color:#FF6AB9">$${((summary?.totalTarifa||0)/1e6).toFixed(1)}M</div></div>
  <div class="kpi"><div class="kpi-label">Producción</div><div class="kpi-value">$${((summary?.totalProd||0)/1e6).toFixed(1)}M</div></div>
  <div class="kpi"><div class="kpi-label">Margen</div><div class="kpi-value" style="color:#34d399">${summary?.margenPct||0}%</div></div>
</div>
<div class="wrap">
<table>
<thead><tr><th>Campaña</th><th>Cliente</th><th>Elemento</th><th class="r">Producción</th><th class="r">Tarifa</th><th class="r">Margen</th><th class="r">Mg%</th></tr></thead>
<tbody>
${projects.slice(0, 60).map(p => `<tr>
  <td class="pink">${p.sheet}</td>
  <td>${p.cliente||'—'}</td>
  <td style="color:#6b7280">${p.elemento||p.formato||'—'}</td>
  <td class="r" style="color:#6b7280">$${((p.totalProd||0)/1e6).toFixed(1)}M</td>
  <td class="r"><strong>$${((p.tarifa||0)/1e6).toFixed(1)}M</strong></td>
  <td class="r green">$${((p.margenAbs||0)/1e6).toFixed(1)}M</td>
  <td class="r">${p.margenPct?(p.margenPct*100).toFixed(1)+'%':'—'}</td>
</tr>`).join('')}
</tbody>
</table>
</div>
${projects.length > 60 ? `<p style="color:#6b7280;font-size:11px;margin-top:8px;font-family:Archivo,sans-serif">+ ${projects.length-60} proyectos más</p>` : ''}
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

const btnBase = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  fontFamily: 'var(--sans)', border: '1px solid rgba(255,106,185,0.3)',
  background: 'transparent', color: '#9ca3af',
};

export default function ExportButtons({ projects, summary, estado }) {
  return (
    <div className="flex gap-2">
      <button
        style={btnBase}
        onClick={() => exportToExcel(projects)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.6)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.3)'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        ↓ Excel
      </button>
      <button
        style={btnBase}
        onClick={() => exportToPDF(projects, summary, estado)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.6)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,106,185,0.3)'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        ↓ PDF
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "00D4FF\|0,212,255\|JetBrains\|var(--mono)\|4A6080\|0D1117\|080C10\|00FF88" /Users/matias/Dasboard/frontend/src/components/ExportButtons.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/components/ExportButtons.jsx
git commit -m "feat: ExportButtons.jsx — PDF template migrated to magenta/Anton/Archivo, button style updated"
```

---

## Task 12: router.jsx — Single Font Token Fix

**Files:**
- Modify: `frontend/src/router.jsx`

- [ ] **Step 1: Replace `var(--mono)` with `var(--sans)` in the spinner span**

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
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '13px' }}>Verificando sesión…</span>
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

- [ ] **Step 2: Verify no old values remain**

```bash
grep -n "var(--mono)\|00D4FF" /Users/matias/Dasboard/frontend/src/router.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/matias/Dasboard
git add frontend/src/router.jsx
git commit -m "feat: router.jsx — replace var(--mono) with var(--sans) in loading spinner"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run full grep to confirm zero cyan/mono leaks across entire frontend**

```bash
grep -rn "00D4FF\|0,212,255\|JetBrains\|4A6080\|00FF88\|0D1117\|080C10" /Users/matias/Dasboard/frontend/src/
```

Expected: **zero matches** (except `--mono` token definition in `index.css` which is set to `Archivo` — that's acceptable).

- [ ] **Step 2: Confirm var(--mono) only exists in index.css token definition**

```bash
grep -rn "var(--mono)" /Users/matias/Dasboard/frontend/src/
```

Expected: zero matches (all usages should have been replaced with `var(--sans)` or `var(--display)`).

- [ ] **Step 3: Start dev server and visually verify**

```bash
cd /Users/matias/Dasboard/frontend && npm run dev
```

Open `http://localhost:5173` and verify:
- Login page: dark card with orb, Anton title "INNOVACIÓN & CREATIVIDAD" in magenta, magenta gradient button
- Dashboard: magenta header gradient, KPI cards with gradient bg + orb + bottom line, pink charts
- Table: gradient thead, Anton numbers, labeled edit/delete buttons, magenta/grey estado badges
- Hover states: KPI glow, row highlight, button border brightens

- [ ] **Step 4: Final commit**

```bash
cd /Users/matias/Dasboard
git add -A
git commit -m "feat: American ADS Gradient Tech UI redesign complete — magenta, Anton/Archivo, gradients"
```
