import { useCallback, useRef } from 'react';
import { interactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * useInteractionTracker
 * Custom hook that provides fire-and-forget interaction logging helpers.
 * All methods are safe to call without awaiting — errors are silently caught.
 */
const useInteractionTracker = () => {
  const { user } = useAuth();
  const dwellStartRef = useRef(null);

  // Only track when user is logged in
  const track = useCallback(
    async (data) => {
      if (!user) return;
      try {
        await interactionAPI.logInteraction(data);
      } catch (_) {
        // Non-critical: never let tracking errors break the UI
      }
    },
    [user]
  );

  const trackPageVisit = useCallback(
    (page, category = null) => {
      track({ type: 'page_visit', page, category });
    },
    [track]
  );

  const trackCategoryBrowse = useCallback(
    (category, page = null) => {
      track({ type: 'category_browse', category, page });
    },
    [track]
  );

  const trackAdImpression = useCallback(
    (adId, category) => {
      track({ type: 'ad_impression', adId, category });
    },
    [track]
  );

  const trackAdClick = useCallback(
    (adId, category) => {
      track({ type: 'ad_click', adId, category });
    },
    [track]
  );

  /** Call on page mount to start dwell timer */
  const startDwellTimer = useCallback(() => {
    dwellStartRef.current = Date.now();
  }, []);

  /** Call on page unmount to record time spent */
  const endDwellTimer = useCallback(
    (page, category = null) => {
      if (!dwellStartRef.current) return;
      const dwellTime = Math.floor((Date.now() - dwellStartRef.current) / 1000);
      if (dwellTime > 2) {
        // Only log if user spent more than 2 seconds
        track({ type: 'dwell_time', page, category, dwellTime });
      }
      dwellStartRef.current = null;
    },
    [track]
  );

  return {
    trackPageVisit,
    trackCategoryBrowse,
    trackAdImpression,
    trackAdClick,
    startDwellTimer,
    endDwellTimer,
  };
};

export default useInteractionTracker;
