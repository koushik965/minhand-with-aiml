const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String, required: true,
    enum: ['page_visit', 'product_view', 'ad_impression', 'ad_click', 'category_browse', 'search', 'wishlist_add', 'dwell_time', 'compare']
  },
  adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  category: { type: String, default: null },
  page: { type: String, default: null },
  dwellTime: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

interactionSchema.index({ userId: 1, type: 1 });
interactionSchema.index({ adId: 1, type: 1 });
interactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
