import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI, adAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import AdBanner from '../components/ads/AdBanner';
import useInteractionTracker from '../hooks/useInteractionTracker';

const CATEGORIES = ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'];

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { trackPageVisit, trackCategoryBrowse, startDwellTimer, endDwellTimer } = useInteractionTracker();

  useEffect(() => {
    trackPageVisit('/');
    startDwellTimer();
    return () => endDwellTimer('/');
  }, []); // eslint-disable-line

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory) params.category = activeCategory;
      const [prodRes, adRes] = await Promise.all([
        productAPI.getAll(params),
        adAPI.getRecommendations(3),
      ]);
      setProducts(prodRes.data.data || []);
      setAds(adRes.data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCategoryClick = (cat) => {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    if (next) trackCategoryBrowse(next, '/');
  };

  const handleCompareToggle = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Interleave ads naturally into product grid (every 5 products)
  const buildFeed = () => {
    const feed = [];
    products.forEach((p, i) => {
      feed.push({ type: 'product', data: p });
      if ((i + 1) % 5 === 0 && ads[(i + 1) / 5 - 1]) {
        feed.push({ type: 'ad', data: ads[Math.floor(i / 5)] });
      }
    });
    return feed;
  };

  const feed = buildFeed();

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '48px 0 40px', background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.1) 0%, transparent 60%)', marginBottom: 40, borderRadius: 'var(--radius-xl)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, marginBottom: 12, background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Discover. Compare. Decide.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 28 }}>
            Smart product discovery with AI-powered recommendations
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 500, margin: '0 auto', gap: 8 }}>
            <input
              className="form-control"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, categories..."
              style={{ borderRadius: '50px', flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
        </div>

        {/* Category filter pills */}
        <div className="category-pills" style={{ marginBottom: 32 }}>
          <button className={`category-pill ${!activeCategory ? 'active' : ''}`} onClick={() => { setActiveCategory(null); }}>
            🌐 All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`category-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => handleCategoryClick(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ⚖️ {compareIds.length} product{compareIds.length > 1 ? 's' : ''} selected for comparison
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 18px' }}
                onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>
                Compare Now →
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 14px' }} onClick={() => setCompareIds([])}>
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                {activeCategory ? `${activeCategory} Products` : 'All Products'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{products.length} products</span>
            </div>

            <div className="ads-grid">
              {feed.map((item, i) =>
                item.type === 'product' ? (
                  <ProductCard
                    key={item.data._id}
                    product={item.data}
                    compareIds={compareIds}
                    onCompareToggle={handleCompareToggle}
                    animClass={`fade-in-up stagger-${Math.min((i % 4) + 1, 4)}`}
                  />
                ) : (
                  <AdBanner key={`ad-${i}`} ad={item.data} variant="card" />
                )
              )}
            </div>

            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                <h3 style={{ fontFamily: 'var(--font-display)' }}>No products found</h3>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
