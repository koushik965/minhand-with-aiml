const User = require('../models/User');
const Ad = require('../models/Ad');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');

const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalAds] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Ad.countDocuments({ isActive: true }),
    ]);

    const adAgg = await Ad.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' } } }]);
    const { totalImpressions = 0, totalClicks = 0 } = adAgg[0] || {};
    const overallCTR = totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions).toFixed(4)) : 0;

    const adPerformance = await Ad.find({ isActive: true }).select('title category impressions clicks budget').sort({ impressions: -1 });
    const categoryStats = await Ad.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' }, adCount: { $sum: 1 } } }, { $sort: { totalImpressions: -1 } }]);
    const interactionStats = await Interaction.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const mostViewed = await Product.find({ isActive: true }).sort({ viewCount: -1 }).limit(8).select('name category brand price viewCount wishlistCount image');

    const users = await User.find({ role: 'user' }).select('interestProfile totalInteractions');
    const interestTotals = {};
    users.forEach(u => { if (u.interestProfile) u.interestProfile.forEach((score, cat) => { interestTotals[cat] = (interestTotals[cat] || 0) + score; }); });
    const interestDistribution = Object.entries(interestTotals).map(([category, totalScore]) => ({ category, totalScore: parseFloat(totalScore.toFixed(1)) })).sort((a, b) => b.totalScore - a.totalScore);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([{ $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    res.json({
      success: true,
      data: {
        overview: { totalUsers, totalProducts, totalAds, totalImpressions, totalClicks, overallCTR },
        adPerformance: adPerformance.map(ad => ({ id: ad._id, title: ad.title, category: ad.category, impressions: ad.impressions, clicks: ad.clicks, budget: ad.budget, ctr: ad.impressions > 0 ? parseFloat((ad.clicks / ad.impressions).toFixed(4)) : 0 })),
        categoryStats, interactionStats, mostViewed, interestDistribution, userGrowth,
      }
    });
  } catch (error) { next(error); }
};

module.exports = { getAnalytics };
