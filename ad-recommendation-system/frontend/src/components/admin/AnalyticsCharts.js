import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const baseOptions = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#9a9ab0', font: { family: 'DM Sans', size: 12 } } },
  },
  scales: {
    x: { ticks: { color: '#5a5a70', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#5a5a70', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const Card = ({ title, children }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>{title}</h3>
    {children}
  </div>
);

/** CTR per ad — bar chart */
export const CTRBarChart = ({ adPerformance = [] }) => {
  const top8 = adPerformance.slice(0, 8);
  return (
    <Card title="📊 CTR per Advertisement">
      <Bar
        data={{
          labels: top8.map(a => a.title.substring(0, 18) + '…'),
          datasets: [{
            label: 'CTR (%)',
            data: top8.map(a => (a.ctr * 100).toFixed(2)),
            backgroundColor: 'rgba(108,99,255,0.7)',
            borderColor: '#6c63ff', borderWidth: 1, borderRadius: 6,
          }],
        }}
        options={baseOptions}
      />
    </Card>
  );
};

/** Impressions vs Clicks */
export const ImpressionsClicksChart = ({ adPerformance = [] }) => {
  const top6 = adPerformance.slice(0, 6);
  return (
    <Card title="📈 Impressions vs Clicks">
      <Bar
        data={{
          labels: top6.map(a => a.title.substring(0, 14) + '…'),
          datasets: [
            { label: 'Impressions', data: top6.map(a => a.impressions), backgroundColor: 'rgba(108,99,255,0.6)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 4 },
            { label: 'Clicks', data: top6.map(a => a.clicks), backgroundColor: 'rgba(255,101,132,0.6)', borderColor: '#ff6584', borderWidth: 1, borderRadius: 4 },
          ],
        }}
        options={baseOptions}
      />
    </Card>
  );
};

/** Category impressions doughnut */
export const CategoryDoughnut = ({ categoryStats = [] }) => {
  const palette = ['#6c63ff','#ff6584','#43e97b','#f7971e','#4facfe','#f093fb','#a18cd1','#fbc2eb','#a1c4fd','#ffecd2'];
  return (
    <Card title="🍩 Impressions by Category">
      <div style={{ maxWidth: 280, margin: '0 auto' }}>
        <Doughnut
          data={{
            labels: categoryStats.map(c => c._id),
            datasets: [{
              data: categoryStats.map(c => c.totalImpressions),
              backgroundColor: palette.slice(0, categoryStats.length).map(c => c + 'cc'),
              borderColor: palette.slice(0, categoryStats.length),
              borderWidth: 2,
            }],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#9a9ab0', padding: 12, font: { family: 'DM Sans', size: 11 } } } },
          }}
        />
      </div>
    </Card>
  );
};

/** Interaction type breakdown */
export const InteractionTypeChart = ({ interactionStats = [] }) => {
  const labelMap = {
    page_visit: 'Page Visits', category_browse: 'Category Browse',
    ad_impression: 'Ad Impressions', ad_click: 'Ad Clicks', dwell_time: 'Dwell Time',
  };
  return (
    <Card title="🖱️ Interaction Breakdown">
      <Bar
        data={{
          labels: interactionStats.map(i => labelMap[i._id] || i._id),
          datasets: [{
            label: 'Count',
            data: interactionStats.map(i => i.count),
            backgroundColor: ['rgba(108,99,255,0.7)','rgba(255,101,132,0.7)','rgba(67,233,123,0.7)','rgba(247,151,30,0.7)','rgba(79,172,254,0.7)'],
            borderRadius: 6,
          }],
        }}
        options={{ ...baseOptions, indexAxis: 'y' }}
      />
    </Card>
  );
};

/** User growth line chart */
export const UserGrowthChart = ({ userGrowth = [] }) => (
  <Card title="📅 User Signups (Last 30 Days)">
    <Line
      data={{
        labels: userGrowth.map(d => d._id),
        datasets: [{
          label: 'New Users',
          data: userGrowth.map(d => d.count),
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108,99,255,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6c63ff',
          fill: true,
          tension: 0.4,
        }],
      }}
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
    />
  </Card>
);

/** Top search keywords bar chart */
export const TopKeywordsChart = ({ topKeywords = [] }) => {
  const top12 = topKeywords.slice(0, 12);
  return (
    <Card title="🔤 Top Search Keywords">
      <Bar
        data={{
          labels: top12.map(k => `"${k._id}"`),
          datasets: [{
            label: 'Searches',
            data: top12.map(k => k.count),
            backgroundColor: 'rgba(67,233,123,0.7)',
            borderColor: '#43e97b', borderWidth: 1, borderRadius: 6,
          }],
        }}
        options={{ ...baseOptions, indexAxis: 'y' }}
      />
    </Card>
  );
};
