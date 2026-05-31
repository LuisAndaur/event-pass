# Web UI — React SPA

## Acceso

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

## Login

- **Email**: cualquier dirección de email (e.g. `user@example.com`)
- **Contraseña**: `pass123`

> Si el email contiene "organizer" (e.g. `organizer@example.com`), obtendrá rol `ROLE_ORGANIZADOR`. De lo contrario, obtendrá `ROLE_ASISTENTE`.

## Flujos disponibles

1. **Login** — formulario de inicio de sesión que envía `{email, password}` al gateway, recibe JWT y lo almacena en memoria/localStorage.
2. **Browse events catalog** — lista de eventos disponibles obtenida desde el Catalog Service vía gateway.
3. **View event detail** — vista detallada de un evento con descripción, fecha, precio y disponibilidad.
4. **Enter virtual waiting room** — al intentar comprar entradas, el usuario ingresa a una sala de espera virtual (conexión SSE para actualizaciones en tiempo real de la posición en la cola).
5. **Checkout with async payment** — al salir de la sala de espera, se realiza la reserva con pago asíncrono. El estado de la reserva se actualiza cuando el MockPaymentWorker procesa el pago (~15s, 80% aprobación).

## Notas

- 6 eventos demo se auto-seeden al iniciar el Catalog Service.
- La Web UI se comunica exclusivamente con el Gateway en `http://localhost:8080`.
- La API base se configura vía `VITE_API_URL` en docker-compose.
