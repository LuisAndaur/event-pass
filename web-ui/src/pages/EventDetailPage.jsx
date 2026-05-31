import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, getAuthToken } from '../services/api';
import Topbar from '../components/Topbar';
import { categoryStyle, formatPrice, formatDate } from '../utils/categories';

function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) { navigate('/login'); return; }
    getEvent(id)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Topbar />
        <div className="skeleton" style={{ height: 300 }} />
        <div className="event-detail-body">
          <div>
            <div className="skeleton skeleton-line" style={{ width: '60%', height: 28 }} />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
          <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <Topbar />
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Evento no encontrado</h2>
          <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={() => navigate('/events')}>
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  const cat = categoryStyle(event.category);
  const soldOut = event.availableStock <= 0;
  const sold = event.totalCapacity - event.availableStock;
  const soldPct = event.totalCapacity > 0 ? Math.round((sold / event.totalCapacity) * 100) : 0;
  const total = event.price * qty;
  const maxQty = Math.min(10, event.availableStock || 0);
  const coverBg = event.imageUrl ? { backgroundImage: `url(${event.imageUrl})` } : undefined;

  return (
    <div>
      <Topbar />

      {/* Cover */}
      <div className={`event-detail-cover ${event.imageUrl ? '' : cat.img}`} style={coverBg}>
        <div className="event-detail-cover-overlay" />
        <div className="event-detail-cover-body">
          <span className="cover-back" onClick={() => navigate('/events')}>← Volver al catálogo</span>
          <h1>{event.title}</h1>
          <div className="cover-meta">
            <span>{formatDate(event.date)}</span>
            <span>{event.venue}</span>
            <span><span className={`badge ${cat.badge}`}>{event.category}</span></span>
          </div>
        </div>
      </div>

      <div className="event-detail-body">
        <div className="event-detail-main">
          <div className="detail-actions">
            <button className="btn btn-ghost btn-sm">♡ Guardar</button>
            <button className="btn btn-ghost btn-sm">Compartir</button>
            <button className="btn btn-ghost btn-sm">Añadir al calendario</button>
          </div>

          <div className="info-chips">
            <span>📅 {formatDate(event.date)}</span>
            <span>📍 {event.venue}</span>
            <span>🎟️ {event.availableStock} de {event.totalCapacity} disponibles</span>
          </div>

          <div className="event-description">
            <h3>Sobre el evento</h3>
            <p>{event.description}</p>
          </div>

          {/* Venue */}
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: '24px 0 14px' }}>El recinto</h3>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{event.venue}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Las puertas abren una hora antes del inicio.
            </p>
          </div>
        </div>

        {/* Ticket selector */}
        <div>
          <div className="ticket-selector">
            <h3>Seleccioná tus entradas</h3>
            <p className="ts-sub">{formatDate(event.date)}</p>

            <div className="ticket-row">
              <div>
                <div className="ticket-name">Entrada general</div>
                <div className="ticket-desc">Acceso al evento</div>
                <div className="ticket-price">{formatPrice(event.price)}</div>
              </div>
              <div className="qty-picker">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty || soldOut}>+</button>
              </div>
            </div>

            <div className="total-line">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button
              className="btn btn-accent btn-block btn-lg"
              style={{ marginTop: 4 }}
              onClick={() => navigate(`/queue/${event.id}`)}
              disabled={soldOut}
            >
              {soldOut ? 'Agotado' : 'Reservar entradas →'}
            </button>
            {!soldOut && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
                Evento de alta demanda · al reservar entrarás en la cola de espera
              </p>
            )}

            <div className="capacity-bar">
              <span>{sold}/{event.totalCapacity} vendidas</span>
              <div className="cap-bar-fill"><div style={{ width: `${soldPct}%` }} /></div>
              <span>{soldPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
