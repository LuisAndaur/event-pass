# API Gateway — Spring Cloud Gateway

## Acceso

El gateway está disponible en: [http://localhost:8080](http://localhost:8080)

## Autenticación

### POST /api/auth/login

Inicia sesión con email y contraseña. Devuelve un JWT.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "pass123"
}
```

**Response (200):**
```json
{
  "token": "<jwt-token>",
  "userId": "12345",
  "email": "user@example.com",
  "role": "ROLE_ASISTENTE",
  "expiresIn": 900000
}
```

**Response (401) — credenciales inválidas:**
```json
{
  "error": "Invalid credentials"
}
```

> La autenticación es mockeada: cualquier contraseña que **no** sea `pass123` será rechazada.

## Endpoints protegidos

Todos los endpoints excepto `/api/auth/login` requieren el header:

```
Authorization: Bearer <token>
```

### Enrutamiento

| Ruta | Destino | Servicio |
|------|---------|----------|
| `/api/auth/login` | AuthController | Gateway (directo) |
| `/api/events/**` | Catalog Service | Puerto 8082 |
| `/api/waiting-room/**` | Waiting Room | Puerto 8081 |
| `/api/tickets/**` | Reservation Service | Puerto 8083 |

### Ejemplo con curl

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Obtener eventos (usando el token recibido)
curl http://localhost:8080/api/events \
  -H "Authorization: Bearer <token>"

# Unirse a sala de espera
curl -X POST http://localhost:8080/api/waiting-room/join \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"1","userId":"12345"}'
```

## CORS

Configurado para permitir solicitudes desde `http://localhost:3000` únicamente.

- Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS
- Headers permitidos: todos (`*`)
- Credenciales: habilitadas

## JWT

- Algoritmo: HMAC-SHA256 (utilizando la clave `JWT_SECRET` de las variables de entorno)
- Expiración configurable via `JWT_EXPIRATION_MS` (default: 900000ms = 15 minutos)
- Claims incluidos: `sub` (userId), `email`, `role`
- Headers inyectados en servicios destino: `X-User-Id`, `X-User-Role`
