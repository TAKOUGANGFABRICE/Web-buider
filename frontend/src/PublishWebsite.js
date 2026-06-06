import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000/api';

function PublishWebsite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const websiteId = searchParams.get('id');
  
  const [domain, setDomain] = useState('');
  const [message, setMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setMessage('');

    try {
      let url = `${API_URL}/websites/`;
      let method = 'POST';
      let body = {};

      if (websiteId) {
        url = `${API_URL}/websites/${websiteId}/`;
        method = 'PATCH';
        body = {
          status: 'published',
          is_published: true,
          custom_domain: domain || null
        };
      } else {
        body = {
          name: 'New Website',
          status: 'published',
          is_published: true,
          custom_domain: domain || null
        };
      }

      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setMessage(`Website published successfully${domain ? ` at https://${domain}` : ''}!`);
        setDomain('');
        setTimeout(() => navigate('/websites'), 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to publish website. Please try again.');
      }
    } catch (err) {
      console.error('Error publishing website:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Publish Website</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Custom Domain (optional):</label><br />
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="yourdomain.com"
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit" disabled={isPublishing}>{isPublishing ? 'Publishing...' : 'Publish'}</button>
      </form>
      {message && <div style={{ color: message.includes('successfully') ? 'green' : 'red', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default PublishWebsite;
