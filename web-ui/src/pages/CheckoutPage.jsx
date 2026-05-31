import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken, getEvent, reserveTicket, getUserReservations } from '../services/api';
import Topbar from '../components/Topbar';
import { formatPrice, formatDate } from '../utils/categories';

const QrSvg = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="white" />
    <g fill="black">
      <rect x="5" y="5" width="20" height="20" /><rect x="8" y="8" width="14" height="14" fill="white" /><rect x="11" y="11" width="8" height="8" />
      <rect x="75" y="5" width="20" height="20" /><rect x="78" y="8" width="14" height="14" fill="white" /><rect x="81" y="11" width="8" height="8" />
      <rect x="5" y="75" width="20" height="20" /><rect x="8" y="78" width="14" height="14" fill="white" /><rect x="11" y="81" width="8" height="8" />
      <rect x="30" y="6" width="3" height="3" /><rect x="36" y="6" width="3" height="3" /><rect x="48" y="6" width="3" height="3" /><rect x="60" y="6" width="3" height="3" />
      <rect x="30" y="30" width="3" height="3" /><rect x="42" y="30" width="3" height="3" /><rect x="54" y="30" width="3" height="3" /><rect x="78" y="30" width="3" height="3" />
      <rect x="18" y="36" width="3" height="3" /><rect x="36" y="36" width="3" height="3" /><rect x="60" y="36" width="3" height="3" /><rect x="84" y="36" width="3" height="3" />
      <rect x="6" y="42" width="3" height="3" /><rect x="42" y="42" width="3" height="3" /><rect x="66" y="42" width="3" height="3" /><rect x="78" y="42" width="3" height="3" />
      <rect x="30" y="48" width="3" height="3" /><rect x="48" y="48" width="3" height="3" /><rect x="60" y="48" width="3" height="3" /><rect x="90" y="48" width="3" height="3" />
      <rect x="6" y="54" width="3" height="3" /><rect x="36" y="54" width="3" height="3" /><rect x="54" y="54" width="3" height="3" /><rect x="84" y="54" width="3" height="3" />
      <rect x="30" y="72" width="3" height="3" /><rect x="48" y="72" width="3" height="3" /><rect x="66" y="72" width="3" height="3" />
      <rect x="36" y="78" width="3" height="3" /><rect x="60" y="78" width="3" height="3" />
      <rect x="30" y="84" width="3" height="3" /><rect x="54" y="84" width="3" height="3" /><rect x="72" y="84" width="3" height="3" />
    </g>
  </svg>
);

const Steps = ({ step }) => {
  // step: 'checkout' | 'processing' | 'done'
  const s1 = step === 'checkout' ? 'active' : 'done';
  const s2 = step === 'processing' ? 'active' : step === 'done' ? 'done' : '';
  const s3 = step === 'done' ? 'active' : '';
  return (
    <div className="checkout-steps">
      <div className={`cstep ${s1}`}><span className="cstep-num">{s1 === 'done' ? '✓' : '1'}</span><span className="cstep-label">Revisar pedido</span></div>
      <div className={`cstep-connector ${s1 === 'done' ? 'done' : ''}`} />
      <div className={`cstep ${s2}`}><span className="cstep-num">{s2 === 'done' ? '✓' : '2'}</span><span className="cstep-label">Pago</span></div>
      <div className={`cstep-connector ${s2 === 'done' ? 'done' : ''}`} />
      <div className={`cstep ${s3}`}><span className="cstep-num">3</span><span className="cstep-label">Confirmación</span></div>
    </div>
  );
};

function CheckoutPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(location.state?.event || null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('checkout');

  const token = getAuthToken();
  const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!event) getEvent(eventId).then(setEvent).catch(() => {});
  }, [eventId]);

  const handleReserve = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await reserveTicket(eventId, userId, quantity, event.price);
      setResult(res);
      setStep('processing');
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
        const updated = reservations.find((r) => r.id === reservationId);
        if (updated) {
          if (updated.status === 'PAID') {
            clearInterval(interval);
            setResult((prev) => ({ ...prev, finalStatus: 'PAID' }));
            setStep('done');
          } else if (updated.status === 'FAILED') {
            clearInterval(interval);
            setError('El pago fue rechazado. Intentá de nuevo.');
            setStep('checkout');
          }
        }
      } catch (e) {}
    }, 5000);
  };

  const total = event ? event.price * quantity : 0;

  const SummaryCard = ({ title = 'Resumen del pedido' }) => (
    <aside>
      <div className="summary-card">
        <h4>{title}</h4>
        {event && (
          <div className="summary-event">
            <div className="summary-event-title">{event.title}</div>
            <div className="summary-event-meta">{formatDate(event.date)}<br />{event.venue}</div>
          </div>
        )}
        <div className="summary-row"><span>{quantity} × General</span><span>{formatPrice(total)}</span></div>
        <div className="summary-row" style={{ color: 'var(--text-secondary)' }}><span>Gastos de gestión</span><span>$0</span></div>
        <div className="summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
        <div className="trust-badges">
          <div className="trust-item">🔒 Pago 100% seguro y cifrado</div>
          <div className="trust-item">📩 Tickets al instante por email</div>
          <div className="trust-item">↩️ Política de reembolso flexible</div>
        </div>
      </div>
    </aside>
  );

  // ---- Processing ----
  if (step === 'processing') {
    return (
      <div>
        <Topbar />
        <Steps step="processing" />
        <div className="queue-page" style={{ minHeight: '50vh' }}>
          <div className="queue-card">
            <div className="queue-spinner" />
            <h1>Procesando tu pago</h1>
            <p className="q-sub">
              {result?.reservationId
                ? `Reserva #${result.reservationId.slice(0, 8)}…`
                : 'Estamos procesando tu compra'}
            </p>
            <div className="alert alert-success">
              Pago en proceso — te confirmaremos automáticamente cuando esté listo.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Done ----
  if (step === 'done') {
    return (
      <div>
        <Topbar />
        <Steps step="done" />
        <div className="success-page">
          <div className="success-icon-wrap">✅</div>
          <h1>¡Reserva confirmada!</h1>
          <p>Hemos enviado tus entradas por email. ¡Que disfrutes del evento!</p>

          <div className="ticket-preview-card">
            <div className="tp-event">{event?.title}</div>
            <div className="tp-meta">{event && formatDate(event.date)} &nbsp;|&nbsp; {event?.venue}</div>
            <div className="tp-divider">
              <div className="tp-notch-l" />
              <div className="tp-line" />
              <div className="tp-notch-r" />
            </div>
            <div className="tp-bottom">
              <div>
                <div className="tp-type">General · {quantity} entrada(s)</div>
                {result?.reservationId && (
                  <div className="tp-id" style={{ marginTop: 8 }}>TKT-{result.reservationId.slice(0, 8)}</div>
                )}
                <div style={{ marginTop: 12, fontSize: 11, opacity: .6 }}>Mostrá el QR en la entrada del evento</div>
              </div>
              <div className="tp-qr"><QrSvg /></div>
            </div>
          </div>

          <div className="success-actions">
            <button className="btn btn-secondary">Descargar PDF</button>
            <button className="btn btn-accent" onClick={() => navigate('/events')}>Volver al catálogo →</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Checkout ----
  return (
    <div>
      <Topbar />
      <Steps step="checkout" />

      <div className="checkout-layout">
        <div className="checkout-main">
          <h1>Revisá tu pedido</h1>
          <p className="sub">Confirmá la cantidad antes de proceder al pago.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="countdown-box">
            <span className="countdown-icon">⏳</span>
            <div className="countdown-text">Tu reserva expira en <strong>10:00</strong></div>
            <div className="countdown-bar"><div className="countdown-bar-fill" style={{ width: '99%' }} /></div>
          </div>

          <div className="checkout-section">
            <h3>Cantidad de entradas</h3>
            <div className="qty-picker">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
              <span className="qty-val" style={{ fontSize: 18 }}>{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(Math.min(10, quantity + 1))} disabled={quantity >= 10}>+</button>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Datos de pago</h3>
            <div className="card-preview">
              <div className="card-chip">▣</div>
              <div className="card-number">••••&nbsp; ••••&nbsp; ••••&nbsp; 4242</div>
              <div className="card-bottom">
                <div><span>Titular</span>DEMO USER</div>
                <div><span>Caduca</span>12/28</div>
                <div><span>Entidad</span>VISA</div>
              </div>
            </div>
            <p className="helper">Pago simulado para la demo — no se cobrará ningún importe.</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/events/${eventId}`)}>← Volver</button>
            <button className="btn btn-accent btn-lg" style={{ flex: 1 }} onClick={handleReserve} disabled={loading || !event}>
              {loading ? 'Procesando…' : `Confirmar y pagar ${formatPrice(total)} →`}
            </button>
          </div>
        </div>

        <SummaryCard />
      </div>
    </div>
  );
}

export default CheckoutPage;
