const mongoose = require('mongoose');

/**
 * Product Schema
 * Represents a discoverable product on the platform.
 * Tracks views and searches for admin analytics (never exposed to users).
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance'],
    },
    brand: { type: String, default: 'Generic' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null }, // for showing discounts
    image: { type: String, default: 'https://via.placeholder.com/800x600' },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    keywords: { type: [String], default: [] },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} }, // { RAM: '16GB', Storage: '512GB' }
    inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },

    // ── Analytics fields — NEVER sent to normal users ──────────────────
    // Tracked silently; only visible in admin dashboard
    viewCount: { type: Number, default: 0 },       // total product page views
    searchCount: { type: Number, default: 0 },     // how often this appeared in searches
    wishlistCount: { type: Number, default: 0 },   // how many users wishlisted it
    compareCount: { type: Number, default: 0 },    // how many times compared
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: discount percentage
productSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Index for fast text search
productSchema.index({ name: 'text', description: 'text', keywords: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
