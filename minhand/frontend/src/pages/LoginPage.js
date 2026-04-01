import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) navigate('/');
    else setError(res.message);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 70%)',
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', top: '10%', left: '5%', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)', bottom: '10%', right: '5%', animation: 'float 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="fade-up">
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37, #f0d060)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 900, color: '#0d0f1a',
            boxShadow: '0 0 40px rgba(212,175,55,0.45)', margin: '0 auto 20px',
            fontFamily: 'var(--font-display)',
          }}>M</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, marginBottom: 8 }}>
            Welcome to <span className="gold-text">MinHand</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Minutes In Hand — Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="glass fade-up-1" style={{ padding: '40px 36px', borderRadius: 'var(--radius-xl)' }}>
          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>

            <button className="btn btn-gold" type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8, letterSpacing: '0.02em' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="divider divider-gold" style={{ margin: '28px 0' }} />


        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }} className="fade-up-2">
          New to MinHand?{' '}
          <Link to="/register" style={{ color: 'var(--gold)', fontWeight: 700 }}>Create account →</Link>
        </p>
      </div>
    </div>
  );
}
