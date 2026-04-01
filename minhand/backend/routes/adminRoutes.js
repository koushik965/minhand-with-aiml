const express = require('express');
const r = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/adminController');
const { createAd } = require('../controllers/adController');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getModelStats, triggerRetraining, explainRecommendation, checkMLHealth } = require('../services/mlService');

r.get('/analytics',  protect, adminOnly, getAnalytics);
r.post('/ads',       protect, adminOnly, createAd);
r.post('/products',  protect, adminOnly, createProduct);
r.put('/products/:id', protect, adminOnly, updateProduct);
r.delete('/products/:id', protect, adminOnly, deleteProduct);

// ML admin routes
r.get('/ml/stats',   protect, adminOnly, async (req, res) => {
  const stats = await getModelStats();
  res.json(stats || { error: 'ML service unavailable' });
});

r.post('/ml/train',  protect, adminOnly, async (req, res) => {
  const result = await triggerRetraining();
  res.json(result || { error: 'ML service unavailable' });
});

r.get('/ml/health',  protect, adminOnly, async (req, res) => {
  const online = await checkMLHealth();
  res.json({ online, url: process.env.ML_SERVICE_URL || 'http://localhost:8000' });
});

r.get('/ml/explain/:adId', protect, adminOnly, async (req, res) => {
  const result = await explainRecommendation(req.params.adId, req.query.userId || '', {});
  res.json(result || { error: 'ML service unavailable' });
});

module.exports = r;
