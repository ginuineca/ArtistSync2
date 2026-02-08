import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import Events from './components/events/Events';
import EventDetail from './components/events/EventDetail';
import CreateEvent from './components/events/CreateEvent';
import EditEvent from './components/events/EditEvent';
import MyEvents from './components/events/MyEvents';
import Notifications from './components/notifications/Notifications';
import SearchUsers from './components/search/SearchUsers';
import Messages from './components/messages/Messages';
import Conversation from './components/messages/Conversation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="events" element={<Events />} />
          <Route path="events/my" element={<MyEvents />} />
          <Route path="events/new" element={<CreateEvent />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="events/:id/edit" element={<EditEvent />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="search" element={<SearchUsers />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Conversation />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
