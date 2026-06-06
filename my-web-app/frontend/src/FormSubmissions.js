import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Submissions.css';

function FormSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await authenticatedFetch('/api/crud/form-submissions/crud/');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try {
      const response = await authenticatedFetch(`/api/crud/form-submissions/crud/${id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== id));
        if (selectedSubmission?.id === id) setSelectedSubmission(null);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  if (loading) {
    return <div className="submissions-loading">Loading submissions...</div>;
  }

  return (
    <div className="submissions-page">
      <header className="submissions-header">
        <h1>Form Submissions</h1>
        <p className="submissions-subtitle">View and manage contact form submissions from your websites</p>
      </header>

      {submissions.length === 0 ? (
        <div className="submissions-empty">
          <p>No form submissions yet</p>
          <p className="submissions-hint">Submissions will appear here when visitors fill out forms on your published websites</p>
        </div>
      ) : (
        <div className="submissions-layout">
          <div className="submissions-list">
            <div className="submissions-header-row">
              <span>Date</span>
              <span>Form</span>
              <span>Website</span>
              <span>Actions</span>
            </div>
            {submissions.map(sub => (
              <div
                key={sub.id}
                className={`submission-item ${selectedSubmission?.id === sub.id ? 'selected' : ''}`}
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="submission-main">
                  <span className="submission-date">{new Date(sub.created_at).toLocaleDateString()}</span>
                  <span className="submission-form">{sub.form_name}</span>
                </div>
                <div className="submission-actions">
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); deleteSubmission(sub.id); }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedSubmission && (
            <div className="submission-detail">
              <h3>Submission Details</h3>
              <div className="detail-meta">
                <span>Date: {new Date(selectedSubmission.created_at).toLocaleString()}</span>
                <span>Form: {selectedSubmission.form_name}</span>
                <span>IP: {selectedSubmission.ip_address || 'N/A'}</span>
              </div>
              <div className="detail-content">
                <h4>Form Data</h4>
                <pre>{JSON.stringify(selectedSubmission.payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FormSubmissions;
