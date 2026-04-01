import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!user) return null;
  const isAdmin = user.role === 'admin';

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) { navigate(`/search?q=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: scrolled ? 'rgba(13,15,26,0.95)' : 'rgba(13,15,26,0.8)',
      backdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.3s ease',
      height: 72,
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>

          {/* Logo */}
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #f0d060)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 900, color: '#0d0f1a',
              boxShadow: '0 0 20px rgba(212,175,55,0.4)',
              fontFamily: 'var(--font-display)',
            }}>M</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
                <span className="gold-text">Min</span><span style={{ color: 'var(--text-primary)' }}>Hand</span>
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Minutes In Hand</div>
            </div>
          </NavLink>

          {/* Search bar — users only */}
          {!isAdmin && (
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 420 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products, brands..."
                  style={{
                    width: '100%', background: 'var(--elevated)',
                    border: '1px solid var(--border-subtle)', borderRadius: 50,
                    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                    fontSize: '0.88rem', padding: '10px 48px 10px 44px',
                    outline: 'none', transition: 'all 0.24s ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="submit" style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                  border: 'none', borderRadius: 50, color: '#0d0f1a',
                  fontSize: '0.72rem', fontWeight: 700, padding: '6px 14px', cursor: 'pointer',
                }}>GO</button>
              </div>
            </form>
          )}

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isAdmin ? (
              <NavLink to="/admin" style={({ isActive }) => ({
                padding: '8px 18px', borderRadius: 50, fontSize: '0.88rem', fontWeight: 600,
                color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                background: isActive ? 'var(--gold-glow)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-glow)' : 'transparent'}`,
                transition: 'all 0.24s ease',
              })}>
                📊 Dashboard
              </NavLink>
            ) : (
              <>
                {[['/', '🏠', 'Home'], ['/products', '🛍️', 'Shop'], ['/compare', '⚖️', 'Compare'], ['/wishlist', '♥', 'Saved']].map(([path, icon, label]) => (
                  <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
                    padding: '8px 14px', borderRadius: 50, fontSize: '0.86rem', fontWeight: 500,
                    color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--gold-glow)' : 'transparent',
                    transition: 'all 0.24s ease', display: 'flex', alignItems: 'center', gap: 5,
                  })}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--elevated)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; }}>
                    <span>{icon}</span>
                    <span style={{ display: window.innerWidth < 900 ? 'none' : 'inline' }}>{label}</span>
                  </NavLink>
                ))}
              </>
            )}

            {/* User menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: isAdmin ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'linear-gradient(135deg, #4ade80, #22c55e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 800, color: '#0d0f1a',
                flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)',
              }}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
