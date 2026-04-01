import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import WishlistPage from './pages/WishlistPage';
import SearchPage from './pages/SearchPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const Guard = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};
const AdminGuard = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
const GuestGuard = ({ children }) => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
      <Route path="/" element={<Guard><HomePage /></Guard>} />
      <Route path="/products" element={<Guard><ProductsPage /></Guard>} />
      <Route path="/products/:id" element={<Guard><ProductDetailPage /></Guard>} />
      <Route path="/compare" element={<Guard><ComparePage /></Guard>} />
      <Route path="/wishlist" element={<Guard><WishlistPage /></Guard>} />
      <Route path="/search" element={<Guard><SearchPage /></Guard>} />
      <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
