import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setAuthToken } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      setAuthToken(res.token);
      const dest = res.role === 'ROLE_ADMIN' ? '/admin'
        : res.role === 'ROLE_ORGANIZADOR' ? '/org'
        : '/events';
      navigate(dest);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <div className="brand"><span className="brand-mark">EP</span>EventPass</div>
        <div>
          <p className="auth-quote">
            "Cualquier idea puede convertirse en un evento. Cualquier evento puede llenar una sala."
          </p>
          <p className="auth-quote-author">— Equipo de plataforma</p>
        </div>
        <p className="auth-foot">© 2026 EventPass · Todos los derechos reservados</p>
      </div>

      <div className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Bienvenido de vuelta</h2>
          <p className="sub">Inicia sesión para continuar donde lo dejaste.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label>Correo electrónico</label>
            <input
              className="input"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="row-between" style={{ marginBottom: 24 }}>
            <label className="checkbox"><input type="checkbox" defaultChecked /> Recordarme</label>
            <a className="link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Demo:</strong> cualquier email con contraseña <code>pass123</code>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
