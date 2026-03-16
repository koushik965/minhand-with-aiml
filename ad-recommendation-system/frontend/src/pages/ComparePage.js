import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

const ComparePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(idsParam ? idsParam.split(',').filter(Boolean) : []);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    productAPI.getAll({}).then(res => setAllProducts(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) compare();
  }, []); // eslint-disable-line

  const compare = async () => {
    if (selectedIds.length < 2) { setError('Select at least 2 products to compare.'); return; }
    setLoading(true); setError('');
    try {
      const res = await productAPI.compare(selectedIds);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed.');
    } finally { setLoading(false); }
  };

  const toggleProduct = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
    setResult(null);
  };

  const filtered = searchQ ? allProducts.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.brand?.toLowerCase().includes(searchQ.toLowerCase())) : allProducts.slice(0, 20);

  const fieldLabels = { name: 'Product', brand: 'Brand', price: 'Price', rating: 'Rating', reviewCount: 'Reviews', category: 'Category', inStock: 'In Stock' };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-title">⚖️ Compare Products</h1>
          <p className="section-subtitle">Select 2–4 products to compare side by side</p>
        </div>

        {/* Product selector */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <input className="form-control" style={{ flex: 1 }} value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search products to add..." />
            <button className="btn btn-primary" onClick={compare} disabled={selectedIds.length < 2 || loading}>
              {loading ? 'Comparing...' : `Compare (${selectedIds.length})`}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {filtered.map(p => {
              const sel = selectedIds.includes(p._id);
              return (
                <button key={p._id} onClick={() => toggleProduct(p._id)}
                  style={{
                    padding: '7px 14px', borderRadius: '50px', fontSize: '0.82rem', fontWeight: 500,
                    border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                    color: sel ? 'var(--accent-light)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  {sel ? '✓' : '+'} {p.name.substring(0, 28)}{p.name.length > 28 ? '…' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {result && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', width: 130 }}>Feature</th>
                  {result.products.map(p => (
                    <th key={p._id} style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <img src={p.image} alt={p.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, display: 'block', margin: '0 auto 8px' }}
                        onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'; }} />
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 700 }}>{p.name.substring(0, 30)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <tr key={field} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</td>
                    {result.products.map(p => {
                      let val = p[field];
                      if (field === 'price') val = `₹${val?.toLocaleString()}`;
                      if (field === 'inStock') val = val ? <span className="badge badge-green">In Stock</span> : <span className="badge badge-pink">Out of Stock</span>;
                      if (field === 'rating') val = `${val} ★`;
                      return (
                        <td key={p._id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {val ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Specs comparison */}
                {result.products.some(p => p.specs && Object.keys(p.specs).length > 0) && (() => {
                  const allSpecKeys = [...new Set(result.products.flatMap(p => Object.keys(p.specs || {})))];
                  return allSpecKeys.map(key => (
                    <tr key={`spec-${key}`} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{key}</td>
                      {result.products.map(p => (
                        <td key={p._id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          {p.specs?.[key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ));
                })()}
                {/* View buttons */}
                <tr>
                  <td style={{ padding: '14px 16px' }} />
                  {result.products.map(p => (
                    <td key={p._id} style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                        onClick={() => navigate(`/products/${p._id}`)}>
                        View Details
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!result && !loading && selectedIds.length < 2 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚖️</div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Select at least 2 products above to compare</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
