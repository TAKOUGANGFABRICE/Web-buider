import React, { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    phone_number: '',
    network: 'mtn',
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

  const handleProceedToPayment = () => {
    if (paymentMethod === 'mobile_money') {
      if (!formData.phone_number) {
        setError('Phone number is required for mobile money');
        return;
      }
    }
    setStep(2);
  };

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access');
      let response;

      if (paymentMethod === 'mobile_money') {
        response = await fetch('/api/flutterwave/initialize/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: plan.slug,
            payment_method: 'mobile_money',
            network: formData.network,
            phone_number: formData.phone_number,
          }),
        });
      } else {
        response = await fetch('/api/flutterwave/initialize/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: plan.slug,
            payment_method: paymentMethod,
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (data.flutterwavePaymentLink) {
          window.open(data.flutterwavePaymentLink, '_blank', 'width=500,height=700');
        }
        onSuccess({
          status: 'pending',
          transaction_id: data.tx_ref,
          amount: plan.price,
          plan: plan.name,
        });
      } else {
        setError(data.error || 'Payment initialization failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/flutterwave/verify/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx_ref: formData.phone_number }),
      });

      const data = await response.json();

      if (data.success && data.status === 'successful') {
        onSuccess({
          status: 'success',
          transaction_id: data.transaction_id,
          amount: data.amount,
          plan: plan.name,
        });
      } else {
        onSuccess({ status: 'failed', reason: 'Payment not completed' });
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProviderLogo = (provider) => {
    const logos = {
      mtn: '📱',
      orange: '🍊',
      visa: '💳',
      mastercard: '💳',
      flutterwave_voucher: '🎫',
    };
    return logos[provider] || '💳';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span>Select Plan</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span>Select Payment</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Confirm</span>
          </div>
        </div>

        {step === 1 && (
          <div className="modal-step-content">
            <h2>{plan?.name} Plan</h2>
            <p className="plan-description">{plan?.description}</p>

            <div className="plan-summary">
              <div className="summary-row">
                <span>Price</span>
                <span className="price">{plan?.price === 0 ? 'Free' : `$${plan?.price}/month`}</span>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleProceedToPayment}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step-content">
            <h2>Select Payment Method</h2>

            <div className="payment-options">
              <h4>Mobile Money</h4>
              <div className="payment-buttons">
                <button
                  className={paymentMethod === 'mtn' ? 'active' : ''}
                  onClick={() => setPaymentMethod('mtn')}
                >
                  📱 MTN Mobile Money
                </button>
                <button
                  className={paymentMethod === 'orange' ? 'active' : ''}
                  onClick={() => setPaymentMethod('orange')}
                >
                  🍊 Orange Money
                </button>
              </div>

              {paymentMethod && paymentMethod !== 'card' && (
                <div className="payment-form">
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

                  {paymentMethod === 'mtn' && (
                    <div className="form-group">
                      <button className="btn-verify" onClick={() => alert('Verification sent!')}>
                        Verify Number
                      </button>
                    </div>
                  )}
                </div>
              )}

              <h4 className="mt-4">Bank Cards</h4>
              <div className="payment-buttons">
                <button
                  className={paymentMethod === 'card' ? 'active' : ''}
                  onClick={() => setPaymentMethod('card')}
                >
                  💳 Saved Cards
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="payment-form">
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
                </div>
              )}

              <h4 className="mt-4">Virtual Cards</h4>
              <div className="payment-buttons">
                <button
                  className={paymentMethod === 'flutterwave_voucher' ? 'active' : ''}
                  onClick={() => setPaymentMethod('flutterwave_voucher')}
                >
                  🎫 Flutterwave Virtual Card
                </button>
              </div>

            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleInitiatePayment} disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="modal-step-content">
            <h2>Confirm Payment</h2>

            <div className="payment-confirmation">
              <p>Please confirm your payment for <strong>{plan?.name} Plan</strong></p>
              <p>Amount: <strong>${plan?.price}</strong></p>

              {paymentMethod && paymentMethod !== 'card' && (
                <p>Payment Method: {getProviderLogo(paymentMethod)} {paymentMethod}</p>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPayment} disabled={loading}>
                {loading ? 'Verifying...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;