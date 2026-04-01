import React from 'react';
import { adAPI } from '../../services/api';
import useTracker from '../../hooks/useTracker';

export default function AdBanner({ ad, variant = 'card' }) {
  const { trackAdClick } = useTracker();
  if (!ad) return null;

  const handleClick = async () => {
    trackAdClick(ad._id, ad.category);
    try { await adAPI.recordClick(ad._id); } catch (_) {}
  };

  if (variant === 'strip') {
    return (
      <div onClick={handleClick} style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 'var(--radius-md)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
        transition: 'all 0.24s', position: 'relative', overflow: 'hidden',
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))'; }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }} />
        <img src={ad.image} alt={ad.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'; }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 3 }}>✦ Sponsored</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ad.description?.substring(0, 70)}…</div>
        </div>
        <div style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>Explore →</div>
      </div>
    );
  }

  // Card variant
  return (
    <div onClick={handleClick} className="card" style={{ cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)', zIndex: 1 }} />
      <div style={{ height: 180, overflow: 'hidden', background: 'var(--elevated)', position: 'relative' }}>
        <img src={ad.image} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }} onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,15,26,0.7) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className="badge badge-gold">✦ Sponsored</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <span className="badge badge-gold" style={{ background: 'rgba(212,175,55,0.15)' }}>{ad.category}</span>
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.96rem', fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{ad.title}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.description}</p>
        <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>Discover More →</button>
      </div>
    </div>
  );
}
