import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';

// User pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import WishlistPage from './pages/WishlistPage';
import SearchPage from './pages/SearchPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import './index.css';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 */
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

/**
 * AdminRoute
 * Redirects non-admins to / (home). Redirects unauthenticated to /login.
 * SECURITY: Even if someone navigates directly to /admin, they get redirected
 * if their role !== 'admin'. The backend also enforces this with adminOnly middleware.
 */
const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

/**
 * GuestRoute
 * Redirects already-logged-in users away from auth pages.
 */
const GuestRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      {/* ── Auth ────────────────────────────────────────────── */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* ── User routes ─────────────────────────────────────── */}
      <Route path="/"              element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/products"      element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/products/:id"  element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/compare"       element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
      <Route path="/wishlist"       element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/search"        element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

      {/* ── Admin route — role='admin' required ─────────────── */}
      <Route path="/admin"   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* ── Fallback ────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
