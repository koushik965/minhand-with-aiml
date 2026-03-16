const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAnalytics, getProductStats, getUserStats, getSearchStats } = require('../controllers/adminController');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { createAd } = require('../controllers/adController');

/**
 * SECURITY: Every single route in this file is guarded by BOTH:
 *   1. protect    — validates JWT, attaches req.user
 *   2. adminOnly  — verifies role === 'admin', returns 403 otherwise
 *
 * Normal users attempting these routes receive:
 *   { success: false, message: 'Access denied. Insufficient permissions.' }
 * No internal data is ever leaked on 403 responses.
 */

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics',     protect, adminOnly, getAnalytics);
router.get('/product-stats', protect, adminOnly, getProductStats);
router.get('/user-stats',    protect, adminOnly, getUserStats);
router.get('/search-stats',  protect, adminOnly, getSearchStats);
// Legacy route kept for compatibility
router.get('/ad-performance', protect, adminOnly, getAnalytics);

// ── Product Management (Admin CRUD) ─────────────────────────────────────────
router.post('/products',     protect, adminOnly, createProduct);
router.put('/products/:id',  protect, adminOnly, updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);

// ── Ad Management ────────────────────────────────────────────────────────────
router.post('/add-ad', protect, adminOnly, createAd);

module.exports = router;
