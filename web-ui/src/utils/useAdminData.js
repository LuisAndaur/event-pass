import { useState, useEffect, useCallback } from 'react';
import { getAllReservations, getEvents } from '../services/api';

// Shared loader for the admin pages: fetches all reservations + the event
// catalog and exposes a refresh function (used after a cancellation).
export function useAdminData() {
  const [reservations, setReservations] = useState([]);
  const [eventsById, setEventsById] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      getAllReservations().catch(() => []),
      getEvents().catch(() => []),
    ])
      .then(([res, evs]) => {
        setReservations(Array.isArray(res) ? res : []);
        setEvents(evs || []);
        const map = {};
        (evs || []).forEach((e) => { map[e.id] = e; });
        setEventsById(map);
      })
      .catch((e) => setError(e.message || 'Error cargando datos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { reservations, events, eventsById, loading, error, refresh: load };
}
