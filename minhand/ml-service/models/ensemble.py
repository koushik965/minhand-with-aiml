"""
Ensemble Recommender
=====================
Combines three models into one final score:

  Final Score = content_score  × weight_content
              + ctr_prediction × weight_ctr
              + collab_score   × weight_collab

Weights are ADAPTIVE:
  - New users (< 5 interactions): content 60%, ctr 40%, collab 0%
  - Growing users (5–20):         content 45%, ctr 40%, collab 15%
  - Active users (20+):           content 35%, ctr 40%, collab 25%

This simulates how real recommendation systems gradually shift
from content-based to collaborative as user data accumulates.
"""

from models.content_based import ContentBasedModel
from models.ctr_predictor import CTRPredictor
from models.collaborative import CollaborativeFilter


class EnsembleRecommender:

    def __init__(self):
        self.content_model = ContentBasedModel()
        self.ctr_model = CTRPredictor()
        self.collab_model = CollaborativeFilter()

    def _get_weights(self, total_interactions: int) -> dict:
        """
        Adaptive weights based on how much we know about the user.
        More interactions → trust collaborative filtering more.
        """
        if total_interactions < 5:
            return {'content': 0.60, 'ctr': 0.40, 'collab': 0.00}
        elif total_interactions < 20:
            return {'content': 0.45, 'ctr': 0.40, 'collab': 0.15}
        else:
            return {'content': 0.35, 'ctr': 0.40, 'collab': 0.25}

    def _get_recommendation_reason(self, user_profile: dict, ad: dict, weights: dict) -> str:
        """
        Generate a human-readable explanation of why this ad was recommended.
        Used for admin transparency — NEVER shown to end users.
        """
        top_interest = max(user_profile, key=user_profile.get) if user_profile else None
        ad_cat = ad.get('category', '')

        if weights['collab'] > 0.15:
            return f"Recommended because users with similar interests also engaged with {ad_cat} ads"
        elif top_interest and top_interest == ad_cat:
            return f"Matches your strongest interest: {top_interest}"
        elif user_profile.get(ad_cat, 0) > 3:
            return f"Based on your {ad_cat} browsing history"
        else:
            return f"Popular {ad_cat} ad with strong engagement"

    def recommend(self, user: dict, ads: list, context: dict, top_n: int = 3) -> list:
        """
        Main recommendation function.

        user:    MongoDB user document
        ads:     list of active ad documents
        context: { timeOfDay, dayOfWeek, deviceType, adPosition, page }
        top_n:   number of ads to return

        Returns list of scored ad recommendations.
        """
        if not ads:
            return []

        user_id = str(user.get('_id', ''))
        interest_profile = dict(user.get('interestProfile', {}))
        total_interactions = int(user.get('totalInteractions', 0))
        weights = self._get_weights(total_interactions)

        # ── Model 1: Content-Based Scores ────────────────────────────
        content_results = self.content_model.recommend(interest_profile, ads, top_n=len(ads))
        content_map = {r['adId']: r['score'] for r in content_results}

        # ── Model 2: XGBoost CTR Predictions ────────────────────────
        ctr_map = {}
        for ad in ads:
            ad_id = str(ad.get('_id', ''))
            ctr_map[ad_id] = self.ctr_model.predict(user, ad, context)

        # ── Model 3: Collaborative Filtering ────────────────────────
        collab_results = self.collab_model.recommend(user_id, top_n=len(ads))
        raw_collab = {r['adId']: r['collaborativeScore'] for r in collab_results}

        # Normalize collaborative scores to [0, 1]
        max_collab = max(raw_collab.values()) if raw_collab else 1.0
        collab_map = {k: v / max(max_collab, 1e-6) for k, v in raw_collab.items()}

        # ── Ensemble: Combine all three scores ─────────────────────
        final_scores = []
        for ad in ads:
            ad_id = str(ad.get('_id', ''))

            c_score = content_map.get(ad_id, 0.0)
            ctr_score = ctr_map.get(ad_id, 0.05)
            col_score = collab_map.get(ad_id, 0.0)

            # Normalize CTR prediction to [0, 1] using max across all ads
            # (will be re-normalized after computing all)
            ensemble = (
                c_score   * weights['content'] +
                ctr_score * weights['ctr'] +
                col_score * weights['collab']
            )

            final_scores.append({
                'adId': ad_id,
                'ad': ad,
                'ensembleScore': round(ensemble, 4),
                'reason': self._get_recommendation_reason(interest_profile, ad, weights),
                'modelWeights': weights,
                'breakdown': {
                    'contentScore': round(c_score, 4),
                    'predictedCTR': round(ctr_score, 4),
                    'collaborativeScore': round(col_score, 4),
                    'userTotalInteractions': total_interactions,
                    'modelUsed': 'ensemble' if self.ctr_model.is_trained else 'content+ctr_fallback',
                }
            })

        final_scores.sort(key=lambda x: x['ensembleScore'], reverse=True)
        return final_scores[:top_n]

    def get_model_status(self) -> dict:
        """Return status of all three models for the health endpoint."""
        return {
            'content_based': {
                'status': 'ready',
                'description': 'Always available — no training required',
            },
            'ctr_predictor': {
                'status': 'trained' if self.ctr_model.is_trained else 'untrained (using CTR fallback)',
                'metadata': self.ctr_model.get_metadata(),
            },
            'collaborative_filter': {
                'status': 'fitted' if self.collab_model.is_fitted else 'unfitted (need more interactions)',
                'users': len(self.collab_model.user_ids),
                'ads': len(self.collab_model.ad_ids),
            },
        }
