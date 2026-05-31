import http from 'k6/http';
import { check, sleep } from 'k6';

// ---- Configuración (override por variables de entorno -e KEY=val) ----
const BASE = __ENV.BASE_URL || 'http://gateway:8080';
const PEAK = parseInt(__ENV.PEAK_VUS || '50', 10);
const RAMP = __ENV.RAMP || '20s';
const HOLD = __ENV.HOLD || '40s';
const EMAIL = __ENV.EMAIL || 'admin@admin.com';
const PASSWORD = __ENV.PASSWORD || '123456';

export const options = {
  scenarios: {
    catalog_browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP, target: PEAK },   // subida
        { duration: HOLD, target: PEAK },   // sostenido
        { duration: '10s', target: 0 },     // bajada
      ],
      gracefulStop: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],        // < 1% de errores
    http_req_duration: ['p(95)<800'],      // p95 < 800ms
    checks: ['rate>0.99'],                 // > 99% de checks OK
  },
};

// Login una sola vez; el token se comparte entre todos los VUs.
export function setup() {
  const res = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status !== 200) {
    throw new Error(`Login falló: status=${res.status} body=${res.body}`);
  }
  return { token: res.json('token') };
}

export default function (data) {
  const params = {
    headers: { Authorization: `Bearer ${data.token}` },
    tags: { name: 'GET /api/events' },
  };
  const res = http.get(`${BASE}/api/events`, params);

  check(res, {
    'status 200': (r) => r.status === 200,
    'devuelve eventos': (r) => {
      try { return Array.isArray(r.json()) && r.json().length > 0; }
      catch { return false; }
    },
  });

  // Think time 0.2s–0.7s para simular navegación real.
  sleep(Math.random() * 0.5 + 0.2);
}
