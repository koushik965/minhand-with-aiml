/**
 * ML Service Connector
 * =====================
 * Connects the Node.js backend to the Python ML Flask service.
 *
 * All calls use a 2-second timeout and fall back gracefully to the
 * rule-based scoring algorithm if the ML service is unavailable.
 * This ensures the app never breaks even if Python is not running.
 */

const http = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 2000; // 2 seconds — never slow down the user

/**
 * Make a JSON HTTP request to the ML service.
 * Returns null on any error (timeout, service down, etc.)
 */
const mlRequest = (method, path, body = null) => {
  return new Promise((resolve) => {
    const url = new URL(ML_SERVICE_URL + path);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: TIMEOUT_MS,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));

    if (payload) req.write(payload);
    req.end();
  });
};

/**
 * Get ML-powered recommendations for a user.
 *
 * @param {string} userId   - MongoDB user ID
 * @param {object} context  - { timeOfDay, dayOfWeek, deviceType, adPosition, page }
 * @param {number} topN     - number of recommendations to return
 * @returns {Array|null}    - array of { adId, ensembleScore, reason, breakdown }
 *                           or null if ML service is unavailable
 */
const getMLRecommendations = async (userId, context, topN = 3) => {
  try {
    const result = await mlRequest('POST', '/recommend', { userId, context, topN });
    if (result && result.success && Array.isArray(result.recommendations)) {
      return result.recommendations;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Trigger nightly model retraining.
 * Called by the cron scheduler — result is logged but not awaited.
 */
const triggerRetraining = async () => {
  console.log('🤖 Triggering ML model retraining...');
  const result = await mlRequest('POST', '/train');
  if (result?.success) {
    console.log('✅ ML models retrained successfully');
    if (result.results?.ctr_model?.auc) {
      console.log(`   XGBoost AUC: ${result.results.ctr_model.auc}`);
    }
  } else {
    console.log('⚠️  ML retraining result:', result?.message || 'No response');
  }
  return result;
};

/**
 * Get explanation for why an ad was recommended.
 * Used in admin dashboard — never sent to users.
 */
const explainRecommendation = async (adId, userId, context = {}) => {
  const params = new URLSearchParams({ userId, ...context }).toString();
  return await mlRequest('GET', `/explain/${adId}?${params}`);
};

/**
 * Get model performance stats for the admin dashboard.
 */
const getModelStats = async () => {
  return await mlRequest('GET', '/model-stats');
};

/**
 * Health check — is the ML service running?
 */
const checkMLHealth = async () => {
  const result = await mlRequest('GET', '/health');
  return result?.status === 'ok';
};

module.exports = {
  getMLRecommendations,
  triggerRetraining,
  explainRecommendation,
  getModelStats,
  checkMLHealth,
};
