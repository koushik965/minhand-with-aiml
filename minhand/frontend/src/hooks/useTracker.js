import { useCallback, useRef } from 'react';
import { interactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const useTracker = () => {
  const { user } = useAuth();
  const dwellStart = useRef(null);

  const track = useCallback(async (data) => {
    if (!user) return;
    try { await interactionAPI.log(data); } catch (_) {}
  }, [user]);

  const trackPageVisit = useCallback((page, category = null) => track({ type: 'page_visit', page, category }), [track]);
  const trackCategory = useCallback((category, page) => track({ type: 'category_browse', category, page }), [track]);
  const trackAdImpression = useCallback((adId, category) => track({ type: 'ad_impression', adId, category }), [track]);
  const trackAdClick = useCallback((adId, category) => track({ type: 'ad_click', adId, category }), [track]);
  const trackSearch = useCallback((query, category) => track({ type: 'search', metadata: { query }, category }), [track]);

  const startDwell = useCallback(() => { dwellStart.current = Date.now(); }, []);
  const endDwell = useCallback((page, category = null) => {
    if (!dwellStart.current) return;
    const seconds = Math.floor((Date.now() - dwellStart.current) / 1000);
    if (seconds > 3) track({ type: 'dwell_time', page, category, dwellTime: seconds });
    dwellStart.current = null;
  }, [track]);

  return { trackPageVisit, trackCategory, trackAdImpression, trackAdClick, trackSearch, startDwell, endDwell };
};

export default useTracker;
