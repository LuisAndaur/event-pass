import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEvents, getAuthToken, getUserReservations } from '../services/api';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myReservations, setMyReservations] = useState([]);
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
      getUserReservations(userId)
        .then(setMyReservations)
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('eventpass_token');
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const paidTickets = myReservations.filter(r => r.status === 'PAID');
  const pendingTickets = myReservations.filter(r => r.status === 'PENDING_PAYMENT');

  return (
    <div>
      <nav className="navbar">
        <Link to="/events" className="navbar-brand">
          🎫 <span>EventPass</span>
        </Link>
        <div className="navbar-actions">
          {pendingTickets.length > 0 && (
            <span className="tag tag-warning">{pendingTickets.length} pendiente(s)</span>
          )}
          {paidTickets.length > 0 && (
            <span className="tag tag-success">{paidTickets.length} comprada(s)</span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="container">
        <h1 className="page-title">🎉 Eventos disponibles</h1>
        <p className="page-subtitle">Explorá los próximos eventos y asegurá tu lugar</p>

        {loading ? (
          <div className="grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="card skeleton-card">
                <div className="skeleton skeleton-img" />
                <div className="card-body">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid">
            {events.map(event => (
              <div key={event.id} className="card">
                <img
                  src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
                  alt={event.title}
                  className="card-img"
                  loading="lazy"
                />
                <div className="card-body">
                  <h3 className="card-title">{event.title}</h3>
                  <p className="card-text">
                    📅 {formatDate(event.date)}<br />
                    📍 {event.venue}
                  </p>
                  <span className="tag">{event.category}</span>
                </div>
                <div className="card-footer">
                  <span className="price">${event.price?.toLocaleString('es-AR')}</span>
                  <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm">
                    Ver evento
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPage;
