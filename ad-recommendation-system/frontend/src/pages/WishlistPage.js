import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ads/ProductCard';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getWishlist()
      .then(res => setItems(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (productId) => {
    setItems(prev => prev.filter(p => p._id !== productId));
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-title">❤️ Your Wishlist</h1>
          <p className="section-subtitle">Products you've saved for later</p>
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🤍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Your wishlist is empty</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Browse products and tap 🤍 to save them here</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Discover Products</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</div>
            <div className="ads-grid">
              {items.map((product, i) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isWishlisted={true}
                  onWishlistToggle={handleRemove}
                  animClass={`fade-in-up stagger-${Math.min((i % 4) + 1, 4)}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
