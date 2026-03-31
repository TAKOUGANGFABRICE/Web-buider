import React, { useState } from 'react';

function ActivateSubscription() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Replace with backend API call to activate subscription
    if (code.trim() === '') {
      setMessage('Please enter a valid activation code.');
      return;
    }
    // Simulate activation
    setTimeout(() => {
      setMessage('Subscription activated successfully!');
      setCode('');
    }, 500);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Activate Subscription</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Activation Code:</label><br />
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter your code"
            style={{ width: '100%' }}
            required
          />
        </div>
        <button type="submit">Activate</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default ActivateSubscription;
