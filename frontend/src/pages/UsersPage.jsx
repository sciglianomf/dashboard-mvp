import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UsersPage() {
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
      setUsers(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando usuarios…</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Gestión de usuarios</h2>

      {users.length === 0 ? (
        <p>No hay usuarios</p>
      ) : (
        <table style={{ width: '100%', marginTop: 20 }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}