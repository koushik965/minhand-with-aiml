const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String, required: true,
    enum: ['Technology', 'Sports', 'Fashion', 'Food', 'Automotive', 'Travel', 'Education', 'Entertainment', 'Health', 'Finance']
  },
  keywords: [String],
  image: { type: String, default: '' },
  targetAudience: [String],
  budget: { type: Number, default: 10000 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

adSchema.virtual('ctr').get(function() {
  if (this.impressions === 0) return 0;
  return parseFloat((this.clicks / this.impressions).toFixed(4));
});

adSchema.methods.recordImpression = async function() {
  this.impressions += 1;
  await this.save();
};

adSchema.methods.recordClick = async function() {
  this.clicks += 1;
  await this.save();
};

module.exports = mongoose.model('Ad', adSchema);
