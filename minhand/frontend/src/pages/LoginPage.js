import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    console.log("🔥 BUTTON CLICKED");

    setError('');

    const res = await login(form.email, form.password);

    console.log("🔥 LOGIN RESPONSE:", res);

    if (res.success) navigate('/');
    else setError(res.message);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ textAlign: 'center' }}>Login</h2>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        {/* ❌ REMOVED form submit */}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ width: '100%', marginBottom: 10 }}
          />

          {/* ✅ DIRECT BUTTON CLICK */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20 }}>
          New user? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
