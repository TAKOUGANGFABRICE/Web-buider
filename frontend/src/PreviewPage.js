import React, { useState } from 'react';

function PreviewPage() {
  const [site, setSite] = useState({
    title: 'Sample Website',
    theme: 'light',
    content: 'This is a preview of your website.'
  });

  // In a real app, fetch site data from backend or props

  const themeStyles = {
    light: { background: '#fff', color: '#222' },
    dark: { background: '#222', color: '#fff' },
    colorful: { background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#222' }
  };

  return (
    <div style={{ minHeight: '100vh', ...themeStyles[site.theme], padding: 40 }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff8', borderRadius: 12, boxShadow: '0 2px 8px #0002', padding: 32 }}>
        <h1>{site.title}</h1>
        <div style={{ margin: '2rem 0' }}>{site.content}</div>
        <div style={{ fontSize: 12, color: '#888' }}>Theme: {site.theme}</div>
      </div>
    </div>
  );
}

export default PreviewPage;
