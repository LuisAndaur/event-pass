import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isOrganizer } from '../../services/api';
import { useAdminData } from '../../utils/useAdminData';

// Mock access-control scanner (the platform has no real check-in backend yet).
// Recent PAID reservations are shown as simulated check-ins.
function OrgScanner() {
  const navigate = useNavigate();
  const { reservations, eventsById } = useAdminData();

  if (!isOrganizer()) {
    navigate('/events', { replace: true });
    return null;
  }

  const checkins = useMemo(
    () => reservations.filter((r) => r.status === 'PAID').slice(0, 8),
    [reservations]
  );

  const initials = (r) => (r.userEmail || r.userId).slice(0, 2).toUpperCase();
  const name = (r) => r.userEmail || `Usuario ${r.userId}`;

  return (
    <div className="scanner-page">
      <div className="scanner-topbar">
        <div>
          <h2>Control de acceso</h2>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>Escáner de entradas (demo)</div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '.04em' }}>Check-ins</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{checkins.length}</div>
          </div>
          <button className="btn btn-outline-white btn-sm" onClick={() => navigate('/org')}>✕ Salir</button>
        </div>
      </div>

      <div className="scanner-main">
        <div className="scanner-view">
          <div className="scanner-frame">
            <div className="scanner-corners">
              <div className="sc-tl" /><div className="sc-tr" />
              <div className="sc-bl" /><div className="sc-br" />
            </div>
          </div>
          <div className="scanner-status">
            <span style={{ fontSize: 20 }}>✓</span> Apuntá la cámara al QR de la entrada
          </div>
        </div>

        <div className="scanner-panel">
          <h3>Últimos check-ins</h3>
          {checkins.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: 13 }}>Aún no hay entradas confirmadas.</p>
          ) : checkins.map((r) => (
            <div className="checkin-item" key={r.id}>
              <div className="checkin-avatar">{initials(r)}</div>
              <div>
                <div className="checkin-name">{name(r)}</div>
                <div className="checkin-meta">{eventsById[r.eventId]?.title || 'Evento'}</div>
              </div>
              <span className="checkin-badge">✓ OK</span>
            </div>
          ))}
        </div>
      </div>

      <div className="scanner-footer">
        <div style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', gap: 24 }}>
          <span><strong style={{ color: 'white' }}>Cámara:</strong> trasera</span>
          <span><strong style={{ color: 'white' }}>Sonido:</strong> activado</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline-white btn-sm">Introducir código manual</button>
        </div>
      </div>
    </div>
  );
}

export default OrgScanner;
