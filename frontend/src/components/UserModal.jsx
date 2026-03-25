// frontend/src/components/UserModal.jsx
import { useState } from 'react';
import api from '../utils/api';

const ROLES = ['Lector', 'Admin', 'DEV'];

export default function UserModal({ user, onClose, onSaved }) {
  const isNew = !user;
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    pin: '',
    rol: user?.rol || 'Lector',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) return setError('El nombre es requerido');
    if (!form.email.endsWith('@american-ads.com')) return setError('Solo emails @american-ads.com');
    if (isNew && !/^\d{4}$/.test(form.pin)) return setError('PIN debe ser 4 dígitos');
    if (form.pin && !/^\d{4}$/.test(form.pin)) return setError('PIN debe ser 4 dígitos');

    setLoading(true);
    try {
      const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
      if (form.pin) payload.pin = form.pin;

      if (isNew) {
        await api.post('/api/users', payload);
      } else {
        await api.put(`/api/users/${user.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(9,9,16,0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle = {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255,106,185,0.13) 0%, rgba(9,9,16,0.95) 100%)',
    border: '1px solid rgba(255,106,185,0.2)',
    borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(255,106,185,0.12)',
  };
  const inputStyle = {
    width: '100%', background: 'var(--bg-base)', border: '1px solid rgba(255,106,185,0.2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)',
    fontSize: '13px', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)',
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '5px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Decorative orb */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: 65, height: 65, background: 'rgba(255,106,185,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />

        <h2 style={{ fontFamily: 'var(--display)', fontSize: '16px', color: 'var(--accent)', marginBottom: '24px', letterSpacing: '0.05em' }}>
          {isNew ? 'NUEVO USUARIO' : 'EDITAR USUARIO'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input
              style={inputStyle}
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Juan Pérez"
              required
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Email corporativo</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="usuario@american-ads.com"
              required
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>
          <div>
            <label style={labelStyle}>PIN {!isNew && '(dejar vacío para no cambiar)'}</label>
            <input
              style={{ ...inputStyle, letterSpacing: form.pin ? '0.4em' : 'normal', fontSize: form.pin ? '18px' : '13px' }}
              type="password"
              value={form.pin}
              onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={isNew ? '••••' : 'Sin cambios'}
              maxLength={4}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Rol</label>
            <select
              style={inputStyle}
              value={form.rol}
              onChange={e => set('rol', e.target.value)}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--sans)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid rgba(255,106,185,0.2)', borderRadius: '8px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '9px',
                background: loading ? 'rgba(255,106,185,0.1)' : 'linear-gradient(135deg, #FF6AB9, #e040a0)',
                border: 'none', borderRadius: '8px',
                color: loading ? 'rgba(255,106,185,0.4)' : '#fff',
                fontFamily: 'var(--sans)', fontWeight: '700', fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando…' : (isNew ? 'Crear' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
