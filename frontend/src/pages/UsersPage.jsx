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
                          style={{
                            fontSize: '11px',
                            color: u.id === currentUser?.id ? 'var(--text-muted)' : '#ff4d6d',
                            background: 'none',
                            border: `1px solid ${u.id === currentUser?.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,77,109,0.2)'}`,
                            borderRadius: '6px', padding: '4px 10px',
                            cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--mono)',
                            opacity: u.id === currentUser?.id ? 0.4 : 1,
                          }}
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
