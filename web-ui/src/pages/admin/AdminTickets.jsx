import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAdminData } from '../../utils/useAdminData';
import { cancelReservation } from '../../services/api';
import { formatPrice, formatDateShort } from '../../utils/categories';

const STATUS_BADGE = {
  PAID: 'badge-success',
  PENDING_PAYMENT: 'badge-warning',
  FAILED: 'badge-danger',
  CANCELLED: 'badge-neutral',
};
const STATUS_LABEL = {
  PAID: 'Comprada',
  PENDING_PAYMENT: 'Pendiente',
  FAILED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

const FILTERS = [
  { key: 'PAID', label: 'Compradas' },
  { key: 'PENDING_PAYMENT', label: 'Pendientes' },
  { key: 'FAILED', label: 'Rechazadas' },
  { key: 'CANCELLED', label: 'Canceladas' },
  { key: 'ALL', label: 'Todas' },
];

function AdminTickets() {
  const { reservations, eventsById, loading, refresh } = useAdminData();
  const [filter, setFilter] = useState('PAID');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');

  const rows = useMemo(() => {
    let list = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const ev = eventsById[r.eventId];
        return (
          (ev?.title || '').toLowerCase().includes(q) ||
          (r.userEmail || '').toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [reservations, eventsById, filter, search]);

  const doCancel = async (r) => {
    setConfirm(null);
    setCancelling(r.id);
    try {
      await cancelReservation(r.id);
      setToast(`Reserva ${r.id.slice(0, 8)} cancelada · stock devuelto`);
      await refresh();
    } catch (e) {
      setToast(`Error al cancelar: ${e.message}`);
    } finally {
      setCancelling(null);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const counts = useMemo(() => {
    const c = { PAID: 0, PENDING_PAYMENT: 0, FAILED: 0, CANCELLED: 0 };
    reservations.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [reservations]);

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Entradas</h1>
          <p>{counts.PAID} compradas · {counts.PENDING_PAYMENT} pendientes · {counts.FAILED} rechazadas · {counts.CANCELLED} canceladas</p>
        </div>
      </div>

      {toast && <div className="alert alert-success">{toast}</div>}

      <div className="content-toolbar">
        <input
          className="search-input"
          placeholder="Buscar por evento, usuario o ID de reserva…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Usuario</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ color: 'var(--text-secondary)' }}>Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={{ color: 'var(--text-secondary)' }}>No hay entradas en esta vista.</td></tr>
            ) : rows.map((r) => {
              const ev = eventsById[r.eventId];
              const canCancel = r.status === 'PAID' || r.status === 'PENDING_PAYMENT';
              return (
                <tr key={r.id}>
                  <td>
                    <strong>{ev?.title || 'Evento'}</strong><br />
                    <span className="mono email">{r.id.slice(0, 8)}</span>
                  </td>
                  <td>
                    {r.userEmail || <span className="mono">{r.userId}</span>}
                  </td>
                  <td>{r.quantity}</td>
                  <td>{formatPrice(r.totalAmount)}</td>
                  <td className="email">{r.createdAt ? formatDateShort(r.createdAt) : '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {canCancel ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={cancelling === r.id}
                        onClick={() => setConfirm(r)}
                      >
                        {cancelling === r.id ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    ) : (
                      <span className="email">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="qr-modal-bg" onClick={() => setConfirm(null)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrap" style={{ background: 'var(--danger-bg)', margin: '0 auto 16px' }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>¿Cancelar esta entrada?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
              {eventsById[confirm.eventId]?.title || 'Evento'} · {confirm.quantity} entrada(s) · {formatPrice(confirm.totalAmount)}.
              Esta acción devuelve el stock al inventario y no se puede deshacer.
            </p>
            <button className="btn btn-danger btn-block" style={{ marginTop: 16 }} onClick={() => doCancel(confirm)}>
              Sí, cancelar entrada
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setConfirm(null)}>
              Volver
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminTickets;
