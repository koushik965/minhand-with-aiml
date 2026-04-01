"""
CTR Prediction Model — XGBoost Classifier
==========================================
Predicts the probability that a specific user will click a specific ad.

This is a REAL machine learning model:
  - Trained on historical (user, ad, context) → click/no-click data
  - XGBoost finds the optimal feature weights automatically
  - AUC score measures quality (target > 0.70)
  - Retrains nightly on new interaction data

Feature vector (16 features):
  User features:    interest score, total interactions, session info
  Ad features:      historical CTR, impressions, age, budget remaining
  Context features: time of day, day of week, weekend flag, device
  Cross features:   keyword overlap, category match, ad position
"""

import numpy as np
import joblib
import os
from datetime import datetime, timezone

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import roc_auc_score, log_loss
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("⚠️  XGBoost not available — CTR model will use fallback scoring")


FEATURE_NAMES = [
    # User features
    'user_interest_in_category',   # 0–100: how much user likes this ad's category
    'user_total_interactions',     # total events user has generated
    'user_days_since_active',      # recency: days since last seen

    # Ad features
    'ad_ctr_historical',           # past CTR of this ad
    'ad_impressions_log',          # log(impressions) — heavy-tailed
    'ad_age_days',                 # how old is this ad
    'ad_budget_remaining_pct',     # budget % remaining (0–1)

    # Context features
    'time_of_day',                 # 0–23 hours
    'day_of_week',                 # 0–6
    'is_weekend',                  # 1 if Saturday/Sunday
    'is_evening',                  # 1 if 18:00–22:00 (peak browsing)
    'device_mobile',               # 1 if mobile
    'device_desktop',              # 1 if desktop

    # Cross features
    'keyword_overlap_score',       # Jaccard(user interests, ad keywords)
    'category_exact_match',        # 1 if ad.category is user's top interest
    'ad_position',                 # slot 1, 2, or 3 on the page
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ctr_model.pkl')
METADATA_PATH = os.path.join(os.path.dirname(__file__), 'ctr_metadata.pkl')


class CTRPredictor:

    def __init__(self):
        self.model = None
        self.is_trained = False
        self.metadata = {
            'trained_at': None,
            'training_examples': 0,
            'auc': 0.0,
            'log_loss': 0.0,
            'feature_importance': {},
        }
        self._load_if_exists()

    # ── Feature Engineering ────────────────────────────────────────

    def _days_since(self, date_value) -> float:
        """Calculate days since a date. Returns 999 if unknown."""
        if date_value is None:
            return 999.0
        try:
            if isinstance(date_value, str):
                dt = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            elif isinstance(date_value, datetime):
                dt = date_value
            else:
                return 999.0
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            delta = datetime.now(timezone.utc) - dt
            return max(float(delta.days), 0.0)
        except Exception:
            return 999.0

    def _budget_remaining(self, budget_data) -> float:
        """What fraction of ad budget is still available."""
        if not isinstance(budget_data, (int, float)) or budget_data <= 0:
            return 0.5  # default: assume 50% remaining
        return 0.5  # simplified — budget spent not tracked separately

    def _jaccard(self, user_interests: dict, ad_keywords: list) -> float:
        """Keyword overlap between user interest keys and ad keywords."""
        user_terms = set(k.lower() for k in user_interests.keys())
        ad_terms = set(k.lower() for k in (ad_keywords or []))
        if not user_terms or not ad_terms:
            return 0.0
        intersection = user_terms & ad_terms
        union = user_terms | ad_terms
        return len(intersection) / len(union)

    def _top_category(self, user_interests: dict) -> str:
        """Return the user's strongest interest category."""
        if not user_interests:
            return ''
        return max(user_interests, key=lambda k: user_interests[k])

    def build_features(self, user: dict, ad: dict, context: dict) -> np.ndarray:
        """
        Build the 16-feature vector for a single (user, ad, context) triple.
        This is called at inference time — must be fast.
        """
        interests = dict(user.get('interestProfile', {}))
        ad_category = ad.get('category', '')

        # Determine device
        device = str(context.get('deviceType', 'desktop')).lower()
        hour = int(context.get('timeOfDay', datetime.now().hour))
        dow = int(context.get('dayOfWeek', datetime.now().weekday()))

        # Impressions: use log transform to compress heavy tail
        impressions = float(ad.get('impressions', 0) or 0)
        impressions_log = float(np.log1p(impressions))

        # Historical CTR
        clicks = float(ad.get('clicks', 0) or 0)
        ctr = clicks / max(impressions, 1)

        features = [
            # User features
            float(interests.get(ad_category, 0)),
            float(user.get('totalInteractions', 0)),
            self._days_since(user.get('lastActive')),

            # Ad features
            round(ctr, 6),
            impressions_log,
            self._days_since(ad.get('createdAt')),
            self._budget_remaining(ad.get('budget')),

            # Context features
            float(hour),
            float(dow),
            1.0 if dow in (5, 6) else 0.0,         # weekend
            1.0 if 18 <= hour <= 22 else 0.0,       # evening
            1.0 if 'mobile' in device else 0.0,
            1.0 if 'desktop' in device else 0.0,

            # Cross features
            self._jaccard(interests, ad.get('keywords', [])),
            1.0 if ad_category == self._top_category(interests) else 0.0,
            float(context.get('adPosition', 1)),
        ]

        return np.array(features, dtype=np.float32)

    # ── Training ───────────────────────────────────────────────────

    def train(self, training_data: list) -> dict:
        """
        Train XGBoost on labeled interaction data.

        training_data: list of dicts:
          { 'user': {...}, 'ad': {...}, 'context': {...}, 'label': 0|1 }

        label = 1 → user clicked the ad
        label = 0 → user saw but did not click
        """
        if not XGB_AVAILABLE:
            return {'error': 'XGBoost not installed', 'auc': 0}

        if len(training_data) < 50:
            return {'error': f'Need at least 50 examples, got {len(training_data)}', 'auc': 0}

        print(f"🤖 Training CTR model on {len(training_data)} examples...")

        # Build feature matrix
        X = np.array([
            self.build_features(d['user'], d['ad'], d.get('context', {}))
            for d in training_data
        ])
        y = np.array([int(d['label']) for d in training_data], dtype=np.float32)

        pos = int(y.sum())
        neg = int(len(y) - pos)
        print(f"   Positive (clicks): {pos} ({pos/len(y):.1%})")
        print(f"   Negative (no click): {neg}")

        # Handle class imbalance: clicks are rare (~5–10%)
        # scale_pos_weight balances the loss function
        scale = neg / max(pos, 1)

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale,
            eval_metric='logloss',
            use_label_encoder=False,
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )

        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        # Evaluate on validation set
        val_probs = self.model.predict_proba(X_val)[:, 1]
        auc = float(roc_auc_score(y_val, val_probs))
        ll = float(log_loss(y_val, val_probs))

        print(f"✅ Training complete!")
        print(f"   AUC:      {auc:.4f}  (>0.70 is good, >0.80 is great)")
        print(f"   Log Loss: {ll:.4f}")

        # Feature importance
        importance = dict(zip(
            FEATURE_NAMES,
            self.model.feature_importances_.tolist()
        ))
        top_features = sorted(importance.items(), key=lambda x: -x[1])[:5]
        print("   Top features:")
        for feat, imp in top_features:
            print(f"     {feat}: {imp:.4f}")

        # Update metadata
        self.metadata = {
            'trained_at': datetime.now().isoformat(),
            'training_examples': len(training_data),
            'auc': round(auc, 4),
            'log_loss': round(ll, 4),
            'feature_importance': importance,
            'class_balance': {'positive': pos, 'negative': neg},
        }
        self.is_trained = True
        self._save()

        return {'auc': auc, 'log_loss': ll, 'examples': len(training_data)}

    # ── Inference ─────────────────────────────────────────────────

    def predict(self, user: dict, ad: dict, context: dict) -> float:
        """
        Predict P(click) for a user-ad pair.
        Returns float [0, 1].
        Falls back to 0.05 (average CTR) if model not trained.
        """
        if not self.is_trained or self.model is None:
            # Fallback: use historical CTR
            impressions = float(ad.get('impressions', 0) or 0)
            clicks = float(ad.get('clicks', 0) or 0)
            return clicks / max(impressions, 1) if impressions > 0 else 0.05

        features = self.build_features(user, ad, context).reshape(1, -1)
        prob = float(self.model.predict_proba(features)[0][1])
        return round(prob, 4)

    # ── Persistence ───────────────────────────────────────────────

    def _save(self):
        """Save trained model and metadata to disk."""
        if self.model is not None:
            joblib.dump(self.model, MODEL_PATH)
            joblib.dump(self.metadata, METADATA_PATH)
            print(f"💾 Model saved to {MODEL_PATH}")

    def _load_if_exists(self):
        """Load previously trained model from disk at startup."""
        if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.metadata = joblib.load(METADATA_PATH)
                self.is_trained = True
                trained_at = self.metadata.get('trained_at', 'unknown')
                auc = self.metadata.get('auc', 0)
                print(f"✅ CTR model loaded (AUC: {auc}, trained: {trained_at})")
            except Exception as e:
                print(f"⚠️  Could not load model: {e}")
                self.is_trained = False

    def get_metadata(self) -> dict:
        return self.metadata
