import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import { getEvent, reserveTicket, getUserReservations } from '../services/api';

function CheckoutPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(location.state?.event || null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('checkout'); // 'checkout' | 'processing' | 'done'

  const token = getAuthToken();
  const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!event) {
      getEvent(eventId).then(setEvent).catch(() => {});
    }
  }, [eventId]);

  const handleReserve = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await reserveTicket(eventId, userId, quantity, event.price);
      setResult(res);
      setStep('processing');

      // Poll for the reservation status
      pollReservation(res.reservationId);
    } catch (err) {
      setError(err.message || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  const pollReservation = (reservationId) => {
    const interval = setInterval(async () => {
      try {
        const reservations = await getUserReservations(userId);
        const updated = reservations.find(r => r.id === reservationId);

        if (updated) {
          if (updated.status === 'PAID') {
            clearInterval(interval);
            setResult(prev => ({ ...prev, finalStatus: 'PAID' }));
            setStep('done');
          } else if (updated.status === 'FAILED') {
            clearInterval(interval);
            setError('El pago fue rechazado. Intenta de nuevo.');
            setStep('checkout');
          }
        }
      } catch (e) {}
    }, 5000);
  };

  const total = event ? event.price * quantity : 0;

  if (step === 'processing') {
    return (
      <div>
        <nav className="navbar">
          <Link to="/events" className="navbar-brand">🎫 <span>EventPass</span></Link>
        </nav>
        <div className="queue-container">
          <div className="queue-animation" />
          <h2>⏳ Procesando tu pago</h2>
          <p className="page-subtitle">
            {result?.reservationId
              ? `Reserva #${result.reservationId.slice(0, 8)}...`
              : 'Estamos procesando tu compra'}
          </p>
          <div className="alert alert-success">
            Pago en proceso — te confirmaremos automáticamente cuando esté listo
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div>
        <nav className="navbar">
          <Link to="/events" className="navbar-brand">🎫 <span>EventPass</span></Link>
        </nav>
        <div className="queue-container">
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
          <h2>¡Compra exitosa!</h2>
          <p className="page-subtitle">
            {event?.title} — {quantity} entrada(s)
          </p>
          <div className="alert alert-success">
            Tus entradas ya están confirmadas. Revisá tu email para recibir el código QR.
          </div>
          <Link to="/events" className="btn btn-primary btn-lg">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <Link to="/events" className="navbar-brand">🎫 <span>EventPass</span></Link>
        <div className="navbar-actions">
          <Link to={`/queue/${eventId}`} className="btn btn-secondary btn-sm">← Atrás</Link>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Confirmá tu compra</p>

        <div className="checkout-steps">
          <div className="checkout-step done">✅ Fila virtual</div>
          <div className="checkout-step active">💳 Pago</div>
          <div className="checkout-step">🎟️ Listo</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {event && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <h3>{event.title}</h3>
              <p className="card-text">
                📅 {new Date(event.date).toLocaleDateString('es-AR')}<br />
                📍 {event.venue}
              </p>
            </div>
            <div className="card-footer">
              <span className="price">${event.price?.toLocaleString('es-AR')} c/u</span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Cantidad de entradas</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >−</button>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: '3rem', textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
            >+</button>
          </div>
        </div>

        <div style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          margin: '1.5rem 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Precio unitario</span>
            <span>${event?.price?.toLocaleString('es-AR')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Cantidad</span>
            <span>{quantity}</span>
          </div>
          <hr style={{ borderColor: 'var(--border)', margin: '0.8rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
            <span>Total</span>
            <span className="price">${total.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={handleReserve}
          disabled={loading}
        >
          {loading ? 'Procesando...' : `💳 Pagar $${total.toLocaleString('es-AR')}`}
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
