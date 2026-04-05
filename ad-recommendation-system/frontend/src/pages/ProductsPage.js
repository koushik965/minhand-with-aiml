import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';
import useInteractionTracker from '../hooks/useInteractionTracker';

const CATEGORIES = ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'];
const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
    inStock: '',
  });
  const { trackPageVisit, trackCategoryBrowse } = useInteractionTracker();

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'category' && value) trackCategoryBrowse(value, '/products');
  };

  const handleCompareToggle = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-title">🛒 Products</h1>
          <p className="section-subtitle">Browse and discover products across all categories</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>
          {/* Filters sidebar */}
          <div style={{ position: 'sticky', top: 90, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>🔽 Filters</h3>

            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Sort By</label>
              <select className="form-control" value={filters.sort} onChange={e => handleFilterChange('sort', e.target.value)}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Min Price (₹)</label>
              <input className="form-control" type="number" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)} placeholder="0" />
            </div>

            <div className="form-group">
              <label>Max Price (₹)</label>
              <input className="form-control" type="number" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)} placeholder="Any" />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <select className="form-control" value={filters.inStock} onChange={e => handleFilterChange('inStock', e.target.value)}>
                <option value="">All</option>
                <option value="true">In Stock Only</option>
              </select>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setFilters({ category: '', sort: 'newest', minPrice: '', maxPrice: '', inStock: '' })}>
              Reset Filters
            </button>
          </div>

          {/* Products grid */}
          <div>
            {compareIds.length >= 2 && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>⚖️ {compareIds.length} selected</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 14px' }} onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}>Compare →</button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '7px 10px' }} onClick={() => setCompareIds([])}>Clear</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : (
              <>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>{products.length} products found</div>
                <div className="ads-grid">
                  {products.map((p, i) => (
                    <ProductCard key={p._id} product={p} compareIds={compareIds} onCompareToggle={handleCompareToggle}
                      animClass={`fade-in-up stagger-${Math.min((i % 4) + 1, 4)}`} />
                  ))}
                </div>
                {products.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                    <h3 style={{ fontFamily: 'var(--font-display)' }}>No products match your filters</h3>
                    <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setFilters({ category: '', sort: 'newest', minPrice: '', maxPrice: '', inStock: '' })}>
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
