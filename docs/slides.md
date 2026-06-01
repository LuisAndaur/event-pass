---
marp: true
theme: default
paginate: true
title: EventPass — Arquitectura y Demo
---

<!--
Esqueleto de slides (≈14 diapositivas para 15 min · 5 oradores).
- Cada bloque separado por "---" es una diapositiva.
- Copiá los bullets a PowerPoint/Google Slides, o renderizá este archivo con Marp.
- "Notas:" son apuntes del orador (no van en pantalla).
- [S1..S5] indica el orador.
-->

# 🎫 EventPass
## Venta de entradas que sobrevive al pico de alta demanda

Presentación de arquitectura · Equipo de 5

`Notas [S1]:` Saludo + premisa del Thundering Herd. ~20s.

---

# El problema  ·  *Thundering Herd*  [S1]

- Miles de usuarios entran en **el mismo segundo** al salir la venta.
- **3 desafíos técnicos:**
  1. 📈 Picos de demanda brutales y cortos
  2. 🎟️ **No sobrevender** (consistencia del stock)
  3. ⚖️ Experiencia justa, sin caídas

`Notas:` El pico tira abajo el sistema o vende la misma butaca dos veces.

---

# Qué es EventPass  [S1]

- Plataforma de venta de entradas con **3 roles**:
  - 🙋 **Asistente** — busca y compra
  - 🎫 **Organizador** — crea y gestiona eventos
  - 🛡️ **Administrador** — modera la plataforma
- Diseñada para el pico **desde la arquitectura**, no como parche.

`Notas:` Transición → "¿Cómo se sostiene? Arquitectura [S2]". ~30s.

---

# Arquitectura  [S2]

```
Web UI (React) → API Gateway (KrakenD)
   ├─ /auth          → Auth Service (Node/JWT)
   ├─ /events        → Catalog      (MySQL + Redis)
   ├─ /waiting-room  → Waiting Room (Redis)
   └─ /tickets       → Reservation  (MySQL + Kafka)
                          ↓ Kafka (async)
                       Pago (mock) → Saga / compensación
```

- Microservicios + gateway único + mensajería asíncrona.

`Notas:` Recorrer el diagrama de izquierda a derecha.

---

# Decisiones → por qué  [S2]

| Decisión | Por qué |
|---|---|
| **Microservicios** | Cada uno escala/falla distinto |
| **Redis (cola + cache)** | Sala de espera y catálogo veloz |
| **MySQL + lock pesimista** | **No sobreventa** garantizada |
| **Kafka + Saga** | Pago lento, desacoplado y resiliente |
| **KrakenD (Go)** | Gateway liviano (~20 MB vs ~400 MB JVM) |
| **Docker Compose** | MVP de 1 nodo, sin sobre-ingeniería |

`Notas:` Esta slide es el corazón del pitch — detenerse acá.

---

# Patrones clave  [S2]

- 🚪 **Sala de espera virtual:** cola en Redis con *drip-feed* → protege a Reservation del pico.
- 🔒 **Lock pesimista (`SELECT … FOR UPDATE`):** la **base** serializa el stock, no la app.
- 🔁 **Saga asíncrona:** si el pago falla, la compensación **devuelve el stock**.

`Notas:` Transición → "Veámoslo por rol. Asistente [S3]". ~40s.

---

# Demo · Asistente (1/2)  [S3]

**Flujo:** Login → Catálogo → Detalle → **Cola** → Checkout → Mis entradas

- Login (cualquier email + `pass123`) → JWT
- Catálogo con filtro por categoría (Redis cache)
- Detalle + selector de entradas + barra de capacidad

`Notas:` Demo en vivo o capturas. Stack ya logueado.

---

# Demo · Asistente (2/2)  [S3]

- 🚪 **Sala de espera:** posición en la fila → "acceso concedido"
- ⏱️ **Checkout con contador de 10:00** → si expira, se libera la reserva
- 💳 Pago **asíncrono**: PENDING → PAID / RECHAZADA
- 🎟️ **Mis entradas** por estado (Compradas / Pendientes / Rechazadas) + QR

`Notas:` Remarcar: "la cola no es estética, es lo que evita la caída". Transición → [S4].

---

# Demo · Organizador  [S4]

- Acceso por rol (JWT): `organizador@organizador.com` / `123456`
- **Dashboard** con KPIs reales (ventas, ingresos, próximo evento)
- **Crear evento** (wizard 3 pasos) → aparece **al instante** en el catálogo
- **Tickets** (export CSV) · **Métricas** (embudo) · **Escáner QR**

`Notas:` Mostrar que el evento creado se ve enseguida como asistente.

---

# Demo · Administrador  [S4]

- Acceso por rol: `admin@admin.com` / `123456`
- **Dashboard global** + **Métricas** agregadas
- **Gestión de entradas:** ver todas y **cancelar** (devuelve stock)
- **Usuarios** y **Eventos** (vista global / moderación)

`Notas:` "Mismo backend, 3 experiencias; el rol viaja en el JWT". Transición → [S5].

---

# Escalado horizontal  [S5]

- 4 APIs con **2 réplicas** · KrakenD balancea por DNS round-robin
- En caliente: `docker compose up -d --scale catalog=3`
- **Problemas reales resueltos al escalar:**
  - Idempotencia en el pago (eventos duplicados inofensivos)
  - Lock en Redis para el drip-feed
  - Advisory lock para el seeding

`Notas:` Un nodo hoy; multi-nodo (Swarm/K8s) cuando haga falta.

---

# Performance  [S5]

- Prueba de carga con **k6** (a través del gateway)
- 50 usuarios concurrentes:
  - ✅ **p95 ≈ 5 ms**
  - ✅ **0 % errores**
  - ✅ tráfico **repartido entre réplicas**

`Notas:` Mostrar el resumen de k6 o captura de Grafana durante la corrida.

---

# Observabilidad · 3 pilares  [S5]

- 📊 **Métricas:** Prometheus + **Grafana** (gateway + servicios + JVM)
- 📜 **Logs:** Filebeat → Elasticsearch → **Kibana**
- 🔎 **Trazas:** OpenTelemetry → APM → **Kibana APM** (gateway → servicio → MySQL/Kafka)

`Notas:` Capturas de los 3. Es el diferencial de "madurez de ingeniería".

---

# Cierre  [S5]

> Con patrones bien elegidos —**sala de espera, lock pesimista y saga asíncrona**— y un stack
> liviano, EventPass sobrevive al pico de alta demanda **sin sobrevender**, observando todo el
> sistema, y en un solo nodo.

## ¡Gracias!  ·  ¿Preguntas?

`Notas:` Frase final fuerte. Tener a mano las respuestas del pitch.md.
