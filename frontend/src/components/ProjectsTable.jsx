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

  // Reset page when projects change (filter change)
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
    padding: '10px 14px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'var(--mono)',
    color: 'var(--text-muted)',
    background: 'var(--bg-base)',
    fontWeight: '500',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-10 text-center text-sm"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--mono)',
        }}
      >
        Cargando proyectos…
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
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
                style={{ borderTop: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.cliente || '—'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: '500' }}>
                  {p.sheet}
                  {p.source === 'local' && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--positive)', border: '1px solid var(--positive)', borderRadius: '3px', padding: '1px 4px' }}>NEW</span>
                  )}
                  {p.source === 'edited' && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: '3px', padding: '1px 4px' }}>EDT</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.elemento || '—'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                  {formatARS(p.totalProd)}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: '600' }}>
                  {formatARS(p.tarifa)}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--positive)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: '500' }}>
                  {formatARS(p.margenAbs)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--mono)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      border: `1px solid ${p.margenPct >= 0.35 ? 'var(--positive)' : p.margenPct >= 0.2 ? '#F59E0B' : 'var(--negative)'}`,
                      color: p.margenPct >= 0.35 ? 'var(--positive)' : p.margenPct >= 0.2 ? '#F59E0B' : 'var(--negative)',
                    }}
                  >
                    {formatPct(p.margenPct)}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
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
                </td>
                {(role === 'Admin' || role === 'DEV') && (
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(p)}
                        title="Editar"
                        style={{ color: 'var(--text-muted)', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <PencilIcon />
                      </button>
                      {(role === 'Admin' || role === 'DEV') && (
                        <button
                          onClick={() => handleDelete(p)}
                          title="Eliminar"
                          style={{ color: 'var(--text-muted)', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <TrashIcon />
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
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
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
                  fontFamily: 'var(--mono)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => !disabled && (e.target.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.target.style.borderColor = 'var(--border)')}
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
