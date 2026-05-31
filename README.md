# EventPass — Sistema de Gestión de Eventos y Entradas

## Descripción
Sistema distribuido de venta de entradas diseñado para soportar alta concurrencia (Thundering Herd) mediante una arquitectura de microservicios con sala de espera virtual, procesamiento asíncrono de pagos y garantía de no sobreventa.

## Stack Tecnológico
- **Frontend**: React 18 + Vite + React Router
- **API Gateway**: KrakenD 2.6 (Go, bajo consumo de recursos) — enrutamiento + CORS
- **Auth Service**: Node.js + Express + jsonwebtoken — emite los JWT del login
- **Microservicios**: Java 21 + Spring Boot 3.2
- **Bases de Datos**: MySQL 8.0 (x2), Redis 7 (caché + cola)
- **Mensajería**: Apache Kafka 7.6 (Confluent) + Zookeeper
- **Observabilidad**: Prometheus + Grafana (+ ELK y OpenTelemetry comentados)
- **Orquestación**: Docker Compose

## Arquitectura
```
Web UI (React)
     │
     ▼
API Gateway (KrakenD)  ──┬── /api/auth/login        → Auth Service (Node/Express) → emite JWT
                         ├── /api/events/**          → Catalog Service     (MySQL + Redis)
                         ├── /api/waiting-room/**     → Waiting Room        (Redis + SSE)
                         └── /api/tickets/**          → Reservation Service (MySQL + Kafka)
                                                          ↓ Kafka
                                                         MockPaymentWorker (procesa pagos async)
                                                          ↓ Kafka
                                                         PaymentEventHandler (Saga / compensación)
```

El gateway KrakenD actúa como reverse proxy transparente (passthrough `no-op`) y resuelve CORS.
La emisión del token JWT vive en un servicio `auth` dedicado y liviano. Los microservicios de
dominio confían en el gateway y no validan el JWT por sí mismos.

## Cómo correr el proyecto

### Requisitos
- Docker y Docker Compose instalados
- Mínimo 8GB RAM disponible

### 1. Crear el archivo `.env`
En la raíz del proyecto creá un archivo `.env` (está en `.gitignore`) con estas variables:

```env
# Redis
REDIS_PASSWORD=redispass123

# MySQL - Catalog
MYSQL_CATALOG_DATABASE=catalog_db
MYSQL_CATALOG_USER=catalog_user
MYSQL_CATALOG_PASSWORD=catalogpass123

# MySQL - Reservation
MYSQL_RESERVATION_DATABASE=reservation_db
MYSQL_RESERVATION_USER=reservation_user
MYSQL_RESERVATION_PASSWORD=reservationpass123

# Gateway
GATEWAY_PORT=8080

# JWT (compartido entre auth-service y waiting-room)
JWT_SECRET=eventpass-super-secret-jwt-key-2024-must-be-at-least-256-bits-long
JWT_EXPIRATION_MS=86400000
```

### 2. Levantar los servicios
En la raíz del proyecto, ejecutar:
```bash
docker compose up --build
```
(En Windows también podés usar el script `start.bat`.)

### 3. Usar la aplicación
1. Esperar a que todos los servicios estén saludables (~2-5 minutos el primer build).
2. Abrir http://localhost:3000

### Credenciales de acceso
| Tipo de usuario | Email | Contraseña | Acceso |
|-----------------|-------|------------|--------|
| Asistente | cualquier email | `pass123` | Catálogo, reservas, mis entradas |
| Organizador | `organizador@organizador.com` | `123456` | Panel del organizador |
| Administrador | `admin@admin.com` | `123456` | Panel de administración |

> Es una autenticación mock para la demo: cualquier email con `pass123` entra como asistente.
> El acceso al panel de organizador está reservado a `organizador@organizador.com` y el del
> panel de administración a `admin@admin.com`. Según el rol, el login redirige automáticamente
> a `/events` (asistente), `/org` (organizador) o `/admin` (administrador).

### Servicios y puertos
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Web UI | 3000 | Frontend React |
| Gateway (KrakenD) | 8080 | API Gateway (routing + CORS) |
| Gateway métricas | 8090 | Endpoint Prometheus de KrakenD (interno) |
| Auth Service | 8084 | Emisión de JWT (interno, sólo vía gateway) |
| Waiting Room | 8081 | Fila virtual |
| Catalog | 8082 | Catálogo de eventos |
| Reservation | 8083 | Reservas y pagos |
| Prometheus | 9090 | Métricas |
| Grafana | 3001 | Dashboards (admin/admin) |
| Kafka | 9092 | Mensajería |
| MySQL Catalog | 3307 | BD de eventos |
| MySQL Reservation | 3308 | BD de reservas |
| Redis | 6379 | Caché y cola |
| Zookeeper | 2181 | Coordinación Kafka |

## Funcionalidades

