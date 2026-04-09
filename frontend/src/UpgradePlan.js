import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000/api';

function UpgradePlan() {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileNetwork, setMobileNetwork] = useState('mtn');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/billing-plans/`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.filter(p => p.is_active && p.price > 0));
        if (data.length > 0) {
          setPlan(data[1]?.id || '');
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plan) {
      setMessage('Please select a plan.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      if (paymentMethod === 'card') {
        const response = await authenticatedFetch(`${API_URL}/payments/create-intent/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            plan_id: plan,
            payment_method: 'card'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessage('Payment initiated successfully! You will be redirected to complete payment.');
          setTimeout(() => navigate('/billing'), 2000);
        } else {
          const errorData = await response.json();
          setMessage(errorData.detail || 'Failed to initiate payment. Please try again.');
        }
      } else {
        const response = await authenticatedFetch(`${API_URL}/payments/mobile-money/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            plan_id: plan,
            network: mobileNetwork
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessage(`Payment request sent to ${mobileNetwork.toUpperCase()}! Check your phone to complete payment.`);
          setTimeout(() => navigate('/billing'), 3000);
        } else {
          const errorData = await response.json();
          setMessage(errorData.detail || 'Failed to initiate mobile payment. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error upgrading plan:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading plans...</div>;
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Upgrade Plan</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Choose Plan:</label><br />
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ width: '100%' }}>
            <option value="">Select a plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name} - ${p.price}/{p.billing_period}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Payment Method:</label><br />
          <input type="radio" id="card" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
          <label htmlFor="card">Card</label>
          <input type="radio" id="mobile" name="payment" value="mobile" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} style={{ marginLeft: 16 }} />
          <label htmlFor="mobile">Mobile Money</label>
        </div>
        {paymentMethod === 'mobile' && (
          <div style={{ marginBottom: 16 }}>
            <label>Mobile Network:</label><br />
            <select value={mobileNetwork} onChange={e => setMobileNetwork(e.target.value)} style={{ width: '100%' }}>
              <option value="mtn">MTN</option>
              <option value="orange">Orange</option>
            </select>
          </div>
        )}
        {paymentMethod === 'card' && (
          <div style={{ marginBottom: 16 }}>
            <label>Card Number:</label><br />
            <input type="text" placeholder="1234 5678 9012 3456" style={{ width: '100%' }} />
          </div>
        )}
        <button type="submit" disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Upgrade'}</button>
      </form>
      {message && <div style={{ color: message.includes('successfully') || message.includes('sent') ? 'green' : 'red', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default UpgradePlan;
