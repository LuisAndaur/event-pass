import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice } from '../../utils/categories';

function AdminUsuarios() {
  const { reservations, loading } = useAdminData();
  const [search, setSearch] = useState('');

  // Derive users from reservation history (the only user data we have).
  const users = useMemo(() => {
    const map = {};
    reservations.forEach((r) => {
      if (!map[r.userId]) {
        map[r.userId] = { userId: r.userId, email: null, total: 0, spent: 0, paid: 0 };
      }
      const u = map[r.userId];
      if (r.userEmail) u.email = r.userEmail; // keep the account email when present
      u.total += 1;
      if (r.status === 'PAID') {
        u.paid += 1;
        u.spent += Number(r.totalAmount || 0);
      }
    });
    let list = Object.values(map).sort((a, b) => b.spent - a.spent);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        (u.email || '').toLowerCase().includes(q) || u.userId.toLowerCase().includes(q));
    }
    return list;
  }, [reservations, search]);

  const initials = (u) => {
    const base = u.email || u.userId;
    return base.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>{users.length} usuario(s) con actividad de reservas</p>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          placeholder="Buscar por ID de usuario…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Reservas</th>
              <th>Compradas</th>
              <th>Total gastado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ color: 'var(--text-secondary)' }}>Cargando…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ color: 'var(--text-secondary)' }}>Sin usuarios con actividad.</td></tr>
            ) : users.map((u) => (
              <tr key={u.userId}>
                <td>
                  <div className="user-pill">
                    <div className="avatar-sm">{initials(u)}</div>
                    <div>
                      {u.email || 'Cuenta sin email registrado'}<br />
                      <span className="email mono">ID {u.userId}</span>
                    </div>
                  </div>
                </td>
                <td>{u.total}</td>
                <td>{u.paid}</td>
                <td>{formatPrice(u.spent)}</td>
                <td><span className="badge badge-success">Activo</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default AdminUsuarios;
