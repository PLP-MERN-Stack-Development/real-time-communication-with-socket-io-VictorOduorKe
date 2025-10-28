import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';

function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/chat" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <ChatRoom />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={<Navigate to="/chat" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <div className="h-full">
          <AppRoutes />
        </div>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}



export default App