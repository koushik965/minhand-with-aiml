import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand */}
          <NavLink to="/" className="navbar-brand">
            🛍️ SmartShop
          </NavLink>

          {/* Search bar — only for users, not shown on admin dashboard */}
          {!isAdmin && !location.pathname.startsWith('/admin') && (
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '380px', margin: '0 24px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  style={{
                    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '50px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                    fontSize: '0.88rem', padding: '9px 40px 9px 18px', outline: 'none',
                    transition: 'border-color var(--transition)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="submit" style={{
                  position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--accent)', border: 'none', borderRadius: '50px',
                  color: '#fff', fontSize: '0.78rem', padding: '5px 12px', cursor: 'pointer',
                }}>
                  Search
                </button>
              </div>
            </form>
          )}

          {/* Nav links */}
          <ul className="navbar-links">
            {isAdmin ? (
              // Admin sees only dashboard link
              <li>
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  📊 <span>Dashboard</span>
                </NavLink>
              </li>
            ) : (
              // Regular users see product navigation only
              // NO interest profile, NO analytics, NO tracking data
              <>
                <li>
                  <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                    🏠 <span>Home</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                    🛒 <span>Products</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/compare" className={({ isActive }) => isActive ? 'active' : ''}>
                    ⚖️ <span>Compare</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/wishlist" className={({ isActive }) => isActive ? 'active' : ''}>
                    ❤️ <span>Wishlist</span>
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '0.88rem' }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
