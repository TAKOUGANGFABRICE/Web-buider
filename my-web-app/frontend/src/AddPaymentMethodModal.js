import React, { useState } from 'react';
import './AddPaymentMethodModal.css';

const AddPaymentMethodModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    provider: '',
    phone_number: '',
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/payment-methods/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to add payment method');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Add Payment Method</h2>

        {step === 'select' && (
          <div className="method-selection">
            <h4>Mobile Money</h4>
            <div className="method-options">
              <button
                className={formData.provider === 'mtn' ? 'selected' : ''}
                onClick={() => {
                  setFormData({ ...formData, provider: 'mtn' });
                  setStep('form');
                }}
              >
                📱 MTN Mobile Money
              </button>
              <button
                className={formData.provider === 'orange' ? 'selected' : ''}
                onClick={() => {
                  setFormData({ ...formData, provider: 'orange' });
                  setStep('form');
                }}
              >
                🍊 Orange Money
              </button>
            </div>

            <h4>Bank Cards</h4>
            <div className="method-options">
              <button
                className={formData.provider === 'visa' ? 'selected' : ''}
                onClick={() => {
                  setFormData({ ...formData, provider: 'visa' });
                  setStep('form');
                }}
              >
                💳 Visa
              </button>
              <button
                className={formData.provider === 'mastercard' ? 'selected' : ''}
                onClick={() => {
                  setFormData({ ...formData, provider: 'mastercard' });
                  setStep('form');
                }}
              >
                💳 MasterCard
              </button>
            </div>

            <h4>Virtual Cards</h4>
            <div className="method-options">
              <button
                className={formData.provider === 'flutterwave_voucher' ? 'selected' : ''}
                onClick={() => {
                  setFormData({ ...formData, provider: 'flutterwave_voucher' });
                  setStep('form');
                }}
              >
                🎫 Flutterwave Virtual Card
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="payment-form">
            {['mtn', 'orange'].includes(formData.provider) && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+237 650 123 456"
                />
              </div>
            )}

            {['visa', 'mastercard', 'flutterwave_voucher'].includes(formData.provider) && (
              <>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="form-group">
                  <label>Card Holder Name</label>
                  <input
                    type="text"
                    name="card_holder_name"
                    value={formData.card_holder_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Month</label>
                    <input
                      type="text"
                      name="expiry_month"
                      value={formData.expiry_month}
                      onChange={handleInputChange}
                      placeholder="MM"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Year</label>
                    <input
                      type="text"
                      name="expiry_year"
                      value={formData.expiry_year}
                      onChange={handleInputChange}
                      placeholder="YY"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setStep('select')}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Payment Method'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;