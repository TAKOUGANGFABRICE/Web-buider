import React, { useState, useEffect } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, plan = 'premium' }) => {
  const [activeTab, setActiveTab] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  // Mobile money state
  const [phoneNumber, setPhoneNumber] = useState('+237 ');
  const [selectedNetwork, setSelectedNetwork] = useState('orange');
  const [mobileInstructions, setMobileInstructions] = useState(null);
  const [verifyingMobile, setVerifyingMobile] = useState(false);

  const planPrices = {
    premium: { amount: 10, period: 'month' },
    business: { amount: 29, period: 'month' }
  };

  const planDetails = planPrices[plan] || planPrices.premium;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setMobileInstructions(null);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setPhoneNumber('+237 ');
    }
  }, [isOpen]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 7) {
      setExpiry(formatted);
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const getCardType = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'visa';
    if (num.startsWith('5')) return 'mastercard';
    return null;
  };

  const handleCardPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access');
      
      // Create payment intent
      const response = await fetch('http://localhost:8000/api/payments/create-intent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Simulate Stripe payment confirmation
      setTimeout(async () => {
        // Confirm payment
        const confirmResponse = await fetch('http://localhost:8000/api/payments/confirm/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentId: data.paymentId, plan })
        });

        const confirmData = await confirmResponse.json();

        if (confirmResponse.ok) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            window.location.href = '/billing?success=true';
          }, 2000);
        } else {
          setError(confirmData.error || 'Payment failed');
        }
        setLoading(false);
      }, 1500);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMobileMoneyPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access');
      
      const response = await fetch('http://localhost:8000/api/payments/mobile-money/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan,
          phoneNumber,
          network: selectedNetwork
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process mobile money payment');
      }

      setMobileInstructions(data);
      setLoading(false);
      setVerifyingMobile(true);
      
      // Simulate verification after user confirms on phone
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch('http://localhost:8000/api/payments/mobile-verify/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ paymentId: data.paymentId, plan })
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok) {
            setSuccess(true);
            setVerifyingMobile(false);
            setTimeout(() => {
              onClose();
              window.location.href = '/billing?success=true';
            }, 2000);
          } else {
            setError(verifyData.error || 'Payment verification failed');
            setVerifyingMobile(false);
          }
        } catch (err) {
          setError(err.message);
          setVerifyingMobile(false);
        }
      }, 5000);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('+237 ')) {
      value = '+237 ';
    }
    const afterPrefix = value.substring(5).replace(/\D/g, '');
    if (afterPrefix.length <= 9) {
      setPhoneNumber('+237 ' + afterPrefix);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={onClose}>×</button>
        
        <div className="payment-modal-header">
          <div className="payment-modal-logo">
            <span className="logo-icon">💎</span>
            <span className="logo-text">WaaS</span>
          </div>
          <h2>Upgrade to Premium</h2>
          <p>Unlock all premium features with the Premium Plan.</p>
        </div>

        {success ? (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Your subscription has been activated.</p>
          </div>
        ) : (
          <>
            <div className="payment-tabs">
              <button
                className={`payment-tab ${activeTab === 'card' ? 'active' : ''}`}
                onClick={() => setActiveTab('card')}
              >
                <span className="tab-icon">💳</span>
                Card Payment
              </button>
              <button
                className={`payment-tab ${activeTab === 'mobile' ? 'active' : ''}`}
                onClick={() => setActiveTab('mobile')}
              >
                <span className="tab-icon">📱</span>
                Mobile Money
              </button>
            </div>

            <div className="plan-summary">
              You're upgrading to the {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${planDetails.amount} / {planDetails.period})
            </div>

            {error && <div className="payment-error">{error}</div>}

            {activeTab === 'card' ? (
              <form onSubmit={handleCardPayment} className="payment-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <div className="card-input-wrapper">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      required
                      disabled={loading}
                    />
                    <div className="card-icons">
                      {getCardType() === 'visa' && <span className="card-icon visa">VISA</span>}
                      {getCardType() === 'mastercard' && <span className="card-icon mastercard">●●●</span>}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM / YY"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <div className="cvc-input-wrapper">
                      <input
                        type="text"
                        value={cvc}
                        onChange={handleCvcChange}
                        placeholder="123"
                        required
                        disabled={loading}
                      />
                      <span className="cvc-icon">●●●</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="pay-button" disabled={loading}>
                  {loading ? 'Processing...' : `Pay $${planDetails.amount}`}
                </button>

                <div className="payment-security">
                  <span className="lock-icon">🔒</span>
                  <span>Secured by</span>
                  <span className="visa-badge">VISA</span>
                  <span className="mastercard-badge">●●●</span>
                  <span className="stripe-badge">stripe</span>
                </div>
                <p className="payment-note">
                  Your payment is securely processed by Stripe. Coming soon.
                </p>
              </form>
            ) : (
              <form onSubmit={handleMobileMoneyPayment} className="payment-form">
                {mobileInstructions ? (
                  <div className="mobile-instructions">
                    <div className="instructions-icon">📱</div>
                    <p>{mobileInstructions.message}</p>
                    <div className="instructions-details">
                      {mobileInstructions.instructions}
                    </div>
                    {verifyingMobile && (
                      <div className="verifying-spinner">
                        <span className="spinner"></span>
                        Verifying payment...
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Phone number</label>
                      <div className="phone-input-wrapper">
                        <span className="phone-flag">🇨🇲</span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          placeholder="+237 650 123 456"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Select Mobile Network</label>
                      <div className="network-options">
                        <button
                          type="button"
                          className={`network-option ${selectedNetwork === 'orange' ? 'selected' : ''}`}
                          onClick={() => setSelectedNetwork('orange')}
                        >
                          <span className="network-logo orange-logo">🟠</span>
                          <span>Orange Money</span>
                        </button>
                        <button
                          type="button"
                          className={`network-option ${selectedNetwork === 'mtn' ? 'selected' : ''}`}
                          onClick={() => setSelectedNetwork('mtn')}
                        >
                          <span className="network-logo mtn-logo">🟡</span>
                          <span>MTN Mobile Money</span>
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="pay-button" disabled={loading}>
                      {loading ? 'Sending Request...' : 'Pay with Mobile Money'}
                    </button>

                    <p className="payment-note">
                      Follow the instructions sent to your phone to authorize the payment.
                    </p>
                  </>
                )}
              </form>
            )}

            <div className="payment-footer">
              <div className="footer-item">
                <span className="check-icon">✓</span>
                You will be charged ${planDetails.amount} today and every {planDetails.period} until cancelled
              </div>
              <div className="footer-security">
                {activeTab === 'card' ? (
                  <>
                    <span className="shield-icon">🛡️</span>
                    Secured payments via <strong>Stripe</strong>
                  </>
                ) : (
                  <>
                    <span className="shield-icon">🛡️</span>
                    Safe mobile money transactions
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
