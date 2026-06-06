import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Forms.css';

const FORM_TEMPLATES = [
  { id: 'contact', name: 'Contact Form', description: 'Name, email, phone, and message', fields: ['name', 'email', 'phone', 'message'] },
  { id: 'newsletter', name: 'Newsletter Signup', description: 'Email-only subscription form', fields: ['email'] },
  { id: 'support', name: 'Support Request', description: 'Subject, priority, and description', fields: ['subject', 'email', 'priority', 'description'] },
  { id: 'feedback', name: 'Feedback Form', description: 'Rating and comments', fields: ['name', 'email', 'rating', 'comments'] },
];

function Forms() {
  const [submissions, setSubmissions] = useState([]);
  const [forms, setForms] = useState([]);
  const [newsletter, setNewsletter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contact');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderForm, setBuilderForm] = useState({ name: '', fields: '', email_notifications: true });
  const [emailSettings, setEmailSettings] = useState({ smtp_host: '', smtp_port: '587', smtp_username: '', smtp_password: '', from_email: '', notify_on_submit: true });
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactRes, newsletterRes, settingsRes] = await Promise.all([
        authenticatedFetch('/api/crud/form-submissions/crud/'),
        authenticatedFetch('/api/crud/newsletter-subscribers/crud/'),
        authenticatedFetch('/api/forms/settings/').catch(() => new Response(JSON.stringify({}), { status: 200 })),
      ]);
      if (contactRes.ok) setSubmissions([...await contactRes.json()]);
      if (newsletterRes.ok) setNewsletter([...await newsletterRes.json()]);
    } catch (err) {
      console.error('Error fetching form data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async () => {
    try {
      const response = await authenticatedFetch('/api/crud/forms/crud/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: builderForm.name, fields: builderForm.fields, email_notifications: builderForm.email_notifications }),
      });
      if (response.ok) {
        setShowBuilder(false);
        setBuilderForm({ name: '', fields: '', email_notifications: true });
        fetchData();
      }
    } catch (err) {
      console.error('Error creating form:', err);
    }
  };

  const saveEmailSettings = async () => {
    try {
      await authenticatedFetch('/api/forms/settings/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailSettings) });
      alert('Email settings saved');
    } catch (err) {
      console.error('Error saving email settings:', err);
    }
  };

  if (loading) return <div className="forms-loading">Loading forms...</div>;

  return (
    <div className="forms-page">
      <header className="forms-header">
        <h1>Forms & Contact</h1>
        <div className="forms-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowBuilder(true)}>+ New Form</button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('email')}>Email Settings</button>
        </div>
      </header>

      {showBuilder && (
        <div className="modal-overlay" onClick={() => setShowBuilder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Form</h2>
            <div className="form-group">
              <label>Form Name</label>
              <input value={builderForm.name} onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })} placeholder="e.g., Contact Form" />
            </div>
            <div className="form-group">
              <label>Fields (comma separated)</label>
              <input value={builderForm.fields} onChange={(e) => setBuilderForm({ ...builderForm, fields: e.target.value })} placeholder="name, email, message" />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={builderForm.email_notifications} onChange={(e) => setBuilderForm({ ...builderForm, email_notifications: e.target.checked })} />
                Send email notifications on submission
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowBuilder(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createForm}>Create Form</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="forms-section">
          <div className="forms-header-row">
            <h2>Contact Forms</h2>
            <div className="forms-actions">
              <button className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Contact</button>
              <button className={`tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`} onClick={() => setActiveTab('newsletter')}>Newsletter</button>
            </div>
          </div>
          <div className="submissions-layout">
            <div className="submissions-list">
              <div className="submissions-header-row"><span>Date</span><span>Form</span><span>Data</span><span>Actions</span></div>
              {submissions.length === 0 && <div className="empty-row"><p>No contact submissions yet</p></div>}
              {submissions.map(sub => (
                <div key={sub.id} className={`submission-item ${selectedSubmission?.id === sub.id ? 'selected' : ''}`} onClick={() => setSelectedSubmission(sub)}>
                  <div className="submission-main">
                    <span className="submission-date">{new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}</span>
                    <span className="submission-form">{sub.form_name}</span>
                  </div>
                  <div className="submission-actions">
                    <button className="btn-delete" onClick={(e) => { e.stopPropagation(); authenticatedFetch(`/api/crud/form-submissions/crud/${sub.id}/`, { method: 'DELETE' }).then(() => setSubmissions(submissions.filter(s => s.id !== sub.id))); }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {selectedSubmission && (
              <div className="submission-detail">
                <h3>Submission Details</h3>
                <div className="detail-meta"><span>Date: {new Date(selectedSubmission.submitted_at || selectedSubmission.created_at).toLocaleString()}</span><span>Form: {selectedSubmission.form_name}</span></div>
                <div className="detail-content"><h4>Data</h4><pre>{JSON.stringify(selectedSubmission.submission_data || selectedSubmission.payload || {}, null, 2)}</pre></div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'newsletter' && (
        <div className="forms-section">
          <div className="forms-header-row"><h2>Newsletter Subscribers</h2></div>
          <div className="submissions-list">
            <div className="submissions-header-row"><span>Email</span><span>Source</span><span>Subscribed</span><span>Status</span></div>
            {newsletter.length === 0 && <div className="empty-row"><p>No subscribers yet</p></div>}
            {newsletter.map(sub => (
              <div key={sub.id} className="submission-item">
                <div className="submission-main">
                  <span className="submission-form">{sub.email}</span>
                  <span className="submission-date">{sub.source || 'website'}</span>
                </div>
                <div className="submission-actions">
                  <span className={`status-badge ${sub.is_active ? 'published' : 'draft'}`}>{sub.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="forms-section">
          <div className="forms-header-row"><h2>Email Notifications</h2></div>
          <div className="email-settings">
            <div className="form-group"><label>SMTP Host</label><input value={emailSettings.smtp_host} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })} /></div>
            <div className="form-group"><label>SMTP Port</label><input value={emailSettings.smtp_port} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })} /></div>
            <div className="form-group"><label>SMTP Username</label><input value={emailSettings.smtp_username} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })} /></div>
            <div className="form-group"><label>SMTP Password</label><input type="password" value={emailSettings.smtp_password} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })} /></div>
            <div className="form-group"><label>From Email</label><input value={emailSettings.from_email} onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })} /></div>
            <div className="form-group"><label className="checkbox-label"><input type="checkbox" checked={emailSettings.notify_on_submit} onChange={(e) => setEmailSettings({ ...emailSettings, notify_on_submit: e.target.checked })} /> Notify on form submit</label></div>
            <button className="btn btn-primary" onClick={saveEmailSettings}>Save Email Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Forms;
