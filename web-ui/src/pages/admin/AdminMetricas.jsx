import React, { useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice } from '../../utils/categories';

function AdminMetricas() {
  const { reservations, eventsById, loading } = useAdminData();

  const m = useMemo(() => {
    const paid = reservations.filter((r) => r.status === 'PAID');
    const revenue = paid.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const ticketsSold = paid.reduce((s, r) => s + (r.quantity || 0), 0);

    const total = reservations.length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED').length;
    const failed = reservations.filter((r) => r.status === 'FAILED').length;
    const conversion = total ? ((paid.length / total) * 100).toFixed(1) : '0';
    const cancelRate = total ? ((cancelled / total) * 100).toFixed(1) : '0';
    const failRate = total ? ((failed / total) * 100).toFixed(1) : '0';

    // Top events by revenue.
    const byEvent = {};
    paid.forEach((r) => {
      byEvent[r.eventId] = (byEvent[r.eventId] || 0) + Number(r.totalAmount || 0);
    });
    const topEvents = Object.entries(byEvent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({ title: eventsById[id]?.title || 'Evento', amount }));

    return { revenue, ticketsSold, conversion, cancelRate, failRate, topEvents, paidCount: paid.length };
  }, [reservations, eventsById]);

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1>Métricas agregadas</h1>
          <p>Análisis de toda la plataforma</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">Ingresos totales</div>
              <div className="kpi-value">{formatPrice(m.revenue)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Entradas vendidas</div>
              <div className="kpi-value">{m.ticketsSold.toLocaleString('es-AR')}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Tasa de conversión</div>
              <div className="kpi-value">{m.conversion}%</div>
              <div className="kpi-delta">{m.paidCount} pagadas</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Tasa de cancelación</div>
              <div className="kpi-value">{m.cancelRate}%</div>
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h3>Top eventos</h3>
              <p className="chart-sub">Por ingresos generados</p>
              <table className="table" style={{ marginTop: 8 }}>
                <tbody>
                  {m.topEvents.length === 0 ? (
                    <tr><td style={{ border: 'none', color: 'var(--text-secondary)' }}>Sin ventas aún.</td></tr>
                  ) : m.topEvents.map((e, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 0', border: 'none' }}><strong>{i + 1}.</strong> {e.title}</td>
                      <td style={{ padding: '10px 0', border: 'none', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatPrice(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-card">
              <h3>Salud de transacciones</h3>
              <p className="chart-sub">Distribución de estados de reserva</p>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>Tasa de conversión (pagadas)</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{m.conversion}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>Tasa de cancelación</span>
                  <span style={{ fontWeight: 700 }}>{m.cancelRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 13 }}>Pagos rechazados</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{m.failRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminMetricas;
