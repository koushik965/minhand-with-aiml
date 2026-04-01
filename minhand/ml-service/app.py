"""
MinHand ML Service
===================
Flask REST API that serves AI/ML recommendations to the Node.js backend.

Endpoints:
  GET  /health              — status of all three models
  POST /recommend           — get top N recommendations for a user
  POST /train               — retrain models on latest data
  GET  /explain/<ad_id>     — explain why an ad was recommended
  GET  /model-stats         — detailed model performance metrics

Run with:
  python app.py

Or in production:
  gunicorn app:app --bind 0.0.0.0:8000 --workers 2
"""

import os
import sys
import traceback

# Add parent directory to path so models/ and utils/ can be imported
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from models.ensemble import EnsembleRecommender
from utils.data_loader import load_training_data, load_active_ads, load_user, count_interactions
from utils.explainer import explain

# ── Initialise app and models ────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:5000'])

print("\n🚀 Initialising MinHand ML Service...")
recommender = EnsembleRecommender()
print("✅ All models initialised\n")


# ── Health check ─────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """Returns status of all three ML models."""
    try:
        interaction_count = count_interactions()
        status = recommender.get_model_status()
        return jsonify({
            'status': 'ok',
            'service': 'MinHand ML Service',
            'models': status,
            'data': {
                'totalInteractions': interaction_count,
                'sufficientForTraining': interaction_count >= 50,
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ── Main recommendation endpoint ─────────────────────────────────────────────

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Get top N ad recommendations for a user.

    Request body:
      {
        "userId": "...",
        "context": {
          "timeOfDay": 14,
          "dayOfWeek": 2,
          "deviceType": "mobile",
          "adPosition": 1,
          "page": "/home"
        },
        "topN": 3
      }

    Response:
      {
        "recommendations": [
          {
            "adId": "...",
            "ensembleScore": 0.742,
            "reason": "Matches your interest in Technology",
            "breakdown": { ... }
          }
        ]
      }
    """
    try:
        data = request.get_json(force=True)
        user_id = data.get('userId', '')
        context = data.get('context', {})
        top_n = int(data.get('topN', 3))

        if not user_id:
            return jsonify({'error': 'userId is required'}), 400

        # Load user and active ads from MongoDB
        user = load_user(user_id)
        if not user:
            return jsonify({'error': 'User not found', 'recommendations': []}), 404

        ads = load_active_ads()
        if not ads:
            return jsonify({'recommendations': [], 'message': 'No active ads available'})

        # Run ensemble recommender
        results = recommender.recommend(user, ads, context, top_n=top_n)

        # Format response — strip MongoDB objects, keep only serialisable data
        recommendations = []
        for r in results:
            recommendations.append({
                'adId': r['adId'],
                'ensembleScore': r['ensembleScore'],
                'reason': r['reason'],
                'modelWeights': r['modelWeights'],
                'breakdown': r['breakdown'],
            })

        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'userId': user_id,
            'modelStatus': {
                'ctrModelTrained': recommender.ctr_model.is_trained,
                'collaborativeFitted': recommender.collab_model.is_fitted,
            }
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'recommendations': []}), 500


# ── Train endpoint ────────────────────────────────────────────────────────────

@app.route('/train', methods=['POST'])
def train():
    """
    Trigger model retraining on the latest interaction data.

    Called by:
      - Node.js nightly cron job at 2am
      - Admin dashboard manually

    Requires at least 50 labeled interaction examples.
    """
    try:
        print("\n🔄 Training triggered...")

        # Load all interaction data from MongoDB
        dataset = load_training_data(min_examples=50)

        if dataset['total'] < 50:
            return jsonify({
                'success': False,
                'message': f"Not enough data to train. Have {dataset['total']} examples, need 50+.",
                'hint': 'Keep using the platform — the model will train automatically once enough clicks are recorded.',
            }), 400

        results = {}

        # 1. Train XGBoost CTR model
        print("\n--- Training XGBoost CTR Model ---")
        ctr_result = recommender.ctr_model.train(dataset['ctr_training'])
        results['ctr_model'] = ctr_result

        # 2. Fit collaborative filter
        print("\n--- Fitting Collaborative Filter ---")
        recommender.collab_model.fit(dataset['interactions'])
        results['collaborative'] = {
            'users': len(recommender.collab_model.user_ids),
            'ads': len(recommender.collab_model.ad_ids),
            'fitted': recommender.collab_model.is_fitted,
        }

        print("\n🎉 Training complete!")

        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'results': results,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ── Explain endpoint ──────────────────────────────────────────────────────────

@app.route('/explain/<ad_id>', methods=['GET'])
def explain_recommendation(ad_id):
    """
    Explain why a specific ad was recommended to a user.
    Used in the admin dashboard for transparency.
    NEVER called from the user-facing frontend.

    Query params: ?userId=...
    """
    try:
        user_id = request.args.get('userId', '')
        if not user_id:
            return jsonify({'error': 'userId query param required'}), 400

        from bson import ObjectId
        from utils.data_loader import get_db
        db = get_db()

        user = load_user(user_id)
        try:
            ad = db.ads.find_one({'_id': ObjectId(ad_id)})
        except Exception:
            return jsonify({'error': 'Invalid ad ID'}), 400

        if not user or not ad:
            return jsonify({'error': 'User or ad not found'}), 404

        # Get scores for this specific ad
        context = {
            'timeOfDay': int(request.args.get('timeOfDay', 14)),
            'dayOfWeek': int(request.args.get('dayOfWeek', 2)),
            'deviceType': request.args.get('deviceType', 'desktop'),
            'adPosition': int(request.args.get('position', 1)),
        }

        content_score = recommender.content_model.score_ad(
            dict(user.get('interestProfile', {})), ad
        )
        predicted_ctr = recommender.ctr_model.predict(user, ad, context)
        collab_recs = recommender.collab_model.recommend(str(user['_id']), top_n=20)
        collab_score = next((r['collaborativeScore'] for r in collab_recs if r['adId'] == str(ad['_id'])), 0.0)

        breakdown = {
            **content_score.get('breakdown', {}),
            'predictedCTR': predicted_ctr,
            'collaborativeScore': collab_score,
            'modelWeights': recommender._get_weights(int(user.get('totalInteractions', 0))),
            'modelUsed': 'ensemble' if recommender.ctr_model.is_trained else 'content_only',
        }

        explanation = explain(user, ad, breakdown)
        return jsonify({'success': True, 'explanation': explanation})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ── Model stats endpoint ──────────────────────────────────────────────────────

@app.route('/model-stats', methods=['GET'])
def model_stats():
    """Detailed model performance metrics for the admin dashboard."""
    try:
        status = recommender.get_model_status()
        interaction_count = count_interactions()

        return jsonify({
            'success': True,
            'models': status,
            'data': {
                'totalInteractions': interaction_count,
                'sufficientForTraining': interaction_count >= 50,
                'recommendedNextStep': (
                    'Models are trained and running optimally' if recommender.ctr_model.is_trained
                    else f'Collect {max(50 - interaction_count, 0)} more ad interactions to enable XGBoost training'
                )
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 8000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    print(f"\n⚡ MinHand ML Service running on port {port}")
    print(f"📡 http://localhost:{port}/health\n")
    app.run(host='0.0.0.0', port=port, debug=debug)
