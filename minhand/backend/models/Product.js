const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String, required: true,
    enum: ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance']
  },
  brand: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: null },
  image: { type: String, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  keywords: [String],
  specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  inStock: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  // Analytics — admin only, never sent to users
  viewCount: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  compareCount: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('discountPercent').get(function() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.index({ name: 'text', description: 'text', keywords: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
