const mongoose = require('mongoose');

/**
 * Ad Schema
 * Represents an advertisement with targeting and performance metrics.
 * CTR (Click-Through Rate) is computed as a virtual field: clicks / impressions.
 */
const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ad title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ad description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Category is used for matching against user interest profile
    category: {
      type: String,
      required: [true, 'Ad category is required'],
      enum: ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'],
    },
    // Keywords enable fine-grained relevance scoring via Jaccard similarity
    keywords: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/800x400',
    },
    targetAudience: {
      type: [String],
      default: [],
    },
    // Budget in INR (rupees)
    budget: {
      type: Number,
      required: [true, 'Ad budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    // Performance metrics — updated in real time
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: CTR (Click-Through Rate) = clicks / impressions
 * Returns 0 if no impressions yet to avoid division by zero.
 */
adSchema.virtual('ctr').get(function () {
  if (this.impressions === 0) return 0;
  return parseFloat((this.clicks / this.impressions).toFixed(4));
});

/**
 * Instance method: Record an impression (ad was shown to user).
 */
adSchema.methods.recordImpression = async function () {
  this.impressions += 1;
  await this.save();
};

/**
 * Instance method: Record a click on the ad.
 */
adSchema.methods.recordClick = async function () {
  this.clicks += 1;
  await this.save();
};

module.exports = mongoose.model('Ad', adSchema);
