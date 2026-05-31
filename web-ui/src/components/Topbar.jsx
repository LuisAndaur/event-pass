import React from 'react';
import { useNavigate } from 'react-router-dom';

// Derives initials for the avatar from the JWT (email claim) when available.
const getInitials = () => {
  const token = localStorage.getItem('eventpass_token');
  if (!token) return 'EP';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload.email || '';
    const namePart = email.split('@')[0];
    return namePart.slice(0, 2).toUpperCase() || 'AG';
  } catch {
    return 'AG';
  }
};

function Topbar({ showNav = true, onLogout, extra }) {
  const navigate = useNavigate();
  const initials = getInitials();

  return (
    <div className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div className="brand" onClick={() => navigate('/events')}>
          <span className="brand-mark">EP</span>EventPass
        </div>
        {showNav && (
          <nav className="app-nav">
            <a className="active" onClick={() => navigate('/events')}>Descubrir</a>
          </nav>
        )}
      </div>
      <div className="user-menu">
        {extra}
        {onLogout && (
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Cerrar sesión</button>
        )}
        <div className="avatar">{initials}</div>
      </div>
    </div>
  );
}

export default Topbar;
