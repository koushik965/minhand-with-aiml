import React from 'react';
import { adAPI } from '../../services/api';
import useInteractionTracker from '../../hooks/useInteractionTracker';

/**
 * AdBanner
 * Displays a sponsored ad naturally within the product feed.
 * Users see only: image, title, description, category.
 * They do NOT see: CTR, impressions, clicks, relevance scores, interest data.
 * The recommendation engine runs completely silently.
 */
const AdBanner = ({ ad, variant = 'card' }) => {
  const { trackAdClick } = useInteractionTracker();

  if (!ad) return null;

  const handleClick = async () => {
    trackAdClick(ad._id, ad.category);
    try { await adAPI.recordClick(ad._id); } catch (_) {}
  };

  if (variant === 'inline') {
    return (
      <div
        onClick={handleClick}
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(255,101,132,0.06))',
          border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)',
          padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center',
          transition: 'all var(--transition)',
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
      >
        <img src={ad.image} alt={ad.title} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'; }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontWeight: 600 }}>
            Sponsored
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ad.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{ad.description?.substring(0, 80)}…</div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>Learn More →</div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      onClick={handleClick}
      className="card"
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        background: 'rgba(108,99,255,0.85)', backdropFilter: 'blur(4px)',
        borderRadius: '50px', padding: '2px 10px', fontSize: '0.68rem',
        color: '#fff', fontWeight: 600, letterSpacing: '0.06em',
      }}>
        Sponsored
      </div>
      <div style={{ height: 180, overflow: 'hidden' }}>
        <img src={ad.image} alt={ad.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'; }} />
      </div>
      <div style={{ padding: '14px' }}>
        <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-block' }}>{ad.category}</span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{ad.title}</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ad.description}
        </p>
        <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}>
          Learn More →
        </button>
      </div>
    </div>
  );
};

export default AdBanner;
