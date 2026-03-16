import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const result = await register(form.username, form.email, form.password);
    if (result.success) navigate('/');
    else setError(result.message);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.12) 0%, transparent 70%)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛍️</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SmartShop</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Create your account</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '36px' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" required minLength={3} autoFocus />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '8px', fontSize: '1rem' }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
