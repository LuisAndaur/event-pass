import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinQueue, getQueueStatus, getAuthToken, getEvent } from '../services/api';
import { subscribeToQueue } from '../services/sse';
import { categoryStyle, formatDateShort } from '../utils/categories';

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

    getQueueStatus(eventId, userId).then((res) => {
      setPosition(res.position);
      setQueueSize(res.queueSize);
    });

    const unsubscribe = subscribeToQueue(eventId, userId, (data) => {
      setPosition(data.position);
      setQueueSize(data.queueSize);
      if (data.hasPass) setHasPass(true);
    });

    return unsubscribe;
  }, [joined, eventId, userId]);

  // Poll every 5s for pass token (popped from queue → position < 0)
  useEffect(() => {
    if (!joined || !userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getQueueStatus(eventId, userId);
        setPosition(res.position);
        setQueueSize(res.queueSize);
        if (res.position < 0 && joined) setHasPass(true);
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [joined, eventId, userId]);

  const progress = queueSize > 0 && position !== null
    ? Math.min(100, Math.round(((queueSize - position) / queueSize) * 100))
    : 0;

  const cat = categoryStyle(event?.category);
  const eventImg = event?.imageUrl
    ? { backgroundImage: `url(${event.imageUrl})` }
    : undefined;

  const EventStrip = () => (
    <div className="queue-event">
      <div className={`queue-event-img ${event?.imageUrl ? '' : cat.img}`} style={eventImg} />
      <div>
        <div className="queue-event-name">{event?.title || 'Cargando…'}</div>
        {event && <div className="queue-event-meta">{formatDateShort(event.date)} · {event.venue}</div>}
      </div>
    </div>
  );

  return (
    <div className="queue-page">
      <div className="queue-card">
        <div className="queue-brand">
          <div className="brand"><span className="brand-mark">EP</span>EventPass</div>
        </div>

        {!joined ? (
          <>
            <div className="queue-eyebrow">Sala de espera virtual</div>
            <h1>Sumate a la fila</h1>
            <p className="q-sub">
              Este evento tiene alta demanda. Ingresá a la fila virtual y te conectaremos
              automáticamente cuando sea tu turno.
            </p>
            <EventStrip />
            <div className="queue-actions">
              <button className="btn btn-accent btn-block btn-lg" onClick={handleJoin}>
                Ingresar a la fila →
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/events/${eventId}`)}>
                Volver al evento
              </button>
            </div>
            <div className="queue-foot">Fila gestionada por EventPass · Protección anti-bots activa</div>
          </>
        ) : hasPass ? (
          <>
            <div className="queue-granted">✓</div>
            <div className="queue-eyebrow">Acceso concedido</div>
            <h1>¡Es tu turno!</h1>
            <p className="q-sub">
              Ya podés reservar tus entradas. Tu lugar está garantizado mientras completes la
              compra a tiempo.
            </p>
            <div className="countdown-box">
              <span className="countdown-icon">⏳</span>
              <div className="countdown-text">Tenés <strong>10:00</strong> para completar la compra</div>
              <div className="countdown-bar"><div className="countdown-bar-fill" style={{ width: '98%' }} /></div>
            </div>
            <EventStrip />
            <div className="queue-actions">
              <button
                className="btn btn-accent btn-block btn-lg"
                onClick={() => navigate(`/checkout/${eventId}`, { state: { event } })}
              >
                Continuar a la reserva →
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/events/${eventId}`)}>
                Ver detalles del evento
              </button>
            </div>
            <div className="queue-foot">Mantené esta pestaña abierta para conservar tu acceso</div>
          </>
        ) : (
          <>
            <div className="queue-eyebrow">Sala de espera virtual</div>
            <h1>Estás en la fila</h1>
            <p className="q-sub">
              Hay mucha demanda para este evento. Te conectaremos automáticamente cuando sea tu
              turno — no necesitás hacer nada.
            </p>
            <EventStrip />

            <div className="queue-spinner" />
            <div className="queue-pos">{position !== null ? position + 1 : '…'}</div>
            <div className="queue-pos-label">Tu posición en la fila</div>

            <div className="queue-bar"><div style={{ width: `${progress}%` }} /></div>
            <div className="queue-bar-meta"><span>Avanzando…</span><span>{progress}%</span></div>

            <div className="queue-stats">
              <div className="queue-stat">
                <div className="queue-stat-val">{position !== null ? Math.max(0, position) : '—'}</div>
                <div className="queue-stat-lbl">Personas delante</div>
              </div>
              <div className="queue-stat">
                <div className="queue-stat-val">{queueSize}</div>
                <div className="queue-stat-lbl">Total en fila</div>
              </div>
            </div>

            <div className="queue-warn">
              <strong>No actualices ni cierres esta pestaña.</strong> Si lo hacés, perderás tu lugar
              y volverás al final de la fila.
            </div>

            <div className="queue-foot">Te notificaremos automáticamente cuando sea tu turno</div>
          </>
        )}
      </div>
    </div>
  );
}

export default QueuePage;
