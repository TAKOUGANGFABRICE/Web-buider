import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import './AnalyticsDashboard.css';

const COLORS = {
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  teal: '#14B8A6',
};

const PIE_COLORS = [COLORS.primary, COLORS.info, COLORS.success, COLORS.warning, COLORS.purple];
const DONUT_COLORS = [COLORS.primary, COLORS.info, COLORS.warning];

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

// ============================================
// MOCK DATA
// ============================================
const generateTrafficData = (days) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: Math.floor(Math.random() * 500 + 200),
      pageViews: Math.floor(Math.random() * 1200 + 600),
    });
  }
  return data;
};

const TOP_PAGES = [
  { name: 'Home Page', url: '/', views: 12450, avgTime: '2:34', bounceRate: '32%' },
  { name: 'About Page', url: '/about', views: 8320, avgTime: '3:12', bounceRate: '28%' },
  { name: 'Services Page', url: '/services', views: 6750, avgTime: '4:45', bounceRate: '22%' },
  { name: 'Contact Page', url: '/contact', views: 4210, avgTime: '1:58', bounceRate: '45%' },
  { name: 'Blog Page', url: '/blog', views: 3890, avgTime: '5:20', bounceRate: '18%' },
];

const TRAFFIC_SOURCES = [
  { name: 'Direct', value: 35, visitors: 8750 },
  { name: 'Google Search', value: 30, visitors: 7500 },
  { name: 'Social Media', value: 20, visitors: 5000 },
  { name: 'Referral', value: 10, visitors: 2500 },
  { name: 'Email', value: 5, visitors: 1250 },
];

const DEVICES = [
  { name: 'Desktop', value: 58, visitors: 14500 },
  { name: 'Mobile', value: 35, visitors: 8750 },
  { name: 'Tablet', value: 7, visitors: 1750 },
];

const GEO_DATA = [
  { country: 'United States', visitors: 8500, percentage: 34 },
  { country: 'United Kingdom', visitors: 4200, percentage: 17 },
  { country: 'Canada', visitors: 3100, percentage: 12 },
  { country: 'Germany', visitors: 2800, percentage: 11 },
  { country: 'Cameroon', visitors: 1900, percentage: 8 },
  { country: 'Australia', visitors: 1500, percentage: 6 },
  { country: 'France', visitors: 1200, percentage: 5 },
  { country: 'Others', visitors: 3800, percentage: 7 },
];

const CONVERSION_DATA = [
  { label: 'Form Submissions', value: 1247, change: 12.5, icon: '📝' },
  { label: 'Newsletter Signups', value: 3892, change: 8.3, icon: '📧' },
  { label: 'Purchases', value: 567, change: -2.4, icon: '🛒' },
  { label: 'Conversion Rate', value: '3.24%', change: 5.1, icon: '👥' },
];

const REAL_TIME_VISITORS = [
  { id: 1, page: 'Home Page', active: true },
  { id: 2, page: 'Pricing Page', active: true },
  { id: 3, page: 'Blog Page', active: true },
  { id: 4, page: 'Services Page', active: true },
  { id: 5, page: 'Contact Page', active: true },
];

const RECENT_EVENTS = [
  { id: 1, type: 'form', message: 'New Form Submission', time: '2 minutes ago', icon: '📝' },
  { id: 2, type: 'visitor', message: 'New Website Visitor', time: '5 minutes ago', icon: '👤' },
  { id: 3, type: 'newsletter', message: 'Newsletter Signup', time: '10 minutes ago', icon: '📧' },
  { id: 4, type: 'purchase', message: 'New Purchase', time: '15 minutes ago', icon: '💰' },
  { id: 5, type: 'visitor', message: 'Returning Visitor', time: '22 minutes ago', icon: '🔄' },
];

// ============================================
// SVG ICONS
// ============================================
const Icons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  eye: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  mouse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <line x1="12" y1="7" x2="12" y2="13" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  pdf: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  excel: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  csv: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  ),
  up: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  down: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  desktop: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  mobile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  ),
  tablet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
};

