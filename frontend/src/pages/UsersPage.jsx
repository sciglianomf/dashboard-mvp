import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AREA_COLORS = {
  Creatividad: '#FF6AB9',
  Producción:  '#63b3ed',
  Trade:       '#f97316',
  Finanzas:    '#34d399',
};

function RolBadge({ rol }) {
  const color =
    rol === 'DEV'   ? '#FF6AB9' :
    rol === 'Admin' ? '#7dd3fc' :
    'var(--text-muted)';
  return (
    <span style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,106,185,0.2)', color, fontSize: '12px', fontWeight: 600, fontFamily: 'var(--sans)' }}>
      {rol || '—'}
    </span>
  );
}

function AreaBadge({ area }) {
  if (!area) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  const color = AREA_COLORS[area] || 'var(--text-muted)';
  return (
    <span style={{ padding: '2px 8px', borderRadius: '5px', border: `1px solid ${color}44`, background: `${color}14`, color, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '0.03em' }}>
      {area}
    </span>
  );
}

function AreasPermitidas({ areas }) {
  if (!areas || areas.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {areas.map((a) => <AreaBadge key={a} area={a} />)}
    </div>
  );
}

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="users-page-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 48px' }}>

        {/* Header */}
        <div className="users-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 className="users-page-title" style={{ fontFamily: 'var(--display)', fontSize: '40px', color: 'var(--accent)', margin: 0, letterSpacing: '0.03em' }}>
              GESTIÓN DE USUARIOS
            </h1>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '14px' }}>
              Acceso: rol, área principal y áreas permitidas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <Link
              to="/"
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,106,185,0.2)', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: '13px' }}
            >
              ← Dashboard
            </Link>
            <button
              onClick={logout}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,106,185,0.2)', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '13px' }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div
          className="users-table-wrap"
          style={{ background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)', border: '1px solid rgba(255,106,185,0.15)', borderRadius: '12px', overflow: 'hidden' }}
        >
          {loading ? (
            <div style={{ padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
              Cargando usuarios…
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)', borderBottom: '1px solid rgba(255,106,185,0.15)' }}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rol</th>
                  <th style={thStyle}>Área Principal</th>
                  <th style={thStyle}>Áreas Permitidas</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,106,185,0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,106,185,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>{u.nombre || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '13px' }}>{u.email || '—'}</td>
                      <td style={tdStyle}><RolBadge rol={u.rol} /></td>
                      <td style={tdStyle}><AreaBadge area={u.area_principal} /></td>
                      <td style={tdStyle}><AreasPermitidas areas={u.areas_permitidas} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Leyenda */}
        <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(255,106,185,0.04)', border: '1px solid rgba(255,106,185,0.1)', borderRadius: '10px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Referencia de permisos
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { rol: 'DEV',   desc: 'Acceso total a todas las áreas, gestión de usuarios' },
              { rol: 'Admin', desc: 'Crea y edita proyectos en su área principal' },
              { rol: 'Lector', desc: 'Solo lectura en sus áreas permitidas' },
            ].map(({ rol, desc }) => (
              <div key={rol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RolBadge rol={rol} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>{desc}</span>
              </div>
            ))}
          </div>
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
