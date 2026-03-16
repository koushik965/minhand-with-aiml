const User = require('../models/User');
const Ad = require('../models/Ad');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const SearchLog = require('../models/SearchLog');

/**
 * All functions in this controller are protected by:
 *   protect middleware (valid JWT required)
 *   adminOnly middleware (role === 'admin' required)
 *
 * SECURITY CONTRACT:
 *   - No function here is reachable by normal users.
 *   - All 403 responses from adminOnly are generic — they never leak data.
 *   - This controller is the ONLY place analytics data is assembled and returned.
 */

/**
 * @route   GET /api/admin/analytics
 * @desc    Full platform analytics overview
 * @access  Admin only
 */
const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalAds = await Ad.countDocuments({ isActive: true });

    // Ad aggregate stats
    const adAgg = await Ad.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' } } },
    ]);
    const { totalImpressions = 0, totalClicks = 0 } = adAgg[0] || {};
    const overallCTR = totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions).toFixed(4)) : 0;

    // Per-ad performance with CTR
    const adPerformance = await Ad.find({ isActive: true })
      .select('title category impressions clicks budget')
      .sort({ impressions: -1 });

    // Category-level ad aggregation
    const categoryStats = await Ad.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' }, adCount: { $sum: 1 } } },
      { $sort: { totalImpressions: -1 } },
    ]);

    // Interaction type breakdown
    const interactionStats = await Interaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: { totalUsers, totalProducts, totalAds, totalImpressions, totalClicks, overallCTR },
        adPerformance: adPerformance.map(ad => ({
          id: ad._id, title: ad.title, category: ad.category,
          impressions: ad.impressions, clicks: ad.clicks, budget: ad.budget,
          ctr: ad.impressions > 0 ? parseFloat((ad.clicks / ad.impressions).toFixed(4)) : 0,
        })),
        categoryStats,
        interactionStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/product-stats
 * @desc    Most viewed, most searched, most wishlisted, most compared products
 * @access  Admin only
 */
const getProductStats = async (req, res, next) => {
  try {
    const mostViewed = await Product.find({ isActive: true })
      .sort({ viewCount: -1 }).limit(10)
      .select('name category brand price viewCount searchCount wishlistCount compareCount image');

    const mostSearched = await Product.find({ isActive: true })
      .sort({ searchCount: -1 }).limit(10)
      .select('name category brand price viewCount searchCount image');

    const mostWishlisted = await Product.find({ isActive: true })
      .sort({ wishlistCount: -1 }).limit(10)
      .select('name category brand price wishlistCount image');

    // Top search keywords from SearchLog
    const topKeywords = await SearchLog.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$resultsCount' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Category search distribution
    const categorySearchDist = await SearchLog.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { mostViewed, mostSearched, mostWishlisted, topKeywords, categorySearchDist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/user-stats
 * @desc    User analytics: interest distribution, activity, growth
 * @access  Admin only
 */
const getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeToday = await User.countDocuments({
      role: 'user',
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Interest distribution across all users
    const users = await User.find({ role: 'user' }).select('interestProfile totalInteractions');
    const interestTotals = {};
    users.forEach(u => {
      if (u.interestProfile) {
        u.interestProfile.forEach((score, category) => {
          interestTotals[category] = (interestTotals[category] || 0) + score;
        });
      }
    });

    const interestDistribution = Object.entries(interestTotals)
      .map(([category, totalScore]) => ({ category, totalScore: parseFloat(totalScore.toFixed(1)) }))
      .sort((a, b) => b.totalScore - a.totalScore);

    // Top interacting users (no PII beyond username)
    const topUsers = await User.find({ role: 'user' })
      .sort({ totalInteractions: -1 })
      .limit(10)
      .select('username totalInteractions lastActive createdAt');

    // User growth (signups per day for last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      { $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: { totalUsers, activeToday, interestDistribution, topUsers, userGrowth },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/search-stats
 * @desc    Search keyword analytics
 * @access  Admin only
 */
const getSearchStats = async (req, res, next) => {
  try {
    const totalSearches = await SearchLog.countDocuments();

    const topKeywords = await SearchLog.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$resultsCount' } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]);

    const zeroResultSearches = await SearchLog.aggregate([
      { $match: { resultsCount: 0 } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const recentSearches = await SearchLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('query resultsCount category createdAt');

    res.json({
      success: true,
      data: { totalSearches, topKeywords, zeroResultSearches, recentSearches },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getProductStats, getUserStats, getSearchStats };
