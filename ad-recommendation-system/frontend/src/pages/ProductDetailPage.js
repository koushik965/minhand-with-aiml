import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, adAPI } from '../services/api';
import AdBanner from '../components/ads/AdBanner';
import useInteractionTracker from '../hooks/useInteractionTracker';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { startDwellTimer, endDwellTimer } = useInteractionTracker();

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, adRes] = await Promise.all([
          productAPI.getById(id),
          adAPI.getRecommendations(2),
        ]);
        setProduct(pRes.data.data);
        setAds(adRes.data.data || []);
        startDwellTimer();
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
    return () => endDwellTimer(`/products/${id}`);
  }, [id]); // eslint-disable-line

  const handleWishlist = async () => {
    setWishlistLoading(true);
    try {
      const res = await productAPI.toggleWishlist(id);
      setWishlisted(res.data.added);
    } catch (_) {}
    finally { setWishlistLoading(false); }
  };

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  if (!product) return (
    <div className="page-wrapper">
      <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Product not found</h2>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div className="page-wrapper">
      <div className="container">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            <div className="card fade-in-up" style={{ overflow: 'hidden' }}>
              {/* Image */}
              <div style={{ height: 380, overflow: 'hidden' }}>
                <img src={product.image} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'; }} />
              </div>

              <div style={{ padding: 32 }}>
                <span className="badge badge-accent" style={{ marginBottom: 12, display: 'inline-block' }}>{product.category}</span>
                {product.brand && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>{product.brand}</div>}

                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, marginBottom: 14 }}>
                  {product.name}
                </h1>

                {product.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '1rem', color: s <= Math.round(product.rating) ? '#f7c948' : 'var(--text-muted)' }}>★</span>
                    ))}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{product.rating} ({product.reviewCount?.toLocaleString()} reviews)</span>
                  </div>
                )}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                    ₹{product.price?.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{product.originalPrice?.toLocaleString()}</span>
                      <span style={{ background: 'var(--accent-2)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, padding: '3px 9px', borderRadius: '50px' }}>-{discount}%</span>
                    </>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.98rem', marginBottom: 24 }}>
                  {product.description}
                </p>

                {/* Specs */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Specifications</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{key}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {product.keywords?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    {product.keywords.map(k => (
                      <span key={k} style={{ display: 'inline-block', marginRight: 6, marginBottom: 6, padding: '3px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{k}</span>
                    ))}
                  </div>
                )}

                {!product.inStock && <div className="alert alert-error">This product is currently out of stock.</div>}

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: '1rem' }} disabled={!product.inStock}>
                    {product.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    className={`btn ${wishlisted ? 'btn-outline' : 'btn-ghost'}`}
                    style={{ padding: '14px 18px' }}
                  >
                    {wishlisted ? '❤️ Wishlisted' : '🤍 Wishlist'}
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '14px 18px' }}
                    onClick={() => navigate(`/compare?ids=${id}`)}>
                    ⚖️ Compare
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Sponsored ads shown naturally */}
          <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
                You may also like
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ads.map(ad => <AdBanner key={ad._id} ad={ad} variant="inline" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
