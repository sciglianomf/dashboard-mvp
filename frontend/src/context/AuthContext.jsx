// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error cargando perfil:', error);
      return null;
    }

    return data;
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obteniendo sesión:', error);
          if (isMounted) setUser(null);
          return;
        }

        if (!session?.user) {
          if (isMounted) setUser(null);
          return;
        }

        const profile = await loadProfile(session.user.id);

        if (isMounted) {
          setUser(profile);
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      loadProfile(session.user.id)
        .then((profile) => {
          if (isMounted) setUser(profile);
        })
        .catch((err) => {
          console.error('Error en onAuthStateChange:', err);
          if (isMounted) setUser(null);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, pin) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (error) {
      console.error('Error de login:', error);
      throw new Error('Error al iniciar sesión');
    }

    const profile = await loadProfile(data.user.id);

    if (!profile) {
      throw new Error('No se pudo cargar el perfil');
    }

    setUser(profile);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error al cerrar sesión:', error);
      throw new Error('Error al cerrar sesión');
    }

    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}