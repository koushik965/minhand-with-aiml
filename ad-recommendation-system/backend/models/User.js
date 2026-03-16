const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user credentials and a dynamic interest profile.
 * interestProfile maps category names to numeric scores (0-10+).
 * Higher score = stronger user interest in that category.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Dynamic interest profile: { "Technology": 8, "Sports": 3, "Fashion": 1 }
    interestProfile: {
      type: Map,
      of: Number,
      default: {},
    },
    // Track total interactions for analytics
    totalInteractions: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: Hash password before storing in DB.
 * Only runs if password field was modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare plain-text password with stored hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: Update user interest profile based on interaction.
 * category: string (e.g., "Technology")
 * weight: number (page visit = 1, category browse = 2, ad click = 3)
 */
userSchema.methods.updateInterest = async function (category, weight = 1) {
  const currentScore = this.interestProfile.get(category) || 0;
  // Cap score at 100 to prevent runaway values
  this.interestProfile.set(category, Math.min(currentScore + weight, 100));
  this.totalInteractions += 1;
  this.lastActive = Date.now();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
