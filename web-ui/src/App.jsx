import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import QueuePage from './pages/QueuePage';
import CheckoutPage from './pages/CheckoutPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets from './pages/admin/AdminTickets';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminEventos from './pages/admin/AdminEventos';
import AdminMetricas from './pages/admin/AdminMetricas';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/queue/:eventId" element={<QueuePage />} />
      <Route path="/checkout/:eventId" element={<CheckoutPage />} />
      <Route path="/tickets" element={<MyTicketsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      <Route path="/admin/eventos" element={<AdminEventos />} />
      <Route path="/admin/metricas" element={<AdminMetricas />} />
      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}

export default App;
