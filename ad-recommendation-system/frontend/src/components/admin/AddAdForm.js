import React, { useState } from 'react';
import { adminAPI } from '../../services/api';

const CATEGORIES = ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'];

const AddAdForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technology',
    keywords: '', image: '', targetAudience: '', budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        targetAudience: form.targetAudience.split(',').map(t => t.trim()).filter(Boolean),
        budget: parseFloat(form.budget),
      };
      await adminAPI.createAd(payload);
      setSuccess('Advertisement created successfully!');
      setForm({ title: '', description: '', category: 'Technology', keywords: '', image: '', targetAudience: '', budget: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>➕ Create New Ad</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Ad Title *</label>
            <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="e.g. MacBook Pro M3 - Power Redefined" required />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description *</label>
            <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Ad description..." rows={3} required style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Budget (₹) *</label>
            <input className="form-control" type="number" name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. 50000" required min="0" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Image URL</label>
            <input className="form-control" name="image" value={form.image} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
          </div>
          <div className="form-group">
            <label>Keywords (comma-separated)</label>
            <input className="form-control" name="keywords" value={form.keywords} onChange={handleChange} placeholder="laptop, apple, tech" />
          </div>
          <div className="form-group">
            <label>Target Audience (comma-separated)</label>
            <input className="form-control" name="targetAudience" value={form.targetAudience} onChange={handleChange} placeholder="professionals, developers" />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Creating...' : '🚀 Create Advertisement'}
        </button>
      </form>
    </div>
  );
};

export default AddAdForm;
