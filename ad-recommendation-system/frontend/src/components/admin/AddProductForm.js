import React, { useState } from 'react';
import { adminAPI } from '../../services/api';

const CATEGORIES = ['Technology','Sports','Fashion','Food','Automotive','Travel','Education','Entertainment','Health','Finance'];

const AddProductForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Technology', brand: '',
    price: '', originalPrice: '', image: '', keywords: '',
    specs: '', inStock: 'true',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      // Parse specs from "Key:Value, Key2:Value2" format
      const specsObj = {};
      if (form.specs) {
        form.specs.split(',').forEach(pair => {
          const [k, v] = pair.split(':');
          if (k && v) specsObj[k.trim()] = v.trim();
        });
      }
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        specs: specsObj,
        inStock: form.inStock === 'true',
      };
      await adminAPI.createProduct(payload);
      setSuccess('Product created successfully!');
      setForm({ name: '', description: '', category: 'Technology', brand: '', price: '', originalPrice: '', image: '', keywords: '', specs: '', inStock: 'true' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: 24 }}>➕ Add New Product</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Product Name *</label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Sony WH-1000XM5" required />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description *</label>
            <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} required style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input className="form-control" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Sony" />
          </div>
          <div className="form-group">
            <label>Price (₹) *</label>
            <input className="form-control" type="number" name="price" value={form.price} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label>Original Price (₹) — for discount</label>
            <input className="form-control" type="number" name="originalPrice" value={form.originalPrice} onChange={handleChange} min="0" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Image URL</label>
            <input className="form-control" name="image" value={form.image} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
          </div>
          <div className="form-group">
            <label>Keywords (comma-separated)</label>
            <input className="form-control" name="keywords" value={form.keywords} onChange={handleChange} placeholder="laptop, apple, macbook" />
          </div>
          <div className="form-group">
            <label>In Stock</label>
            <select className="form-control" name="inStock" value={form.inStock} onChange={handleChange}>
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Specs (format: Key:Value, Key2:Value2)</label>
            <input className="form-control" name="specs" value={form.specs} onChange={handleChange} placeholder="RAM:16GB, Storage:512GB, Battery:22 hrs" />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Creating…' : '🚀 Create Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
