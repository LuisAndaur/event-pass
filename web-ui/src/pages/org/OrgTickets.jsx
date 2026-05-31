import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrgLayout from '../../components/OrgLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice, formatDateShort } from '../../utils/categories';

const STATUS_BADGE = {
  PAID: 'badge-success',
  PENDING_PAYMENT: 'badge-warning',
  FAILED: 'badge-danger',
  CANCELLED: 'badge-neutral',
};
const STATUS_LABEL = {
  PAID: 'Emitida',
  PENDING_PAYMENT: 'Pendiente',
  FAILED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

function OrgTickets() {
  const navigate = useNavigate();
  const { reservations, eventsById, events, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rows = useMemo(() => {
    let list = reservations;
    if (eventFilter !== 'ALL') list = list.filter((r) => r.eventId === eventFilter);
    if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        (r.userEmail || '').toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q));
    }
    return list;
  }, [reservations, eventFilter, statusFilter, search]);

  const sold = reservations.filter((r) => r.status === 'PAID').length;
  const cancelled = reservations.filter((r) => r.status === 'CANCELLED').length;

  const exportCsv = () => {
    const header = ['id', 'evento', 'usuario', 'cantidad', 'total', 'estado', 'fecha'];
    const lines = rows.map((r) => [
      r.id,
      `"${(eventsById[r.eventId]?.title || '').replace(/"/g, '""')}"`,
      r.userEmail || r.userId,
      r.quantity,
      r.totalAmount,
      r.status,
      r.createdAt || '',
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OrgLayout>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>{sold} entradas emitidas · {cancelled} canceladas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCsv}>Exportar CSV</button>
          <button className="btn btn-accent" onClick={() => navigate('/org/scanner')}>Abrir escáner</button>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          placeholder="Buscar por email, usuario o ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" style={{ width: 'auto' }} value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="ALL">Evento: Todos</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Estado: Todos</option>
          <option value="PAID">Emitidas</option>
          <option value="PENDING_PAYMENT">Pendientes</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="FAILED">Rechazadas</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Asistente</th><th>Evento</th><th>Cantidad</th><th>Reservado</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: 'var(--text-secondary)' }}>Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ color: 'var(--text-secondary)' }}>No hay tickets en esta vista.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="mono email">TKT-{r.id.slice(0, 8)}</td>
                <td>
                  <div className="user-pill">
                    <div className="avatar-sm">{(r.userEmail || r.userId).slice(0, 2).toUpperCase()}</div>
                    <div>{r.userEmail || <span className="mono">{r.userId}</span>}</div>
                  </div>
                </td>
                <td>{eventsById[r.eventId]?.title || 'Evento'}</td>
                <td>{r.quantity}</td>
                <td className="email">{r.createdAt ? formatDateShort(r.createdAt) : '—'}</td>
                <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OrgLayout>
  );
}

export default OrgTickets;
