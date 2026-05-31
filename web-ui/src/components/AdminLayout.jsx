import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAdmin } from '../services/api';

const NAV = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Entradas', path: '/admin/tickets' },
  { label: 'Usuarios', path: '/admin/usuarios' },
  { label: 'Eventos', path: '/admin/eventos' },
  { label: 'Métricas', path: '/admin/metricas' },
];

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Route guard: only the admin role may render the admin module.
  if (!isAdmin()) {
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
          <div className="app-sidebar-tag">Administración</div>
        </div>
        <nav className="side-nav">
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

export default AdminLayout;
