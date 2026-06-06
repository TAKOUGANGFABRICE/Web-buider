import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-container">
        <nav className="settings-tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={activeTab === 'password' ? 'active' : ''}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </nav>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <button className="btn btn-primary">Update Password</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="toggle-group">
                <label>
                  <input type="checkbox" defaultChecked /> Email Notifications
                </label>
                <label>
                  <input type="checkbox" /> Marketing Emails
                </label>
                <label>
                  <input type="checkbox" defaultChecked /> New Comments
                </label>
              </div>
              <button className="btn btn-primary">Save Preferences</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;