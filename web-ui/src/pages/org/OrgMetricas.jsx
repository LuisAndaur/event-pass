import React, { useMemo } from 'react';
import OrgLayout from '../../components/OrgLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice } from '../../utils/categories';

function OrgMetricas() {
  const { reservations, events, loading } = useAdminData();

  const m = useMemo(() => {
    const paid = reservations.filter((r) => r.status === 'PAID');
    const revenue = paid.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const ticketsSold = paid.reduce((s, r) => s + (r.quantity || 0), 0);
    const total = reservations.length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED').length;
    const conversion = total ? ((paid.length / total) * 100).toFixed(1) : '0';

    // Sales mix by category.
    const byCat = {};
    paid.forEach((r) => {
      const ev = events.find((e) => e.id === r.eventId);
      const cat = ev?.category || 'Otros';
      byCat[cat] = (byCat[cat] || 0) + (r.quantity || 0);
    });
    const mix = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const mixTotal = mix.reduce((s, [, v]) => s + v, 0) || 1;

    // Simple funnel from reservation states.
    const initiated = total;
    const confirmed = paid.length;

    return { revenue, ticketsSold, conversion, cancelled, mix, mixTotal, initiated, confirmed };
  }, [reservations, events]);

  const funnel = [
    { label: 'Reservas iniciadas', value: m.initiated, color: 'var(--primary)', opacity: 1 },
    { label: 'Confirmadas (pagadas)', value: m.confirmed, color: 'var(--success)', opacity: 1 },
  ];
  const funnelMax = Math.max(m.initiated, 1);

  return (
    <OrgLayout>
      <div className="page-header">
        <div>
          <h1>Métricas</h1>
          <p>Rendimiento agregado de tus eventos</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi"><div className="kpi-label">Entradas vendidas</div><div className="kpi-value">{m.ticketsSold.toLocaleString('es-AR')}</div></div>
            <div className="kpi"><div className="kpi-label">Ingresos brutos</div><div className="kpi-value">{formatPrice(m.revenue)}</div></div>
            <div className="kpi"><div className="kpi-label">Conversión</div><div className="kpi-value">{m.conversion}%</div><div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>reserva → pago</div></div>
            <div className="kpi"><div className="kpi-label">Cancelaciones</div><div className="kpi-value">{m.cancelled}</div></div>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h3>Mix por categoría</h3>
              <p className="chart-sub">Distribución de entradas vendidas</p>
              {m.mix.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin ventas aún.</p>
              ) : (
                <div style={{ marginTop: 16 }}>
                  {m.mix.map(([cat, qty]) => (
                    <React.Fragment key={cat}>
                      <div className="cap-bar">
                        <span>{cat}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{qty} ({Math.round((qty / m.mixTotal) * 100)}%)</span>
                      </div>
                      <div className="cap-bar-track"><div style={{ width: `${Math.round((qty / m.mixTotal) * 100)}%` }} /></div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Embudo de conversión</h3>
              <p className="chart-sub">De reserva a compra confirmada</p>
              <div style={{ display: 'flex', gap: 20, alignItems: 'end', paddingTop: 20, height: 160 }}>
                {funnel.map((f) => (
                  <div key={f.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      background: f.color,
                      height: `${Math.max(12, Math.round((f.value / funnelMax) * 100))}%`,
                      borderRadius: 6, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 10, color: 'white', fontWeight: 700,
                    }}>{f.value}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </OrgLayout>
  );
}

export default OrgMetricas;
