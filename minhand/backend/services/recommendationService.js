const Ad = require('../models/Ad');

const CATEGORY_WEIGHT = 5.0;
const PERFORMANCE_WEIGHT = 3.0;
const KEYWORD_WEIGHT = 2.0;

const jaccardSimilarity = (setA, setB) => {
  if (!setA.length || !setB.length) return 0;
  const a = new Set(setA.map(k => k.toLowerCase()));
  const b = new Set(setB.map(k => k.toLowerCase()));
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
};

const getRecommendations = async (interestProfile, limit = 3) => {
  const ads = await Ad.find({ isActive: true });
  if (!ads.length) return [];
  const interests = interestProfile instanceof Map ? Object.fromEntries(interestProfile) : (interestProfile || {});
  const maxInterest = Math.max(...Object.values(interests), 1);
  const userKeywords = Object.keys(interests);

  const scored = ads.map(ad => {
    const rawInterest = interests[ad.category] || 0;
    const categoryScore = (rawInterest / maxInterest) * CATEGORY_WEIGHT;
    const ctrCapped = Math.min(ad.ctr, 0.5);
    const performanceScore = (ctrCapped / 0.5) * PERFORMANCE_WEIGHT;
    const keywordScore = jaccardSimilarity(userKeywords, ad.keywords) * KEYWORD_WEIGHT;
    const totalScore = categoryScore + performanceScore + keywordScore;
    return { ad, score: parseFloat(totalScore.toFixed(4)) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};

module.exports = { getRecommendations };
