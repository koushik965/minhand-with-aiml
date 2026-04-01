import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getWishlist().then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRemove = id => setItems(prev => prev.filter(p => p._id !== id));

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow fade-up">✦ Your Collection</div>
          <h1 className="section-title fade-up-1">Saved Products</h1>
          <p className="section-sub fade-up-2">Products you've saved for later</p>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 20, opacity: 0.5 }}>♡</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 10 }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
              Browse products and tap the heart icon to save them here for later.
            </p>
            <button className="btn btn-gold btn-lg" onClick={() => navigate('/products')}>Start Browsing →</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{items.length}</span> saved item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid-products">
              {items.map((product, i) => (
                <ProductCard key={product._id} product={product} isWishlisted={true}
                  onWishlistToggle={handleRemove} animClass={`fade-up-${Math.min((i % 5) + 1, 5)}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
