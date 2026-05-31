/**
 * Subscribe to the waiting room SSE stream for real-time position updates.
 */
export const subscribeToQueue = (eventId, userId, onMessage, onError) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const token = localStorage.getItem('eventpass_token');

  const url = `${API_URL}/api/waiting-room/sse?eventId=${eventId}&userId=${userId}`;

  const eventSource = new EventSource(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
    if (onError) onError(err);
  };

  return () => eventSource.close();
};
