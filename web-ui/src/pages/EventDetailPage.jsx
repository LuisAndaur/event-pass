import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEvent, getAuthToken } from '../services/api';

function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) { navigate('/login'); return; }

    getEvent(id)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container event-detail">
        <div className="skeleton" style={{ height: '400px', borderRadius: '12px', marginBottom: '2rem' }} />
        <div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Evento no encontrado</h2>
        <Link to="/events" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <Link to="/events" className="navbar-brand">🎫 <span>EventPass</span></Link>
        <div className="navbar-actions">
          <Link to="/events" className="btn btn-secondary btn-sm">← Volver</Link>
        </div>
      </nav>

      <div className="container event-detail">
        <img
          src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
          alt={event.title}
          className="event-detail-img"
        />

        <h1>{event.title}</h1>
        <span className="tag" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
          {event.category}
        </span>

        <div className="event-meta">
          <div className="event-meta-item">
            <span className="event-meta-label">📅 Fecha</span>
            <span className="event-meta-value">{formatDate(event.date)}</span>
          </div>
          <div className="event-meta-item">
            <span className="event-meta-label">📍 Lugar</span>
            <span className="event-meta-value">{event.venue}</span>
          </div>
          <div className="event-meta-item">
            <span className="event-meta-label">🎟️ Disponibles</span>
            <span className="event-meta-value">{event.availableStock} de {event.totalCapacity}</span>
          </div>
          <div className="event-meta-item">
            <span className="event-meta-label">💰 Precio</span>
            <span className="event-meta-value price">${event.price?.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <p style={{ lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {event.description}
        </p>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={() => navigate(`/queue/${event.id}`)}
          disabled={event.availableStock <= 0}
        >
          {event.availableStock > 0 ? '🎯 Comprar entradas' : '😔 Agotado'}
        </button>
      </div>
    </div>
  );
}

export default EventDetailPage;
