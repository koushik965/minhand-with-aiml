import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI, adAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import AdBanner from '../components/ads/AdBanner';
import useTracker from '../hooks/useTracker';

const CATS = ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'];
const CAT_ICONS = { Technology: '💻', Sports: '⚽', Fashion: '👗', Food: '🍜', Automotive: '🚗', Travel: '✈️', Education: '📚', Entertainment: '🎬', Health: '💊', Finance: '💰' };

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const { trackPageVisit, trackCategory, startDwell, endDwell } = useTracker();

  useEffect(() => {
    trackPageVisit('/');
    startDwell();
    return () => endDwell('/');
  }, []); // eslint-disable-line

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort: 'newest' };
      if (activeCategory) params.category = activeCategory;
      const [pRes, adRes] = await Promise.all([productAPI.getAll(params), adAPI.getRecommendations(4)]);
      setProducts(pRes.data.data || []);
      setAds(adRes.data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCat = cat => {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    if (next) trackCategory(next, '/');
  };

  const handleCompare = id => setCompareIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
  );

  const handleSearch = e => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  // Interleave ads naturally every 6 products
  const feed = [];
  products.forEach((p, i) => {
    feed.push({ type: 'product', data: p });
    if ((i + 1) % 6 === 0 && ads[Math.floor(i / 6)]) feed.push({ type: 'ad', data: ads[Math.floor(i / 6)] });
  });

  return (
    <div>
      {/* ── Hero Section ─────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '80px 0 72px',
        background: 'linear-gradient(180deg, rgba(212,175,55,0.07) 0%, transparent 100%)',
      }}>
        {/* Decorative lines */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${15 + i * 18}%`, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,${0.03 + i * 0.01}), transparent)`,
            pointerEvents: 'none',
          }} />
        ))}
        {/* Gold orb */}
        <div style={{ position: 'absolute', top: -100, right: '15%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="eyebrow fade-up">✦ Smart Product Discovery Platform</div>
          <h1 className="display-1 fade-up-1" style={{ marginBottom: 20 }}>
            Every Minute <span className="gold-text">In Hand</span>
          </h1>
          <p className="fade-up-2" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Discover products tailored to you. Our AI learns your taste in real time — the longer you browse, the better it gets.
          </p>

          {/* Hero search */}
          <form onSubmit={handleSearch} className="fade-up-3" style={{ display: 'flex', maxWidth: 520, margin: '0 auto 48px', gap: 10 }}>
            <input
              className="form-control"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search products, brands, categories…"
              style={{ borderRadius: 50, flex: 1, padding: '14px 22px', fontSize: '0.95rem' }}
            />
            <button className="btn btn-gold" type="submit" style={{ borderRadius: 50, padding: '14px 28px', flexShrink: 0 }}>
              Search
            </button>
          </form>

          {/* Feature pills */}
          <div className="fade-up-4" style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[['⚡', 'AI Recommendations'], ['⚖️', 'Side-by-Side Compare'], ['♥', 'Personal Wishlist'], ['🔍', 'Smart Search']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 50, background: 'var(--elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48 }}>
        {/* Category filter */}
        <div className="pill-row fade-up">
          <button className={`pill ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>🌐 All</button>
          {CATS.map(c => (
            <button key={c} className={`pill ${activeCategory === c ? 'active' : ''}`} onClick={() => handleCat(c)}>
              {CAT_ICONS[c]} {c}
            </button>
          ))}
        </div>

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div className="fade-up" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>⚖️ {compareIds.length} products selected for comparison</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-gold btn-sm" onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>Compare Now →</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>Clear</button>
            </div>
          </div>
        )}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow">{activeCategory ? `Browsing` : 'Curated for You'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
              {activeCategory ? `${CAT_ICONS[activeCategory]} ${activeCategory}` : '✦ Featured Products'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/products')}>Browse All →</button>
            <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}>🔄 Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading your personalized feed…</p>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📭</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 8 }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try a different category or check back soon.</p>
          </div>
        ) : (
          <div className="grid-products">
            {feed.map((item, i) =>
              item.type === 'product' ? (
                <ProductCard key={item.data._id} product={item.data} compareIds={compareIds} onCompareToggle={handleCompare}
                  animClass={`fade-up-${Math.min((i % 5) + 1, 5)}`} />
              ) : (
                <AdBanner key={`ad-${i}`} ad={item.data} variant="card" />
              )
            )}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && products.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 56, padding: '40px', background: 'linear-gradient(135deg, rgba(212,175,55,0.05), rgba(212,175,55,0.02))', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 10 }}>
              Want to see more?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Browse our complete catalog with filters and sorting</p>
            <button className="btn btn-gold btn-lg" onClick={() => navigate('/products')}>Explore All Products →</button>
          </div>
        )}
      </div>
    </div>
  );
}
