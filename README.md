# EventPass — Sistema de Gestión de Eventos y Entradas

![CI/CD](https://github.com/LuisAndaur/event-pass/actions/workflows/ci.yml/badge.svg)

## Descripción
Sistema distribuido de venta de entradas diseñado para soportar alta concurrencia (Thundering Herd) mediante una arquitectura de microservicios con sala de espera virtual, procesamiento asíncrono de pagos y garantía de no sobreventa.

## Stack Tecnológico
- **Frontend**: React 18 + Vite + React Router
- **API Gateway**: KrakenD 2.6 (Go, bajo consumo de recursos) — enrutamiento + CORS
- **Auth Service**: Node.js + Express + jsonwebtoken — emite los JWT del login (se uso esta tecnologia para facilitar la POC)
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
API Gateway (KrakenD)  ──┬── /api/auth/login        → Auth Service → emite JWT
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

# Elastic Stack (seguridad — para logs y trazas en Kibana)
ELASTIC_PASSWORD=elastic123
KIBANA_PASSWORD=kibana123
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

### Credenciales de acceso.
| Tipo de usuario | Email | Contraseña | Acceso |
|-----------------|-------|------------|--------|
| Asistente | cualquier email | `pass123` | Catálogo, reservas, mis entradas |
| Organizador | `organizador@organizador.com` | `123456` | Panel del organizador |
| Administrador | `admin@admin.com` | `123456` | Panel de administración |

> Es una autenticación mock para la demo: cualquier email con `pass123` entra como asistente.
> El acceso al panel de organizador está reservado a `organizador@organizador.com` y el del
> panel de administración a `admin@admin.com`. Según el rol, el login redirige automáticamente
> a `/events` (asistente), `/org` (organizador) o `/admin` (administrador).

### Servicios y puertos.
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
| Elasticsearch | 9200 | 9200 | Logs + trazas (requiere login `elastic`) |
| Kibana | 5601 | 5601 | Logs + APM (requiere login `elastic`) |
| APM Server | 8200 | 8200 | Ingesta de trazas OTLP |
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

## Visualización de logs (ELK)

Stack de logs centralizados: **Filebeat → Elasticsearch → Kibana**. Filebeat lee el `stdout`
de todos los contenedores del proyecto (incluidas las APIs y sus réplicas) vía el socket de
Docker, los enriquece con metadata y los indexa en Elasticsearch. No requiere instrumentar las
apps ni OpenTelemetry: los servicios ya logean a stdout y Filebeat los recolecta directamente.

**Componentes** (definidos en `docker-compose.yml`):
- `elasticsearch` (8.11, single-node, heap 512m) — almacenamiento, `:9200`.
- `kibana` (8.11) — visualización, `:5601`.
- `filebeat` (8.11) — recolección; config en [`monitoring/filebeat/filebeat.yml`](monitoring/filebeat/filebeat.yml).

Los logs se indexan en `eventpass-logs-*`, con metadata por contenedor (`container.name`,
`container.image`, etc.).

**Cómo ver los logs:**
1. Abrí **http://localhost:5601** e iniciá sesión con **`elastic` / `${ELASTIC_PASSWORD}`**
   (por defecto `elastic123`).
2. Menú **☰ → Analytics → Discover**.
3. Seleccioná el data view **EventPass Logs** (se crea automáticamente; si no, crealo sobre el
   patrón `eventpass-logs-*` con time field `@timestamp`).
4. Filtrá por servicio o contenido, por ejemplo:
   - `container.name: "event-pass-catalog-1"` — logs de una réplica de catalog.
   - `container.name: *reservation*` — todas las réplicas de reservation.
   - `message: *ERROR*` — solo errores.

**Notas:**
- Kibana y Elasticsearch tienen **seguridad habilitada** (necesaria para las trazas/Fleet), así
  que piden login (`elastic` / `elastic123`).
- ELK suma ~2.2 GB de RAM (ES 1g + Kibana 1g + Filebeat ~150m). En un host justo, podés bajar
  réplicas de las APIs mientras usás Kibana.
- Los logs se ingestan como texto plano (campo `message`). Para verlos **estructurados** en
  Kibana (nivel, logger, etc. como campos) se puede activar logging JSON/ECS en los servicios
  Java — queda como mejora opcional.

## Trazas distribuidas (APM)

Trazas de extremo a extremo con **OpenTelemetry → APM Server → Elasticsearch → Kibana APM**.
Permite seguir un request a través de los servicios y ver latencias, errores y dependencias
(incluyendo spans de MySQL y Kafka).

**Instrumentación** (automática, sin tocar código de negocio):
- Servicios Java (catalog, reservation, waiting-room): **OpenTelemetry Java Agent** vía
  `-javaagent` (en el `Dockerfile` + `JAVA_TOOL_OPTIONS`). Auto-instrumenta Spring, JDBC y Kafka.
- `auth` (Node): `@opentelemetry/auto-instrumentations-node` cargado con `--require`.
- Todos exportan **OTLP** a `apm-server:8200` (configurado por variables `OTEL_*` en el compose).

**Componentes:**
- `apm-server` (8.11) — recibe OTLP y escribe a Elasticsearch; config en
  [`monitoring/apm-server/apm-server.yml`](monitoring/apm-server/apm-server.yml).
- La **APM integration** de Kibana provee los index templates (se instala vía Fleet — requiere
  la seguridad del Elastic Stack habilitada).

**Cómo ver las trazas:**
1. Abrí **http://localhost:5601** (login `elastic` / `elastic123`).
2. Menú **☰ → Observability → APM**.
3. Vas a ver los servicios (`eventpass-catalog`, `eventpass-reservation`,
   `eventpass-waiting-room`, `eventpass-auth`); entrá a uno para ver transacciones, latencias,
   throughput, errores y el mapa de dependencias.

**Instalación de la APM integration** (una vez, si arrancás desde cero): tras levantar el stack
y que Kibana esté listo, instalá el paquete vía Fleet:
```bash
curl -s -u elastic:elastic123 "http://localhost:5601/api/fleet/epm/packages/apm" -H "kbn-xsrf: true" \
  | grep -o '"latestVersion":"[^"]*"'   # ver la versión, p.ej. 8.11.0
curl -s -X POST "http://localhost:5601/api/fleet/epm/packages/apm/8.11.0" \
  -H "kbn-xsrf: true" -H "Content-Type: application/json" -u elastic:elastic123 -d '{"force":true}'
```

**Nota de recursos:** el APM Server (~512m) y los agentes Java suman carga. En el host de bajos
recursos, durante el análisis de trazas conviene bajar las APIs a `--scale <svc>=1`.

## CI/CD (GitHub Actions)

Un único pipeline en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) con etapas
encadenadas: **el CD solo corre si todo el CI pasó**.

