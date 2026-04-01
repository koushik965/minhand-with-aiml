const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Interaction = require('../models/Interaction');

// Strip admin-only fields before sending to users
const sanitize = (product) => {
  const p = product.toObject ? product.toObject() : product;
  const { viewCount, wishlistCount, compareCount, __v, ...safe } = p;
  return safe;
};

const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, inStock, sort = 'newest', featured } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (inStock) filter.inStock = inStock === 'true';
    if (featured) filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    const sortMap = { price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { rating: -1 }, newest: { createdAt: -1 } };
    const products = await Product.find(filter).sort(sortMap[sort] || { createdAt: -1 }).select('-viewCount -wishlistCount -compareCount');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    if (!q?.trim()) return res.status(400).json({ success: false, message: 'Query required.' });
    const filter = { isActive: true, $or: [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }, { keywords: { $elemMatch: { $regex: q, $options: 'i' } } }, { brand: { $regex: q, $options: 'i' } }] };
    if (category) filter.category = category;
    const products = await Product.find(filter).select('-viewCount -wishlistCount -compareCount').limit(50);
    if (category) req.user.updateInterest(category, 0.5).catch(() => {});
    res.json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found.' });
    Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});
    req.user.updateInterest(product.category, 1.0).catch(() => {});
    Interaction.create({ userId: req.user._id, type: 'product_view', productId: product._id, category: product.category }).catch(() => {});
    res.json({ success: true, data: sanitize(product) });
  } catch (error) { next(error); }
};

const compareProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || productIds.length < 2) return res.status(400).json({ success: false, message: 'Need at least 2 products.' });
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).select('-viewCount -wishlistCount -compareCount');
    Product.updateMany({ _id: { $in: productIds } }, { $inc: { compareCount: 1 } }).catch(() => {});
    res.json({ success: true, products: products.map(p => sanitize(p)) });
  } catch (error) { next(error); }
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({ path: 'products.productId', select: '-viewCount -wishlistCount -compareCount' });
    if (!wishlist) return res.json({ success: true, data: [] });
    const items = wishlist.products.filter(i => i.productId).map(i => ({ ...sanitize(i.productId), addedAt: i.addedAt }));
    res.json({ success: true, count: items.length, data: items });
  } catch (error) { next(error); }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    const idx = wishlist.products.findIndex(i => i.productId.toString() === req.params.productId);
    let added;
    if (idx > -1) { wishlist.products.splice(idx, 1); added = false; Product.findByIdAndUpdate(req.params.productId, { $inc: { wishlistCount: -1 } }).catch(() => {}); }
    else { wishlist.products.push({ productId: req.params.productId }); added = true; Product.findByIdAndUpdate(req.params.productId, { $inc: { wishlistCount: 1 } }).catch(() => {}); }
    await wishlist.save();
    res.json({ success: true, added, message: added ? 'Added to wishlist' : 'Removed from wishlist' });
  } catch (error) { next(error); }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) { next(error); }
};

module.exports = { getProducts, searchProducts, getProductById, compareProducts, getWishlist, toggleWishlist, createProduct, updateProduct, deleteProduct };
