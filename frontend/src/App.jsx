// frontend/src/App.jsx
import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import KPICard from './components/KPICard';
import ProjectsTable from './components/ProjectsTable';
import { ClientesChart, CampañasChart, GananciaNetaChart } from './components/Charts';
import ComparativoChart from './components/ComparativoChart';
import ExportButtons from './components/ExportButtons';
import ProjectModal from './components/ProjectModal';
import { useSummary, useProjects, useCampaigns } from './hooks/useData';
import { useAuth } from './context/AuthContext';
import { formatARS } from './utils/format';
import {
  AREAS,
  getAreasPermitidas,
  canEditInArea,
  canCreateAny,
  canSeeGastoEstructura,
  hasMultipleAreas,
  getDefaultArea,
  isFinanzas,
} from './utils/permissions';

const ESTADOS = ['Presupuestado', 'Realizado'];

// ─── Styles ──────────────────────────────────────────────────────────────────
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

// ─── Colores por área ─────────────────────────────────────────────────────────
const AREA_COLORS = {
  Creatividad: { bg: 'rgba(255,106,185,0.12)', border: 'rgba(255,106,185,0.4)', text: '#FF6AB9' },
  Producción:  { bg: 'rgba(99,179,237,0.12)',  border: 'rgba(99,179,237,0.4)',  text: '#63b3ed' },
  Trade:       { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.4)',  text: '#f97316' },
  Finanzas:    { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.4)',  text: '#34d399' },
  Comercial:   { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.4)', text: '#a78bfa' },
};

const AREA_LABELS = {
  Creatividad: 'Creatividad',
  Producción: 'Producción',
  Trade: 'Trade',
  Finanzas: 'Finanzas',
  Comercial: 'Comercial',
};

