/**
 * Global error handling middleware for Express.
 * Must be registered LAST in the middleware chain (after all routes).
 * Handles Mongoose validation errors, cast errors, and duplicate key errors.
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Mongoose: Bad ObjectId (e.g., invalid _id format)
  if (err.name === 'CastError') {
    error.message = `Resource not found with id: ${err.value}`;
    return res.status(404).json({ success: false, message: error.message });
  }

  // Mongoose: Duplicate key error (e.g., duplicate email/username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists. Please use a different value.`;
    return res.status(400).json({ success: false, message: error.message });
  }

  // Mongoose: Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join('. ');
    return res.status(400).json({ success: false, message: error.message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // Default: Internal Server Error
  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
