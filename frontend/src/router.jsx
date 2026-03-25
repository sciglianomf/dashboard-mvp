// frontend/src/router.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import App from './App';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, onlyRole }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)', fontSize: '12px' }}>Verificando sesión…</span>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (onlyRole && user.rol !== onlyRole) return <Navigate to="/" replace />;

  return children;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute onlyRole="DEV">
          <UsersPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
