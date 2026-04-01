"""
Explainability Module
======================
Generates human-readable explanations for why an ad was recommended.
Used in the admin dashboard for transparency.
NEVER shown to regular users.
"""


def explain(user: dict, ad: dict, breakdown: dict) -> dict:
    """
    Build a transparency report for a single recommendation.

    Returns:
      {
        'adTitle': str,
        'reasons': [ str ],
        'confidence': int (0-100),
        'dominantModel': str,
      }
    """
    interests = dict(user.get('interestProfile', {}))
    ad_category = ad.get('category', '')

    reasons = []

    # 1. Interest match
    interest_score = interests.get(ad_category, 0)
    if interest_score >= 7:
        reasons.append(f"Strong interest in {ad_category} (score: {interest_score:.0f}/100)")
    elif interest_score >= 3:
        reasons.append(f"Moderate interest in {ad_category} (score: {interest_score:.0f}/100)")

    # 2. Keyword overlap
    kw_score = breakdown.get('keywordScore', 0) or breakdown.get('keywordOverlap', 0)
    if kw_score > 0.2:
        user_kws = list(interests.keys())[:3]
        reasons.append(f"Keyword match with your browsed topics: {', '.join(user_kws)}")

    # 3. CTR signal
    predicted_ctr = breakdown.get('predictedCTR', 0)
    if predicted_ctr > 0.10:
        reasons.append(f"High predicted engagement: {predicted_ctr:.0%} click probability")
    elif predicted_ctr > 0.05:
        reasons.append(f"Good predicted engagement: {predicted_ctr:.0%} click probability")

    # 4. Collaborative signal
    collab_score = breakdown.get('collaborativeScore', 0)
    if collab_score > 0.3:
        reasons.append("Users with similar browsing patterns also engaged with this ad")

    # 5. Trending / high performing
    content_score = breakdown.get('contentScore', 0)
    if not reasons and content_score > 0.3:
        reasons.append(f"Trending {ad_category} ad with strong performance metrics")

    # Default reason
    if not reasons:
        reasons.append(f"Relevant {ad_category} content based on your recent activity")

    # Determine dominant model
    weights = breakdown.get('modelWeights', {})
    if weights.get('collab', 0) > 0.2:
        dominant = 'Collaborative Filtering'
    elif breakdown.get('modelUsed') == 'ensemble':
        dominant = 'ML Ensemble (XGBoost + Content + Collaborative)'
    else:
        dominant = 'Content-Based Filtering'

    # Confidence = number of reasons × 25, capped at 95
    confidence = min(len(reasons) * 28, 95)

    return {
        'adTitle': ad.get('title', ''),
        'adCategory': ad_category,
        'reasons': reasons,
        'confidence': confidence,
        'dominantModel': dominant,
        'featureBreakdown': breakdown,
        'userInterestScore': round(interest_score, 1),
    }
