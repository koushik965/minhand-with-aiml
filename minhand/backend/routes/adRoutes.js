const express = require('express');
const r = express.Router();
const { getRecommendedAds, recordAdClick, getAllAds } = require('../controllers/adController');
const { protect } = require('../middleware/auth');
r.get('/recommend', protect, getRecommendedAds);
r.get('/', protect, getAllAds);
r.post('/click', protect, recordAdClick);
module.exports = r;
