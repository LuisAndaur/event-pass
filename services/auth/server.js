const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8084;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION_MS = parseInt(process.env.JWT_EXPIRATION_MS || '900000', 10);

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Replicates java.lang.String#hashCode() so the derived userId matches the
// value the previous Spring gateway produced for a given email.
function javaHashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Health check (used by container orchestration / debugging).
app.get('/health', (_req, res) => res.json({ status: 'UP' }));

// POST /api/auth/login — mock authentication, mirrors the old AuthController.
app.post('/api/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Admin account: the only user allowed into the admin module.
  const isAdmin = email.toLowerCase() === 'admin@admin.com';
  const expectedPassword = isAdmin ? '123456' : 'pass123';

  // Mock auth — in production this would validate against a user service.
  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const userId = String(javaHashCode(email));
  const role = isAdmin
    ? 'ROLE_ADMIN'
    : email.includes('organizer') ? 'ROLE_ORGANIZADOR' : 'ROLE_ASISTENTE';

  const token = jwt.sign({ email, role }, JWT_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: Math.floor(JWT_EXPIRATION_MS / 1000),
  });

  return res.json({
    token,
    userId,
    email,
    role,
    expiresIn: JWT_EXPIRATION_MS,
  });
});

app.listen(PORT, () => {
  console.log(`✓ EventPass auth service listening on :${PORT}`);
});
