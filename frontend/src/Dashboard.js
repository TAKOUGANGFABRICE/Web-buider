





import React, { useState } from 'react';
import CreateWebsite from './CreateWebsite';
import BuildWebsite from './BuildWebsite';
import PreviewPage from './PreviewPage';
import UpgradePlan from './UpgradePlan';
import ActivateSubscription from './ActivateSubscription';
import PublishWebsite from './PublishWebsite';






function Dashboard() {
  const username = localStorage.getItem('username');
  const [page, setPage] = useState('dashboard');

  if (page === 'create') {
    return <CreateWebsite />;
  }
  if (page === 'build') {
    return <BuildWebsite />;
  }
  if (page === 'preview') {
    return <PreviewPage />;
  }
  if (page === 'upgrade') {
    return <UpgradePlan />;
  }
  if (page === 'activate') {
    return <ActivateSubscription />;
  }
  if (page === 'publish') {
    return <PublishWebsite />;
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Dashboard</h2>
      <p>Welcome{username ? `, ${username}` : ''}!</p>
      <p>This is your dashboard. You are logged in.</p>
      <button onClick={() => setPage('create')} style={{ marginTop: 20, marginRight: 10 }}>Create Website</button>
      <button onClick={() => setPage('build')} style={{ marginTop: 20, marginRight: 10 }}>Build Website</button>
      <button onClick={() => setPage('preview')} style={{ marginTop: 20, marginRight: 10 }}>Preview Website</button>
      <button onClick={() => setPage('upgrade')} style={{ marginTop: 20, marginRight: 10 }}>Upgrade Plan</button>
      <button onClick={() => setPage('activate')} style={{ marginTop: 20, marginRight: 10 }}>Activate Subscription</button>
      <button onClick={() => setPage('publish')} style={{ marginTop: 20 }}>Publish Website</button>
    </div>
  );
}

export default Dashboard;
