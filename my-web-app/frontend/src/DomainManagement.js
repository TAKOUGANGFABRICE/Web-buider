import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './DomainManagement.css';

function DomainManagement() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await authenticatedFetch('/api/crud/domains/crud/');
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async (websiteId) => {
    if (!newDomain.trim()) return;
    try {
      const response = await authenticatedFetch('/api/crud/domains/crud/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain,
          website_id: websiteId,
          is_primary: true,
          ssl_enabled: false,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setDomains([...domains, data]);
        setNewDomain('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding domain:', err);
    }
  };

  const verifyDomain = async (domainId) => {
    try {
      const response = await authenticatedFetch(`/api/crud/domains/crud/${domainId}/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_code: 'verify' }),
      });
      if (response.ok) {
        fetchDomains();
      }
    } catch (err) {
      console.error('Error verifying domain:', err);
    }
  };

  const setPrimary = async (domainId) => {
    try {
      const response = await authenticatedFetch(`/api/crud/domains/crud/${domainId}/set_primary/`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchDomains();
      }
    } catch (err) {
      console.error('Error setting primary domain:', err);
    }
  };

  if (loading) {
    return <div className="domains-loading">Loading domains...</div>;
  }

  return (
    <div className="domains-page">
      <header className="domains-header">
        <h1>Domain Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Domain'}
        </button>
      </header>

      {showAddForm && (
        <div className="add-domain-form">
          <h3>Add Custom Domain</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => addDomain(1)}>Add Domain</button>
          </div>
          <p className="form-hint">Enter your domain without http:// or www. (e.g., example.com)</p>
        </div>
      )}

      {domains.length === 0 ? (
        <div className="domains-empty">
          <h3>No Custom Domains</h3>
          <p>Upgrade to a Premium or Business plan to connect custom domains</p>
        </div>
      ) : (
        <div className="domains-list">
          {domains.map(domain => (
            <div key={domain.id} className="domain-card">
              <div className="domain-info">
                <h3>{domain.domain}</h3>
                <div className="domain-meta">
                  <span className={`verification-badge ${domain.is_verified ? 'verified' : 'pending'}`}>
                    {domain.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
                  </span>
                  <span className="ssl-badge">
                    {domain.ssl_enabled ? '🔒 SSL Enabled' : '🔓 SSL Not Enabled'}
                  </span>
                  {domain.is_primary && <span className="primary-badge">Primary</span>}
                </div>
              </div>
              <div className="domain-actions">
                {!domain.is_verified && (
                  <button className="btn btn-secondary" onClick={() => verifyDomain(domain.id)}>
                    Verify Domain
                  </button>
                )}
                {domain.is_verified && !domain.ssl_enabled && (
                  <button className="btn btn-secondary" onClick={() => alert('SSL will be enabled after verification')}>
                    Enable SSL
                  </button>
                )}
                {!domain.is_primary && (
                  <button className="btn btn-secondary" onClick={() => setPrimary(domain.id)}>
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="domains-info">
        <h3>How to Connect a Custom Domain</h3>
        <ol>
          <li>Add your domain above</li>
          <li>Update your DNS records to point to our servers</li>
          <li>Wait for verification (usually takes 24-48 hours)</li>
          <li>SSL certificate will be automatically enabled</li>
        </ol>
      </div>
    </div>
  );
}

export default DomainManagement;
