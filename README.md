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
| Servicio | Puerto host | Puerto interno | Descripción |
|----------|-------------|----------------|-------------|
| Web UI | 3000 | 3000 | Frontend React |
| Gateway (KrakenD) | 8080 | 8080 | API Gateway (routing + CORS) |
| Gateway métricas | — | 9091 | Endpoint Prometheus de KrakenD (interno) |
| Auth Service | dinámico ×2 | 8084 | Emisión de JWT (escalado, vía gateway) |
| Waiting Room | dinámico ×2 | 8081 | Fila virtual (escalado) |
| Catalog | dinámico ×2 | 8082 | Catálogo de eventos (escalado) |
| Reservation | dinámico ×2 | 8083 | Reservas y pagos (escalado) |
| Prometheus | 9090 | 9090 | Métricas |
| Grafana | 3001 | 3000 | Dashboards (admin/admin) |
| Kafka | 9092 | 9092 | Mensajería |
| MySQL Catalog | 3307 | 3306 | BD de eventos |
| MySQL Reservation | 3308 | 3306 | BD de reservas |
| Redis | 6379 | 6379 | Caché y cola |
| Zookeeper | 2181 | 2181 | Coordinación Kafka |

> Las 4 APIs corren con **2 réplicas** y publican su puerto en un **host port dinámico por réplica**
> (para evitar conflictos al escalar). El acceso normal es siempre vía el gateway (`:8080`).
> Para ver el puerto asignado a cada réplica (p. ej. para abrir su Swagger): `docker compose ps`.

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

## Escalado horizontal

Las 4 APIs (auth, catalog, reservation, waiting-room) escalan horizontalmente **en un solo
nodo** con réplicas de Docker Compose. No se usa Kubernetes/Swarm: para un MVP de bajos
recursos, Compose alcanza y el salto a multi-nodo se deja para cuando un host ya no dé abasto.

**Cómo funciona:**
- Cada API declara `deploy.replicas: 2` con límite de memoria (`384M` Java / `128M` Node) y
  tuning de JVM (`-XX:MaxRAMPercentage=70 -XX:+UseSerialGC`).
- El **balanceo** lo hace el DNS interno de Docker (round-robin): KrakenD apunta a
  `http://catalog:8082` y el tráfico se reparte entre las réplicas. Bajo alta concurrencia
  (el escenario de alta demanda) la distribución es efectiva; con muy baja concurrencia
  KrakenD puede reutilizar una conexión y "pegarse" a una réplica (irrelevante bajo carga).
- **Prometheus** descubre todas las réplicas vía `dns_sd_configs` (tipo A) y las scrapea todas;
  el dashboard agrega por `application`.

**Ajustar la cantidad de réplicas según el consumo (en caliente):**
```bash
docker compose up -d --scale catalog=3      # subir
docker compose up -d --scale catalog=2      # bajar
docker stats                                # observar consumo por réplica
```

**Seguridad ante réplicas (sin contenedores extra):**
- `reservation`: `PaymentEventHandler` es idempotente (ignora eventos de pago de reservas ya
  resueltas), así los eventos duplicados que generan las réplicas del `MockPaymentWorker` no
  causan doble procesamiento. La garantía de no-sobreventa la da el lock pesimista en MySQL.
- `waiting-room`: el drip-feed de la fila usa un lock en Redis (`SET NX EX`) para que solo una
  réplica lo ejecute por ciclo, manteniendo constante el ritmo del throttle.
- `catalog`: el `DataSeeder` usa un advisory lock de MySQL (`GET_LOCK`) para que, en un primer
  arranque con varias réplicas, solo una siembre los datos de ejemplo.

**Qué NO se escala (a propósito):** MySQL (×2), Redis, Kafka, Zookeeper y el propio gateway
quedan en una instancia. Escalar datos/mensajería requiere clustering, fuera del alcance del MVP.

## Prueba de performance

Se incluye una prueba de carga con [k6](https://k6.io) (vía Docker, sin instalar nada) que
ataca `GET /api/events` **a través del gateway**, midiendo la ruta completa
(KrakenD → balanceo → réplicas de catalog → MySQL/Redis). El script está en
[`perf/catalog-load.js`](perf/catalog-load.js): hace login una vez, reutiliza el JWT y aplica
una rampa de VUs con *think time*, con umbrales de error (<1%) y latencia p95 (<800 ms).

**Requisito:** tener el stack levantado (`docker compose up -d`).

**Ejecución (PowerShell, Windows):**
```powershell
cd "C:\ruta\al\event-pass"
docker run --rm -i --network event-pass_event-pass-net -v "${PWD}\perf:/perf" grafana/k6 run /perf/catalog-load.js
```

**Ejecución (bash / Git Bash / Linux / macOS):**
```bash
docker run --rm -i --network event-pass_event-pass-net grafana/k6 run - < perf/catalog-load.js
```

**Parámetros opcionales** (variables de entorno con `-e`): `PEAK_VUS` (VUs pico, def. 50),
`RAMP` (def. `20s`), `HOLD` (def. `40s`), `BASE_URL` (def. `http://gateway:8080`),
`EMAIL` / `PASSWORD` (credenciales del login). Ejemplo subiendo a 100 VUs:
```powershell
docker run --rm -i --network event-pass_event-pass-net -e PEAK_VUS=100 -v "${PWD}\perf:/perf" grafana/k6 run /perf/catalog-load.js
```

> El nombre de red `event-pass_event-pass-net` es el que crea Compose (prefijo = nombre de la
> carpeta del proyecto). Verificalo con `docker network ls` si tu carpeta tiene otro nombre.
> Mientras corre, podés observar el impacto en vivo en Grafana (dashboard *EventPass — Overview*).

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
├── perf/                   # Pruebas de carga (k6)
└── docs/                   # Documentación
```

## Notas importantes
- El **API Gateway** es KrakenD (Go), elegido por su bajo consumo de recursos frente a un
  gateway sobre la JVM. Hace routing transparente y CORS; expone métricas Prometheus en `:9091`.
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
