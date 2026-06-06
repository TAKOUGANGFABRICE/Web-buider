import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Dashboard.css';

function Dashboard() {
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    visitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [websitesRes, statsRes, planRes] = await Promise.all([
          fetch('/api/crud/websites/crud/'),
          fetch('/api/crud/websites/crud/count/'),
          fetch('/api/my-plan/'),
        ]);

        let websitesData = [];
        if (websitesRes.ok) {
          websitesData = await websitesRes.json();
          setWebsites(websitesData);
        }

        if (statsRes.ok) {
          const visitors = websitesData.reduce((sum, w) => sum + (w.visitor_count || 0), 0);
          setStats({
            total: websitesData.length,
            published: websitesData.filter(w => w.is_published).length,
            draft: websitesData.filter(w => !w.is_published).length,
            visitors,
          });
        }

        if (planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData);
        }

        setNotifications([
          { id: 1, type: 'info', message: 'Welcome back! You have 3 pending tasks.', time: '2 min ago' },
          { id: 2, type: 'success', message: 'Your website is now live!', time: '1 hour ago' },
          { id: 3, type: 'warning', message: 'Storage is 80% full. Consider upgrading.', time: '3 hours ago' },
        ]);

        setActivities([
          { id: 1, action: 'Published', target: 'Personal Portfolio', time: '2 hours ago' },
          { id: 2, action: 'Updated', target: 'E-commerce Store', time: '4 hours ago' },
          { id: 3, action: 'Created', target: 'Blog Site', time: '1 day ago' },
        ]);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (isPublished) => isPublished ? 'published' : 'draft';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.username || 'User'}</h1>
          <p className="header-subtitle">Here's what's happening with your websites today.</p>
        </div>
        <div className="header-actions">
          <Link to="/create" className="btn btn-primary">
            <span className="btn-icon">+</span>
            Create New Website
          </Link>
        </div>
      </header>

      {plan && (
        <div className="plan-banner">
          <span className="plan-label">Current Plan:</span>
          <span className="plan-name">{plan.plan?.name || 'Free'}</span>
          <Link to="/billing" className="plan-upgrade">Upgrade</Link>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eef2ff' }}>
            <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Websites</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Published</span>
            <span className="stat-value">{stats.published}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Draft</span>
            <span className="stat-value">{stats.draft}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Visitors</span>
            <span className="stat-value">{stats.visitors.toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="table-card">
          <div className="section-header">
            <h2>Recent Websites</h2>
            <Link to="/create" className="btn btn-secondary">Create New</Link>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your websites...</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Visitors</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {websites.length === 0 ? (
                    <tr><td colSpan="5" className="empty-cell">No websites yet. Create your first one!</td></tr>
                  ) : (
                    websites.slice(0, 5).map(site => (
                      <tr key={site.id}>
                        <td><strong>{site.name}</strong></td>
                        <td><span className={`status-badge ${getStatusBadgeClass(site.is_published)}`}>{site.is_published ? 'Published' : 'Draft'}</span></td>
                        <td>{site.visitor_count?.toLocaleString() || 0}</td>
                        <td>{site.updated_at ? new Date(site.updated_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/builder?id=${site.id}`} className="btn btn-secondary">Edit</Link>
                            <Link to={`/publish/${site.id}`} className="btn btn-primary">Publish</Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="side-column">
          <div className="activity-card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {activities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div>
                    <p><strong>{activity.action}</strong> {activity.target}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="notifications-card">
            <h3>Notifications</h3>
            <div className="notifications-list">
              {notifications.map(notif => (
                <div key={notif.id} className={`notification-item ${notif.type}`}>
                  <span className="notification-dot"></span>
                  <div>
                    <p>{notif.message}</p>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {plan && (
            <div className="subscription-card">
              <div className="subscription-header">
                <h3>Subscription</h3>
                <span className="plan-badge">{plan.plan?.name || 'Free'}</span>
              </div>
              <p className="subscription-price">${plan.plan?.price || 0}<span>/mo</span></p>
              <Link to="/billing" className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }}>Manage Subscription</Link>
            </div>
          )}
        </div>
      </section>

      <section className="bottom-grid">
        <div className="traffic-card">
          <h3>Traffic Analytics</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${h}%` }}></div>
                  <span className="chart-label">{[ 'Mon','Tue','Wed','Thu','Fri','Sat','Sun' ][i]}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#6366f1' }}></span>
              <span>Visitors this week</span>
            </div>
          </div>
        </div>

        <div className="summary-card domains-card">
          <h3>Domain Summary</h3>
          <div className="summary-stats">
            <div className="summary-stat"><span className="summary-value">3</span><span className="summary-label">Total</span></div>
            <div className="summary-stat"><span className="summary-value success">2</span><span className="summary-label">Active</span></div>
            <div className="summary-stat"><span className="summary-value warning">1</span><span className="summary-label">Pending</span></div>
          </div>
          <Link to="/domains" className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }}>Manage Domains</Link>
        </div>

        <div className="summary-card forms-card">
          <h3>Forms Summary</h3>
          <div className="summary-stats">
            <div className="summary-stat"><span className="summary-value">12</span><span className="summary-label">Total Forms</span></div>
            <div className="summary-stat"><span className="summary-value success">142</span><span className="summary-label">Submissions</span></div>
            <div className="summary-stat"><span className="summary-value">12.4%</span><span className="summary-label">Conversion</span></div>
          </div>
          <Link to="/forms" className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }}>View Forms</Link>
        </div>

        <div className="summary-card storage-card">
          <h3>Media Storage</h3>
          <div className="storage-bar">
            <div className="storage-fill" style={{ width: '48%' }}></div>
          </div>
          <div className="storage-info">
            <span>2.4 GB / 5 GB</span>
            <span className="storage-percent">48%</span>
          </div>
          <Link to="/media" className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }}>Manage Media</Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;