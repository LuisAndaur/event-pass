# 🎫 EventPass — Pitch de presentación (15 min · 5 oradores)

## Premisa (el "gancho" de entrada)
> *"Cuando salen a la venta las entradas de un recital, miles de personas entran en el mismo
> segundo. Ese pico —el **Thundering Herd**— tira abajo la mayoría de los sistemas o, peor,
> vende la misma butaca dos veces. EventPass está diseñado desde cero para sobrevivir a ese
> pico **sin sobreventa**."*

## Distribución de tiempo (≈15 min)
| # | Orador | Tema | Tiempo |
|---|--------|------|--------|
| 1 | Apertura | Problema + qué es EventPass | 2:30 |
| 2 | Arquitectura | Diseño y **justificación** tecnológica | 3:30 |
| 3 | Demo · Asistente | Flujo de compra end-to-end | 3:00 |
| 4 | Demo · Organizador + Admin | Gestión y moderación | 3:00 |
| 5 | Calidad + cierre | Escalado, performance, observabilidad | 3:00 |

---

## 🎤 Orador 1 — Apertura y problema (2:30)

**Objetivo:** enganchar y enmarcar el problema.

**Guion / puntos clave:**
- Saludo + premisa del Thundering Herd (arriba).
- **El problema tiene 3 desafíos técnicos:**
  1. **Picos de demanda** brutales y de corta duración.
  2. **No sobrevender** (consistencia fuerte del stock) aunque miles compren a la vez.
  3. **Experiencia justa**: orden de llegada, sin que se caiga la web.
- **Qué es EventPass:** plataforma de venta de entradas con **3 roles** — Asistente (compra),
  Organizador (crea/gestiona eventos), Administrador (modera la plataforma).
- **Cierre del bloque (transición):** *"¿Cómo se sostiene esto técnicamente? Le paso a
  [Orador 2] que cuenta la arquitectura."*

**Slide:** portada + 3 desafíos + los 3 roles.

---

## 🎤 Orador 2 — Arquitectura y justificación (3:30)

**Objetivo:** mostrar el diseño y **por qué** cada decisión.

**Diagrama (slide central):**
```
Web UI (React) → API Gateway (KrakenD)
   ├─ /auth         → Auth Service (Node/JWT)
   ├─ /events       → Catalog (MySQL + Redis)
   ├─ /waiting-room → Waiting Room (Redis)
   └─ /tickets      → Reservation (MySQL + Kafka)
                         ↓ Kafka (async)
                      Pago (mock) → Saga / compensación
```

**Decisiones + justificación (el corazón del pitch):**
- **Microservicios, no monolito:** cada servicio tiene una naturaleza distinta y escala distinto.
  - *Catalog* = mucha lectura → **cache en Redis**.
  - *Reservation* = escritura con consistencia → **MySQL + lock**.
  - *Waiting Room* = tiempo real → **Redis**.
- **Sala de espera virtual (patrón clave):** una cola en Redis (sorted set) absorbe el pico y
  libera usuarios "de a goteo" (*drip-feed*). **Protege** al servicio de reservas de recibir
  10.000 requests de golpe.
- **No sobreventa → lock pesimista en MySQL** (`SELECT … FOR UPDATE`): aunque dos réplicas
  procesen a la vez, la base serializa el descuento de stock. **Garantía a nivel de datos, no
  de aplicación.**
- **Pago asíncrono con Kafka + patrón Saga:** el pago es lento e inestable; lo desacoplamos. Si
  el pago falla, una **compensación** devuelve el stock automáticamente.
- **Gateway KrakenD (Go), no Spring Cloud Gateway (JVM):** mismo trabajo (routing + CORS) con
  **~15-30 MB en vez de ~400 MB** → clave en un host de bajos recursos.
- **Docker Compose, no Kubernetes:** es un MVP de **un nodo**; escalamos con réplicas y subimos
  a multi-nodo solo si hace falta. No sobre-ingeniería.

**Transición:** *"Veamos cómo se siente todo esto para cada rol. Arranca el Asistente."*

**Slides:** (1) diagrama de arquitectura, (2) tabla "decisión → por qué".

---

## 🎤 Orador 3 — Demo: Asistente (3:00)

**Objetivo:** mostrar el flujo de compra y los patrones "en vivo".

**Guion (demo o capturas):** login → catálogo → detalle → **cola** → checkout → mis entradas.
- **Login** (cualquier email + `pass123`) → JWT emitido por el Auth Service.
- **Catálogo** con filtro por categoría (datos reales del Catalog, cacheados en Redis).
- **Detalle del evento** + selector de entradas y barra de capacidad.
- **Sala de espera virtual:** *"Acá está el patrón estrella"* — muestra posición en la fila,
  avanza por polling; cuando es el turno, **acceso concedido**.
