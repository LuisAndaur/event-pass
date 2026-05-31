const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

let authToken = localStorage.getItem('eventpass_token');

export const setAuthToken = (token) => {
  authToken = token;
  if (token) localStorage.setItem('eventpass_token', token);
  else localStorage.removeItem('eventpass_token');
};

export const getAuthToken = () => authToken;

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
export const reserveTicket = (eventId, userId, quantity, unitPrice) =>
  fetch(`${API_URL}/api/tickets/reserve`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ eventId, userId, quantity, unitPrice }),
  }).then(handleResponse);

export const getUserReservations = (userId) =>
  fetch(`${API_URL}/api/tickets/user/${userId}`, { headers: headers() }).then(handleResponse);

export const getReservation = (id) =>
  fetch(`${API_URL}/api/tickets/${id}`, { headers: headers() }).then(handleResponse);
