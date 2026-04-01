import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI, mlAdminAPI } from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#9a95a8', font: { family: 'Plus Jakarta Sans', size: 11 } } } },
  scales: {
    x: { ticks: { color: '#5a5670', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#5a5670', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const PALETTE = ['#d4af37','#f0d060','#4ade80','#60a5fa','#f87171','#a78bfa','#fb923c','#34d399','#f472b6','#38bdf8'];

const ChartCard = ({ title, children }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 20 }}>{title}</h3>
    {children}
  </div>
);

const TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'ml',        label: '🤖 AI/ML Engine' },
  { id: 'ads',       label: '📢 Ad Performance' },
  { id: 'products',  label: '📦 Products' },
  { id: 'users',     label: '👥 Users' },
  { id: 'add',       label: '➕ Create' },
];

const CATS = ['Technology','Sports','Fashion','Food','Automotive','Travel','Education','Entertainment','Health','Finance'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [mlHealth, setMlHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainMsg, setTrainMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [addType, setAddType] = useState('product');
  const [form, setForm] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await adminAPI.getAnalytics(); setData(r.data.data); }
    catch (e) { setError(e.response?.data?.message || 'Failed to load analytics.'); }
    finally { setLoading(false); }
  }, []);

  const fetchMLStats = useCallback(async () => {
    setMlLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        mlAdminAPI.getStats().catch(() => null),
        mlAdminAPI.getHealth().catch(() => null),
      ]);
      setMlStats(statsRes?.data || null);
      setMlHealth(healthRes?.data || null);
    } catch (_) {}
    finally { setMlLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); fetchMLStats(); }, [fetchAnalytics, fetchMLStats]);

  const handleTrain = async () => {
    setTrainLoading(true); setTrainMsg('');
    try {
      const res = await mlAdminAPI.trainNow();
      if (res.data?.success) {
        const auc = res.data?.results?.ctr_model?.auc;
        setTrainMsg(`✅ Models retrained successfully!${auc ? ` XGBoost AUC: ${auc}` : ''}`);
        fetchMLStats();
      } else {
        setTrainMsg(`⚠️ ${res.data?.message || 'Training failed.'}`);
      }
    } catch (err) {
      setTrainMsg(`❌ ${err.response?.data?.message || 'ML service unavailable. Make sure Python is running.'}`);
    } finally { setTrainLoading(false); }
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setFormLoading(true); setFormMsg('');
    try {
      const payload = { ...form };
      if (payload.keywords) payload.keywords = payload.keywords.split(',').map(k => k.trim()).filter(Boolean);
      if (payload.price) payload.price = parseFloat(payload.price);
      if (payload.originalPrice) payload.originalPrice = parseFloat(payload.originalPrice);
      if (payload.budget) payload.budget = parseFloat(payload.budget);
      if (addType === 'product') await adminAPI.createProduct(payload);
      else await adminAPI.createAd(payload);
      setFormMsg(`✅ ${addType === 'product' ? 'Product' : 'Ad'} created!`);
      setForm({});
      fetchAnalytics();
    } catch (err) { setFormMsg(`❌ ${err.response?.data?.message || 'Failed.'}`); }
    finally { setFormLoading(false); }
  };

  if (loading) return (
    <div className="page"><div className="spinner-wrap" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading analytics…</p>
    </div></div>
  );

  const ov = data?.overview || {};

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow fade-up">🔐 Admin Only</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="section-title fade-up-1">Analytics Dashboard</h1>
              <p className="section-sub fade-up-2">Platform-wide insights — visible only to administrators</p>
            </div>
            <button className="btn btn-outline btn-sm fade-up-2" onClick={() => { fetchAnalytics(); fetchMLStats(); }}>🔄 Refresh</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 36, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer',
              color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '0.88rem',
              fontWeight: tab === t.id ? 700 : 400,
              borderBottom: `2px solid ${tab === t.id ? 'var(--gold)' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.24s', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && data && (
          <div>
            <div className="grid-stats">
              {[
                { icon: '👥', label: 'Total Users',      val: ov.totalUsers },
                { icon: '📦', label: 'Products',         val: ov.totalProducts },
                { icon: '📢', label: 'Active Ads',       val: ov.totalAds },
                { icon: '👁️', label: 'Impressions',      val: ov.totalImpressions?.toLocaleString() },
                { icon: '🖱️', label: 'Total Clicks',     val: ov.totalClicks?.toLocaleString() },
                { icon: '📈', label: 'Overall CTR',      val: `${((ov.overallCTR || 0) * 100).toFixed(2)}%` },
                { icon: '🤖', label: 'ML Model',         val: mlHealth?.online ? '✅ Online' : '⚠️ Offline' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="stat-card fade-up">
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-value" style={{ fontSize: label === 'ML Model' ? '1.1rem' : undefined }}>{val ?? '—'}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24, marginBottom: 28 }}>
              <ChartCard title="📊 CTR by Advertisement">
                <Bar data={{
                  labels: data.adPerformance?.slice(0,8).map(a => a.title.substring(0,16) + '…'),
                  datasets: [{ label: 'CTR (%)', data: data.adPerformance?.slice(0,8).map(a => (a.ctr * 100).toFixed(2)), backgroundColor: 'rgba(212,175,55,0.7)', borderColor: '#d4af37', borderWidth: 1, borderRadius: 6 }]
                }} options={CHART_OPTS} />
              </ChartCard>
              <ChartCard title="🍩 Impressions by Category">
                <div style={{ maxWidth: 280, margin: '0 auto' }}>
                  <Doughnut data={{
                    labels: data.categoryStats?.map(c => c._id),
                    datasets: [{ data: data.categoryStats?.map(c => c.totalImpressions), backgroundColor: PALETTE.map(c => c + 'cc'), borderColor: PALETTE, borderWidth: 2 }]
                  }} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#9a95a8', padding: 10, font: { family: 'Plus Jakarta Sans', size: 11 } } } } }} />
                </div>
              </ChartCard>
            </div>

            {data.interestDistribution?.length > 0 && (
              <ChartCard title="🧠 User Interest Distribution">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {data.interestDistribution.slice(0, 8).map(({ category, totalScore }) => {
                    const max = data.interestDistribution[0]?.totalScore || 1;
                    return (
                      <div key={category} className="progress-wrap">
                        <div className="progress-header"><span>{category}</span><span>{totalScore.toFixed(0)}</span></div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${(totalScore / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {/* ── ML ENGINE TAB ────────────────────────────────────── */}
        {tab === 'ml' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ML Service Status Banner */}
            <div style={{
              background: mlHealth?.online ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${mlHealth?.online ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
              borderRadius: 'var(--radius-md)', padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '2rem' }}>{mlHealth?.online ? '🟢' : '🔴'}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: mlHealth?.online ? 'var(--success)' : 'var(--danger)' }}>
                    Python ML Service — {mlHealth?.online ? 'Online & Ready' : 'Offline'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {mlHealth?.online
                      ? `Running at ${mlHealth.url || 'http://localhost:8000'}`
                      : 'Start the ML service: cd ml-service && python app.py'}
                  </div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={fetchMLStats} disabled={mlLoading}>
                {mlLoading ? 'Checking…' : '🔄 Recheck'}
              </button>
            </div>

            {/* Three Model Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {/* Content-Based */}
              <div className="stat-card" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #d4af37, transparent)', opacity: 1 }} />
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📐</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Content-Based Filter</div>
                <div className="badge badge-green" style={{ marginBottom: 12 }}>✓ Always Active</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Matches user interest vectors to ad category vectors using cosine similarity. No training required — works from day one.
                </p>
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Algorithm:</strong> Cosine Similarity + Jaccard Keywords
                </div>
              </div>

              {/* XGBoost CTR */}
              <div className="stat-card" style={{ borderColor: mlStats?.models?.ctr_predictor?.status === 'trained' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.2)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${mlStats?.models?.ctr_predictor?.status === 'trained' ? '#4ade80' : '#f87171'}, transparent)`, opacity: 1 }} />
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧠</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>XGBoost CTR Predictor</div>
                <div className={`badge ${mlStats?.models?.ctr_predictor?.status === 'trained' ? 'badge-green' : 'badge-red'}`} style={{ marginBottom: 12 }}>
                  {mlStats?.models?.ctr_predictor?.status === 'trained' ? '✓ Trained' : '⚠ Needs Training'}
                </div>
                {mlStats?.models?.ctr_predictor?.metadata?.auc > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      ['AUC Score', (mlStats.models.ctr_predictor.metadata.auc * 100).toFixed(1) + '%'],
                      ['Trained On', (mlStats.models.ctr_predictor.metadata.training_examples || 0).toLocaleString() + ' samples'],
                      ['Log Loss', mlStats.models.ctr_predictor.metadata.log_loss?.toFixed(4) || '—'],
                      ['Trained At', mlStats.models.ctr_predictor.metadata.trained_at ? new Date(mlStats.models.ctr_predictor.metadata.trained_at).toLocaleDateString() : '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 10px', background: 'var(--elevated)', borderRadius: 6 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold-light)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Predicts P(click) for every user-ad pair using 16 behavioral features. Trained on real click data.
                </p>
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Algorithm:</strong> XGBoost Binary Classifier (16 features)
                </div>
              </div>

              {/* Collaborative Filter */}
              <div className="stat-card" style={{ borderColor: mlStats?.models?.collaborative_filter?.status === 'fitted' ? 'rgba(96,165,250,0.3)' : 'rgba(248,113,113,0.2)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${mlStats?.models?.collaborative_filter?.status === 'fitted' ? '#60a5fa' : '#f87171'}, transparent)`, opacity: 1 }} />
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🕸️</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Collaborative Filter</div>
                <div className={`badge ${mlStats?.models?.collaborative_filter?.status === 'fitted' ? 'badge-blue' : 'badge-red'}`} style={{ marginBottom: 12 }}>
                  {mlStats?.models?.collaborative_filter?.status === 'fitted' ? '✓ Fitted' : '⚠ Needs More Users'}
                </div>
                {mlStats?.models?.collaborative_filter?.users > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      ['Users Indexed', mlStats.models.collaborative_filter.users],
                      ['Ads Indexed', mlStats.models.collaborative_filter.ads],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 10px', background: 'var(--elevated)', borderRadius: 6 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--info)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  "Users who clicked similar ads also liked these." Improves as more users interact with the platform.
                </p>
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Algorithm:</strong> User-User Cosine Similarity (Sparse Matrix)
                </div>
              </div>
            </div>

            {/* Feature importance chart */}
            {mlStats?.models?.ctr_predictor?.metadata?.feature_importance && Object.keys(mlStats.models.ctr_predictor.metadata.feature_importance).length > 0 && (
              <ChartCard title="🔬 XGBoost Feature Importance — What drives click predictions">
                {(() => {
                  const fi = mlStats.models.ctr_predictor.metadata.feature_importance;
                  const sorted = Object.entries(fi).sort((a, b) => b[1] - a[1]).slice(0, 10);
                  return (
                    <Bar data={{
                      labels: sorted.map(([k]) => k.replace(/_/g, ' ')),
                      datasets: [{
                        label: 'Importance',
                        data: sorted.map(([, v]) => v.toFixed(4)),
                        backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length] + 'bb'),
                        borderRadius: 6,
                      }]
                    }} options={{ ...CHART_OPTS, indexAxis: 'y', plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
                  );
                })()}
              </ChartCard>
            )}

            {/* Ensemble weights explanation */}
            <ChartCard title="⚖️ Adaptive Ensemble Weights — How models are combined">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'New User (0–5 interactions)', weights: { 'Content-Based': 60, 'XGBoost CTR': 40, 'Collaborative': 0 }, note: 'Cold start — rely on content' },
                  { label: 'Growing (5–20 interactions)', weights: { 'Content-Based': 45, 'XGBoost CTR': 40, 'Collaborative': 15 }, note: 'Introducing collaborative' },
                  { label: 'Active (20+ interactions)', weights: { 'Content-Based': 35, 'XGBoost CTR': 40, 'Collaborative': 25 }, note: 'Full ensemble power' },
                ].map(({ label, weights, note }) => (
                  <div key={label} style={{ background: 'var(--elevated)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
                    {Object.entries(weights).map(([model, pct]) => (
                      <div key={model} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
                          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>{note}</div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Retrain controls */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>🔄 Manual Model Retraining</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                Models retrain automatically every night at 2am. Use this to trigger retraining immediately after collecting enough data (50+ ad interactions minimum).
              </p>
              {trainMsg && (
                <div className={`alert ${trainMsg.startsWith('✅') ? 'alert-success' : trainMsg.startsWith('⚠️') ? 'alert-info' : 'alert-error'}`} style={{ marginBottom: 16 }}>
                  {trainMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" onClick={handleTrain} disabled={trainLoading || !mlHealth?.online}>
                  {trainLoading ? '⏳ Training…' : '🚀 Train Models Now'}
                </button>
                <button className="btn btn-ghost" onClick={fetchMLStats} disabled={mlLoading}>
                  🔄 Refresh Stats
                </button>
              </div>
              {!mlHealth?.online && (
                <div className="alert alert-error" style={{ marginTop: 16 }}>
                  ML service is offline. Start it first: <code style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>cd ml-service && python app.py</code>
                </div>
              )}
              <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600 }}>📋 Training data required:</div>
                <div>• <strong style={{ color: 'var(--text-primary)' }}>50+ ad impressions</strong> for XGBoost to train</div>
                <div>• <strong style={{ color: 'var(--text-primary)' }}>5+ clicks</strong> for positive labels (click = 1)</div>
                <div>• <strong style={{ color: 'var(--text-primary)' }}>3+ users</strong> for collaborative filtering</div>
                <div style={{ marginTop: 8 }}>Interaction count: <strong style={{ color: 'var(--gold)' }}>{mlStats?.data?.totalInteractions ?? '…'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* ── ADS TAB ───────────────────────────────────────────── */}
        {tab === 'ads' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24 }}>
              <ChartCard title="📈 Impressions vs Clicks">
                <Bar data={{
                  labels: data.adPerformance?.slice(0,6).map(a => a.title.substring(0,14) + '…'),
                  datasets: [
                    { label: 'Impressions', data: data.adPerformance?.slice(0,6).map(a => a.impressions), backgroundColor: 'rgba(212,175,55,0.6)', borderColor: '#d4af37', borderWidth: 1, borderRadius: 4 },
                    { label: 'Clicks', data: data.adPerformance?.slice(0,6).map(a => a.clicks), backgroundColor: 'rgba(74,222,128,0.6)', borderColor: '#4ade80', borderWidth: 1, borderRadius: 4 },
                  ]
                }} options={CHART_OPTS} />
              </ChartCard>
              <ChartCard title="🖱️ Interaction Breakdown">
                <Bar data={{
                  labels: data.interactionStats?.map(i => i._id.replace(/_/g, ' ')),
                  datasets: [{ label: 'Count', data: data.interactionStats?.map(i => i.count), backgroundColor: PALETTE.map(c => c + 'bb'), borderRadius: 6 }]
                }} options={{ ...CHART_OPTS, indexAxis: 'y' }} />
              </ChartCard>
            </div>
            <ChartCard title="📋 Ad Performance — CTR per Ad">
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr>{['#','Title','Category','Budget','Impressions','Clicks','CTR'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.adPerformance?.map((ad, i) => (
                      <tr key={ad.id}>
                        <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</td>
                        <td><span className="badge badge-gold">{ad.category}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>₹{ad.budget?.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{ad.impressions?.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{ad.clicks?.toLocaleString()}</td>
                        <td><span className={`badge ${ad.ctr > 0.08 ? 'badge-green' : ad.ctr > 0.04 ? 'badge-gold' : 'badge-red'}`}>{(ad.ctr * 100).toFixed(2)}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ── PRODUCTS TAB ─────────────────────────────────────── */}
        {tab === 'products' && data && (
          <ChartCard title="👁️ Most Viewed Products">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr>{['#','Product','Category','Views','Wishlisted'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.mostViewed?.map((p, i) => (
                    <tr key={p._id}>
                      <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.image} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }}
                            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100'; }} />
                          <span style={{ fontWeight: 500 }}>{p.name?.substring(0, 30)}{p.name?.length > 30 ? '…' : ''}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-gold">{p.category}</span></td>
                      <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.viewCount?.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.wishlistCount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}

        {/* ── USERS TAB ────────────────────────────────────────── */}
        {tab === 'users' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{ov.totalUsers}</div><div className="stat-label">Total Users</div></div>
            </div>
            {data.userGrowth?.length > 0 && (
              <ChartCard title="📅 New Signups (Last 30 Days)">
                <Line data={{
                  labels: data.userGrowth.map(d => d._id),
                  datasets: [{ label: 'New Users', data: data.userGrowth.map(d => d.count), borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#d4af37' }]
                }} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
              </ChartCard>
            )}
            {data.interestDistribution?.length > 0 && (
              <ChartCard title="🧠 Interest Distribution Across All Users">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {data.interestDistribution.map(({ category, totalScore }) => {
                    const max = data.interestDistribution[0]?.totalScore || 1;
                    return (
                      <div key={category} className="progress-wrap">
                        <div className="progress-header"><span>{category}</span><span>{totalScore.toFixed(0)}</span></div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${(totalScore / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {/* ── CREATE TAB ───────────────────────────────────────── */}
        {tab === 'add' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {['product','ad'].map(t => (
                <button key={t} onClick={() => { setAddType(t); setForm({}); setFormMsg(''); }}
                  className={`btn ${addType === t ? 'btn-gold' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                  {t === 'product' ? '📦 New Product' : '📢 New Ad'}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: 28 }}>
                {addType === 'product' ? '📦 Create New Product' : '📢 Create New Ad'}
              </h2>
              {formMsg && <div className={`alert ${formMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{formMsg}</div>}
              <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">{addType === 'product' ? 'Product Name' : 'Ad Title'} *</label>
                    <input className="form-control" required value={form.name || form.title || ''}
                      onChange={e => setForm(p => ({ ...p, [addType === 'product' ? 'name' : 'title']: e.target.value }))}
                      placeholder={addType === 'product' ? 'e.g. Sony WH-1000XM5' : 'e.g. Sony XM5 — Hear Everything'} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description *</label>
                    <textarea className="form-control" required rows={3} value={form.description || ''}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Compelling description…" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-control" required value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Select category</option>
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {addType === 'product' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Brand</label>
                        <input className="form-control" value={form.brand || ''} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Sony" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Price (₹) *</label>
                        <input className="form-control" type="number" required min="0" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="29990" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Original Price (₹)</label>
                        <input className="form-control" type="number" min="0" value={form.originalPrice || ''} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))} placeholder="34990" />
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Budget (₹) *</label>
                      <input className="form-control" type="number" required min="0" value={form.budget || ''} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="50000" />
                    </div>
                  )}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Image URL</label>
                    <input className="form-control" value={form.image || ''} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://images.unsplash.com/…" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Keywords (comma-separated)</label>
                    <input className="form-control" value={form.keywords || ''} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} placeholder="sony, headphones, wireless" />
                  </div>
                </div>
                <button className="btn btn-gold" type="submit" disabled={formLoading} style={{ marginTop: 8 }}>
                  {formLoading ? 'Creating…' : `🚀 Create ${addType === 'product' ? 'Product' : 'Ad'}`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
