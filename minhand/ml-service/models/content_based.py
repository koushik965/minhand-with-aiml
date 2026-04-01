"""
Content-Based Filtering Model
==============================
Recommends ads by computing similarity between:
  - User interest profile vector (built from browsing behavior)
  - Ad category/keyword vector

This is the FIRST model that runs — it works even with zero training data.
It is the cold-start solution.

Scoring formula:
  score = (category_similarity × 0.50)
        + (ctr_performance    × 0.30)
        + (keyword_jaccard    × 0.20)
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


CATEGORIES = [
    'Technology', 'Sports', 'Fashion', 'Food',
    'Automotive', 'Travel', 'Education', 'Entertainment',
    'Health', 'Finance'
]


class ContentBasedModel:

    def __init__(self):
        self.categories = CATEGORIES

    def build_user_vector(self, interest_profile: dict) -> np.ndarray:
        """
        Convert user interest dict to a normalized numpy vector.

        Input:  { "Technology": 8.5, "Sports": 3.0, "Fashion": 1.0 }
        Output: [0.93, 0.33, 0.11, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]  (normalized)
        """
        vec = np.zeros(len(self.categories))
        for i, cat in enumerate(self.categories):
            vec[i] = float(interest_profile.get(cat, 0))

        # L2-normalize so magnitude doesn't dominate similarity
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def build_ad_vector(self, ad: dict) -> np.ndarray:
        """One-hot encode the ad's category."""
        vec = np.zeros(len(self.categories))
        cat = ad.get('category', '')
        if cat in self.categories:
            vec[self.categories.index(cat)] = 1.0
        return vec

    def jaccard_similarity(self, user_interests: dict, ad_keywords: list) -> float:
        """
        Jaccard similarity between user interest keys and ad keywords.
        Measures keyword overlap as a fraction of the union.
        """
        user_terms = set(k.lower() for k in user_interests.keys())
        ad_terms = set(k.lower() for k in (ad_keywords or []))
        if not user_terms or not ad_terms:
            return 0.0
        intersection = user_terms & ad_terms
        union = user_terms | ad_terms
        return len(intersection) / len(union)

    def score_ad(self, user_profile: dict, ad: dict) -> dict:
        """
        Score a single (user, ad) pair.
        Returns the score + a full breakdown for explainability.
        """
        user_vec = self.build_user_vector(user_profile)
        ad_vec = self.build_ad_vector(ad)

        # 1. Category match via cosine similarity
        cat_score = float(cosine_similarity(
            user_vec.reshape(1, -1),
            ad_vec.reshape(1, -1)
        )[0][0])

        # 2. Ad quality via CTR (capped at 0.5 to prevent domination)
        ctr = float(ad.get('ctr', 0) or 0)
        perf_score = min(ctr / 0.5, 1.0)

        # 3. Keyword overlap
        kw_score = self.jaccard_similarity(user_profile, ad.get('keywords', []))

        # Weighted ensemble
        final = cat_score * 0.50 + perf_score * 0.30 + kw_score * 0.20

        return {
            'adId': str(ad.get('_id', '')),
            'score': round(final, 4),
            'model': 'content_based',
            'breakdown': {
                'categoryScore': round(cat_score, 4),
                'performanceScore': round(perf_score, 4),
                'keywordScore': round(kw_score, 4),
                'userInterestInCategory': float(user_profile.get(ad.get('category', ''), 0)),
                'adCTR': round(ctr, 4),
            }
        }

    def recommend(self, user_profile: dict, ads: list, top_n: int = 3) -> list:
        """Score all ads and return top N sorted by score."""
        if not ads or not user_profile:
            # Cold start: return ads sorted by CTR alone
            sorted_ads = sorted(ads, key=lambda a: float(a.get('ctr', 0) or 0), reverse=True)
            return [
                {'adId': str(a.get('_id', '')), 'score': float(a.get('ctr', 0) or 0),
                 'model': 'content_based_cold_start', 'breakdown': {}}
                for a in sorted_ads[:top_n]
            ]

        scored = [self.score_ad(user_profile, ad) for ad in ads]
        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:top_n]