### Asistente
- **Catálogo** de eventos con filtro por categoría (datos reales del Catalog Service).
- **Detalle de evento** con selector de entradas y barra de capacidad.
- **Sala de espera virtual** (cola en Redis) que regula el acceso al checkout; las
  actualizaciones de posición se obtienen por polling (cada 5s).
- **Checkout** multi-paso con **contador regresivo de 10 minutos**: si expira, se muestra
  un aviso de "tiempo de reserva finalizado" y se bloquea la compra.
- **Mis entradas**: tickets agrupados por estado — Compradas (`PAID`), Pendientes
  (`PENDING_PAYMENT`) y Rechazadas (`FAILED`/`CANCELLED`), con QR por entrada.

### Organizador (`organizador@organizador.com`)
- **Dashboard**: saludo, KPIs (próximo evento, entradas vendidas, ingresos, eventos activos),
  mix por categoría y tabla "Mis eventos" con ventas.
- **Crear evento**: asistente (wizard) de 3 pasos — información básica → fecha y lugar →
  entrada y publicación — que **crea el evento real** en el catálogo (`POST /api/events`).
- **Tickets**: tabla de tickets vendidos con filtros por evento y estado, búsqueda y
  **exportación a CSV**.
- **Métricas**: entradas vendidas, ingresos, conversión, cancelaciones, mix por categoría y
  embudo de conversión.
- **Escáner de acceso**: maqueta visual de control de acceso por QR (sin backend de check-in;
  los check-ins se simulan a partir de reservas confirmadas).

### Administración (`admin@admin.com`)
- **Dashboard**: KPIs agregados (eventos, entradas vendidas, ingresos), top categorías y
  reservas recientes.
- **Entradas**: tabla de todas las reservas, filtrable por estado y con búsqueda; permite
  **cancelar entradas** (devuelve el stock al inventario).
- **Usuarios**: cuentas derivadas del historial de reservas, mostradas por email.
- **Eventos**: catálogo global con ventas/capacidad y estado.
- **Métricas**: ingresos, tasa de conversión, tasa de cancelación y top eventos.

## API (a través del gateway, base `http://localhost:8080`)
| Método | Ruta | Servicio | Descripción |
|--------|------|----------|-------------|
| POST | `/api/auth/login` | Auth | Login, devuelve JWT |
| GET | `/api/events` | Catalog | Lista de eventos |
| GET | `/api/events/{id}` | Catalog | Detalle de evento |
| POST | `/api/events` | Catalog | Crear evento (organizador) |
| PUT | `/api/events/{id}` | Catalog | Editar evento (organizador) |
| POST | `/api/waiting-room/join` | Waiting Room | Unirse a la fila |
| GET | `/api/waiting-room/status` | Waiting Room | Posición en la fila |
| POST | `/api/tickets/reserve` | Reservation | Crear reserva |
| GET | `/api/tickets` | Reservation | Todas las reservas (admin) |
| GET | `/api/tickets/{id}` | Reservation | Detalle de reserva |
| GET | `/api/tickets/user/{userId}` | Reservation | Reservas de un usuario |
| POST | `/api/tickets/{id}/cancel` | Reservation | Cancelar reserva + devolver stock |

## Estructura del proyecto
```
event-pass/
├── docker-compose.yml
├── .env                    # variables de entorno (no versionado)
├── start.bat               # script de arranque (Windows)
├── gateway/
│   └── krakend.json        # configuración del API Gateway (KrakenD)
├── services/
│   ├── auth/               # Auth Service (Node/Express) — emite JWT
│   ├── waiting-room/       # Fila virtual (Redis + SSE)
│   ├── catalog/            # Catálogo de eventos (MySQL + Redis)
│   └── reservation/        # Reservas y pagos (MySQL + Kafka)
├── web-ui/                 # React SPA (Vite)
├── monitoring/             # Prometheus + Grafana
└── docs/                   # Documentación
```

## Notas importantes
- El **API Gateway** es KrakenD (Go), elegido por su bajo consumo de recursos frente a un
  gateway sobre la JVM. Hace routing transparente y CORS; expone métricas Prometheus en `:8090`.
- La **autenticación** es mock y vive en el `auth-service`. El gateway no valida el JWT en el
  borde: los microservicios confían en el gateway. (KrakenD puede activar validación de JWT si
  se requiere.)
- **SSE**: KrakenD no hace streaming de server-sent events, por lo que la sala de espera se
  actualiza mediante polling periódico (el código SSE queda como best-effort).
- **Inventario**: el Catalog Service y el Reservation Service mantienen inventarios separados.
  Un evento creado por el organizador nace con el stock del catálogo, pero el Reservation
  Service crea su propio inventario (con un valor por defecto) en la primera reserva.
- Los workers de **Payment** y **Notification** están mockeados (embebidos en Reservation Service).
- ELK Stack y OpenTelemetry están comentados en `docker-compose.yml`, listos para activar.
- Cada servicio Java usa multi-stage Docker build (Maven → JRE) para imágenes optimizadas.
