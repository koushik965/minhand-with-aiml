import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import useTracker from '../hooks/useTracker';

const CATS = ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'];
const SORTS = [{ v: 'newest', l: 'Newest First' }, { v: 'price_asc', l: 'Price: Low to High' }, { v: 'price_desc', l: 'Price: High to Low' }, { v: 'rating', l: 'Top Rated' }];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState({ category: '', sort: 'newest', minPrice: '', maxPrice: '', inStock: '' });
  const { trackPageVisit, trackCategory } = useTracker();

  useEffect(() => { trackPageVisit('/products'); }, []); // eslint-disable-line

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = filters.inStock;
      const res = await productAPI.getAll(params);
      setProducts(res.data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const set = (key, val) => {
    setFilters(p => ({ ...p, [key]: val }));
    if (key === 'category' && val) trackCategory(val, '/products');
  };

  const resetFilters = () => setFilters({ category: '', sort: 'newest', minPrice: '', maxPrice: '', inStock: '' });

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow fade-up">✦ Complete Catalog</div>
          <h1 className="section-title fade-up-1">Shop All Products</h1>
          <p className="section-sub fade-up-2">Discover and compare thousands of products across every category</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36, alignItems: 'start' }}>
          {/* Filters sidebar */}
          <div style={{ position: 'sticky', top: 88 }} className="fade-up-1">
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
              {/* Gold top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>🎛 Filters</h3>
                <button className="btn btn-ghost btn-sm" onClick={resetFilters} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>Reset</button>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={filters.category} onChange={e => set('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select className="form-control" value={filters.sort} onChange={e => set('sort', e.target.value)}>
                  {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div>
                  <label className="form-label">Min ₹</label>
                  <input className="form-control" type="number" placeholder="0" value={filters.minPrice} onChange={e => set('minPrice', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Max ₹</label>
                  <input className="form-control" type="number" placeholder="Any" value={filters.maxPrice} onChange={e => set('maxPrice', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="form-control" value={filters.inStock} onChange={e => set('inStock', e.target.value)}>
                  <option value="">All Products</option>
                  <option value="true">In Stock Only</option>
                </select>
              </div>

              {/* Active filter count */}
              {Object.values(filters).filter(v => v && v !== 'newest').length > 0 && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--gold-glow)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--gold)', textAlign: 'center' }}>
                  {Object.values(filters).filter(v => v && v !== 'newest').length} filter{Object.values(filters).filter(v => v && v !== 'newest').length > 1 ? 's' : ''} active
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div>
            {/* Compare bar */}
            {compareIds.length >= 2 && (
              <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.88rem' }}>⚖️ {compareIds.length} selected</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-gold btn-sm" onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>Compare →</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>Clear</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{products.length}</span> products found
                  </p>
                </div>
                {products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No products match your filters</h3>
                    <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={resetFilters}>Clear Filters</button>
                  </div>
                ) : (
                  <div className="grid-products">
                    {products.map((p, i) => (
                      <ProductCard key={p._id} product={p} compareIds={compareIds}
                        onCompareToggle={id => setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)}
                        animClass={`fade-up-${Math.min((i % 5) + 1, 5)}`} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
