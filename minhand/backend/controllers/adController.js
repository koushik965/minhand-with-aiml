const Ad = require('../models/Ad');
const Interaction = require('../models/Interaction');
const User = require('../models/User');
const { getRecommendations } = require('../services/recommendationService');
const { getMLRecommendations } = require('../services/mlService');

/**
 * sanitizeAd — strips all analytics from user-facing responses.
 * Users NEVER see: CTR, impressions, clicks, budget, scoring data.
 */
const sanitizeAd = (ad) => ({
  _id: ad._id,
  title: ad.title,
  description: ad.description,
  category: ad.category,
  keywords: ad.keywords,
  image: ad.image,
  targetAudience: ad.targetAudience,
  isActive: ad.isActive,
  createdAt: ad.createdAt,
});

/**
 * Build context object from request for ML features.
 */
const buildContext = (req) => ({
  timeOfDay: new Date().getHours(),
  dayOfWeek: new Date().getDay(),
  deviceType: req.headers['x-device-type'] ||
    (req.headers['user-agent']?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'),
  adPosition: parseInt(req.query.position) || 1,
  page: req.query.page || '/',
});

/**
 * @route   GET /api/ads/recommend
 * @desc    Get personalised ads — uses ML ensemble when available,
 *          falls back to rule-based scoring if ML service is down.
 * @access  Protected
 */
const getRecommendedAds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const limit = parseInt(req.query.limit) || 3;
    const context = buildContext(req);

    let adIds = null;
    let usedML = false;

    // ── Try ML service first ────────────────────────────────────
    const mlResults = await getMLRecommendations(
      req.user._id.toString(),
      context,
      limit
    );

    if (mlResults && mlResults.length > 0) {
      adIds = mlResults.map(r => r.adId);
      usedML = true;
    }

    // ── Fallback: rule-based scoring ────────────────────────────
    let finalAds = [];
    if (adIds) {
      // Fetch the ML-recommended ads by ID (preserving ML order)
      const adsMap = {};
      const fetched = await Ad.find({ _id: { $in: adIds }, isActive: true });
      fetched.forEach(a => { adsMap[a._id.toString()] = a; });
      finalAds = adIds.map(id => adsMap[id]).filter(Boolean);
    } else {
      // ML unavailable — use rule-based recommender
      const recommendations = await getRecommendations(user.interestProfile, limit);
      finalAds = recommendations.map(r => r.ad);
    }

    // ── Record impressions asynchronously ───────────────────────
    finalAds.forEach(async (ad) => {
      try {
        await Interaction.create({
          userId: user._id,
          type: 'ad_impression',
          adId: ad._id,
          category: ad.category,
          metadata: { ...context, usedML },
        });
        await ad.recordImpression();
      } catch (_) {}
    });

    res.json({
      success: true,
      count: finalAds.length,
      // SECURITY: sanitize — no analytics data sent to users
      data: finalAds.map(ad => sanitizeAd(ad.toObject())),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ads/click
 * @desc    Record a user clicking an ad — updates interest + CTR
 * @access  Protected
 */
const recordAdClick = async (req, res, next) => {
  try {
    const { adId } = req.body;
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found.' });

    await ad.recordClick();
    await req.user.updateInterest(ad.category, 3.0);
    await Interaction.create({
      userId: req.user._id,
      type: 'ad_click',
      adId: ad._id,
      category: ad.category,
      metadata: buildContext(req),
    });

    res.json({ success: true, message: 'Click recorded.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ads
 * @access  Protected
 */
const getAllAds = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const ads = await Ad.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: ads.length, data: ads.map(a => sanitizeAd(a.toObject())) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/ads
 * @access  Admin
 */
const createAd = async (req, res, next) => {
  try {
    const ad = await Ad.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendedAds, recordAdClick, getAllAds, createAd };
