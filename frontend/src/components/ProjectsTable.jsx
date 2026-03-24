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
