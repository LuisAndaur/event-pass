import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getAuthToken, getUserReservations } from '../services/api';
import Topbar from '../components/Topbar';
import { categoryStyle, formatPrice, formatDateShort } from '../utils/categories';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myReservations, setMyReservations] = useState([]);
  const [activeCat, setActiveCat] = useState('Todos');
  const navigate = useNavigate();
  const token = getAuthToken();
  const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    getEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (userId) {
      getUserReservations(userId).then(setMyReservations).catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('eventpass_token');
    navigate('/login');
  };

  const paidTickets = myReservations.filter((r) => r.status === 'PAID');
  const pendingTickets = myReservations.filter((r) => r.status === 'PENDING_PAYMENT');

  // Distinct categories present in the data, for the hero filter chips.
  const categories = useMemo(() => {
    const set = [...new Set(events.map((e) => e.category))];
    return ['Todos', ...set];
  }, [events]);

  const visibleEvents = activeCat === 'Todos'
    ? events
    : events.filter((e) => e.category === activeCat);

  const reservationsChip = (
    <>
      {pendingTickets.length > 0 && (
        <span className="badge badge-warning">{pendingTickets.length} pendiente(s)</span>
      )}
      {paidTickets.length > 0 && (
        <span className="badge badge-success">{paidTickets.length} comprada(s)</span>
      )}
    </>
  );

  return (
    <div>
      <Topbar onLogout={handleLogout} extra={reservationsChip} />

      {/* Hero */}
      <div className="hero-dark">
        <div className="hero-dark-content">
          <h1>Tu próxima gran<br /><span>experiencia</span> empieza aquí</h1>
          <p>Conciertos, deportes, teatro y mucho más. Reservá en segundos.</p>

          <div className="hero-cats">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`hero-cat${activeCat === cat ? ' active' : ''}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Event grid */}
      <div className="page-section" style={{ padding: '40px 0 48px' }}>
        <div className="section">
          <div className="section-head">
            <h2>{activeCat === 'Todos' ? 'Eventos disponibles' : activeCat}</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {visibleEvents.length} evento(s)
            </span>
          </div>

          {loading ? (
            <div className="event-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))}
            </div>
          ) : (
            <div className="event-grid">
              {visibleEvents.map((event) => {
                const cat = categoryStyle(event.category);
                const lowStock = event.availableStock > 0 && event.availableStock <= 20;
                const bg = event.imageUrl
                  ? { backgroundImage: `url(${event.imageUrl})` }
                  : undefined;
                return (
                  <div
                    key={event.id}
                    className="event-card"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className={`event-img ${event.imageUrl ? '' : cat.img}`} style={bg}>
                      <span className="price-tag">{formatPrice(event.price)}</span>
                      <button className="fav-btn" onClick={(e) => e.stopPropagation()}>♡</button>
                      {event.availableStock <= 0 && <span className="urgency-tag">Agotado</span>}
                      {lowStock && <span className="urgency-tag">Solo {event.availableStock} entradas</span>}
                    </div>
                    <div className="event-body">
                      <div className="event-meta">{formatDateShort(event.date)}</div>
                      <h3>{event.title}</h3>
                      <div className="event-venue">{event.venue}</div>
                      <div className="event-card-footer">
                        <span className={`badge ${cat.badge}`}>{event.category}</span>
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
                        >
                          Entradas
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventsPage;
