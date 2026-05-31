# Observabilidad

## Prometheus — http://localhost:9090

### Configuración

- **Scrape interval**: cada 15 segundos
- **Jobs configurados**: gateway, waiting-room, catalog, reservation
- **Metrics path**: `/actuator/prometheus` en cada servicio Java

### Targets scrapeados

| Job | Endpoint |
|-----|----------|
| `gateway` | `gateway:8080/actuator/prometheus` |
| `waiting-room` | `waiting-room:8081/actuator/prometheus` |
| `catalog` | `catalog:8082/actuator/prometheus` |
| `reservation` | `reservation:8083/actuator/prometheus` |

### Consultas útiles

```promql
# Estado de todos los servicios
up{job=~"gateway|waiting-room|catalog|reservation"}

# Métricas JVM por servicio
jvm_memory_used_bytes{area="heap"}

# Tasa de requests HTTP (por servicio si exponen métricas)
http_server_requests_seconds_count
```

## Grafana — http://localhost:3001

### Acceso

- **URL**: [http://localhost:3001](http://localhost:3001)
- **Usuario**: `admin`
- **Contraseña**: `admin`

### Dashboard pre-cargado: "EventPass — Overview"

El dashboard se aprovisiona automáticamente al iniciar el contenedor y contiene:

- **Health Status** — estado de cada servicio (up/down)
- _(paneles adicionales configurados en `monitoring/grafana/dashboards/eventpass-overview.json`)_

### Datasource

- Prometheus configurado como datasource por defecto via provisioning (`monitoring/grafana/provisioning/datasources/prometheus.yml`)

## Kafka Topics

Los siguientes tópicos se crean automáticamente en el broker Kafka (puerto `9092`):

| Tópico | Propósito |
|--------|-----------|
| `ticket-events` | Eventos del ciclo de vida de las reservas |
| `payment-events` | Eventos de procesamiento de pagos |

La creación automática está habilitada via `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true` en el contenedor Kafka.

## Stack adicional (comentado en docker-compose.yml)

Los siguientes componentes están definidos pero **comentados**, listos para activarse si es necesario:

- **ELK Stack**: Elasticsearch (puerto 9200), Logstash (puerto 5000), Kibana (puerto 5601)
- **OpenTelemetry Collector**: puertos 4317 (gRPC) y 4318 (HTTP)

Para activarlos, descomentar los servicios correspondientes en `docker-compose.yml` y sus configuraciones en `monitoring/`.
