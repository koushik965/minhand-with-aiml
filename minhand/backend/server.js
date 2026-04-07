require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { startScheduler } = require('./scheduler');

connectDB().then(() => {
  // Start background jobs after DB connects
  startScheduler();
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    "https://minhand-with-aiml.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options('*', cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/products',     require('./routes/productRoutes'));
app.use('/api/ads',          require('./routes/adRoutes'));
app.use('/api/interactions', require('./routes/interactionRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'MinHand API running 🚀',
  mlService: process.env.ML_SERVICE_URL,
}));

// ── 404 / Error ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n⚡ MinHand API         → http://localhost:${PORT}/api`);
  console.log(`🤖 ML Service → ${process.env.ML_SERVICE_URL}`);
});

module.exports = app;
