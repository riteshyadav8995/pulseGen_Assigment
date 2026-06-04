import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import VideoLibrary from './pages/VideoLibrary';
import VideoPlayer  from './pages/VideoPlayer';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <SocketProvider isAuthenticated={!!user}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Protected — any authenticated role */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/library"   element={<ProtectedRoute><VideoLibrary /></ProtectedRoute>} />
        <Route path="/player/:id" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />

        {/* Protected — editor + admin only */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['editor', 'admin']}>
              <Upload />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </SocketProvider>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          duration: 4000,
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
