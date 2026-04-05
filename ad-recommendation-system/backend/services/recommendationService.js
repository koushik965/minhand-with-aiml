const Ad = require('../models/Ad');

/**
 * RecommendationService
 * 
 * Core recommendation algorithm that scores ads against a user's interest profile.
 * 
 * Scoring formula:
 * score = (userInterestScore * CATEGORY_WEIGHT)
 *       + (adCTR * PERFORMANCE_WEIGHT)
 *       + (keywordSimilarity * KEYWORD_WEIGHT)
 * 
 * Weights are tunable constants for experimentation.
 */

const CATEGORY_WEIGHT = 5.0;    // Category match is the strongest signal
const PERFORMANCE_WEIGHT = 3.0; // CTR reflects real-world ad quality
const KEYWORD_WEIGHT = 2.0;     // Keyword overlap for fine-grained matching

/**
 * Compute Jaccard Similarity between two keyword arrays.
 * Jaccard = |A ∩ B| / |A ∪ B|
 * Returns a value between 0 (no overlap) and 1 (identical sets).
 */
const jaccardSimilarity = (setA, setB) => {
  if (!setA.length || !setB.length) return 0;

  const a = new Set(setA.map((k) => k.toLowerCase()));
  const b = new Set(setB.map((k) => k.toLowerCase()));

  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  return intersection.size / union.size;
};

/**
 * Normalize a score value to 0-1 range given a max possible value.
 */
const normalize = (value, max) => (max === 0 ? 0 : Math.min(value / max, 1));

/**
 * Main recommendation function.
 * 
 * @param {Map} interestProfile - User's interest map { "Technology": 8, "Sports": 3 }
 * @param {number} limit - Number of top ads to return (default 3)
 * @returns {Array} Sorted array of { ad, score, breakdown } objects
 */
const getRecommendations = async (interestProfile, limit = 3) => {
  // Fetch all active ads from DB
  const ads = await Ad.find({ isActive: true });

  if (!ads.length) return [];

  // Convert Map to plain object for easier access
  const interests =
    interestProfile instanceof Map
      ? Object.fromEntries(interestProfile)
      : interestProfile || {};

  // Find max interest score to normalize user scores
  const maxInterest = Math.max(...Object.values(interests), 1);

  // Extract all user interest keywords (category names as keywords)
  const userKeywords = Object.keys(interests);

  // Score each ad
  const scoredAds = ads.map((ad) => {
    // 1. Category match score: normalized user interest in this ad's category
    const rawInterest = interests[ad.category] || 0;
    const categoryScore = normalize(rawInterest, maxInterest) * CATEGORY_WEIGHT;

    // 2. Performance score: ad CTR (already 0-1 naturally, but cap at 0.5 for safety)
    const ctrCapped = Math.min(ad.ctr, 0.5);
    const performanceScore = (ctrCapped / 0.5) * PERFORMANCE_WEIGHT;

    // 3. Keyword similarity: Jaccard between user interest keywords and ad keywords
    const keywordScore = jaccardSimilarity(userKeywords, ad.keywords) * KEYWORD_WEIGHT;

    // Total weighted score
    const totalScore = categoryScore + performanceScore + keywordScore;

    return {
      ad,
      score: parseFloat(totalScore.toFixed(4)),
      breakdown: {
        categoryScore: parseFloat(categoryScore.toFixed(4)),
        performanceScore: parseFloat(performanceScore.toFixed(4)),
        keywordScore: parseFloat(keywordScore.toFixed(4)),
        userInterestInCategory: rawInterest,
        adCTR: ad.ctr,
      },
    };
  });

  // Sort descending by score and return top N
  return scoredAds
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

module.exports = { getRecommendations };
