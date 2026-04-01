import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI, adAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import AdBanner from '../components/ads/AdBanner';
import useTracker from '../hooks/useTracker';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const { trackSearch } = useTracker();

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    const run = async () => {
      setLoading(true);
      try {
        const [pRes, adRes] = await Promise.all([productAPI.search(q), adAPI.getRecommendations(1)]);
        setProducts(pRes.data.data || []);
        setAd(adRes.data.data?.[0] || null);
        trackSearch(q);
      } catch (_) {}
      finally { setLoading(false); }
    };
    run();
  }, [q]); // eslint-disable-line

  return (
    <div className="page">
      <div className="container">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>← Back</button>

        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow">Search Results</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 6 }}>
            {q ? <>Results for <span className="gold-text">"{q}"</span></> : 'Search Products'}
          </h1>
          {!loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{products.length} product{products.length !== 1 ? 's' : ''} found</p>}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 10 }}>No results for "{q}"</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Try different keywords or browse all categories</p>
            <button className="btn btn-gold" onClick={() => navigate('/products')}>Browse All Products →</button>
          </div>
        ) : (
          <>
            {compareIds.length >= 2 && (
              <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.88rem' }}>⚖️ {compareIds.length} selected for comparison</span>
                <button className="btn btn-gold btn-sm" onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>Compare →</button>
              </div>
            )}
            {ad && <div style={{ marginBottom: 24 }}><AdBanner ad={ad} variant="strip" /></div>}
            <div className="grid-products">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} compareIds={compareIds}
                  onCompareToggle={id => setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)}
                  animClass={`fade-up-${Math.min((i % 5) + 1, 5)}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