**CI** — en cada push y PR a `master`:
- Build de los 3 servicios Java (`mvn package`, con cache de Maven).
- Build de `auth` (Node) y de `web-ui` (`npm run build`).
- Validación de la config del gateway (`krakend check`) y del `docker-compose.yml`.
- **Smoke test de salud** (`smoke`): levanta el núcleo de la app y verifica que las APIs
  respondan 200 vía gateway.

**CD** (job `publish`, con `needs:` de todos los jobs de CI incl. `smoke`) — solo en push a
`master` y tags `v*` (se omite en PRs):
- Si **algún** job de CI falla, `publish` **no se ejecuta**.
- Construye y publica 5 imágenes en **GHCR**:
  `ghcr.io/luisandaur/event-pass-{auth,catalog,reservation,waiting-room,web-ui}`.
- Tags: `latest` (en master), `sha-<commit>` y semver (`1.2.3`, `1.2`) en tags `v*`.
- Usa `GITHUB_TOKEN` (sin secrets adicionales) y cache de capas Docker.

**Deploy desde GHCR:** cada servicio en `docker-compose.yml` declara `image:` además de `build:`,
así que en un servidor podés consumir las imágenes publicadas sin compilar:
```bash
docker compose pull && docker compose up -d
```
> Tras el primer run de CD, los paquetes de GHCR son **privados** por defecto. Para `pull` sin
> autenticación, hacelos públicos en GitHub → *Packages* → *Package settings* → *Change visibility*;
> o autenticá con `docker login ghcr.io`.

> No hay tests aún, así que el CI valida compilación/build. Al agregar tests (JUnit / Vitest) se
> enchufan en los jobs existentes.

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
├── monitoring/             # Prometheus, Grafana, Filebeat (logs), APM Server (trazas)
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
- **Observabilidad**: métricas (Prometheus + Grafana), logs (Filebeat → Elasticsearch → Kibana)
  y trazas (OpenTelemetry → APM Server → Kibana APM) están activos. Ver las secciones
  *Visualización de logs* y *Trazas distribuidas*.
- **Seguridad del Elastic Stack** habilitada (login `elastic`/`elastic123`); fue necesaria para
  Fleet y la APM integration. Un contenedor init (`es-setup`) fija la clave de `kibana_system`.
- Cada servicio Java usa multi-stage Docker build (Maven → JRE) para imágenes optimizadas.

##Prototipo
https://gold-vulture-401163.hostingersite.com/

## Video demo del POC
https://github.com/user-attachments/assets/3b6cfa15-b4a0-4ca7-9c42-459e1dda2248

- [Video completo](https://drive.google.com/file/d/1s1-yQk4xKPbEwHfbczzUCZQBJXu3iZit/view?usp=drive_link)

