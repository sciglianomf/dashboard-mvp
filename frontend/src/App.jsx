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
  const { data: projects, loading: loadingProj } = useProjects({ ...filters, estado }, refreshKey);
  const campaigns = useCampaigns(refreshKey);

  const años = summary?.años || [];
  const canEdit = user?.rol === 'Admin' || user?.rol === 'DEV';

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
        <div className="header-inner" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="header-title">
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '19px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {user ? `Hola, ${user.nombre.split(' ')[0]}` : 'INNOVACIÓN & CREATIVIDAD'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 300, marginTop: '2px' }}>
              {user ? `Estás viendo la vista de ${estado}` : 'DASHBOARD EJECUTIVO'}
            </p>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Estado global selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="header-vista-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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

      <main className="dashboard-main" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* KPI Cards — 5 cards */}
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Comparativo — full width */}
            <ComparativoChart data={summary.comparativoAnual} />
            {/* Clientes + Campañas */}
            <div className="charts-pair-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <ClientesChart data={summary.byCliente} />
              <CampañasChart data={summary.byCampaña} />
            </div>
          </div>
        )}

        {/* Table section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Filters bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              className="filter-section-label"
              style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}
            >
              Filtros
            </span>

            <select className="filter-select-item" value={filters.año} onChange={e => setFilter('año', e.target.value)} style={filterSelectStyle}>
              <option value="">Todos los años</option>
              {años.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select className="filter-select-item" value={filters.sheet} onChange={e => setFilter('sheet', e.target.value)} style={filterSelectStyle}>
              <option value="">Todas las campañas</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
              type="text"
              className="filter-input"
              placeholder="Buscar cliente…"
              value={filters.cliente}
              onChange={e => setFilter('cliente', e.target.value)}
              style={{ ...filterSelectStyle, width: '160px', backgroundImage: 'none', paddingRight: '12px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,106,185,0.15)')}
            />

            <input
              type="text"
              className="filter-input"
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

            <div className="filter-spacer" style={{ flex: 1 }} />
            {canEdit && (
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

      <footer className="dashboard-footer" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px', textAlign: 'center' }}>
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