- **Checkout con contador de 10:00 regresivo:** si expira → modal "tiempo finalizado" y se
  libera la reserva. El pago se procesa **async** (queda PENDING → PAID/RECHAZADA).
- **Mis entradas:** tabs por estado (Compradas / Pendientes / Rechazadas) con QR.

**Mensaje a remarcar:** *"La cola no es estética: es el mecanismo que evita que el pico mate al
sistema."*

**Transición:** *"Eso es comprar. Ahora, ¿quién publica esos eventos y quién modera? [Orador 4]."*

---

## 🎤 Orador 4 — Demo: Organizador + Administrador (3:00)

**Objetivo:** mostrar gestión y control, y el acceso por roles.

- **Control de acceso por rol (JWT):** el login redirige según rol; cada panel está protegido.
  Credenciales:
  - Organizador → `organizador@organizador.com` / `123456`
  - Admin → `admin@admin.com` / `123456`

**Organizador** (panel propio):
- **Dashboard:** KPIs (ventas, ingresos, próximo evento) reales.
- **Crear evento:** wizard de 3 pasos → publica un evento real (`POST /api/events`) que
  **aparece al instante** en el catálogo del asistente.
- **Tickets** (con export CSV), **Métricas** (embudo de conversión) y **Escáner QR** de acceso.

**Administrador** (panel de moderación):
- **Dashboard global** + **Métricas** agregadas de toda la plataforma.
- **Gestión de entradas:** ver todas las reservas y **cancelar** (devuelve stock al inventario).
- **Usuarios** (derivados del historial) y **Eventos** (catálogo global).

**Mensaje:** *"Mismo backend, tres experiencias; el rol viaja en el JWT y el frontend + las
rutas lo respetan."*

**Transición:** *"Funciona… ¿pero aguanta y lo podemos operar? [Orador 5]."*

---

## 🎤 Orador 5 — Calidad, escalado y observabilidad + cierre (3:00)

**Objetivo:** demostrar madurez de ingeniería y cerrar fuerte.

- **Escalado horizontal:** las 4 APIs corren con **2 réplicas**; KrakenD balancea por DNS
  round-robin. Se escala en caliente: `docker compose up -d --scale catalog=3`.
  - *"Escalar trajo problemas reales que resolvimos"*: **idempotencia** en el pago (eventos
    duplicados inofensivos), **lock en Redis** para el drip-feed, **advisory lock** para el seeding.
- **Prueba de performance (k6):** 50 usuarios concurrentes → **p95 ~5 ms, 0 errores**, tráfico
  repartido entre réplicas.
- **Observabilidad completa (3 pilares):**
  - **Métricas:** Prometheus + **dashboard de Grafana** (gateway + servicios + JVM).
  - **Logs:** Filebeat → Elasticsearch → **Kibana** (centralizados por servicio).
  - **Trazas:** OpenTelemetry → APM → **Kibana APM** (un request a través de gateway, servicio,
    MySQL y Kafka).

**Cierre (frase final):**
> *"EventPass demuestra cómo, con patrones bien elegidos —sala de espera, lock pesimista y saga
> asíncrona— y un stack liviano, se puede sobrevivir al pico de alta demanda **sin sobrevender**,
> observando todo el sistema, y todo corriendo en un solo nodo. Gracias."*

**Slides:** (1) escalado + resultado k6, (2) los 3 pilares de observabilidad (capturas
Grafana/Kibana/APM), (3) cierre.

---

## 🛡️ Preparación para preguntas (repartir entre todos)
- **¿Por qué no Kubernetes?** MVP de un nodo; Compose escala con réplicas. K8s/Swarm cuando un
  host no alcance o se necesite HA/autoscaling.
- **¿Cómo evitan la sobreventa exactamente?** Lock pesimista en MySQL al descontar stock; la BD
  serializa, no la app → seguro aunque haya réplicas.
- **¿Qué pasa si falla el pago?** Kafka + Saga: se marca FAILED y la compensación **devuelve el
  stock**.
- **¿La cola es real?** Sí, sorted set en Redis con drip-feed; un lock garantiza que con varias
  réplicas el ritmo no se multiplique.
- **¿Seguridad del JWT?** Hoy se valida el rol en el front + emite el Auth Service; el gateway
  puede activar validación de JWT en el borde (KrakenD lo soporta).
- **¿Single point of failure?** Para el MVP sí (gateway/DBs únicos); el diseño permite
  clusterizar después.

## 💡 Tips de ejecución
- **Ensayen las transiciones** (cada orador "pasa la pelota" nombrando al siguiente).
- **Demo con red de seguridad:** tener **capturas** por si falla el vivo; dejar el stack ya
  levantado y logueado.
- **Reloj visible:** si se atrasan, los oradores 3 y 4 pueden acortar la demo a capturas.
