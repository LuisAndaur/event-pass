/**
 * Subscribe to the waiting room SSE stream for real-time position updates.
 *
 * Note: the KrakenD API gateway proxies REST calls but does not stream
 * server-sent events, so this is best-effort. If the stream can't be
 * established we close it immediately (instead of letting EventSource
 * reconnect in a loop) and the caller falls back to periodic polling.
 */
export const subscribeToQueue = (eventId, userId, onMessage, onError) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const url = `${API_URL}/api/waiting-room/sse?eventId=${eventId}&userId=${userId}`;

  let eventSource;
  try {
    eventSource = new EventSource(url);
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };

  eventSource.onerror = (err) => {
    // Stop auto-reconnect attempts; polling keeps the UI up to date.
    eventSource.close();
    if (onError) onError(err);
  };

  return () => eventSource.close();
};
