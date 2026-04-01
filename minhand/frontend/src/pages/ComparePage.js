import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

const Stars = ({ rating }) => (
  <div className="stars" style={{ justifyContent: 'center', gap: 2 }}>
    {[1,2,3,4,5].map(s => <span key={s} className={`star ${s <= Math.round(rating) ? 'filled' : ''}`}>★</span>)}
  </div>
);

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const [result, setResult] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(idsParam ? idsParam.split(',').filter(Boolean) : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => { productAPI.getAll({}).then(r => setAllProducts(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => { if (selectedIds.length >= 2) compare(); }, []); // eslint-disable-line

  const compare = async () => {
    if (selectedIds.length < 2) { setError('Select at least 2 products.'); return; }
    setLoading(true); setError('');
    try { const r = await productAPI.compare(selectedIds); setResult(r.data); }
    catch (err) { setError(err.response?.data?.message || 'Comparison failed.'); }
    finally { setLoading(false); }
  };

  const toggleProduct = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
    setResult(null);
  };

  const filtered = searchQ ? allProducts.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.brand?.toLowerCase().includes(searchQ.toLowerCase())) : allProducts.slice(0, 24);

  const fields = [
    { key: 'brand', label: 'Brand', render: v => v || '—' },
    { key: 'price', label: 'Price', render: v => v ? `₹${v.toLocaleString()}` : '—' },
    { key: 'originalPrice', label: 'Original Price', render: v => v ? `₹${v.toLocaleString()}` : '—' },
    { key: 'rating', label: 'Rating', render: (v, p) => v ? <><Stars rating={v} /><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>{v}/5 ({p.reviewCount?.toLocaleString()})</span></> : '—' },
    { key: 'category', label: 'Category', render: v => v ? <span className="badge badge-gold">{v}</span> : '—' },
    { key: 'inStock', label: 'Availability', render: v => v ? <span className="badge badge-green">✓ In Stock</span> : <span className="badge badge-red">Out of Stock</span> },
  ];

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow fade-up">✦ Side-by-Side Analysis</div>
          <h1 className="section-title fade-up-1">Compare Products</h1>
          <p className="section-sub fade-up-2">Select 2–4 products to compare specifications, price, and ratings</p>
        </div>

        {/* Selector */}
        <div className="card fade-up-2" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <input className="form-control" style={{ flex: 1 }} value={searchQ}
              onChange={e => setSearchQ(e.target.value)} placeholder="Search products to add…" />
            <button className="btn btn-gold" onClick={compare} disabled={selectedIds.length < 2 || loading}
              style={{ flexShrink: 0 }}>
              {loading ? 'Comparing…' : `Compare (${selectedIds.length})`}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(p => {
              const sel = selectedIds.includes(p._id);
              return (
                <button key={p._id} onClick={() => toggleProduct(p._id)} style={{
                  padding: '7px 14px', borderRadius: 50, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${sel ? 'var(--gold)' : 'var(--border-subtle)'}`,
                  background: sel ? 'var(--gold-glow)' : 'var(--elevated)',
                  color: sel ? 'var(--gold)' : 'var(--text-secondary)', transition: 'all 0.24s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {sel ? '✓' : '+'} {p.name.substring(0, 26)}{p.name.length > 26 ? '…' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Comparison table */}
        {result ? (
          <div className="fade-up" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 600, background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {/* Product headers */}
              <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${result.products.length}, 1fr)`, borderBottom: '2px solid var(--border-subtle)' }}>
                <div style={{ padding: '20px 16px', background: 'var(--elevated)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Feature</span>
                </div>
                {result.products.map(p => (
                  <div key={p._id} style={{ padding: '20px 16px', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', background: 'var(--elevated)' }}>
                    <img src={p.image} alt={p.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, margin: '0 auto 10px', display: 'block', border: '2px solid var(--border-subtle)' }}
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'; }} />
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3 }}>{p.name.substring(0, 30)}{p.name.length > 30 ? '…' : ''}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {fields.map(({ key, label, render }) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${result.products.length}, 1fr)`, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center' }}>{label}</div>
                  {result.products.map(p => (
                    <div key={p._id} style={{ padding: '14px 16px', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--elevated)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      {render(p[key], p)}
                    </div>
                  ))}
                </div>
              ))}

              {/* Specs rows */}
              {(() => {
                const allKeys = [...new Set(result.products.flatMap(p => Object.keys(p.specs || {})))];
                return allKeys.map(key => (
                  <div key={`spec-${key}`} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${result.products.length}, 1fr)`, borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center' }}>{key}</div>
                    {result.products.map(p => (
                      <div key={p._id} style={{ padding: '12px 16px', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        {p.specs?.[key] || '—'}
                      </div>
                    ))}
                  </div>
                ));
              })()}

              {/* CTA row */}
              <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${result.products.length}, 1fr)` }}>
                <div style={{ padding: '20px 16px' }} />
                {result.products.map(p => (
                  <div key={p._id} style={{ padding: '20px 16px', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
                    <button className="btn btn-gold btn-sm" onClick={() => navigate(`/products/${p._id}`)}>View Details →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !loading && selectedIds.length < 2 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚖️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8 }}>Select products above to compare</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Choose at least 2 products, then click Compare</p>
          </div>
        )}
      </div>
    </div>
  );
}
