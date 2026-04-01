import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    const res = await register(form.username, form.email, form.password);
    if (res.success) navigate('/');
    else setError(res.message);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.1) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }} className="fade-up">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#0d0f1a', boxShadow: '0 0 32px rgba(212,175,55,0.4)', margin: '0 auto 18px', fontFamily: 'var(--font-display)' }}>M</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, marginBottom: 6 }}>
            Join <span className="gold-text">MinHand</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Create your account and start discovering</p>
        </div>

        <div className="glass fade-up-1" style={{ padding: '36px', borderRadius: 'var(--radius-xl)' }}>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Username</label>
                <input className="form-control" placeholder="johndoe" minLength={3} required
                  value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoFocus />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="Min. 6 chars" required
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-control" type="password" placeholder="Repeat" required
                  value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-gold" type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-secondary)', fontSize: '0.9rem' }} className="fade-up-2">
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 700 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
