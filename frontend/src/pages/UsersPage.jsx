// frontend/src/pages/UsersPage.jsx
// Gestión completa de usuarios — solo accesible para DEV.
// Operaciones admin (crear, eliminar, cambiar contraseña) van via Edge Function.
// Edición de perfil (nombre, rol, áreas) va directo a Supabase profiles.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AREAS } from '../utils/permissions';

/* ─── Constantes ─────────────────────────────────────────── */

const ROLES = ['DEV', 'Admin', 'Lector'];

const AREA_COLORS = {
  Creatividad: '#FF6AB9',
  Producción:  '#63b3ed',
  Trade:       '#f97316',
  Finanzas:    '#34d399',
  Comercial:   '#a78bfa',
};

const ROL_COLORS = {
  DEV:   '#FF6AB9',
  Admin: '#7dd3fc',
  Lector:'#a3a3a3',
};

/* ─── Helper: llamar Edge Function ───────────────────────── */

async function callAdminFn(action, payload) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, payload },
  });

  if (error) {
    // Intentar extraer el mensaje real del body de la respuesta
    let detail = error.message;
    try {
      const body = await error.context?.json?.();
      detail = body?.error || body?.message || error.message;
    } catch (_) { /* response no es JSON */ }
    throw new Error(detail);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

/* ─── Componentes de UI pequeños ─────────────────────────── */

function RolBadge({ rol }) {
  const color = ROL_COLORS[rol] || '#a3a3a3';
  return (
    <span style={{ padding: '3px 10px', borderRadius: '6px', border: `1px solid ${color}33`, background: `${color}12`, color, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '0.05em' }}>
      {rol || '—'}
    </span>
  );
}

function AreaBadge({ area }) {
  if (!area) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  const color = AREA_COLORS[area] || '#a3a3a3';
  return (
    <span style={{ padding: '2px 8px', borderRadius: '5px', border: `1px solid ${color}44`, background: `${color}14`, color, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '0.03em' }}>
      {area}
    </span>
  );
}

function AreasChips({ areas }) {
  if (!areas || areas.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {areas.map((a) => <AreaBadge key={a} area={a} />)}
    </div>
  );
}

/* ─── Estilos reutilizables ──────────────────────────────── */

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--sans)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,106,185,0.2)',
  borderRadius: '8px',
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--sans)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const thStyle = {
  padding: '12px 16px',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'var(--sans)',
  color: 'var(--text-muted)',
  fontWeight: 600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '13px 16px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--sans)',
  verticalAlign: 'middle',
};

/* ─── Modal base (overlay) ───────────────────────────────── */

function ModalOverlay({ children, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(9,9,16,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'linear-gradient(135deg, rgba(255,106,185,0.07) 0%, #0d0d18 100%)', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '14px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,106,185,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0d0d18', zIndex: 1 }}>
      <div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: 'var(--sans)' }}>{subtitle}</p>
        <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, margin: '3px 0 0', fontFamily: 'var(--sans)' }}>{title}</p>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '2px 6px', borderRadius: '6px', lineHeight: 1 }}>×</button>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, saveLabel = 'Guardar', danger = false }) {
  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,106,185,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px', position: 'sticky', bottom: 0, background: '#0d0d18' }}>
      <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          padding: '9px 20px', borderRadius: '8px', border: 'none', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
          background: saving ? 'rgba(255,255,255,0.06)' : danger ? 'linear-gradient(135deg,#ff4d6d,#c9184a)' : 'linear-gradient(135deg,#FF6AB9,#e040a0)',
          color: saving ? 'var(--text-muted)' : '#fff',
        }}
      >
        {saving ? 'Guardando…' : saveLabel}
      </button>
    </div>
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: '12px', color: '#ff4d6d', fontFamily: 'var(--sans)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px', border: '1px solid rgba(255,77,109,0.2)' }}>
      {msg}
    </p>
  );
}

/* ─── Selector de rol ─────────────────────────────────────── */

function RolSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {ROLES.map((r) => {
        const active = value === r;
        const color = ROL_COLORS[r];
        return (
          <button key={r} onClick={() => onChange(r)} style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all 0.15s', border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: active ? `${color}18` : 'transparent', color: active ? color : 'var(--text-muted)' }}>
            {r}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Selector de área principal ─────────────────────────── */

function AreaPrincipalSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {['', ...AREAS].map((a) => {
        const active = value === a;
        const color = AREA_COLORS[a] || '#a3a3a3';
        return (
          <button key={a || 'none'} onClick={() => onChange(a)} style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.03em', border: active ? `1px solid ${a ? color : 'rgba(255,255,255,0.25)'}` : '1px solid rgba(255,255,255,0.08)', background: active ? (a ? `${color}18` : 'rgba(255,255,255,0.06)') : 'transparent', color: active ? (a ? color : 'var(--text-secondary)') : 'var(--text-muted)' }}>
            {a || 'Ninguna'}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Selector de áreas permitidas ───────────────────────── */

function AreasPermitidasSelector({ value, onChange }) {
  function toggle(area) {
    onChange(value.includes(area) ? value.filter((a) => a !== area) : [...value, area]);
  }
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {AREAS.map((a) => {
        const active = value.includes(a);
        const color = AREA_COLORS[a];
        return (
          <button key={a} onClick={() => toggle(a)} style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.03em', border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: active ? `${color}18` : 'transparent', color: active ? color : 'var(--text-muted)' }}>
            {a}
          </button>
        );
      })}
    </div>
  );
}

/* ─── MODAL: Crear usuario ────────────────────────────────── */

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'Admin', area_principal: '', areas_permitidas: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!form.nombre.trim()) return setError('El nombre es requerido');
    if (!form.email.trim()) return setError('El email es requerido');
    if (!form.password || form.password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres');
    if (form.rol !== 'DEV' && form.areas_permitidas.length === 0) return setError('Seleccioná al menos un área permitida');

    setSaving(true);
    setError('');
    try {
      const result = await callAdminFn('createUser', { ...form });
      onCreated(result.user);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Nuevo usuario" subtitle="Crear usuario" onClose={onClose} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} placeholder="Nombre completo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" placeholder="usuario@ejemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Contraseña inicial</label>
          <input style={inputStyle} type="password" placeholder="Mínimo 4 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Rol</label>
          <RolSelector value={form.rol} onChange={(v) => set('rol', v)} />
        </div>
        <div>
          <label style={labelStyle}>Área principal</label>
          <AreaPrincipalSelector value={form.area_principal} onChange={(v) => set('area_principal', v)} />
        </div>
        <div>
          <label style={labelStyle}>Áreas permitidas</label>
          <AreasPermitidasSelector value={form.areas_permitidas} onChange={(v) => set('areas_permitidas', v)} />
          {form.rol !== 'DEV' && <p style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>Requerido al menos 1 para Admin y Lector.</p>}
        </div>
        <ErrorBanner msg={error} />
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Crear usuario" />
    </ModalOverlay>
  );
}

/* ─── MODAL: Editar usuario ───────────────────────────────── */

function EditUserModal({ target, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: target.nombre || '',
    rol: target.rol || 'Lector',
    area_principal: target.area_principal || '',
    areas_permitidas: target.areas_permitidas || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!form.nombre.trim()) return setError('El nombre es requerido');
    if (form.rol !== 'DEV' && form.areas_permitidas.length === 0) return setError('Seleccioná al menos un área permitida');

    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({ nombre: form.nombre, rol: form.rol, area_principal: form.area_principal || null, areas_permitidas: form.areas_permitidas })
      .eq('id', target.id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    onSaved({ ...target, ...form, area_principal: form.area_principal || null });
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={target.nombre || target.email} subtitle="Editar usuario" onClose={onClose} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} placeholder="Nombre completo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Rol</label>
          <RolSelector value={form.rol} onChange={(v) => set('rol', v)} />
        </div>
        <div>
          <label style={labelStyle}>Área principal</label>
          <AreaPrincipalSelector value={form.area_principal} onChange={(v) => set('area_principal', v)} />
        </div>
        <div>
          <label style={labelStyle}>Áreas permitidas</label>
          <AreasPermitidasSelector value={form.areas_permitidas} onChange={(v) => set('areas_permitidas', v)} />
          <p style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>DEV ignora este campo — accede a todo.</p>
        </div>
        <ErrorBanner msg={error} />
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalOverlay>
  );
}

/* ─── MODAL: Cambiar contraseña ──────────────────────────── */

function ChangePasswordModal({ target, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');

    setSaving(true);
    setError('');
    try {
      await callAdminFn('updatePassword', { userId: target.id, password });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={target.nombre || target.email} subtitle="Cambiar contraseña" onClose={onClose} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {success ? (
          <p style={{ color: '#34d399', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, textAlign: 'center', padding: '8px' }}>
            ✓ Contraseña actualizada
          </p>
        ) : (
          <>
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input style={inputStyle} type="password" placeholder="Mínimo 4 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input style={inputStyle} type="password" placeholder="Repetí la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <ErrorBanner msg={error} />
          </>
        )}
      </div>
      {!success && <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Actualizar contraseña" />}
    </ModalOverlay>
  );
}

/* ─── MODAL: Eliminar usuario ────────────────────────────── */

function DeleteUserModal({ target, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setSaving(true);
    setError('');
    try {
      await callAdminFn('deleteUser', { userId: target.id });
      onDeleted(target.id);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Confirmar eliminación" subtitle="Acción irreversible" onClose={onClose} />
      <div style={{ padding: '20px 20px 4px' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          ¿Estás seguro que querés eliminar a <strong style={{ color: 'var(--text-primary)' }}>{target.nombre || target.email}</strong>?
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: '#ff4d6d', marginTop: '8px' }}>
          Esta acción no se puede deshacer. Se eliminarán el usuario y todos sus datos de perfil.
        </p>
        <ErrorBanner msg={error} />
      </div>
      <ModalFooter onClose={onClose} onSave={handleDelete} saving={saving} saveLabel="Eliminar usuario" danger />
    </ModalOverlay>
  );
}

/* ─── COMPONENTE PRINCIPAL ───────────────────────────────── */

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'password' | 'delete'
  const [target, setTarget] = useState(null);

  const isDev = user?.rol === 'DEV';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openModal(type, u = null) {
    setTarget(u);
    setModal(type);
  }

  function closeModal() {
    setModal(null);
    setTarget(null);
  }

  function handleCreated(newUser) {
    setUsers((prev) => [...prev, newUser].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
  }

  function handleSaved(updated) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  }

  function handleDeleted(deletedId) {
    setUsers((prev) => prev.filter((u) => u.id !== deletedId));
  }

  /* Renderizado */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div className="users-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px,5vw,42px)', color: 'var(--accent)', margin: 0, letterSpacing: '0.03em' }}>
              GESTIÓN DE USUARIOS
            </h1>
            <p style={{ marginTop: '6px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '13px' }}>
              {users.length} usuario{users.length !== 1 ? 's' : ''} · Administración completa de acceso y áreas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
            {isDev && (
              <button
                onClick={() => openModal('create')}
                style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#FF6AB9,#e040a0)', color: '#fff', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                + Nuevo usuario
              </button>
            )}
            <Link to="/" style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,106,185,0.2)', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: '13px' }}>
              ← Dashboard
            </Link>
            <button onClick={logout} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,106,185,0.2)', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '13px' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(13,13,24,0.98) 100%)', border: '1px solid rgba(255,106,185,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px 20px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '14px' }}>
                Cargando usuarios…
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg,rgba(255,106,185,0.1),transparent)', borderBottom: '1px solid rgba(255,106,185,0.12)' }}>
                    <th style={thStyle}>Nombre</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Rol</th>
                    <th style={thStyle}>Área principal</th>
                    <th style={thStyle}>Áreas permitidas</th>
                    {isDev && <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={isDev ? 6 : 5} style={{ padding: '32px 20px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
                        No hay usuarios registrados.
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
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{u.nombre || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '12px' }}>{u.email}</td>
                        <td style={tdStyle}><RolBadge rol={u.rol} /></td>
                        <td style={tdStyle}><AreaBadge area={u.area_principal} /></td>
                        <td style={tdStyle}><AreasChips areas={u.areas_permitidas} /></td>
                        {isDev && (
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <ActionBtn label="Editar" onClick={() => openModal('edit', u)} />
                              <ActionBtn label="Contraseña" onClick={() => openModal('password', u)} color="#63b3ed" />
                              <ActionBtn label="Eliminar" onClick={() => openModal('delete', u)} color="#ff4d6d" />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(255,106,185,0.04)', border: '1px solid rgba(255,106,185,0.08)', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          {[
            { rol: 'DEV',    desc: 'Acceso total — ve y edita todas las áreas' },
            { rol: 'Admin',  desc: 'Crea y edita proyectos en su área principal' },
            { rol: 'Lector', desc: 'Solo lectura en sus áreas permitidas' },
          ].map(({ rol, desc }) => (
            <div key={rol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RolBadge rol={rol} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      {modal === 'create'   && <CreateUserModal onClose={closeModal} onCreated={handleCreated} />}
      {modal === 'edit'     && target && <EditUserModal target={target} onClose={closeModal} onSaved={handleSaved} />}
      {modal === 'password' && target && <ChangePasswordModal target={target} onClose={closeModal} />}
      {modal === 'delete'   && target && <DeleteUserModal target={target} onClose={closeModal} onDeleted={handleDeleted} />}
    </div>
  );
}

/* ─── Botón de acción en tabla ────────────────────────────── */

function ActionBtn({ label, onClick, color = '#FF6AB9' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'all 0.15s',
        border: `1px solid ${color}33`,
        background: hovered ? `${color}18` : 'transparent',
        color: hovered ? color : `${color}99`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
