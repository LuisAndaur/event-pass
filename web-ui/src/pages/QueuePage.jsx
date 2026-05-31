import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { joinQueue, getQueueStatus, getAuthToken, getEvent } from '../services/api';
import { subscribeToQueue } from '../services/sse';

function QueuePage() {
  const { eventId } = useParams();
  const [position, setPosition] = useState(null);
  const [queueSize, setQueueSize] = useState(0);
  const [hasPass, setHasPass] = useState(false);
  const [joined, setJoined] = useState(false);
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  const token = getAuthToken();
  const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    getEvent(eventId).then(setEvent).catch(() => {});
  }, [eventId]);

  const handleJoin = async () => {
    try {
      const res = await joinQueue(eventId, userId);
      setPosition(res.position);
      setJoined(true);
    } catch (err) {
      console.error('Error joining queue:', err);
    }
  };

  // SSE subscription after joining
  useEffect(() => {
    if (!joined || !userId) return;

    // Initial poll
    getQueueStatus(eventId, userId).then(res => {
      setPosition(res.position);
      setQueueSize(res.queueSize);
    });

    // SSE for live updates
    const unsubscribe = subscribeToQueue(eventId, userId, (data) => {
      setPosition(data.position);
      setQueueSize(data.queueSize);

      if (data.hasPass) {
        setHasPass(true);
      }
    });

    return unsubscribe;
  }, [joined, eventId, userId]);

  // Check every 5s if we got a pass token (from the queue processor)
  useEffect(() => {
    if (!joined || !userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getQueueStatus(eventId, userId);
        setPosition(res.position);
        setQueueSize(res.queueSize);

        // If position is -1, the user was popped from the queue
        // meaning they got a pass token
        if (res.position < 0 && joined) {
          setHasPass(true);
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [joined, eventId, userId]);

  const progress = queueSize > 0 && position !== null
    ? ((queueSize - position) / queueSize) * 100
    : 0;

  return (
    <div>
      <nav className="navbar">
        <Link to="/events" className="navbar-brand">🎫 <span>EventPass</span></Link>
        <div className="navbar-actions">
          <Link to={`/events/${eventId}`} className="btn btn-secondary btn-sm">← Volver</Link>
        </div>
      </nav>

      {!joined ? (
        <div className="queue-container">
          <h2>{event?.title || 'Cargando...'}</h2>
          <p className="page-subtitle">Antes de comprar, ingresá a la fila virtual</p>
          <button className="btn btn-primary btn-lg" onClick={handleJoin}>
            🎯 Ingresar a la fila
          </button>
        </div>
      ) : hasPass ? (
        <div className="queue-container">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2>¡Es tu turno!</h2>
          <p className="page-subtitle">Tenés 10 minutos para completar tu compra</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/checkout/${eventId}`, {
              state: { event }
            })}
          >
            Ir al checkout
          </button>
        </div>
      ) : (
        <div className="queue-container">
          <div className="queue-animation" />
          <h2>Estás en la fila virtual</h2>
          <p className="page-subtitle">{event?.title}</p>

          <div className="queue-position">
            {position !== null ? `#${position + 1}` : '...'}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            de {queueSize} persona(s) en la fila
          </p>

          <div className="queue-bar">
            <div className="queue-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            Te notificaremos automáticamente cuando sea tu turno
          </p>
        </div>
      )}
    </div>
  );
}

export default QueuePage;
