import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatARS, formatPct } from '../utils/format';

const PER_PAGE = 15;

const AREA_COLORS = {
  Creatividad: { bg: 'rgba(255,106,185,0.1)',  border: 'rgba(255,106,185,0.35)', text: '#FF6AB9' },
  Producción:  { bg: 'rgba(99,179,237,0.1)',   border: 'rgba(99,179,237,0.35)',  text: '#63b3ed' },
  Trade:       { bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.35)',  text: '#f97316' },
  Finanzas:    { bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.35)',  text: '#34d399' },
  Comercial:   { bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.35)', text: '#a78bfa' },
};

function AreaBadge({ area }) {
  if (!area) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  const c = AREA_COLORS[area] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', text: 'var(--text-muted)' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '5px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: '11px',
        fontFamily: 'var(--sans)',
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {area}
    </span>
  );
}

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

/**
 * @param {object[]}  projects
 * @param {boolean}   loading
 * @param {function}  canEditProject — (project) => boolean
 * @param {function}  onEdit
 * @param {function}  onRefresh
 */
export default function ProjectsTable({ projects, loading, canEditProject, onEdit, onRefresh }) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [projects]);

  const total      = projects.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const paginated  = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete(project) {
    if (!window.confirm(`¿Eliminar "${project.cliente || project.sheet}"? Esta acción es reversible.`)) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted: true })
        .eq('id', project.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      alert('Error al eliminar: ' + (err.message || 'No se pudo eliminar'));
    }
  }

  const thStyle = {
    padding: '13px 12px',
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
          padding: '32px',
          textAlign: 'center',
        }}
      >
        Cargando proyectos…
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
          border: '1px solid rgba(255,106,185,0.15)',
          borderRadius: '12px',
          padding: '48px 32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'var(--sans)',
          fontSize: '14px',
        }}
      >
        No hay proyectos para los filtros seleccionados.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
        border: '1px solid rgba(255,106,185,0.15)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
          <thead>
            <tr
              style={{
                background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)',
                borderBottom: '1px solid rgba(255,106,185,0.15)',
              }}
            >
              <th style={thStyle}>Área</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Campaña</th>
              <th style={thStyle}>OP</th>
              <th style={thStyle}>Elemento</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Producción</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Tarifa</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Margen</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Mg%</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => {
              const campaignName  = p.sheet || p.campaña || '—';
              const totalProd     = p.total_prod    ?? p.totalProd    ?? 0;
              const margenAbs     = p.margen_abs    ?? p.margenAbs    ?? 0;
              const margenPct     = p.margen_pct    ?? p.margenPct    ?? 0;
              const canEdit       = typeof canEditProject === 'function' ? canEditProject(p) : false;

              return (
                <tr
                  key={p.id || i}
                  style={{ borderBottom: '1px solid rgba(255,106,185,0.06)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,106,185,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Área */}
                  <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                    <AreaBadge area={p.area} />
                  </td>

                  {/* Cliente */}
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: '#d1d5db', fontFamily: 'var(--sans)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.cliente || '—'}
                  </td>

                  {/* Campaña */}
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: '#FF6AB9', fontFamily: 'var(--sans)', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {campaignName}
                  </td>

                  {/* OP */}
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}>
                    {p.op_numero || '—'}
                  </td>

                  {/* Elemento */}
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.elemento || '—'}
                  </td>

                  {/* Producción */}
                  <td style={{ padding: '11px 12px', fontSize: '14px', color: '#e2e8f0', textAlign: 'right', fontFamily: 'var(--display)' }}>
                    {formatARS(totalProd)}
                  </td>

                  {/* Tarifa */}
                  <td style={{ padding: '11px 12px', fontSize: '14px', color: '#e2e8f0', textAlign: 'right', fontFamily: 'var(--display)' }}>
                    {formatARS(p.tarifa)}
                  </td>

                  {/* Margen ARS */}
                  <td style={{ padding: '11px 12px', fontSize: '14px', color: 'var(--positive)', textAlign: 'right', fontFamily: 'var(--display)' }}>
                    {formatARS(margenAbs)}
                  </td>

                  {/* Margen % */}
                  <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontFamily: 'var(--display)',
                        color:
                          margenPct >= 0.35
                            ? 'var(--positive)'
                            : margenPct >= 0.2
                              ? 'var(--warning)'
                              : 'var(--negative)',
                      }}
                    >
                      {formatPct(margenPct)}
                    </span>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '11px 12px' }}>
                    {p.estado === 'Realizado' ? (
                      <span style={{ background: 'linear-gradient(135deg, rgba(255,106,185,0.15), rgba(255,106,185,0.05))', border: '1px solid rgba(255,106,185,0.4)', color: '#FF6AB9', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                        {p.estado}
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                        {p.estado || 'Presupuestado'}
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '11px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {canEdit ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onEdit(p)}
                          title="Editar"
                          style={{
                            color: '#FF6AB9', border: '1px solid rgba(255,106,185,0.25)', borderRadius: '6px',
                            padding: '3px 8px', background: 'none', cursor: 'pointer',
                            fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px', transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.6)')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,106,185,0.25)')}
                        >
                          <PencilIcon /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Eliminar"
                          style={{
                            color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.2)', borderRadius: '6px',
                            padding: '3px 8px', background: 'none', cursor: 'pointer',
                            fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px', transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.5)')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,77,109,0.2)')}
                        >
                          <TrashIcon /> Eliminar
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
                        Solo lectura
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} de {total}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '←', action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
              { label: '→', action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages },
            ].map(({ label, action, disabled }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                style={{
                  padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--sans)',
                  border: '1px solid rgba(255,106,185,0.2)', borderRadius: '6px',
                  background: 'transparent',
                  color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1, transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => !disabled && (e.target.style.borderColor = 'rgba(255,106,185,0.5)')}
                onMouseLeave={(e) => (e.target.style.borderColor = 'rgba(255,106,185,0.2)')}
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
