import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';

/**
 * ProductCard
 * Displays a product. No CTR, no interest scores, no tracking data shown.
 * Recommendation system runs silently — users only see clean product info.
 */
const ProductCard = ({ product, onWishlistToggle, isWishlisted = false, compareIds = [], onCompareToggle }) => {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleWishlist = async (e) => {
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      await productAPI.toggleWishlist(product._id);
      setWishlisted(w => !w);
      if (onWishlistToggle) onWishlistToggle(product._id);
    } catch (_) {}
    finally { setWishlistLoading(false); }
  };

  const inCompare = compareIds.includes(product._id);

  const handleCompare = (e) => {
    e.stopPropagation();
    if (onCompareToggle) onCompareToggle(product._id);
  };

  return (
    <div
      className="card"
      onClick={() => navigate(`/products/${product._id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: 'var(--accent-2)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '50px' }}>
          -{discount}%
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        style={{
          position: 'absolute', top: 10, right: 12, zIndex: 2,
          background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)', borderRadius: '50%',
          width: 34, height: 34, cursor: 'pointer', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: wishlisted ? '#ff6584' : 'var(--text-muted)',
          transition: 'all var(--transition)',
        }}
        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wishlisted ? '❤️' : '🤍'}
      </button>

      {/* Image */}
      <div style={{ height: 200, overflow: 'hidden' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'; }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-block' }}>{product.category}</span>

        {product.brand && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{product.brand}</div>
        )}

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: '0.75rem', color: s <= Math.round(product.rating) ? '#f7c948' : 'var(--text-muted)' }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({product.reviewCount?.toLocaleString()})</span>
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-light)' }}>
            ₹{product.price?.toLocaleString()}
          </span>
          {discount > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ₹{product.originalPrice?.toLocaleString()}
            </span>
          )}
        </div>

        {!product.inStock && (
          <div className="badge badge-pink" style={{ marginBottom: 10 }}>Out of Stock</div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
          >
            View Details
          </button>
          {onCompareToggle && (
            <button
              onClick={handleCompare}
              className={`btn ${inCompare ? 'btn-outline' : 'btn-ghost'}`}
              style={{ padding: '8px 10px', fontSize: '0.78rem' }}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
            >
              {inCompare ? '✓' : '⚖️'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
