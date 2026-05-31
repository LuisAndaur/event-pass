import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isOrganizer } from '../services/api';

const NAV = [
  { label: 'Dashboard', path: '/org' },
  { label: 'Crear evento', path: '/org/crear' },
  { label: 'Tickets', path: '/org/tickets' },
  { label: 'Métricas', path: '/org/metricas' },
  { label: 'Escáner acceso', path: '/org/scanner' },
];

function OrgLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Route guard: only the organizer role may render the organizer module.
  if (!isOrganizer()) {
    navigate('/events', { replace: true });
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('eventpass_token');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="brand" onClick={() => navigate('/events')}>
            <span className="brand-mark">EP</span>EventPass
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Panel del organizador
          </div>
        </div>
        <nav className="side-nav">
          <div className="side-nav-label">Gestión</div>
          {NAV.map((item) => (
            <a
              key={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="side-nav-foot">
          <button className="btn btn-secondary btn-sm btn-block" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}

export default OrgLayout;
