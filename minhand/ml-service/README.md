# MinHand ML Service — Setup Guide

## What's Inside

| File | Purpose |
|---|---|
| `app.py` | Flask REST API (main entry point) |
| `models/content_based.py` | Cosine similarity interest matching |
| `models/ctr_predictor.py` | XGBoost click-through rate predictor |
| `models/collaborative.py` | User-user collaborative filtering |
| `models/ensemble.py` | Combines all three with adaptive weights |
| `utils/data_loader.py` | MongoDB data fetching for training |
| `utils/explainer.py` | Recommendation explanation generator |

## How to Run

### Step 1 — Install Python (if not already installed)
Download Python 3.10+ from https://python.org

### Step 2 — Install dependencies
```bash
cd ml-service
pip install -r requirements.txt
```

### Step 3 — Copy environment file
```bash
copy .env.example .env
```

### Step 4 — Start the service
```bash
python app.py
```

You should see:
```
✅ All models initialised
⚡ MinHand ML Service running on port 8000
📡 http://localhost:8000/health
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Check all model statuses |
| POST | `/recommend` | Get ML recommendations for a user |
| POST | `/train` | Retrain models on latest data |
| GET | `/explain/<adId>?userId=...` | Explain why ad was recommended |
| GET | `/model-stats` | Detailed model performance metrics |

## Training the Models

The XGBoost and Collaborative models need real click data to train.

1. Use the platform normally — browse products, click ads
2. Once 50+ ad interactions are logged, go to Admin Dashboard → AI/ML Engine
3. Click "Train Models Now"
4. Check the AUC score (target: >0.70)

Models auto-retrain every night at 2am.

## Model Details

### Content-Based Filter
- Always active, no training needed
- Uses cosine similarity between user interest vectors and ad category vectors
- Jaccard similarity for keyword matching

### XGBoost CTR Predictor (16 features)
- User features: interest score, total interactions, recency
- Ad features: historical CTR, impressions, age, budget
- Context: time of day, day of week, weekend, device type
- Cross features: keyword overlap, category match, ad position

### Collaborative Filter
- User-user cosine similarity on sparse interaction matrix
- Weighted by interaction type (click=3.0, impression=0.5, dismiss=-1.0)
- Automatically excludes ads the user has already seen
