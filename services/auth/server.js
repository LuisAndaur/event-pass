const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// OpenAPI spec for the auth service, served as Swagger UI at /docs.
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EventPass — Auth API',
    description: 'Servicio de autenticación: emite el JWT del login.',
    version: '1.0.0',
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Iniciar sesión y obtener un JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@admin.com' },
                  password: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login correcto',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    userId: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', example: 'ROLE_ADMIN' },
                    expiresIn: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Faltan email o password' },
          401: { description: 'Credenciales inválidas' },
        },
      },
    },
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/v3/api-docs', (_req, res) => res.json(openApiSpec));

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

  const normalizedEmail = email.toLowerCase();

  // Special accounts with their own module access.
  const isAdmin = normalizedEmail === 'admin@admin.com';
  const isOrganizer = normalizedEmail === 'organizador@organizador.com';

  // admin and organizer use 123456; regular assistants use pass123.
  const expectedPassword = (isAdmin || isOrganizer) ? '123456' : 'pass123';

  // Mock auth — in production this would validate against a user service.
  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const userId = String(javaHashCode(email));
  let role = 'ROLE_ASISTENTE';
  if (isAdmin) role = 'ROLE_ADMIN';
  else if (isOrganizer || email.includes('organizer')) role = 'ROLE_ORGANIZADOR';

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