// ─── Area Switcher ────────────────────────────────────────────────────────────
function AreaSwitcher({ areas, activeArea, onSelect, showAll }) {
  const tabs = showAll ? [null, ...areas] : areas;

  return (
    <div
      className="area-switcher"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}
    >
      {tabs.map((area) => {
        const isActive = activeArea === area;
        const colors = area ? AREA_COLORS[area] : null;

        return (
          <button
            key={area ?? '__todas__'}
            onClick={() => onSelect(area)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'var(--sans)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: isActive
                ? `1px solid ${colors?.border || 'rgba(255,106,185,0.5)'}`
                : '1px solid rgba(255,255,255,0.08)',
              background: isActive
                ? (colors?.bg || 'rgba(255,106,185,0.12)')
                : 'transparent',
              color: isActive
                ? (colors?.text || '#FF6AB9')
                : 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,106,185,0.25)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            {area === null ? 'Todas' : AREA_LABELS[area] || area}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth();
  const [estado, setEstado] = useState('Presupuestado');
  const [filters, setFilters] = useState({
    año: '', cliente: '', sheet: '', elemento: '', op_numero: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState(null);

  // Área activa: inicializa desde el perfil del usuario
  const [activeArea, setActiveArea] = useState(() => getDefaultArea(user));

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  // ─── Permisos ───────────────────────────────────────────────────────────────
  const areasPermitidas = useMemo(() => getAreasPermitidas(user), [user]);
  const isDev = user?.rol === 'DEV';
  const showSwitcher = hasMultipleAreas(user);
  const showAll = isDev || isFinanzas(user); // "Todas" tab disponible
  const showGastoEstructura = canSeeGastoEstructura(user);

  // canCreate: puede crear en la vista actual
  const canCreate = useMemo(() => {
    if (!canCreateAny(user)) return false;
    if (isDev) return true;
    if (activeArea) return canEditInArea(user, activeArea);
    // Vista consolidada: Admin puede crear en su área principal
    return !!user?.area_principal;
  }, [user, isDev, activeArea]);

  // canEditProject: función por proyecto
  const canEditProject = useCallback(
    (project) => canEditInArea(user, project?.area),
    [user]
  );

  // Área por defecto al crear un proyecto nuevo
  const defaultAreaForNew = activeArea || user?.area_principal || AREAS[0];

  // ─── Restricción de área para queries ────────────────────────────────────────
  // null areasPermitidas = DEV (sin restricción)
  const areasQueryParam = isDev ? null : areasPermitidas;

  // ─── Datos ───────────────────────────────────────────────────────────────────
  const { data: summary, loading: loadingSum } = useSummary(
    estado,
    refreshKey,
    activeArea,
    areasQueryParam
  );

  const { data: projects, loading: loadingProj } = useProjects(
    {
      ...filters,
      estado,
      area: activeArea || undefined,
      areasPermitidas: !activeArea ? areasQueryParam : undefined,
    },
    refreshKey
  );

  const campaigns = useCampaigns(refreshKey, activeArea, areasQueryParam);

  const años = summary?.años || [];

  // ─── Labels de contexto ──────────────────────────────────────────────────────
  const viewLabel = activeArea
    ? `Dashboard ${AREA_LABELS[activeArea] || activeArea}`
    : isDev || isFinanzas(user)
      ? 'Vista Consolidada · Todas las áreas'
      : `Dashboard ${user?.area_principal || ''}`;

  const hasAnyFilter = filters.año || filters.sheet || filters.cliente || filters.elemento || filters.op_numero;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Header */}
      <header
        className="dashboard-header"
        style={{
          background: 'linear-gradient(135deg, rgba(255,106,185,0.1) 0%, rgba(9,9,16,0.97) 60%)',
          borderBottom: '1px solid rgba(255,106,185,0.2)',
          padding: '14px 32px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="header-inner" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="header-title">
            <h1
              style={{
                fontFamily: 'var(--display)',
                fontSize: '19px',
                color: 'var(--accent)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {user ? `Hola, ${user.nombre.split(' ')[0]}` : 'AMERICAN ADS'}
            </h1>
            <p
              className="header-subtitle"
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--sans)',
                fontWeight: 300,
                marginTop: '2px',
              }}
            >
              {viewLabel}
            </p>
          </div>

          <div className="header-actions">
            {/* Estado global selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="header-vista-label"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--sans)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Vista
              </span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,106,185,0.35)')}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <ExportButtons projects={projects} summary={summary} estado={estado} />

            {isDev && (
              <Link
                to="/users"
                style={{
                  fontSize: '13px',
                  color: '#FF6AB9',
                  fontFamily: 'var(--sans)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '7px 12px',
                  background: 'rgba(255,106,185,0.08)',
                  border: '1px solid rgba(255,106,185,0.2)',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,106,185,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,106,185,0.08)'; }}
              >
                Usuarios
              </Link>
            )}

            <button
              onClick={logout}
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                background: 'none',
                border: '1px solid rgba(255,106,185,0.3)',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,106,185,0.3)'; }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Area Switcher — secundaria bajo el header */}
        {showSwitcher && (
          <div
            className="area-switcher-bar"
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,106,185,0.08)',
              marginTop: '10px',
            }}
          >
            <AreaSwitcher
              areas={areasPermitidas}
              activeArea={activeArea}
              onSelect={setActiveArea}
              showAll={showAll}
            />
          </div>
        )}
      </header>

      <main
        className="dashboard-main"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >

        {/* KPI Cards */}
        <div
          className="kpi-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: showGastoEstructura ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)',
            gap: '14px',
          }}
        >
          {loadingSum ? (
            [...Array(showGastoEstructura ? 6 : 5)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  height: '112px',
                  opacity: 0.4,
                }}
              />
            ))
          ) : (
            <>
              <KPICard title="Proyectos"    value={summary?.totalProjects || 0}        subtitle="registros" />
              <KPICard title="Tarifa Total" value={formatARS(summary?.totalTarifa)}    subtitle="facturación" accent />
              <KPICard title="Producción"   value={formatARS(summary?.totalProd)}      subtitle="costo total" />
              <KPICard title="Margen"       value={`${summary?.margenPct || 0}%`}      subtitle="promedio" />
              <KPICard title="Ganancia Neta" value={formatARS(summary?.totalMargenAbs)} subtitle="tarifa − producción" accent />
              {showGastoEstructura && (
                <KPICard
                  title="Gasto de Estructura"
                  value={formatARS(summary?.totalGastoEstructura)}
                  subtitle="suma proyectos"
                />
              )}
            </>
          )}
        </div>

        {/* Charts */}
        {!loadingSum && summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Gráfico de ganancia neta por área — solo Finanzas/DEV en vista consolidada */}
            {showGastoEstructura && !activeArea && (
              <GananciaNetaChart data={summary.byArea} />
            )}
            <ComparativoChart data={summary.comparativoAnual} />
            <div
              className="charts-pair-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
            >
              <ClientesChart data={summary.byCliente} />
              <CampañasChart data={summary.byCampaña} />
            </div>
          </div>
        )}

        {/* Table section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Filters bar */}
          <div
            className="filters-bar"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
          >
            <span
              className="filter-section-label"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginRight: '4px',
              }}
            >
              Filtros
            </span>

            <select
              className="filter-select-item"
              value={filters.año}
              onChange={(e) => setFilter('año', e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Todos los años</option>
              {años.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              className="filter-select-item"
              value={filters.sheet}
              onChange={(e) => setFilter('sheet', e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Todas las campañas</option>
              {campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
              type="text"
              className="filter-input"
              placeholder="Buscar cliente…"
              value={filters.cliente}
              onChange={(e) => setFilter('cliente', e.target.value)}
              style={{ ...filterSelectStyle, width: '150px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            <input
              type="text"
              className="filter-input"
              placeholder="Buscar elemento…"
              value={filters.elemento}
              onChange={(e) => setFilter('elemento', e.target.value)}
              style={{ ...filterSelectStyle, width: '150px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            <input
              type="text"
              className="filter-input filter-op"
              placeholder="OP número…"
              value={filters.op_numero}
              onChange={(e) => setFilter('op_numero', e.target.value)}
              style={{ ...filterSelectStyle, width: '130px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            {hasAnyFilter && (
              <button
                onClick={() => setFilters({ año: '', cliente: '', sheet: '', elemento: '', op_numero: '' })}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  textDecoration: 'underline',
                }}
              >
                limpiar
              </button>
            )}

            <div className="filter-spacer" style={{ flex: 1 }} />

            {canCreate && (
              <button
                className="btn-nuevo"
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
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                + NUEVO
              </button>
            )}
          </div>

          <ProjectsTable
            projects={projects}
            loading={loadingProj}
            canEditProject={canEditProject}
            onEdit={(p) => setModal({ project: p })}
            onRefresh={refresh}
          />
        </div>
      </main>

      <footer
        className="dashboard-footer"
        style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px', textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          AMERICAN ADS · DASHBOARD V3
        </p>
      </footer>

      {modal && (
        <ProjectModal
          project={modal.project}
          defaultArea={defaultAreaForNew}
          showGastoEstructura={showGastoEstructura}
          user={user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
    </div>
  );
}
