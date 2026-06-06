import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Publish.css';

function Publish() {
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { authenticatedFetch } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchWebsite();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchWebsite = async () => {
    try {
      const response = await authenticatedFetch(`/api/crud/websites/crud/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setWebsite(data);
      } else {
        setError('Website not found');
      }
    } catch (err) {
      setError('Failed to load website');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (withDomain = false, domainData = {}) => {
    setPublishing(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (withDomain && domainData.domain) {
        response = await authenticatedFetch(`/api/crud/websites/crud/${id}/publish-with-domain/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: domainData.domain,
            ssl_enabled: domainData.ssl_enabled,
            is_primary: domainData.is_primary,
          }),
        });
      } else {
        response = await authenticatedFetch(`/api/crud/websites/crud/${id}/publish/`, {
          method: 'POST',
        });
      }

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Website published successfully!');
        setWebsite({ ...website, is_published: true, status: 'published' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to publish website');
      }
    } catch (err) {
      setError('Failed to publish website');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/crud/websites/crud/${id}/unpublish/`, {
        method: 'POST',
      });
      if (response.ok) {
        setSuccess('Website unpublished successfully');
        setWebsite({ ...website, is_published: false, status: 'draft' });
      } else {
        setError('Failed to unpublish website');
      }
    } catch (err) {
      setError('Failed to unpublish website');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="publish-loading">Loading...</div>;
  }

  if (!website) {
    return (
      <div className="publish-page">
        <div className="publish-empty">
          <h2>No Website Selected</h2>
          <p>Select a website to publish from your dashboard</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-page">
      <header className="publish-header">
        <h1>Publish Website</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>

      <div className="publish-content">
        <div className="website-info">
          <h2>{website.name}</h2>
          <p className="website-status">
            Status: <span className={`status-badge ${website.is_published ? 'published' : 'draft'}`}>
              {website.is_published ? 'Published' : 'Draft'}
            </span>
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="publish-options">
          <div className="publish-card">
            <h3>🌐 Platform Subdomain</h3>
            <p>Publish to your free subdomain on our platform</p>
            <div className="url-preview">
              <span>https://{website.slug}.websitebuilder.com</span>
            </div>
            <div className="publish-actions">
              {website.is_published ? (
                <button className="btn btn-secondary" onClick={handleUnpublish} disabled={publishing}>
                  {publishing ? 'Processing...' : 'Unpublish'}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => handlePublish(false)} disabled={publishing}>
                  {publishing ? 'Publishing...' : 'Publish to Subdomain'}
                </button>
              )}
            </div>
          </div>

          <div className="publish-card">
            <h3>🔗 Custom Domain</h3>
            <p>Connect your own domain (Premium feature)</p>
            <div className="domain-input">
              <input
                type="text"
                placeholder="Enter your domain (e.g., www.yourdomain.com)"
                disabled={!website.is_published}
              />
              <button 
                className="btn btn-secondary" 
                disabled={!website.is_published}
                onClick={() => {
                  const domain = document.querySelector('.domain-input input').value;
                  handlePublish(true, { domain, ssl_enabled: true, is_primary: true });
                }}
              >
                Connect Domain
              </button>
            </div>
            <p className="domain-note">Custom domains require a Premium or Business plan</p>
          </div>
        </div>

        <div className="publish-checklist">
          <h3>Before Publishing Checklist</h3>
          <ul>
            <li>✓ All pages are created and reviewed</li>
            <li>✓ Content is finalized</li>
            <li>✓ Images and media are uploaded</li>
            <li>✓ Forms are configured (if needed)</li>
            <li>✓ SEO settings are complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Publish;
