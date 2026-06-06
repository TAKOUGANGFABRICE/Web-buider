import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000/api';

function BuildWebsite() {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  
  const [step, setStep] = useState(1);
  const [siteData, setSiteData] = useState({ title: '', theme: '', content: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setSiteData({ ...siteData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await authenticatedFetch(`${API_URL}/websites/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: siteData.title,
          content: siteData.content,
          settings: { theme: siteData.theme }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Website "${data.name}" created successfully!`);
        setTimeout(() => navigate('/websites'), 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to create website. Please try again.');
      }
    } catch (err) {
      console.error('Error creating website:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Build Website</h2>
      {step === 1 && (
        <form onSubmit={handleNext}>
          <div>
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={siteData.title}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </div>
          <button type="submit">Next</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleNext}>
          <div>
            <label>Theme</label>
            <select
              name="theme"
              value={siteData.theme}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 10 }}
            >
              <option value="">Select a theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="colorful">Colorful</option>
            </select>
          </div>
          <button onClick={handleBack} style={{ marginRight: 10 }}>Back</button>
          <button type="submit">Next</button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Content</label>
            <textarea
              name="content"
              value={siteData.content}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </div>
          <button onClick={handleBack} style={{ marginRight: 10 }}>Back</button>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Building...' : 'Build Website'}</button>
        </form>
      )}
      {message && <div style={{ color: message.includes('successfully') ? 'green' : 'red', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default BuildWebsite;
