const mongoose = require('mongoose');

/**
 * Interaction Schema
 * Records every user action for analytics and profile building.
 * Types: page_visit, category_browse, ad_impression, ad_click, dwell_time
 */
const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['page_visit', 'category_browse', 'ad_impression', 'ad_click', 'dwell_time'],
    },
    // Optional: which ad was interacted with
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      default: null,
    },
    // Category browsed or ad category interacted with
    category: {
      type: String,
      default: null,
    },
    // Page URL visited
    page: {
      type: String,
      default: null,
    },
    // Time spent on page in seconds (for dwell_time events)
    dwellTime: {
      type: Number,
      default: 0,
    },
    // Client metadata for analytics
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast analytics queries
interactionSchema.index({ userId: 1, type: 1 });
interactionSchema.index({ adId: 1, type: 1 });
interactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
