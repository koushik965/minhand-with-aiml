const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  // Silent interest tracking — never exposed to users
  interestProfile: { type: Map, of: Number, default: {} },
  totalInteractions: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

userSchema.methods.updateInterest = async function(category, weight = 1) {
  const current = this.interestProfile.get(category) || 0;
  this.interestProfile.set(category, Math.min(current + weight, 100));
  this.totalInteractions += 1;
  this.lastActive = Date.now();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
