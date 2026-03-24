// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALLOWED_DOMAIN = '@american-ads.com';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError('Solo se permiten emails @american-ads.com');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('El PIN debe ser exactamente 4 dígitos numéricos');
      return;
    }

    setLoading(true);
    try {
      await login(email, pin);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.1em' }}>
            INNOVACIÓN & CREATIVIDAD
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '4px' }}>
            DASHBOARD EJECUTIVO
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Email corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@american-ads.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--mono)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              PIN (4 dígitos)
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '20px',
                letterSpacing: '0.4em',
                fontFamily: 'var(--mono)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
            />
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--mono)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              background: loading ? 'rgba(0,212,255,0.1)' : 'var(--accent)',
              color: loading ? 'var(--accent)' : '#080C10',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              fontFamily: 'var(--mono)',
              fontWeight: '700',
              fontSize: '12px',
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '4px',
            }}
          >
            {loading ? 'VERIFICANDO…' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
