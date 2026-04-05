# ⚡ AdPulse — Dynamic Ad Recommendation System

A full-stack **MERN** application that recommends ads to users in real time based on their browsing behavior, click patterns, and dwell time — powered by a custom relevance-scoring algorithm.

---

## 🏗️ Project Structure

```
ad-recommendation-system/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── seed.js                # Sample data seeder
│   ├── controllers/
│   │   ├── userController.js      # Register, login, profile
│   │   ├── adController.js        # Recommendations, clicks, admin
│   │   └── interactionController.js # Interaction logging
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + adminOnly guards
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema + interest profile
│   │   ├── Ad.js                  # Ad schema + CTR virtual
│   │   └── Interaction.js         # Event tracking schema
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── adRoutes.js
│   │   └── interactionRoutes.js
│   ├── services/
│   │   └── recommendationService.js  # Core scoring algorithm
│   ├── server.js                  # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ads/
    │   │   │   ├── AdCard.js              # Ad display card
    │   │   │   └── InterestProfileWidget.js # User interest bars
    │   │   ├── admin/
    │   │   │   ├── AddAdForm.js           # Create ad form
    │   │   │   └── AnalyticsCharts.js     # Chart.js charts
    │   │   └── common/
    │   │       └── Navbar.js
    │   ├── context/
    │   │   └── AuthContext.js             # JWT auth state
    │   ├── hooks/
    │   │   └── useInteractionTracker.js   # Behavior tracking hook
    │   ├── pages/
    │   │   ├── HomePage.js                # Personalized feed
    │   │   ├── CategoryPage.js            # Browse by category
    │   │   ├── AdDetailPage.js            # Ad detail + dwell time
    │   │   ├── AdminDashboard.js          # Analytics + charts
    │   │   ├── LoginPage.js
    │   │   └── RegisterPage.js
    │   ├── services/
    │   │   └── api.js                     # Axios + all API calls
    │   ├── App.js
    │   ├── index.js
    │   └── index.css                      # Design system + global styles
    ├── .env.example
    └── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register` | ❌ | Register new user |
| POST | `/api/users/login` | ❌ | Login + get JWT |
| GET | `/api/users/profile` | ✅ | Get user profile + interests |
| GET | `/api/ads` | ✅ | Get all active ads |
| GET | `/api/ads/recommend` | ✅ | Get top N recommendations |
| GET | `/api/ads/:id` | ✅ | Get single ad detail |
| POST | `/api/ads/click` | ✅ | Record an ad click |
| POST | `/api/interactions` | ✅ | Log any user interaction |
| GET | `/api/interactions` | ✅ | Get interaction history |
| GET | `/api/ads/admin/analytics` | 🔐 Admin | Platform analytics |
| POST | `/api/ads/admin/add-ad` | 🔐 Admin | Create advertisement |

---

## 🧮 Recommendation Algorithm

```
score = (userInterestScore × CATEGORY_WEIGHT)
      + (adCTR × PERFORMANCE_WEIGHT)
      + (jaccardKeywordSimilarity × KEYWORD_WEIGHT)

CATEGORY_WEIGHT   = 5.0   ← strongest signal
PERFORMANCE_WEIGHT = 3.0  ← real-world ad quality
KEYWORD_WEIGHT    = 2.0   ← fine-grained relevance
```

**Jaccard Similarity** is used for keyword matching:
```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

**Interest profile update weights:**
- Page visit → +0.5
- Category browse → +1.5
- Ad impression → +0.5
- Ad click → +3.0
- Dwell time → +0.1 per second (capped at 300s)

---

## 🚀 Local Setup — Step by Step

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd ad-recommendation-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and set:
#   MONGODB_URI=mongodb://localhost:27017/ad_recommendation_db
#   JWT_SECRET=your_secret_key_here
#   PORT=5000

# Frontend
cd ../frontend
cp .env.example .env
# Default: REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Seed the Database

```bash
cd backend
node config/seed.js
```

This inserts **10 sample advertisements** across 8 categories and creates:
- Admin user: `admin@adrecsys.com` / `Admin@123456`

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# React app opens at http://localhost:3000
```

### 5. Open in Browser

- **User app:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin (login as admin first)
- **API health check:** http://localhost:5000/api/health

---

## 🧪 Usage Flow

1. **Register** a new account or login as admin
2. **Browse** the home page — top recommendations are shown (initially generic, sorted by CTR)
3. **Browse categories** — each visit updates your interest profile
4. **Click an ad** — interest score increases, CTR updates, future recommendations improve
5. **View ad detail** — dwell time is tracked on unmount
6. **Check your profile** in the sidebar — watch interest bars grow in real time
7. **Admin dashboard** — see platform-wide analytics, charts, and add new ads

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Chart.js, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Security | Helmet, CORS, express-rate-limit |

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Passwords hashed with bcrypt (10 salt rounds)
- Helmet.js for secure HTTP headers
- Rate limiting (200 req / 15 min per IP)
- Admin route protection with role-based middleware
- Password field excluded from all queries by default

---

## 📄 License

MIT
