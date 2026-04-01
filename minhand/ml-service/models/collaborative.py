"""
Collaborative Filtering Model
===============================
"Users who clicked similar ads also liked these"

Uses user-based collaborative filtering:
  1. Build a sparse user × ad interaction matrix
  2. Compute cosine similarity between user vectors
  3. Find the 10 most similar users to the target user
  4. Recommend ads that similar users clicked but target hasn't seen

This model IMPROVES as more users join — the network effect.
It produces the most surprising and serendipitous recommendations.
"""

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'collab_model.pkl')

# Interaction type weights for the matrix
INTERACTION_WEIGHTS = {
    'ad_click':      3.0,
    'ad_conversion': 5.0,
    'ad_impression': 0.5,
    'ad_dismissed': -1.0,   # negative signal
    'category_browse': 0.3,
}


class CollaborativeFilter:

    def __init__(self):
        self.user_ad_matrix = None
        self.user_ids = []
        self.ad_ids = []
        self.user_similarity = None
        self.is_fitted = False
        self._load_if_exists()

    def fit(self, interactions: list):
        """
        Build the user-ad matrix and pre-compute user similarities.

        interactions: list of MongoDB interaction documents
          { userId, adId, type, ... }
        """
        if not interactions:
            print("⚠️  No interactions to fit collaborative filter")
            return

        print(f"🤖 Fitting collaborative filter on {len(interactions)} interactions...")

        # Accumulate weighted scores per (user, ad) pair
        scores = {}
        for ix in interactions:
            uid = str(ix.get('userId', ''))
            aid = str(ix.get('adId', ''))
            if not uid or not aid or aid == 'None':
                continue
            weight = INTERACTION_WEIGHTS.get(str(ix.get('type', '')), 0.1)
            key = (uid, aid)
            scores[key] = scores.get(key, 0) + weight

        if not scores:
            print("⚠️  No valid (user, ad) pairs found")
            return

        # Index users and ads
        self.user_ids = list(set(k[0] for k in scores))
        self.ad_ids = list(set(k[1] for k in scores))
        user_idx = {u: i for i, u in enumerate(self.user_ids)}
        ad_idx = {a: i for i, a in enumerate(self.ad_ids)}

        # Build sparse matrix (only positive interactions)
        rows, cols, data = [], [], []
        for (uid, aid), score in scores.items():
            if score > 0:
                rows.append(user_idx[uid])
                cols.append(ad_idx[aid])
                data.append(score)

        self.user_ad_matrix = csr_matrix(
            (data, (rows, cols)),
            shape=(len(self.user_ids), len(self.ad_ids))
        )

        # Pre-compute all pairwise user similarities
        self.user_similarity = cosine_similarity(self.user_ad_matrix)
        self.is_fitted = True

        print(f"✅ Collaborative filter fitted:")
        print(f"   Users: {len(self.user_ids)}")
        print(f"   Ads:   {len(self.ad_ids)}")
        print(f"   Matrix density: {len(data) / max(len(self.user_ids) * len(self.ad_ids), 1):.2%}")

        self._save()

    def recommend(self, user_id: str, top_n: int = 3, exclude_seen: bool = True) -> list:
        """
        Recommend ads for a user based on similar users' behavior.

        Returns list of { adId, collaborativeScore }
        Empty list if user has no history (cold start).
        """
        if not self.is_fitted or user_id not in self.user_ids:
            return []  # cold start — no collaborative recommendations

        uid_idx = self.user_ids.index(user_id)

        # Get similarity scores for all users vs this user
        sims = self.user_similarity[uid_idx].copy()
        sims[uid_idx] = 0  # exclude self

        # Find top 10 most similar users
        top_similar_indices = np.argsort(sims)[::-1][:10]

        # Aggregate ad scores from similar users (weighted by similarity)
        ad_scores = np.zeros(len(self.ad_ids))
        for sim_idx in top_similar_indices:
            sim_weight = sims[sim_idx]
            if sim_weight <= 0:
                continue
            ad_scores += sim_weight * self.user_ad_matrix[sim_idx].toarray()[0]

        # Optionally exclude ads the user has already seen
        if exclude_seen:
            user_seen = self.user_ad_matrix[uid_idx].toarray()[0]
            ad_scores[user_seen > 0] = 0

        # Extract top N
        top_indices = np.argsort(ad_scores)[::-1][:top_n]

        return [
            {
                'adId': self.ad_ids[i],
                'collaborativeScore': round(float(ad_scores[i]), 4),
                'model': 'collaborative',
            }
            for i in top_indices
            if ad_scores[i] > 0
        ]

    def _save(self):
        state = {
            'user_ad_matrix': self.user_ad_matrix,
            'user_ids': self.user_ids,
            'ad_ids': self.ad_ids,
            'user_similarity': self.user_similarity,
        }
        joblib.dump(state, MODEL_PATH)
        print(f"💾 Collaborative model saved")

    def _load_if_exists(self):
        if os.path.exists(MODEL_PATH):
            try:
                state = joblib.load(MODEL_PATH)
                self.user_ad_matrix = state['user_ad_matrix']
                self.user_ids = state['user_ids']
                self.ad_ids = state['ad_ids']
                self.user_similarity = state['user_similarity']
                self.is_fitted = True
                print(f"✅ Collaborative model loaded ({len(self.user_ids)} users, {len(self.ad_ids)} ads)")
            except Exception as e:
                print(f"⚠️  Could not load collaborative model: {e}")
