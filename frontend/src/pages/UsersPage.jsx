import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error cargando usuarios:', error);
      setUsers([]);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="users-page-inner"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px 48px',
        }}
      >
        <div
          className="users-page-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1
              className="users-page-title"
              style={{
                fontFamily: 'var(--display)',
                fontSize: '40px',
                color: 'var(--accent)',
                margin: 0,
                letterSpacing: '0.03em',
              }}
            >
              GESTIÓN DE USUARIOS
            </h1>
            <p
              style={{
                marginTop: '8px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--sans)',
                fontSize: '14px',
              }}
            >
              Solo accesible para DEV
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="/"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,106,185,0.2)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
              }}
            >
              ← Dashboard
            </a>

            <button
              onClick={logout}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,106,185,0.2)',
                color: 'var(--text-muted)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
              }}
            >
              Salir
            </button>
          </div>
        </div>

        <div
          className="users-table-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)',
            border: '1px solid rgba(255,106,185,0.15)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '32px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--sans)',
              }}
            >
              Cargando usuarios…
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)',
                    borderBottom: '1px solid rgba(255,106,185,0.15)',
                  }}
                >
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        padding: '24px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--sans)',
                      }}
                    >
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255,106,185,0.06)',
                      }}
                    >
                      <td style={tdStyle}>{u.nombre || '—'}</td>
                      <td style={tdStyle}>{u.email || '—'}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,106,185,0.2)',
                            color:
                              u.rol === 'DEV'
                                ? '#FF6AB9'
                                : u.rol === 'Admin'
                                  ? '#7dd3fc'
                                  : 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'var(--sans)',
                          }}
                        >
                          {u.rol}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '14px 18px',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'var(--sans)',
  color: 'var(--text-muted)',
  fontWeight: 600,
  textAlign: 'left',
};

const tdStyle = {
  padding: '14px 18px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--sans)',
};