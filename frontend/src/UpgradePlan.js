import React, { useState } from 'react';

function UpgradePlan() {
  const [plan, setPlan] = useState('basic');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileNetwork, setMobileNetwork] = useState('mtn');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend/payment gateway
    setMessage(`Upgrade to ${plan} plan using ${paymentMethod === 'card' ? 'Card' : mobileNetwork.toUpperCase() + ' Mobile Money'} successful!`);
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Upgrade Plan</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Choose Plan:</label><br />
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ width: '100%' }}>
            <option value="basic">Basic (Free)</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
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
            <input type="text" placeholder="1234 5678 9012 3456" style={{ width: '100%' }} required />
          </div>
        )}
        <button type="submit">Upgrade</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: 10 }}>{message}</div>}
    </div>
  );
}

export default UpgradePlan;
