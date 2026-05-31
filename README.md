# EventPass — Sistema de Gestión de Eventos y Entradas

## Descripción
Sistema distribuido de venta de entradas diseñado para soportar alta concurrencia (Thundering Herd) mediante una arquitectura de microservicios con sala de espera virtual, procesamiento asíncrono de pagos y garantía de no sobreventa.

## Stack Tecnológico
- **Frontend**: React 18 + Vite + React Router
- **API Gateway**: Spring Cloud Gateway 2023 + JWT (jjwt)
- **Microservicios**: Java 21 + Spring Boot 3.2 + Virtual Threads
- **Bases de Datos**: MySQL 8.0 (x2), Redis 7 (caché + cola)
- **Mensajería**: Apache Kafka 7.6 (Confluent) + Zookeeper
- **Observabilidad**: Prometheus + Grafana (+ ELK y OpenTelemetry comentados)
- **Orquestación**: Docker Compose

## Arquitectura
```
Web UI (React) → API Gateway (Spring Cloud Gateway)
                    ├── Auth (JWT) — manejado por el gateway
                    ├── /api/events/** → Catalog Service (MySQL + Redis)
                    ├── /api/waiting-room/** → Waiting Room (Redis + SSE)
                    └── /api/tickets/** → Reservation Service (MySQL + Kafka)
                                            ↓ Kafka
                                           MockPaymentWorker (cada 15s)
                                            ↓ Kafka
                                           PaymentEventHandler (Saga compensation)
```

## Cómo correr el proyecto

### Requisitos
- Docker y Docker Compose instalados
- Mínimo 8GB RAM disponible

### Pasos
1. Clonar el repositorio
2. En la raíz del proyecto, ejecutar:
   ```bash
   docker compose up --build
   ```
3. Esperar a que todos los servicios estén saludables (~2-5 minutos el primer build)
4. Abrir http://localhost:3000
5. Iniciar sesión con cualquier email + contraseña `pass123`

### Servicios y puertos
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Web UI | 3000 | Frontend React |
| Gateway | 8080 | API Gateway + Auth |
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

### Estructura del proyecto
```
event-pass/
├── docker-compose.yml
├── gateway/               # Spring Cloud Gateway
├── services/
│   ├── waiting-room/      # Fila virtual
│   ├── catalog/           # Catálogo de eventos
│   └── reservation/       # Reservas y pagos
├── web-ui/                # React SPA
├── monitoring/            # Prometheus + Grafana
└── docs/                  # Documentación
```

## Notas importantes
- Los workers de Payment y Notification están mockeados (el mock está embebido en Reservation Service)
- ELK Stack y OpenTelemetry están comentados en docker-compose.yml, listos para activar
- Cada servicio Java usa multi-stage Docker build (Maven → JRE) para imágenes optimizadas
