const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const SearchLog = require('../models/SearchLog');
const Interaction = require('../models/Interaction');

/**
 * sanitizeProductForUser
 * Strips admin-only analytics fields from product data.
 * Users NEVER see: viewCount, searchCount, wishlistCount, compareCount.
 */
const sanitizeProductForUser = (product) => {
  const p = product.toObject ? product.toObject() : product;
  const { viewCount, searchCount, wishlistCount, compareCount, __v, ...safe } = p;
  return safe;
};

/**
 * @route   GET /api/products
 * @desc    List all products with optional category + price filter
 * @access  Protected (user)
 */
const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, inStock, sort = 'createdAt' } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const products = await Product.find(filter)
      .sort(sortMap[sort] || { createdAt: -1 })
      .select('-viewCount -searchCount -wishlistCount -compareCount'); // strip analytics

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/search
 * @desc    Full-text search across name, description, keywords
 * @access  Protected (user)
 * Side effect: logs search to SearchLog (admin analytics only)
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const filter = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { keywords: { $elemMatch: { $regex: q, $options: 'i' } } },
        { brand: { $regex: q, $options: 'i' } },
      ],
    };
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .select('-viewCount -searchCount -wishlistCount -compareCount')
      .limit(50);

    // ── Analytics side-effect (silent, non-blocking) ─────────────────────
    // Log search for admin keyword tracking — never shown to user
    SearchLog.create({
      userId: req.user._id,
      query: q.toLowerCase().trim(),
      resultsCount: products.length,
      category: category || null,
    }).catch(() => {});

    // Increment searchCount on matched products (admin analytics only)
    Product.updateMany(
      { _id: { $in: products.map(p => p._id) } },
      { $inc: { searchCount: 1 } }
    ).catch(() => {});

    // Update user interest profile if category was searched
    if (category) {
      req.user.updateInterest(category, 0.5).catch(() => {});
    }

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product detail
 * @access  Protected (user)
 * Side effect: increments viewCount (admin analytics only)
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // ── Analytics side-effects (silent) ─────────────────────────────────
    Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});

    // Track as interaction for recommendation engine
    Interaction.create({
      userId: req.user._id,
      type: 'page_visit',
      category: product.category,
      page: `/products/${req.params.id}`,
    }).catch(() => {});

    // Update user interest silently
    req.user.updateInterest(product.category, 1.0).catch(() => {});

    // Return sanitized product (no analytics fields)
    res.json({ success: true, data: sanitizeProductForUser(product) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/compare
 * @desc    Compare multiple products side by side
 * @access  Protected (user)
 * Accepts: { productIds: ['id1', 'id2', 'id3'] }
 */
const compareProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Provide at least 2 product IDs to compare.' });
    }
    if (productIds.length > 4) {
      return res.status(400).json({ success: false, message: 'Cannot compare more than 4 products at once.' });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).select('-viewCount -searchCount -wishlistCount -compareCount');

    if (products.length < 2) {
      return res.status(404).json({ success: false, message: 'Not enough valid products found.' });
    }

    // Silent analytics increment
    Product.updateMany(
      { _id: { $in: productIds } },
      { $inc: { compareCount: 1 } }
    ).catch(() => {});

    // Build comparison table: { fieldName -> { productId: value } }
    const comparisonFields = ['name', 'brand', 'price', 'originalPrice', 'rating', 'reviewCount', 'category', 'inStock', 'specs'];
    const comparison = {};
    comparisonFields.forEach(field => {
      comparison[field] = {};
      products.forEach(p => {
        comparison[field][p._id.toString()] = p[field];
      });
    });

    res.json({
      success: true,
      products: products.map(p => sanitizeProductForUser(p)),
      comparison,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/wishlist
 * @desc    Get current user's wishlist
 * @access  Protected (user)
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate({
        path: 'products.productId',
        select: '-viewCount -searchCount -wishlistCount -compareCount',
      });

    if (!wishlist) {
      return res.json({ success: true, data: [] });
    }

    const items = wishlist.products
      .filter(item => item.productId) // filter deleted products
      .map(item => ({ ...sanitizeProductForUser(item.productId), addedAt: item.addedAt }));

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/wishlist/:productId
 * @desc    Toggle product in/out of wishlist
 * @access  Protected (user)
 */
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    }

    const idx = wishlist.products.findIndex(
      item => item.productId.toString() === productId
    );

    let added;
    if (idx > -1) {
      // Remove from wishlist
      wishlist.products.splice(idx, 1);
      Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } }).catch(() => {});
      added = false;
    } else {
      // Add to wishlist
      wishlist.products.push({ productId });
      Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } }).catch(() => {});
      added = true;
    }

    await wishlist.save();

    res.json({
      success: true,
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
      added,
    });
  } catch (error) {
    next(error);
  }
};

// ── Admin-only CRUD ─────────────────────────────────────────────────────────

/**
 * @route   POST /api/admin/products
 * @desc    Create a new product (Admin only)
 * @access  Admin
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update a product (Admin only)
 * @access  Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Soft-delete a product (Admin only)
 * @access  Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts, searchProducts, getProductById,
  compareProducts, getWishlist, toggleWishlist,
  createProduct, updateProduct, deleteProduct,
};
