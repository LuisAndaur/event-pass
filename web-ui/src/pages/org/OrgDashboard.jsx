import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import OrgLayout from '../../components/OrgLayout';
import { useAdminData } from '../../utils/useAdminData';
import { formatPrice, formatDateShort, categoryStyle } from '../../utils/categories';

function OrgDashboard() {
  const navigate = useNavigate();
  const { events, reservations, loading } = useAdminData();

  const data = useMemo(() => {
    const paid = reservations.filter((r) => r.status === 'PAID');
    const revenue = paid.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const ticketsSold = paid.reduce((s, r) => s + (r.quantity || 0), 0);

    const soldByEvent = {};
    paid.forEach((r) => { soldByEvent[r.eventId] = (soldByEvent[r.eventId] || 0) + (r.quantity || 0); });

    const now = Date.now();
    const upcoming = events
      .filter((e) => new Date(e.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextEvent = upcoming[0] || events[0];

    // Sales mix by category (tickets).
    const byCat = {};
    paid.forEach((r) => {
      const ev = events.find((e) => e.id === r.eventId);
      const cat = ev?.category || 'Otros';
      byCat[cat] = (byCat[cat] || 0) + (r.quantity || 0);
    });
    const mix = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const mixTotal = mix.reduce((s, [, v]) => s + v, 0) || 1;

    return { revenue, ticketsSold, soldByEvent, nextEvent, mix, mixTotal, eventsCount: events.length };
  }, [events, reservations]);

  return (
    <OrgLayout>
      <div className="page-header">
        <div>
          <h1>Hola, Organizador</h1>
          <p>Aquí tenés el resumen de tus eventos.</p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/org/crear')}>+ Nuevo evento</button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">Próximo evento</div>
              <div className="kpi-value" style={{ fontSize: 17, lineHeight: 1.3 }}>
                {data.nextEvent?.title || '—'}
              </div>
              {data.nextEvent && (
                <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>
                  {formatDateShort(data.nextEvent.date)}
                </div>
              )}
            </div>
            <div className="kpi">
              <div className="kpi-label">Entradas vendidas</div>
              <div className="kpi-value">{data.ticketsSold.toLocaleString('es-AR')}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Eventos activos</div>
              <div className="kpi-value">{data.eventsCount}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Ingresos</div>
              <div className="kpi-value">{formatPrice(data.revenue)}</div>
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h3>Mix por categoría</h3>
              <p className="chart-sub">Entradas vendidas por categoría</p>
              {data.mix.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin ventas aún.</p>
              ) : (
                <div style={{ marginTop: 16 }}>
                  {data.mix.map(([cat, qty]) => (
                    <React.Fragment key={cat}>
                      <div className="cap-bar">
                        <span>{cat}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {qty} ({Math.round((qty / data.mixTotal) * 100)}%)
                        </span>
                      </div>
                      <div className="cap-bar-track">
                        <div style={{ width: `${Math.round((qty / data.mixTotal) * 100)}%` }} />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            <div className="chart-card">
              <h3>Acciones rápidas</h3>
              <p className="chart-sub">Gestión del evento</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                <button className="btn btn-secondary btn-block" onClick={() => navigate('/org/crear')}>+ Crear nuevo evento</button>
                <button className="btn btn-secondary btn-block" onClick={() => navigate('/org/tickets')}>Ver tickets vendidos</button>
                <button className="btn btn-secondary btn-block" onClick={() => navigate('/org/scanner')}>Abrir escáner de acceso</button>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 16px' }}>Mis eventos</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Evento</th><th>Categoría</th><th>Fecha</th><th>Vendidas</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={6} style={{ color: 'var(--text-secondary)' }}>Sin eventos.</td></tr>
                ) : events.map((e) => {
                  const cat = categoryStyle(e.category);
                  return (
                    <tr key={e.id}>
                      <td><strong>{e.title}</strong><br /><span className="email">{e.venue}</span></td>
                      <td><span className={`badge ${cat.badge}`}>{e.category}</span></td>
                      <td className="email">{formatDateShort(e.date)}</td>
                      <td>{data.soldByEvent[e.id] || 0} / {e.totalCapacity?.toLocaleString('es-AR')}</td>
                      <td>
                        <span className={`badge ${e.availableStock > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {e.availableStock > 0 ? 'Publicado' : 'Agotado'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/org/metricas')}>Ver →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OrgLayout>
  );
}

export default OrgDashboard;
