import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';

const Stars = ({ rating }) => (
  <div className="stars">
    {[1,2,3,4,5].map(s => <span key={s} className={`star ${s <= Math.round(rating) ? 'filled' : ''}`}>★</span>)}
  </div>
);

export default function ProductCard({ product, compareIds = [], onCompareToggle, animClass = '' }) {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const inCompare = compareIds.includes(product._id);

  const handleWishlist = async e => {
    e.stopPropagation();
    setWishlistLoading(true);
    try { await productAPI.toggleWishlist(product._id); setWishlisted(w => !w); } catch (_) {}
    finally { setWishlistLoading(false); }
  };

  const handleCompare = e => { e.stopPropagation(); if (onCompareToggle) onCompareToggle(product._id); };

  return (
    <div className={`card ${animClass}`} onClick={() => navigate(`/products/${product._id}`)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>

      {/* Image area */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: 'var(--elevated)', flexShrink: 0 }}>
        {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
        <img
          src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: imgLoaded ? 'block' : 'none' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.07)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'; setImgLoaded(true); }}
        />

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(13,15,26,0.8), transparent)', pointerEvents: 'none' }} />

        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="badge badge-gold">{product.category}</span>
          {discount > 0 && <span className="badge badge-green">-{discount}%</span>}
          {product.isFeatured && <span className="badge badge-blue">✦ Featured</span>}
          {!product.inStock && <span className="badge badge-red">Out of Stock</span>}
        </div>

        {/* Action buttons */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(13,15,26,0.8)', backdropFilter: 'blur(8px)',
              border: `1px solid ${wishlisted ? 'rgba(248,113,113,0.5)' : 'var(--border-subtle)'}`,
              color: wishlisted ? '#f87171' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.24s',
            }}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
          {onCompareToggle && (
            <button
              onClick={handleCompare}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: inCompare ? 'rgba(212,175,55,0.2)' : 'rgba(13,15,26,0.8)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${inCompare ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                color: inCompare ? 'var(--gold)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.24s',
              }}
            >
              {inCompare ? '✓' : '⚖'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {product.brand && (
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            {product.brand}
          </div>
        )}

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.35, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Stars rating={product.rating} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.rating} ({product.reviewCount?.toLocaleString()})</span>
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--gold-light)' }}>
            ₹{product.price?.toLocaleString()}
          </span>
          {discount > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ₹{product.originalPrice?.toLocaleString()}
            </span>
          )}
        </div>

        <button
          className="btn btn-gold"
          style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
          onClick={e => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
          disabled={!product.inStock}
        >
          {product.inStock ? 'View Details →' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
