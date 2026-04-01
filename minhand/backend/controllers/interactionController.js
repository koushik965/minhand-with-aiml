const Interaction = require('../models/Interaction');

const WEIGHTS = { page_visit: 0.5, category_browse: 1.5, ad_impression: 0.5, ad_click: 3.0, product_view: 1.0, wishlist_add: 2.0, search: 0.8, dwell_time: 0.1, compare: 1.2 };

const logInteraction = async (req, res, next) => {
  try {
    const { type, adId, productId, category, page, dwellTime, metadata } = req.body;
    const interaction = await Interaction.create({ userId: req.user._id, type, adId: adId || null, productId: productId || null, category: category || null, page: page || null, dwellTime: dwellTime || 0, metadata: metadata || {} });
    if (category) {
      const weight = type === 'dwell_time' ? WEIGHTS[type] * Math.min(dwellTime || 0, 300) : (WEIGHTS[type] || 1);
      req.user.updateInterest(category, weight).catch(() => {});
    }
    res.status(201).json({ success: true, interaction });
  } catch (error) { next(error); }
};

module.exports = { logInteraction };
