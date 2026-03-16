const express = require('express');
const router = express.Router();
const {
  getRecommendedAds,
  recordAdClick,
  getAllAds,
  getAdById,
  createAd,
  getAnalytics,
} = require('../controllers/adController');
const { protect, adminOnly } = require('../middleware/auth');

// Public ad routes (require auth)
router.get('/', protect, getAllAds);
router.get('/recommend', protect, getRecommendedAds);
router.get('/:id', protect, getAdById);
router.post('/click', protect, recordAdClick);

// Admin-only routes
router.post('/admin/add-ad', protect, adminOnly, createAd);
router.get('/admin/analytics', protect, adminOnly, getAnalytics);

module.exports = router;
