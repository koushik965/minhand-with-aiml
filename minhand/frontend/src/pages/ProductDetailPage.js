import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, adAPI } from '../services/api';
import AdBanner from '../components/ads/AdBanner';
import useTracker from '../hooks/useTracker';

const Stars = ({ rating }) => (
  <div className="stars" style={{ gap: 3 }}>
    {[1,2,3,4,5].map(s => <span key={s} className={`star ${s <= Math.round(rating) ? 'filled' : ''}`} style={{ fontSize: '1.1rem' }}>★</span>)}
  </div>
);

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeSpec, setActiveSpec] = useState(null);
  const { startDwell, endDwell } = useTracker();

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, adRes] = await Promise.all([productAPI.getById(id), adAPI.getRecommendations(2)]);
        setProduct(pRes.data.data);
        setAds(adRes.data.data || []);
        startDwell();
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
    return () => endDwell(`/products/${id}`);
  }, [id]); // eslint-disable-line

  const handleWishlist = async () => {
    setWishlistLoading(true);
    try { const res = await productAPI.toggleWishlist(id); setWishlisted(res.data.added); } catch (_) {}
    finally { setWishlistLoading(false); }
  };

  if (loading) return <div className="spinner-wrap" style={{ minHeight: '70vh' }}><div className="spinner" /></div>;
  if (!product) return (
    <div className="page"><div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Product not found</h2>
      <button className="btn btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
    </div></div>
  );

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const specs = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="page">
      <div className="container">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 28 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 36, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            <div className="card fade-up" style={{ overflow: 'hidden' }}>
              {/* Product image */}
              <div style={{ position: 'relative', height: 420, overflow: 'hidden', background: 'var(--elevated)' }}>
                <img src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'}
                  alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,15,26,0.75) 0%, transparent 50%)' }} />
                {/* Top badges */}
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-gold">{product.category}</span>
                  {discount > 0 && <span className="badge badge-green">-{discount}% OFF</span>}
                  {product.isFeatured && <span className="badge badge-blue">✦ Featured</span>}
                  {!product.inStock && <span className="badge badge-red">Out of Stock</span>}
                </div>
                {/* Bottom info */}
                <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
                  {product.brand && <div style={{ color: 'var(--gold)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{product.brand}</div>}
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>{product.name}</h1>
                </div>
              </div>

              <div style={{ padding: '32px 36px' }}>
                {/* Rating */}
                {product.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <Stars rating={product.rating} />
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{product.rating}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({product.reviewCount?.toLocaleString()} reviews)</span>
                  </div>
                )}

                {/* Price block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px 24px', background: 'var(--elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, color: 'var(--gold-light)' }}>
                    ₹{product.price?.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <div>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{product.originalPrice?.toLocaleString()}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>Save ₹{(product.originalPrice - product.price)?.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.97rem', marginBottom: 28 }}>{product.description}</p>

                {/* Specs grid */}
                {specs.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Specifications</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {specs.map(([key, val]) => (
                        <div key={key} style={{
                          background: activeSpec === key ? 'var(--gold-glow)' : 'var(--elevated)',
                          border: `1px solid ${activeSpec === key ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)', padding: '12px 14px', cursor: 'pointer',
                          transition: 'all 0.24s',
                        }} onClick={() => setActiveSpec(activeSpec === key ? null : key)}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>{key}</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {product.keywords?.length > 0 && (
                  <div style={{ marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.keywords.map(k => (
                      <span key={k} style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>#{k}</span>
                    ))}
                  </div>
                )}

                {!product.inStock && <div className="alert alert-error">This product is currently out of stock.</div>}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-gold btn-lg" style={{ flex: 1 }} disabled={!product.inStock}>
                    {product.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    className={`btn btn-lg ${wishlisted ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ padding: '16px 22px' }}
                  >
                    {wishlisted ? '♥ Saved' : '♡ Save'}
                  </button>
                  <button className="btn btn-outline btn-lg" style={{ padding: '16px 22px' }} onClick={() => navigate(`/compare?ids=${id}`)}>
                    ⚖️ Compare
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 88 }} className="fade-up-2">
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>You may also like</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ads.map(ad => <AdBanner key={ad._id} ad={ad} variant="strip" />)}
              </div>
            </div>
            {/* Share / quick actions */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }} onClick={() => navigate('/products')}>🛍️ Back to Shopping</button>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }} onClick={() => navigate('/compare')}>⚖️ Open Compare Tool</button>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }} onClick={() => navigate('/wishlist')}>♥ View Wishlist</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
