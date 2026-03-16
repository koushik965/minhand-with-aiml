require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const connectDB = require('./db');
const Ad = require('../models/Ad');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

const sampleProducts = [
  {
    name: 'Apple MacBook Pro 14" M3',
    description: 'The most powerful MacBook Pro ever. M3 chip, 22 hours battery, Liquid Retina XDR display.',
    category: 'Technology', brand: 'Apple', price: 199900, originalPrice: 229900,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    rating: 4.8, reviewCount: 1240,
    keywords: ['laptop', 'apple', 'macbook', 'computer', 'developer'],
    specs: { Chip: 'Apple M3', RAM: '16GB', Storage: '512GB SSD', Battery: '22 hrs' },
    inStock: true, viewCount: 4200, searchCount: 980, wishlistCount: 320, compareCount: 210,
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Galaxy AI is here. 200MP camera, built-in S Pen, titanium frame.',
    category: 'Technology', brand: 'Samsung', price: 134999, originalPrice: 149999,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    rating: 4.7, reviewCount: 890,
    keywords: ['smartphone', 'samsung', 'android', 'camera', '5G'],
    specs: { Processor: 'Snapdragon 8 Gen 3', RAM: '12GB', Storage: '256GB', Camera: '200MP' },
    inStock: true, viewCount: 3800, searchCount: 1100, wishlistCount: 450, compareCount: 380,
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling, 30-hour battery, crystal clear calling.',
    category: 'Technology', brand: 'Sony', price: 29990, originalPrice: 34990,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    rating: 4.9, reviewCount: 3200,
    keywords: ['headphones', 'sony', 'noise canceling', 'wireless', 'audio'],
    specs: { 'Battery Life': '30 hrs', Connectivity: 'Bluetooth 5.2', Weight: '250g' },
    inStock: true, viewCount: 5600, searchCount: 1400, wishlistCount: 620, compareCount: 290,
  },
  {
    name: 'Nike Air Max 270',
    description: 'Big, bold look with a large Air unit in the heel for all-day comfort.',
    category: 'Sports', brand: 'Nike', price: 12995, originalPrice: 15995,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    rating: 4.6, reviewCount: 2100,
    keywords: ['shoes', 'running', 'nike', 'sneakers', 'sports'],
    specs: { Type: 'Running Shoe', Upper: 'Engineered Mesh', Sizes: 'UK 6-12' },
    inStock: true, viewCount: 3100, searchCount: 780, wishlistCount: 290, compareCount: 120,
  },
  {
    name: 'Adidas Ultraboost 23',
    description: 'Responsive Boost cushioning returns energy to every stride. PRIMEKNIT+ upper.',
    category: 'Sports', brand: 'Adidas', price: 14999, originalPrice: 17999,
    image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800',
    rating: 4.7, reviewCount: 1650,
    keywords: ['shoes', 'adidas', 'ultraboost', 'running', 'boost'],
    specs: { Type: 'Running Shoe', Midsole: 'Boost', Drop: '10mm', Weight: '310g' },
    inStock: true, viewCount: 2700, searchCount: 640, wishlistCount: 210, compareCount: 180,
  },
  {
    name: 'Zara Oversized Blazer',
    description: 'Contemporary oversized blazer in premium fabric. For formal and casual occasions.',
    category: 'Fashion', brand: 'Zara', price: 4999, originalPrice: 6999,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800',
    rating: 4.3, reviewCount: 480,
    keywords: ['blazer', 'fashion', 'formal', 'jacket', 'office wear'],
    specs: { Material: 'Polyester blend', Fit: 'Oversized', Sizes: 'XS-XXL' },
    inStock: true, viewCount: 1800, searchCount: 420, wishlistCount: 160, compareCount: 45,
  },
  {
    name: 'Tesla Model 3 Long Range',
    description: 'All-electric sedan. 602km range, 0-100 in 4.4 seconds, full Autopilot.',
    category: 'Automotive', brand: 'Tesla', price: 4299000,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    rating: 4.8, reviewCount: 3400,
    keywords: ['tesla', 'electric car', 'EV', 'sedan', 'autopilot'],
    specs: { Range: '602 km', '0-100': '4.4s', Motor: 'Dual', Autopilot: 'Yes' },
    inStock: false, viewCount: 8900, searchCount: 2100, wishlistCount: 890, compareCount: 560,
  },
  {
    name: 'Coursera Data Science Specialization',
    description: 'Master Python, ML, and AI. 6-course series from Johns Hopkins. Verified certificate.',
    category: 'Education', brand: 'Coursera', price: 3999, originalPrice: 5999,
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
    rating: 4.7, reviewCount: 8900,
    keywords: ['education', 'data science', 'python', 'machine learning', 'certificate'],
    specs: { Courses: '6', Duration: '8 months', Level: 'Beginner to Advanced', Certificate: 'Yes' },
    inStock: true, viewCount: 4100, searchCount: 1600, wishlistCount: 510, compareCount: 220,
  },
  {
    name: 'Dyson V15 Detect Absolute',
    description: 'Laser reveals microscopic dust. Piezo sensor. 60 minutes fade-free suction.',
    category: 'Health', brand: 'Dyson', price: 59900, originalPrice: 64900,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    rating: 4.6, reviewCount: 1100,
    keywords: ['dyson', 'vacuum', 'cordless', 'laser', 'cleaning'],
    specs: { Suction: '230 AW', Battery: '60 min', Weight: '3.1kg', Filter: 'HEPA' },
    inStock: true, viewCount: 2900, searchCount: 760, wishlistCount: 270, compareCount: 140,
  },
  {
    name: 'Airbnb Bali Villa Experience',
    description: 'Private infinity pool villa in Ubud. 3 bedrooms, personal chef, daily spa.',
    category: 'Travel', brand: 'Airbnb', price: 45000,
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    rating: 4.9, reviewCount: 230,
    keywords: ['travel', 'villa', 'bali', 'luxury', 'vacation'],
    specs: { Bedrooms: '3', Pool: 'Private Infinity', Location: 'Ubud, Bali', Includes: 'Chef + Spa' },
    inStock: true, viewCount: 2200, searchCount: 580, wishlistCount: 340, compareCount: 90,
  },
];

