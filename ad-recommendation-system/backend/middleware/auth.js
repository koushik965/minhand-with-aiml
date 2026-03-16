const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware
 * Validates JWT from Authorization header.
 * Role is embedded in the JWT payload for fast checks.
 * Full user object attached to req.user for downstream handlers.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    // JWT payload includes { id, role } — role embedded at sign time
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deleted/role-changed users)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

/**
 * adminOnly middleware
 * Must be chained AFTER protect middleware.
 * Double-checks role from BOTH JWT and DB record.
 * Returns 403 with a generic message — never leaks why access was denied.
 *
 * Usage: router.get('/route', protect, adminOnly, handler)
 */
const adminOnly = (req, res, next) => {
  // req.user is guaranteed to exist here (protect ran first)
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  // Generic 403 — do NOT reveal internal structure or data
  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient permissions.',
  });
};

/**
 * generateToken
 * Signs a JWT embedding id AND role for downstream role checks.
 * Exported so userController can use it.
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, adminOnly, generateToken };
