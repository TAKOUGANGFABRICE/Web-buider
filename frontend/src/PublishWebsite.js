import React, { useState } from 'react';

function PublishWebsite() {
  const [domain, setDomain] = useState('');
  const [message, setMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setMessage('');
    // TODO: Replace with backend API call to publish website
    setTimeout(() => {
      setIsPublishing(false);
      setMessage(`Website published successfully at https://${domain}`);
      setDomain('');
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Publish Website</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Custom Domain:</label><br />
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="yourdomain.com"
            style={{ width: '100%' }}
            required
          />
        </div>
        <button type="submit" disabled={isPublishing}>{isPublishing ? 'Publishing...' : 'Publish'}</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default PublishWebsite;
