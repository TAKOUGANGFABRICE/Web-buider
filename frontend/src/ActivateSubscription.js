import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000/api';

function ActivateSubscription() {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.trim() === '') {
      setMessage('Please enter a valid activation code.');
      return;
    }
    
    setIsActivating(true);
    setMessage('');

    try {
      const response = await authenticatedFetch(`${API_URL}/billing/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activation_code: code }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Subscription activated successfully!');
        setCode('');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Invalid activation code. Please try again.');
      }
    } catch (err) {
      console.error('Error activating subscription:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsActivating(false);
    }
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
        <button type="submit" disabled={isActivating}>{isActivating ? 'Activating...' : 'Activate'}</button>
      </form>
      {message && <div style={{ color: message.includes('successfully') ? 'green' : 'red', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default ActivateSubscription;