const sampleAds = [
  { title: 'MacBook Pro M3 — Power Redefined', description: 'Experience next-generation performance.', category: 'Technology', keywords: ['laptop', 'apple', 'developer'], image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', targetAudience: ['developers'], budget: 50000, impressions: 1200, clicks: 96 },
  { title: 'Nike Air Max — Just Do It', description: 'Engineered for performance, designed for style.', category: 'Sports', keywords: ['shoes', 'running', 'fitness'], image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', targetAudience: ['athletes'], budget: 20000, impressions: 890, clicks: 62 },
  { title: 'Zara Summer Collection 2024', description: 'Discover the latest trends this season.', category: 'Fashion', keywords: ['fashion', 'clothing', 'style'], image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', targetAudience: ['fashion lovers'], budget: 15000, impressions: 2100, clicks: 210 },
  { title: 'Tesla Model 3 — Drive the Future', description: 'Zero emissions. Maximum performance.', category: 'Automotive', keywords: ['tesla', 'electric car', 'ev'], image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800', targetAudience: ['eco-conscious'], budget: 100000, impressions: 3200, clicks: 192 },
  { title: 'Coursera — Learn Without Limits', description: 'Access 7,000+ courses from top universities.', category: 'Education', keywords: ['education', 'online learning', 'certificate'], image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800', targetAudience: ['students'], budget: 12000, impressions: 1100, clicks: 99 },
  { title: 'Sony XM5 — Hear Everything', description: 'Industry-leading noise canceling. 30-hour battery.', category: 'Technology', keywords: ['headphones', 'sony', 'wireless', 'audio'], image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', targetAudience: ['music lovers'], budget: 18000, impressions: 980, clicks: 88 },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await Promise.all([Ad.deleteMany({}), Product.deleteMany({}), User.deleteMany({ role: 'admin' })]);
    const [ads, products] = await Promise.all([Ad.insertMany(sampleAds), Product.insertMany(sampleProducts)]);
    console.log(`✅ Inserted ${ads.length} ads`);
    console.log(`✅ Inserted ${products.length} products`);
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('Admin@123456', salt);
    await User.create({ username: 'admin', email: 'admin@adrecsys.com', password: hashed, role: 'admin' });
    console.log(`✅ Admin created: admin@adrecsys.com / Admin@123456`);
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