// ============================================
// REUSABLE COMPONENTS
// ============================================
const KPICard = ({ title, value, change, changeType = 'positive', icon }) => {
  const TrendIcon = changeType === 'positive' ? Icons.up : Icons.down;
  const trendColor = changeType === 'positive' ? COLORS.success : COLORS.danger;

  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}>
        {icon}
      </div>
      <div className="kpi-content">
        <span className="kpi-label">{title}</span>
        <span className="kpi-value">{value}</span>
        {change && (
          <div className="kpi-trend" style={{ color: trendColor }}>
            {TrendIcon}
            <span>{change}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, children, className = '', action }) => (
  <div className={`analytics-card ${className}`}>
    {(title || action) && (
      <div className="card-header">
        {title && <h3 className="card-title">{title}</h3>}
        {action && <div className="card-action">{action}</div>}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatChange = ({ value, type }) => {
  if (!value) return null;
  const isPositive = type === 'positive';
  return (
    <span className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? Icons.up : Icons.down}
      {value}%
    </span>
  );
};

// ============================================
// MAIN ANALYTICS PAGE
// ============================================
function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showCustomRange, setShowCustomRange] = useState(false);

  const trafficData = useMemo(() => generateTrafficData(period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90), [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting analytics report as ${format}...`);
  };

  return (
    <div className="analytics-page">
      {/* PAGE HEADER */}
      <header className="analytics-header">
        <div className="header-left">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Monitor website traffic, visitor behavior, and performance metrics.</p>
        </div>
        <div className="header-right">
          <div className="period-selector">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => handlePeriodChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {showCustomRange && (
            <div className="custom-range">
              <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="date-input" />
              <span className="range-separator">to</span>
              <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="date-input" />
              <button className="apply-btn">Apply</button>
            </div>
          )}
          <div className="export-dropdown">
            <button className="export-btn">
              {Icons.download}
              Export Report
            </button>
            <div className="export-options">
              <button onClick={() => handleExport('PDF')}>{Icons.pdf} Export PDF</button>
              <button onClick={() => handleExport('Excel')}>{Icons.excel} Export Excel</button>
              <button onClick={() => handleExport('CSV')}>{Icons.csv} Export CSV</button>
            </div>
          </div>
        </div>
      </header>

      {/* KPI OVERVIEW CARDS */}
      <div className="kpi-grid">
        <KPICard
          title="Total Visitors"
          value="25,000"
          change="12.5"
          changeType="positive"
          icon={Icons.users}
        />
        <KPICard
          title="Page Views"
          value="68,420"
          change="8.2"
          changeType="positive"
          icon={Icons.eye}
        />
        <KPICard
          title="Sessions"
          value="18,750"
          change="5.4"
          changeType="positive"
          icon={Icons.mouse}
        />
        <KPICard
          title="Bounce Rate"
          value="32.4%"
          change="3.1"
          changeType="negative"
          icon={Icons.chart}
        />
      </div>

      {/* TRAFFIC OVERVIEW CHART */}
      <Card title="Website Traffic" className="traffic-card">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trafficData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="visitors"
                name="Visitors"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.primary }}
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                name="Page Views"
                stroke={COLORS.info}
                strokeWidth={3}
                dot={{ fill: COLORS.info, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.info }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* TOP PAGES + TRAFFIC SOURCES */}
      <div className="analytics-grid-2">
        <Card title="Top Pages" className="table-card">
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Page Name</th>
                  <th>URL</th>
                  <th>Views</th>
                  <th>Avg. Time</th>
                  <th>Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PAGES.map((page, idx) => (
                  <tr key={idx}>
                    <td className="page-name-cell">
                      <span className="page-icon">📄</span>
                      {page.name}
                    </td>
                    <td className="url-cell">{page.url}</td>
                    <td className="numeric-cell">{page.views.toLocaleString()}</td>
                    <td className="numeric-cell">{page.avgTime}</td>
                    <td className="numeric-cell">
                      <span className={`bounce-badge ${parseInt(page.bounceRate) > 35 ? 'high' : 'low'}`}>
                        {page.bounceRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Traffic Sources" className="chart-card">
          <div className="chart-container donut-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={TRAFFIC_SOURCES}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {TRAFFIC_SOURCES.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="sources-legend">
            {TRAFFIC_SOURCES.map((source, idx) => (
              <div key={idx} className="legend-item">
                <span className="legend-dot" style={{ background: PIE_COLORS[idx] }}></span>
                <span className="legend-name">{source.name}</span>
                <span className="legend-value">{source.visitors.toLocaleString()}</span>
                <span className="legend-percent">{source.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* DEVICE ANALYTICS + GEOGRAPHIC */}
      <div className="analytics-grid-2">
        <Card title="Device Analytics" className="chart-card">
          <div className="chart-container donut-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={DEVICES}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DEVICES.map((entry, index) => (
                    <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="devices-summary">
            {DEVICES.map((device, idx) => (
              <div key={idx} className="device-summary-item">
                <div className="device-icon" style={{ background: `${DONUT_COLORS[idx]}20`, color: DONUT_COLORS[idx] }}>
                  {device.name === 'Desktop' && Icons.desktop}
                  {device.name === 'Mobile' && Icons.mobile}
                  {device.name === 'Tablet' && Icons.tablet}
                </div>
                <div className="device-info">
                  <span className="device-name">{device.name}</span>
                  <span className="device-visitors">{device.visitors.toLocaleString()} visitors</span>
                </div>
                <span className="device-percent" style={{ color: DONUT_COLORS[idx] }}>{device.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Geographic Analytics" className="table-card">
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Visitors</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {GEO_DATA.map((geo, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="country-flag">🌍</span>
                      {geo.country}
                    </td>
                    <td className="numeric-cell">{geo.visitors.toLocaleString()}</td>
                    <td className="numeric-cell">
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${geo.percentage}%`, background: COLORS.primary }}></div>
                        </div>
                        <span className="progress-text">{geo.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* REAL-TIME VISITORS + CONVERSION METRICS */}
      <div className="analytics-grid-2">
        <Card title="Real-Time Visitors" className="realtime-card">
          <div className="realtime-content">
            <div className="realtime-stat">
              <span className="realtime-number">{REAL_TIME_VISITORS.length}</span>
              <span className="realtime-label">Active Visitors</span>
            </div>
            <div className="realtime-list">
              {REAL_TIME_VISITORS.map((visitor) => (
                <div key={visitor.id} className="realtime-item">
                  <span className="realtime-dot"></span>
                  <span className="realtime-page">Viewing: {visitor.page}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Conversion Metrics" className="conversion-card">
          <div className="conversion-grid">
            {CONVERSION_DATA.map((item, idx) => (
              <div key={idx} className="conversion-item">
                <div className="conversion-icon">{item.icon}</div>
                <div className="conversion-content">
                  <span className="conversion-value">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
                  <span className="conversion-label">{item.label}</span>
                  <StatChange value={item.change} type={item.change >= 0 ? 'positive' : 'negative'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECENT EVENTS */}
      <Card title="Recent Events" className="events-card">
        <div className="events-list">
          {RECENT_EVENTS.map((event) => (
            <div key={event.id} className="event-item">
              <span className="event-icon">{event.icon}</span>
              <div className="event-content">
                <span className="event-message">{event.message}</span>
                <span className="event-time">{event.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
