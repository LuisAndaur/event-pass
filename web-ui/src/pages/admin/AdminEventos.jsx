import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice, formatDateShort } from '../../utils/categories';

function AdminEventos() {
  const { events, reservations, loading } = useAdminData();
  const [search, setSearch] = useState('');

  // Tickets sold per event (PAID reservations).
  const soldByEvent = useMemo(() => {
    const m = {};
    reservations.filter((r) => r.status === 'PAID').forEach((r) => {
      m[r.eventId] = (m[r.eventId] || 0) + (r.quantity || 0);
    });
    return m;
  }, [reservations]);

  const rows = useMemo(() => {
    let list = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, search]);

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Eventos</h1>
          <p>Vista global del catálogo · {events.length} evento(s)</p>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          placeholder="Buscar por título, recinto o categoría…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th>Ventas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: 'var(--text-secondary)' }}>Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ color: 'var(--text-secondary)' }}>Sin eventos.</td></tr>
            ) : rows.map((e) => {
              const sold = soldByEvent[e.id] || 0;
              return (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title}</strong><br />
                    <span className="email">{e.venue}</span>
                  </td>
                  <td><span className="badge badge-info">{e.category}</span></td>
                  <td className="email">{formatDateShort(e.date)}</td>
                  <td>{formatPrice(e.price)}</td>
                  <td>{sold} / {e.totalCapacity?.toLocaleString('es-AR')}</td>
                  <td>
                    <span className={`badge ${e.availableStock > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {e.availableStock > 0 ? 'Publicado' : 'Agotado'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default AdminEventos;
