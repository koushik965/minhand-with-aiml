const Interaction = require('../models/Interaction');
const User = require('../models/User');
const Ad = require('../models/Ad');

/**
 * Interest weight per interaction type.
 * Clicks carry more weight than impressions or visits.
 */
const INTERACTION_WEIGHTS = {
  page_visit: 0.5,
  category_browse: 1.5,
  ad_impression: 0.5,
  ad_click: 3.0,
  dwell_time: 0.1, // per second of dwell time
};

/**
 * @route   POST /api/interactions
 * @desc    Log a user interaction and update interest profile + ad metrics
 * @access  Protected
 */
const logInteraction = async (req, res, next) => {
  try {
    const { type, adId, category, page, dwellTime, metadata } = req.body;
    const userId = req.user._id;

    // Create the interaction record
    const interaction = await Interaction.create({
      userId,
      type,
      adId: adId || null,
      category: category || null,
      page: page || null,
      dwellTime: dwellTime || 0,
      metadata: metadata || {},
    });

    // Determine interest category to update
    let interestCategory = category;
    let weightMultiplier = INTERACTION_WEIGHTS[type] || 1;

    // If interaction is with an ad, derive category from the ad
    if (adId && !category) {
      const ad = await Ad.findById(adId);
      if (ad) {
        interestCategory = ad.category;

        // Update ad performance metrics
        if (type === 'ad_impression') {
          await ad.recordImpression();
        } else if (type === 'ad_click') {
          await ad.recordClick();
          // Also increment impression if not already recorded
        }
      }
    }

    // Update user interest profile if we have a category
    if (interestCategory) {
      // For dwell_time, weight is multiplied by seconds spent
      const finalWeight =
        type === 'dwell_time'
          ? weightMultiplier * Math.min(dwellTime || 0, 300) // cap at 5 min
          : weightMultiplier;

      await req.user.updateInterest(interestCategory, finalWeight);
    }

    res.status(201).json({
      success: true,
      message: 'Interaction logged successfully',
      interaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interactions
 * @desc    Get interaction history for current user
 * @access  Protected
 */
const getUserInteractions = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const interactions = await Interaction.find({ userId: req.user._id })
      .populate('adId', 'title category image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interaction.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: interactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logInteraction, getUserInteractions };
