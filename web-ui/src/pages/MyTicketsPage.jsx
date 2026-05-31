import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUserReservations, getEvents } from '../services/api';
import Topbar from '../components/Topbar';
import QrCode from '../components/QrCode';
import { categoryHex, formatPrice, formatDateShort } from '../utils/categories';

const STATUS_BADGE = {
  PAID: { cls: 'wt-badge-ok', label: 'Confirmada ✓' },
  PENDING_PAYMENT: { cls: 'wt-badge-warn', label: 'Pendiente' },
  FAILED: { cls: 'wt-badge-cancel', label: 'Rechazada' },
  CANCELLED: { cls: 'wt-badge-cancel', label: 'Cancelada' },
};

function MyTicketsPage() {
  const [reservations, setReservations] = useState([]);
  const [eventsById, setEventsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('purchased');
  const [qrTicket, setQrTicket] = useState(null);
  const navigate = useNavigate();

  const token = getAuthToken();
  const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    Promise.all([
      getUserReservations(userId).catch(() => []),
      getEvents().catch(() => []),
    ])
      .then(([res, events]) => {
        setReservations(Array.isArray(res) ? res : []);
        const map = {};
        (events || []).forEach((e) => { map[e.id] = e; });
        setEventsById(map);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('eventpass_token');
    navigate('/login');
  };

  // Group reservations by status: purchased (PAID), pending, rejected (FAILED/CANCELLED).
  const groups = useMemo(() => {
    const purchased = [];
    const pending = [];
    const rejected = [];

    reservations.forEach((r) => {
      if (r.status === 'PAID') purchased.push(r);
      else if (r.status === 'PENDING_PAYMENT') pending.push(r);
      else rejected.push(r); // FAILED, CANCELLED
    });
    return { purchased, pending, rejected };
  }, [reservations]);

  const tabs = [
    { key: 'purchased', label: 'Compradas', list: groups.purchased },
    { key: 'pending', label: 'Pendientes', list: groups.pending },
    { key: 'rejected', label: 'Rechazadas', list: groups.rejected },
  ];

  const activeList = tabs.find((t) => t.key === tab).list;

  const renderTicket = (r) => {
    const ev = eventsById[r.eventId];
    const title = ev ? ev.title : 'Evento';
    const badge = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING_PAYMENT;
    const bg = ev ? categoryHex(ev.category) : '#1C1F26';
    const shortId = `TKT-${r.id.slice(0, 8)}`;

    return (
      <div key={r.id}>
        <div className="wallet-ticket" style={{ background: bg }} onClick={() => setQrTicket(r)}>
          <div className="wallet-ticket-left">
            <div className="wt-event">{title}</div>
            <div className="wt-meta">
              {ev && <span>{formatDateShort(ev.date)}</span>}
              {ev && <span>{ev.venue}</span>}
              {!ev && <span>Detalles del evento no disponibles</span>}
            </div>
            <div className="wt-type">
              {r.quantity} entrada(s) · {formatPrice(r.totalAmount)}
            </div>
            <div className="wt-id">{shortId}</div>
          </div>
          <div className="wallet-ticket-notch" />
          <div className="wallet-ticket-right">
            <div className="wt-qr-box"><QrCode /></div>
            <span className={`wt-badge ${badge.cls}`}>{badge.label}</span>
          </div>
        </div>
        <div className="wallet-ticket-actions">
          <button className="wallet-btn" onClick={() => setQrTicket(r)}>Ver QR</button>
          <button className="wallet-btn">Descargar PDF</button>
          {ev && (
            <button className="wallet-btn" onClick={() => navigate(`/events/${ev.id}`)}>Ver evento</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Topbar active="tickets" onLogout={handleLogout} />

      <div className="page-content" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1>Mis entradas</h1>
        <p className="sub">Tus tickets están listos. Pulsá cualquier tarjeta para ver el código QR.</p>

        <div className="tabs">
          {tabs.map((t) => (
            <div
              key={t.key}
              className={`tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} ({t.list.length})
            </div>
          ))}
        </div>

        {loading ? (
          <>
            <div className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-xl)', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-xl)' }} />
          </>
        ) : activeList.length === 0 ? (
          <div className="tickets-empty">
            <div className="tickets-empty-icon">🎫</div>
            <h3>No tenés entradas {tab === 'purchased' ? 'compradas' : tab === 'pending' ? 'pendientes' : 'rechazadas'}</h3>
            <p>Cuando reserves entradas aparecerán acá.</p>
            {tab === 'purchased' && (
              <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={() => navigate('/events')}>
                Explorar eventos →
              </button>
            )}
          </div>
        ) : (
          activeList.map(renderTicket)
        )}
      </div>

      {/* QR Modal */}
      {qrTicket && (
        <div className="qr-modal-bg" onClick={() => setQrTicket(null)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>Tu entrada</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 4, textAlign: 'left' }}>
              {eventsById[qrTicket.eventId]?.title || 'Evento'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {qrTicket.quantity} entrada(s)
              {eventsById[qrTicket.eventId] && ` · ${formatDateShort(eventsById[qrTicket.eventId].date)}`}
            </p>
            <div className="qr-image-box"><QrCode size={200} /></div>
            <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'var(--bg-soft)', padding: '8px 12px', borderRadius: 6 }}>
              TKT-{qrTicket.id}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>
              Mostrá este código en la entrada del evento.
            </p>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={() => setQrTicket(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTicketsPage;
