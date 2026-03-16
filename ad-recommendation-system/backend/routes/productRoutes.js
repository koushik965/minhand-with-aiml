const express = require('express');
const router = express.Router();
const {
  getProducts, searchProducts, getProductById,
  compareProducts, getWishlist, toggleWishlist,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// All product routes require authentication (normal users)
// No adminOnly here — product browsing is for users

router.get('/', protect, getProducts);
router.get('/search', protect, searchProducts);
router.get('/wishlist', protect, getWishlist);
router.post('/compare', protect, compareProducts);
router.get('/:id', protect, getProductById);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
