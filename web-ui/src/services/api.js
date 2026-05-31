const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

let authToken = localStorage.getItem('eventpass_token');

export const setAuthToken = (token) => {
  authToken = token;
  if (token) localStorage.setItem('eventpass_token', token);
  else localStorage.removeItem('eventpass_token');
};

export const getAuthToken = () => authToken;

// Decodes the JWT payload to expose the current user's identity and role.
export const getUserInfo = () => {
  const token = authToken || localStorage.getItem('eventpass_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const isAdmin = () => getUserInfo()?.role === 'ROLE_ADMIN';
export const isOrganizer = () => getUserInfo()?.role === 'ROLE_ORGANIZADOR';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

// Auth
export const login = (email, password) =>
  fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

// Catalog
export const getEvents = () =>
  fetch(`${API_URL}/api/events`, { headers: headers() }).then(handleResponse);

export const getEvent = (id) =>
  fetch(`${API_URL}/api/events/${id}`, { headers: headers() }).then(handleResponse);

export const createEvent = (event) =>
  fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(event),
  }).then(handleResponse);

// Waiting Room
export const joinQueue = (eventId, userId) =>
  fetch(`${API_URL}/api/waiting-room/join`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ eventId, userId }),
  }).then(handleResponse);

export const getQueueStatus = (eventId, userId) =>
  fetch(`${API_URL}/api/waiting-room/status?eventId=${eventId}&userId=${userId}`, {
    headers: headers(),
  }).then(handleResponse);

// Reservations
export const reserveTicket = (eventId, userId, quantity, unitPrice, email) =>
  fetch(`${API_URL}/api/tickets/reserve`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ eventId, userId, quantity, unitPrice, email }),
  }).then(handleResponse);

export const getUserReservations = (userId) =>
  fetch(`${API_URL}/api/tickets/user/${userId}`, { headers: headers() }).then(handleResponse);

export const getReservation = (id) =>
  fetch(`${API_URL}/api/tickets/${id}`, { headers: headers() }).then(handleResponse);

// Admin
export const getAllReservations = () =>
  fetch(`${API_URL}/api/tickets`, { headers: headers() }).then(handleResponse);

export const cancelReservation = (id) =>
  fetch(`${API_URL}/api/tickets/${id}/cancel`, {
    method: 'POST',
    headers: headers(),
  }).then(handleResponse);
