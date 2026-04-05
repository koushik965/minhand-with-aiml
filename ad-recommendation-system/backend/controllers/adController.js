const Ad = require('../models/Ad');
const Interaction = require('../models/Interaction');
const User = require('../models/User');
const { getRecommendations } = require('../services/recommendationService');

/**
 * sanitizeAdForUser
 * Strips all internal analytics fields before sending to normal users.
 * Users must NEVER see: CTR, impressions, clicks, scoring data.
 * Only safe display fields are returned.
 */
const sanitizeAdForUser = (ad) => ({
  _id: ad._id,
  title: ad.title,
  description: ad.description,
  category: ad.category,
  keywords: ad.keywords,
  image: ad.image,
  targetAudience: ad.targetAudience,
  isActive: ad.isActive,
  createdAt: ad.createdAt,
  // intentionally omit: impressions, clicks, ctr, budget, relevanceScore, scoreBreakdown
});

/**
 * @route   GET /api/ads/recommend
 * @desc    Get top 3 recommended ads for current user based on interest profile
 * @access  Protected
 */
const getRecommendedAds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const limit = parseInt(req.query.limit) || 3;

    const recommendations = await getRecommendations(user.interestProfile, limit);

    // Record impressions for each recommended ad (async, non-blocking)
    recommendations.forEach(async ({ ad }) => {
      try {
        await Interaction.create({
          userId: user._id,
          type: 'ad_impression',
          adId: ad._id,
          category: ad.category,
        });
        await ad.recordImpression();
      } catch (_) {
        // Silently swallow impression errors — non-critical
      }
    });

    res.json({
      success: true,
      count: recommendations.length,
      // SECURITY: strip all scoring/analytics fields from user-facing response
      // relevanceScore and scoreBreakdown are internal — never sent to users
      data: recommendations.map(({ ad }) => sanitizeAdForUser(ad.toObject())),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ads/click
 * @desc    Record a user clicking on an ad
 * @access  Protected
 */
const recordAdClick = async (req, res, next) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      return res.status(400).json({ success: false, message: 'adId is required.' });
    }

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found.' });
    }

    // Record the click on the ad
    await ad.recordClick();

    // Update user interest profile with high weight for clicks
    await req.user.updateInterest(ad.category, 3.0);

    // Log the interaction
    await Interaction.create({
      userId: req.user._id,
      type: 'ad_click',
      adId: ad._id,
      category: ad.category,
    });

    res.json({
      success: true,
      message: 'Click recorded successfully',
      // SECURITY: never return CTR or interest scores to users
      ad: { id: ad._id, title: ad.title },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ads
 * @desc    Get all ads (with optional category filter)
 * @access  Protected
 */
const getAllAds = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const ads = await Ad.find(filter).sort({ createdAt: -1 });

    // SECURITY: sanitize — strip analytics before sending to users
    res.json({ success: true, count: ads.length, data: ads.map(a => sanitizeAdForUser(a.toObject())) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ads/:id
 * @desc    Get single ad detail
 * @access  Protected
 */
const getAdById = async (req, res, next) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found.' });
    }
    // SECURITY: strip analytics from single ad response
    res.json({ success: true, data: sanitizeAdForUser(ad.toObject()) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/add-ad
 * @desc    Create a new advertisement (Admin only)
 * @access  Protected + Admin
 */
const createAd = async (req, res, next) => {
  try {
    const ad = await Ad.create({ ...req.body, createdBy: req.user._id });

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform-wide analytics for the admin dashboard
 * @access  Protected + Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    // Aggregate top-level stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAds = await Ad.countDocuments({ isActive: true });

    // Sum total impressions and clicks across all ads
    const adAggregation = await Ad.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
    ]);

    const { totalImpressions = 0, totalClicks = 0 } = adAggregation[0] || {};
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions).toFixed(4) : 0;

    // Per-ad performance breakdown
    const adPerformance = await Ad.find({ isActive: true })
      .select('title category impressions clicks')
      .sort({ impressions: -1 });

    // Category-level aggregation
    const categoryStats = await Ad.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          adCount: { $sum: 1 },
        },
      },
      { $sort: { totalImpressions: -1 } },
    ]);

    // Recent interactions (last 100)
    const recentInteractions = await Interaction.find()
      .populate('userId', 'username')
      .populate('adId', 'title')
      .sort({ createdAt: -1 })
      .limit(100);

    // Interactions grouped by type
    const interactionStats = await Interaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAds,
          totalImpressions,
          totalClicks,
          overallCTR: parseFloat(overallCTR),
        },
        adPerformance: adPerformance.map((ad) => ({
          id: ad._id,
          title: ad.title,
          category: ad.category,
          impressions: ad.impressions,
          clicks: ad.clicks,
          ctr: ad.impressions > 0 ? parseFloat((ad.clicks / ad.impressions).toFixed(4)) : 0,
        })),
        categoryStats,
        interactionStats,
        recentInteractions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendedAds, recordAdClick, getAllAds, getAdById, createAd, getAnalytics };
