import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice, formatDateShort, categoryStyle } from '../../utils/categories';

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

function AdminDashboard() {
  const navigate = useNavigate();
  const { reservations, events, eventsById, loading } = useAdminData();

  const stats = useMemo(() => {
    const paid = reservations.filter((r) => r.status === 'PAID');
    const revenue = paid.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
    const ticketsSold = paid.reduce((sum, r) => sum + (r.quantity || 0), 0);

    // Revenue by category (from PAID reservations joined to events).
    const byCat = {};
    paid.forEach((r) => {
      const ev = eventsById[r.eventId];
      const cat = ev?.category || 'Otros';
      byCat[cat] = (byCat[cat] || 0) + Number(r.totalAmount || 0);
    });
    const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = topCats.length ? topCats[0][1] : 1;

    return {
      revenue,
      ticketsSold,
      paidCount: paid.length,
      totalReservations: reservations.length,
      eventsCount: events.length,
      topCats,
      maxCat,
      recent: reservations.slice(0, 6),
    };
  }, [reservations, events, eventsById]);

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Plataforma · Resumen</h1>
          <p>Vista agregada de toda la actividad.</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">Eventos publicados</div>
              <div className="kpi-value">{stats.eventsCount}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Entradas vendidas</div>
              <div className="kpi-value">{stats.ticketsSold.toLocaleString('es-AR')}</div>
              <div className="kpi-delta up">{stats.paidCount} compras confirmadas</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Reservas totales</div>
              <div className="kpi-value">{stats.totalReservations.toLocaleString('es-AR')}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Ingresos plataforma</div>
              <div className="kpi-value">{formatPrice(stats.revenue)}</div>
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h3>Top categorías</h3>
              <p className="chart-sub">Por ingresos generados (compras confirmadas)</p>
              {stats.topCats.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin ventas aún.</p>
              ) : (
                <div style={{ marginTop: 16 }}>
                  {stats.topCats.map(([cat, amount]) => (
                    <React.Fragment key={cat}>
                      <div className="cap-bar">
                        <span>{cat}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatPrice(amount)}</span>
                      </div>
                      <div className="cap-bar-track">
                        <div style={{ width: `${Math.round((amount / stats.maxCat) * 100)}%` }} />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Reservas recientes</h3>
              <p className="chart-sub">Últimos movimientos en la plataforma</p>
              <table className="table" style={{ marginTop: 8 }}>
                <tbody>
                  {stats.recent.length === 0 ? (
                    <tr><td style={{ border: 'none', color: 'var(--text-secondary)' }}>Sin reservas.</td></tr>
                  ) : stats.recent.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: '10px 0', border: 'none' }}>
                        <strong>{eventsById[r.eventId]?.title || 'Evento'}</strong><br />
                        <span className="email">{r.quantity} entrada(s) · {formatPrice(r.totalAmount)}</span>
                      </td>
                      <td style={{ padding: '10px 0', border: 'none', textAlign: 'right' }}>
                        <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <button className="btn btn-accent" onClick={() => navigate('/admin/tickets')}>
              Gestionar entradas →
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
