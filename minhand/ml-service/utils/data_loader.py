"""
Data Loader
============
Fetches and preprocesses data from MongoDB for model training.
Handles all the messy edge cases of real-world data.
"""

from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime, timezone


def get_db():
    """Connect to MongoDB and return the database object."""
    uri = os.getenv('MONGODB_URI')
    if not uri:
        raise Exception("❌ MONGODB_URI is not set in environment variables")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db_name = uri.split('/')[-1] or 'minhand_db'
    return client[db_name]


def load_training_data(min_examples: int = 50) -> dict:
    """
    Load and label all interaction data for ML training.

    Returns:
      {
        'ctr_training': [ { user, ad, context, label } ],  # for XGBoost
        'interactions': [ raw interaction docs ],            # for collaborative filter
        'total': int,
        'positive': int,
        'negative': int,
      }
    """
    db = get_db()

    # Load all ad-related interactions
    raw_interactions = list(db.interactions.find(
        {'adId': {'$exists': True, '$ne': None}},
        sort=[('createdAt', -1)],
        limit=100_000
    ))

    if not raw_interactions:
        return {'ctr_training': [], 'interactions': [], 'total': 0, 'positive': 0, 'negative': 0}

    # Cache users and ads to avoid N+1 queries
    user_ids = list(set(ix['userId'] for ix in raw_interactions if 'userId' in ix))
    ad_ids = list(set(ix['adId'] for ix in raw_interactions if 'adId' in ix))

    users_map = {
        str(u['_id']): u
        for u in db.users.find({'_id': {'$in': user_ids}})
    }
    ads_map = {
        str(a['_id']): a
        for a in db.ads.find({'_id': {'$in': ad_ids}})
    }

    ctr_training = []
    positive = 0
    negative = 0

    for ix in raw_interactions:
        uid = str(ix.get('userId', ''))
        aid = str(ix.get('adId', ''))

        user = users_map.get(uid)
        ad = ads_map.get(aid)

        if not user or not ad:
            continue

        # Label: 1 if click/conversion, 0 if impression without click
        ix_type = str(ix.get('type', ''))
        if ix_type in ('ad_click', 'ad_conversion'):
            label = 1
            positive += 1
        elif ix_type == 'ad_impression':
            label = 0
            negative += 1
        else:
            continue  # skip non-ad interactions for CTR training

        # Reconstruct context from interaction metadata
        created_at = ix.get('createdAt', datetime.now(timezone.utc))
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except Exception:
                created_at = datetime.now(timezone.utc)

        context = {
            'timeOfDay': created_at.hour,
            'dayOfWeek': created_at.weekday(),
            'deviceType': ix.get('metadata', {}).get('deviceType', 'desktop'),
            'adPosition': ix.get('metadata', {}).get('adPosition', 1),
        }

        ctr_training.append({
            'user': user,
            'ad': ad,
            'context': context,
            'label': label,
        })

    print(f"📊 Training data loaded:")
    print(f"   Total labeled examples: {len(ctr_training)}")
    print(f"   Positive (clicks): {positive} ({positive/max(len(ctr_training),1):.1%})")
    print(f"   Negative (impressions): {negative}")

    return {
        'ctr_training': ctr_training,
        'interactions': raw_interactions,
        'total': len(ctr_training),
        'positive': positive,
        'negative': negative,
    }


def load_active_ads() -> list:
    """Load all active ads from MongoDB."""
    db = get_db()
    return list(db.ads.find({'isActive': True}))


def load_user(user_id: str) -> dict:
    """Load a single user by ID."""
    db = get_db()
    try:
        return db.users.find_one({'_id': ObjectId(user_id)}) or {}
    except Exception:
        return {}


def count_interactions() -> int:
    """Count total interactions for readiness check."""
    db = get_db()
    return db.interactions.count_documents({'adId': {'$exists': True, '$ne': None}})
