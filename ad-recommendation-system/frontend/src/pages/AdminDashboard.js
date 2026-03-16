import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../services/api';
import {
  CTRBarChart,
  ImpressionsClicksChart,
  CategoryDoughnut,
  InteractionTypeChart,
  UserGrowthChart,
  TopKeywordsChart,
} from '../components/admin/AnalyticsCharts';
import AddAdForm from '../components/admin/AddAdForm';
import AddProductForm from '../components/admin/AddProductForm';

/**
 * AdminDashboard
 * ALL data on this page is analytics — never accessible to normal users.
 * This component is wrapped in <AdminRoute> in App.js (frontend guard).
 * Every API call here hits /api/admin/* which requires role=admin (backend guard).
 * Double protection: frontend redirect + backend 403.
 */
const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [searchStats, setSearchStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [aRes, pRes, uRes, sRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getProductStats(),
        adminAPI.getUserStats(),
        adminAPI.getSearchStats(),
      ]);
      setAnalytics(aRes.data.data);
      setProductStats(pRes.data.data);
      setUserStats(uRes.data.data);
      setSearchStats(sRes.data.data);
    } catch (err) {
      // 403 is handled by the AdminRoute guard — this catches network errors etc.
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tabs = [
    { id: 'overview',  label: '📊 Overview' },
    { id: 'products',  label: '📦 Products' },
    { id: 'ads',       label: '📢 Ads' },
    { id: 'users',     label: '👥 Users' },
    { id: 'search',    label: '🔍 Search' },
    { id: 'add-product', label: '➕ Add Product' },
    { id: 'add-ad',    label: '➕ Add Ad' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="spinner-wrapper" style={{ minHeight: '60vh' }}>
            <div>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading analytics…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>
            🔐 Admin Only
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="section-title">Analytics Dashboard</h1>
              <p className="section-subtitle">Platform-wide insights — visible only to administrators.</p>
            </div>
            <button className="btn btn-outline" onClick={() => fetchAll(true)} disabled={refreshing}>
              {refreshing ? '⏳ Refreshing…' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'none', border: 'none', padding: '10px 18px',
              color: activeTab === tab.id ? 'var(--accent-light)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '0.88rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', transition: 'all var(--transition)',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ───────────────────────────────────────────── */}
        {activeTab === 'overview' && analytics && userStats && (
          <div>
            {/* KPI grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', marginBottom: 32 }}>
              {[
                { label: 'Total Users',      value: userStats.totalUsers,                  icon: '👥' },
                { label: 'Active Today',     value: userStats.activeToday,                 icon: '🟢' },
                { label: 'Total Products',   value: analytics.overview.totalProducts,      icon: '📦' },
                { label: 'Active Ads',       value: analytics.overview.totalAds,           icon: '📢' },
                { label: 'Total Impressions',value: analytics.overview.totalImpressions?.toLocaleString(), icon: '👁️' },
                { label: 'Total Clicks',     value: analytics.overview.totalClicks?.toLocaleString(),      icon: '🖱️' },
                { label: 'Overall CTR',      value: `${(analytics.overview.overallCTR * 100).toFixed(2)}%`, icon: '📈' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="stat-card fade-in-up">
                  <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24, marginBottom: 32 }}>
              <CTRBarChart adPerformance={analytics.adPerformance} />
              <CategoryDoughnut categoryStats={analytics.categoryStats} />
            </div>

            {/* Interest distribution */}
            {userStats.interestDistribution?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
                  🧠 Interest Distribution Across All Users
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {userStats.interestDistribution.slice(0, 8).map(({ category, totalScore }) => {
                    const max = userStats.interestDistribution[0]?.totalScore || 1;
                    return (
                      <div key={category} className="score-bar-wrapper">
                        <div className="score-bar-label">
                          <span>{category}</span>
                          <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{totalScore}</span>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${(totalScore / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Products ────────────────────────────────────────────── */}
        {activeTab === 'products' && productStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Most Viewed */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>👁️ Most Viewed Products</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Product', 'Category', 'Views', 'Searches', 'Wishlisted', 'Compared'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productStats.mostViewed.map((p, i) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={p.image} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                              onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100'; }} />
                            <span style={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}><span className="badge badge-accent">{p.category}</span></td>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-light)' }}>{p.viewCount?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.searchCount?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.wishlistCount?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.compareCount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Searched */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>🔍 Most Searched Products</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {productStats.mostSearched.map((p, i) => (
                  <div key={p._id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 700 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name.substring(0, 28)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.searchCount} searches</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Ads ─────────────────────────────────────────────────── */}
        {activeTab === 'ads' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24 }}>
              <ImpressionsClicksChart adPerformance={analytics.adPerformance} />
              <InteractionTypeChart interactionStats={analytics.interactionStats} />
            </div>

            {/* Ad performance table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
                📊 Ad Performance — CTR per Ad
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Ad Title', 'Category', 'Budget', 'Impressions', 'Clicks', 'CTR'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.adPerformance.map((ad, idx) => (
                      <tr key={ad.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', width: 40 }}>{idx + 1}</td>
                        <td style={{ padding: '12px', fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</td>
                        <td style={{ padding: '12px' }}><span className="badge badge-accent">{ad.category}</span></td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>₹{ad.budget?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{ad.impressions?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{ad.clicks?.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${ad.ctr > 0.08 ? 'badge-green' : ad.ctr > 0.04 ? 'badge-accent' : 'badge-pink'}`}>
                            {(ad.ctr * 100).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category stats */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>🗂️ Ad Performance by Category</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Category', 'Ads', 'Impressions', 'Clicks', 'CTR'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.categoryStats.map(cat => (
                      <tr key={cat._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{cat._id}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{cat.adCount}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{cat.totalImpressions?.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{cat.totalClicks?.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge badge-accent">
                            {cat.totalImpressions > 0 ? ((cat.totalClicks / cat.totalImpressions) * 100).toFixed(2) : '0.00'}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Users ───────────────────────────────────────────────── */}
        {activeTab === 'users' && userStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24 }}>
              <UserGrowthChart userGrowth={userStats.userGrowth} />

              {/* Interest distribution chart */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
                  🧠 Interest Distribution
                </h3>
                {userStats.interestDistribution.map(({ category, totalScore }) => {
                  const max = userStats.interestDistribution[0]?.totalScore || 1;
                  return (
                    <div key={category} className="score-bar-wrapper" style={{ marginBottom: 12 }}>
                      <div className="score-bar-label">
                        <span>{category}</span>
                        <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{totalScore}</span>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${(totalScore / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top users table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>🏆 Most Active Users</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Username', 'Total Interactions', 'Last Active', 'Member Since'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.topUsers.map((u, i) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{u.username}</td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge badge-accent">{u.totalInteractions}</span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(u.lastActive).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Search ──────────────────────────────────────────────── */}
        {activeTab === 'search' && searchStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Searches', value: searchStats.totalSearches?.toLocaleString(), icon: '🔍' },
                { label: 'Unique Keywords', value: searchStats.topKeywords?.length, icon: '🔤' },
                { label: 'Zero-Result Searches', value: searchStats.zeroResultSearches?.length, icon: '❌' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="stat-card">
                  <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24 }}>
              <TopKeywordsChart topKeywords={searchStats.topKeywords} />

              {/* Zero-result searches */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>❌ Zero-Result Searches</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Queries with no matching products — add products to fill gaps.</p>
                {searchStats.zeroResultSearches?.length === 0 ? (
                  <p style={{ color: 'var(--accent-3)', fontSize: '0.9rem' }}>✅ All searches returned results!</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {searchStats.zeroResultSearches.map(({ _id, count }) => (
                      <div key={_id} style={{ background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.3)', borderRadius: '50px', padding: '4px 12px', fontSize: '0.82rem', color: '#ff8fa5' }}>
                        "{_id}" <span style={{ fontWeight: 700 }}>×{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent searches */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>🕐 Recent Search Activity</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {searchStats.recentSearches?.slice(0, 30).map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50px', padding: '5px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔍 {s.query}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.resultsCount} results</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Add Product ─────────────────────────────────────────── */}
        {activeTab === 'add-product' && (
          <AddProductForm onSuccess={() => { fetchAll(true); setActiveTab('products'); }} />
        )}

        {/* ── Tab: Add Ad ──────────────────────────────────────────────── */}
        {activeTab === 'add-ad' && (
          <AddAdForm onSuccess={() => { fetchAll(true); setActiveTab('ads'); }} />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
