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
    padding: '13px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
    fontFamily: 'var(--sans)', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left',
  };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--sans)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(255,106,185,0.08) 0%, rgba(9,9,16,0.95) 100%)',
        borderBottom: '1px solid rgba(255,106,185,0.2)',
        padding: '14px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '20px', color: 'var(--accent)', letterSpacing: '0.05em' }}>
              GESTIÓN DE USUARIOS
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', marginTop: '2px' }}>
              Solo accesible para DEV
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', textDecoration: 'none', padding: '7px 12px', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '8px' }}>
              ← Dashboard
            </Link>
            <button onClick={logout} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => setModal({ user: null })}
            style={{ padding: '8px 16px', fontSize: '12px', fontFamily: 'var(--sans)', fontWeight: '600', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #FF6AB9, #e040a0)', color: '#fff', cursor: 'pointer' }}
          >
            + Nuevo usuario
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255,106,185,0.08) 0%, rgba(9,9,16,0.95) 100%)',
          border: '1px solid rgba(255,106,185,0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '12px' }}>Cargando usuarios…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)', borderBottom: '1px solid rgba(255,106,185,0.15)' }}>
                  {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,106,185,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>{u.nombre}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--sans)', fontWeight: 600,
                        border: `1px solid ${u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(255,106,185,0.35)' : 'rgba(255,255,255,0.1)'}`,
                        color: u.rol === 'DEV' ? 'var(--accent)' : u.rol === 'Admin' ? 'rgba(255,106,185,0.75)' : 'var(--text-muted)',
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setModal({ user: u })}
                          style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--sans)' }}
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
                            fontFamily: 'var(--sans)',
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
