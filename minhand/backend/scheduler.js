/**
 * Scheduler
 * ==========
 * Runs background jobs without any external cron dependency.
 * Uses Node.js setInterval for simplicity.
 *
 * Jobs:
 *   - Nightly at 2:00am: retrain ML models on latest interaction data
 *   - Every hour:        apply interest score decay for inactive users
 */

const { triggerRetraining } = require('./services/mlService');
const User = require('./models/User');

const DECAY_FACTOR = 0.995; // lose 0.5% per hour ≈ 70% decay over 30 days

/**
 * Start all background jobs.
 * Call once from server.js after DB connects.
 */
const startScheduler = () => {
  console.log('⏰ Background scheduler started');

  // ── Nightly retraining at 2am ─────────────────────────────────
  const scheduleNightly = () => {
    const now = new Date();
    const next2am = new Date();
    next2am.setHours(2, 0, 0, 0);
    if (next2am <= now) next2am.setDate(next2am.getDate() + 1);

    const msUntil2am = next2am - now;
    console.log(`⏳ Next ML retraining in ${Math.round(msUntil2am / 3600000)}h`);

    setTimeout(async () => {
      try {
        await triggerRetraining();
      } catch (err) {
        console.error('Retraining error:', err.message);
      }
      // Schedule next run in 24 hours
      setInterval(async () => {
        try { await triggerRetraining(); } catch (err) { console.error(err.message); }
      }, 24 * 60 * 60 * 1000);
    }, msUntil2am);
  };

  // ── Hourly interest decay ────────────────────────────────────
  const runDecay = async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const users = await User.find({
        role: 'user',
        lastActive: { $lt: cutoff },
        'interestProfile': { $exists: true },
      }).limit(500); // process in batches

      let decayed = 0;
      for (const user of users) {
        let changed = false;
        user.interestProfile.forEach((score, category) => {
          const newScore = score * DECAY_FACTOR;
          if (newScore < 0.1) {
            user.interestProfile.delete(category);
          } else {
            user.interestProfile.set(category, parseFloat(newScore.toFixed(2)));
          }
          changed = true;
        });
        if (changed) {
          await user.save();
          decayed++;
        }
      }

      if (decayed > 0) {
        console.log(`📉 Interest decay applied to ${decayed} inactive users`);
      }
    } catch (err) {
      console.error('Decay job error:', err.message);
    }
  };

  scheduleNightly();
  setInterval(runDecay, 60 * 60 * 1000); // every hour
};

module.exports = { startScheduler };
