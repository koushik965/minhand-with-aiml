import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI, adAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import AdBanner from '../components/ads/AdBanner';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    const run = async () => {
      setLoading(true);
      try {
        const [pRes, adRes] = await Promise.all([
          productAPI.search(q),
          adAPI.getRecommendations(1),
        ]);
        setProducts(pRes.data.data || []);
        setAd(adRes.data.data?.[0] || null);
      } catch (_) {}
      finally { setLoading(false); }
    };
    run();
  }, [q]);

  const handleCompareToggle = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: 28 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
            {q ? `Results for "${q}"` : 'Search Products'}
          </h1>
          {!loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{products.length} products found</p>}
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No results found for "{q}"</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Try a different search term or browse our categories</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse All Products</button>
          </div>
        ) : (
          <>
            {compareIds.length >= 2 && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>⚖️ {compareIds.length} selected</span>
                <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                  onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>
                  Compare →
                </button>
              </div>
            )}

            {/* Sponsored ad at top of results — natural placement */}
            {ad && <div style={{ marginBottom: 20 }}><AdBanner ad={ad} variant="inline" /></div>}

            <div className="ads-grid">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} compareIds={compareIds} onCompareToggle={handleCompareToggle}
                  animClass={`fade-in-up stagger-${Math.min((i % 4) + 1, 4)}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
