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
    if (!pin) {
      setError('Ingresá tu contraseña');
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
      padding: '16px',
    }}>
      <div
        className="login-card"
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(255,106,185,0.13) 0%, rgba(9,9,16,0.95) 100%)',
          border: '1px solid rgba(255,106,185,0.2)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '380px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(255,106,185,0.08)',
        }}
      >
        {/* Decorative orb */}
        <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: 80, height: 80, background: 'rgba(255,106,185,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '22px', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            AMERICAN ADS
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Dashboard Ejecutivo
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
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
                border: '1px solid rgba(255,106,185,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid rgba(255,106,185,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                letterSpacing: 'normal',
                fontFamily: 'var(--sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,106,185,0.2)'}
            />
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#ff4d6d', fontFamily: 'var(--sans)', margin: 0, padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: '6px', border: '1px solid rgba(255,77,109,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              background: loading ? 'rgba(255,106,185,0.1)' : 'linear-gradient(135deg, #FF6AB9, #e040a0)',
              color: loading ? 'rgba(255,106,185,0.4)' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'var(--sans)',
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
