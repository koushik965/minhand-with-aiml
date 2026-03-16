const mongoose = require('mongoose');

/**
 * SearchLog Schema
 * Records every search query for admin analytics.
 * NEVER exposed to normal users — admin-only aggregation target.
 */
const searchLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    query: { type: String, required: true, trim: true, lowercase: true },
    resultsCount: { type: Number, default: 0 },
    category: { type: String, default: null },
  },
  { timestamps: true }
);

searchLogSchema.index({ query: 1 });
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
