import React, { useState } from 'react';

function BuildWebsite() {
  const [step, setStep] = useState(1);
  const [siteData, setSiteData] = useState({ title: '', theme: '', content: '' });
  const [message, setMessage] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with backend API call
    setMessage('Website build process started!');
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
          <button type="submit">Build Website</button>
        </form>
      )}
      {message && <div style={{ color: 'green', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default BuildWebsite;
