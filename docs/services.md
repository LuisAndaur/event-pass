# Microservicios

## waiting-room (puerto 8081)

Gestión de sala de espera virtual usando Redis como cola ordenada (Sorted Set).

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/waiting-room/join` | Ingresa a la cola de un evento |
| GET | `/api/waiting-room/status` | Consulta posición en la cola |
| GET | `/api/waiting-room/sse` | SSE stream con actualizaciones en tiempo real |

### POST /api/waiting-room/join

**Request body:**
```json
{
  "eventId": "1",
  "userId": "12345"
}
```

**Response:**
```json
{
  "position": 0,
  "eventId": "1",
  "status": "in_queue"
}
```

### GET /api/waiting-room/status

**Query params:** `eventId`, `userId`

**Response:**
```json
{
  "eventId": "1",
  "userId": "12345",
  "position": 0,
  "queueSize": 15,
  "status": "in_queue"
}
```

### GET /api/waiting-room/sse — Server-Sent Events

**Query params:** `eventId`, `userId`

Stream con actualizaciones cada 3 segundos:
```
data: {"position":0,"queueSize":15,"hasPass":false,"eventId":"1"}

data: {"position":-1,"queueSize":10,"hasPass":true,"eventId":"1"}
```

### Procesamiento por lotes (pass tokens)

Cada **10 segundos**, una tarea programada (`@Scheduled`) toma los primeros **5 usuarios** de la cola de cada evento, los remueve de la cola y genera un **pass token** JWT que les permite proceder al checkout.

El pass token se almacena en Redis con la misma expiración que el JWT de autenticación.

---

## catalog (puerto 8082)

CRUD de eventos con MySQL (persistencia) y Redis (caché).

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/events` | Lista todos los eventos activos |
| GET | `/api/events/{id}` | Obtiene detalle de un evento |
| POST | `/api/events` | Crea un nuevo evento |
| PUT | `/api/events/{id}` | Actualiza un evento existente |

### GET /api/events

**Response:**
```json
[
  {
    "id": "1",
    "name": "Rock en el Parque",
    "description": "Concierto de rock con bandas locales",
    "date": "2026-06-15",
    "totalCapacity": 500,
    "availableCapacity": 500,
    "price": 35000.00,
    "status": "ACTIVE"
  }
]
```

### Auto-seed

Al iniciar, el servicio crea **6 eventos demo** si la tabla `events` está vacía. Esto permite probar el sistema inmediatamente sin necesidad de cargar datos manualmente.

### Caché

Redis cachea eventos individuales por ID para reducir carga en MySQL. La caché se invalida al actualizar un evento.

---

## reservation (puerto 8083)

Reservas de entradas con locking pesimista (MySQL `SELECT ... FOR UPDATE`) y Kafka para eventos de pago.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/tickets/reserve` | Crea una reserva (con locking pesimista) |
| GET | `/api/tickets/{id}` | Obtiene detalle de una reserva |
| GET | `/api/tickets/user/{userId}` | Lista reservas de un usuario |
| GET | `/api/tickets/user/{userId}/paid` | Lista reservas pagadas de un usuario |

### POST /api/tickets/reserve

**Request body:**
```json
{
  "eventId": "1",
  "userId": "12345",
  "quantity": 2,
  "unitPrice": 35000.00
}
```

**Response (202 — Accepted):**
```json
{
  "reservationId": "uuid",
  "status": "PENDING_PAYMENT",
  "message": "Reservation created. Processing payment..."
}
```

### Mock Payment Worker

Cada **15 segundos**, una tarea programada (`@Scheduled`):
1. Busca reservas en estado `PENDING_PAYMENT`
2. Simula el procesamiento: **80% aprobadas**, **20% rechazadas**
3. Publica un `PaymentEvent` al tópico Kafka `payment-events`
4. Un `PaymentEventHandler` consume el evento y actualiza el estado de la reserva en MySQL

### Kafka Topics

- `ticket-events` — eventos del ciclo de vida de las reservas
- `payment-events` — eventos de procesamiento de pagos (producidos por MockPaymentWorker, consumidos por PaymentEventHandler)

Ambos tópicos se crean automáticamente gracias a `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`.

### Locking pesimista

Al reservar, el servicio ejecuta `SELECT ... FOR UPDATE` sobre el evento en MySQL, bloqueando otras transacciones concurrentes para garantizar que no se exceda la capacidad disponible (no sobreventa).
