import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaymentModal from './PaymentModal';
import './Billing.css';

const Billing = () => {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');

  useEffect(() => {
    fetchBillingData();
    
    if (successParam === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successParam]);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('access');
      
      // Fetch subscription
      const subResponse = await fetch('http://localhost:8000/api/subscription/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }
      
      // Fetch invoices
      const invResponse = await fetch('http://localhost:8000/api/invoices/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (invResponse.ok) {
        const invData = await invResponse.json();
        setInvoices(invData);
      }
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('http://localhost:8000/api/subscription/cancel/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchBillingData();
        setShowCancelModal(false);
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'status-paid',
      open: 'status-open',
      draft: 'status-draft',
      void: 'status-void',
      uncollectible: 'status-uncollectible'
    };
    return <span className={`status-badge ${statusClasses[status] || 'status-draft'}`}>{status}</span>;
  };

  const getSubscriptionStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      cancelled: 'status-cancelled',
      past_due: 'status-past-due',
      unpaid: 'status-unpaid'
    };
    return <span className={`status-badge ${statusClasses[status] || 'status-active'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="billing-page">
        <div className="billing-loading">
          <div className="spinner"></div>
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h1>Billing & Subscription</h1>
        <p>Manage your subscription and view your invoices</p>
      </div>

      {showSuccessMessage && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          <span>Payment successful! Your subscription has been upgraded.</span>
          <button onClick={() => setShowSuccessMessage(false)}>×</button>
        </div>
      )}

      {canceledParam === 'true' && (
        <div className="info-banner">
          <span>Payment was canceled. No charges were made.</span>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Current Subscription */}
      <div className="billing-section">
        <h2>Current Subscription</h2>
        {subscription && (
          <div className="subscription-card">
            <div className="subscription-info">
              <div className="plan-badge">
                <span className={`plan-icon plan-${subscription.plan}`}>
                  {subscription.plan === 'free' ? '🆓' : subscription.plan === 'premium' ? '💎' : '🏢'}
                </span>
                <div>
                  <h3>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan</h3>
                  {getSubscriptionStatusBadge(subscription.status)}
                </div>
              </div>
              
              {subscription.plan !== 'free' && (
                <div className="subscription-details">
                  <div className="detail-item">
                    <span className="detail-label">Current Period</span>
                    <span className="detail-value">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Next Billing Date</span>
                    <span className="detail-value">{formatDate(subscription.current_period_end)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="subscription-actions">
              {subscription.plan === 'free' ? (
                <button className="btn-upgrade" onClick={() => handleUpgrade('premium')}>
                  Upgrade to Premium
                </button>
              ) : (
                <>
                  {subscription.status === 'active' && (
                    <button className="btn-cancel" onClick={() => setShowCancelModal(true)}>
                      Cancel Subscription
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      {(!subscription || subscription.plan === 'free') && (
        <div className="billing-section">
          <h2>Upgrade Your Plan</h2>
          <div className="pricing-plans">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Premium</h3>
                <div className="pricing-price">
                  <span className="price">$10</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Unlimited websites</li>
                <li>✓ Custom domains</li>
                <li>✓ Remove WaaS branding</li>
                <li>✓ Premium templates</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="btn-select-plan" onClick={() => handleUpgrade('premium')}>
                Select Premium
              </button>
            </div>
            
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Business</h3>
                <div className="pricing-price">
                  <span className="price">$29</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Everything in Premium</li>
                <li>✓ Team collaboration (5 members)</li>
                <li>✓ Advanced analytics</li>
                <li>✓ API access</li>
                <li>✓ Dedicated support</li>
                <li>✓ White-label option</li>
              </ul>
              <button className="btn-select-plan btn-featured" onClick={() => handleUpgrade('business')}>
                Select Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="billing-section">
        <h2>Payment Methods</h2>
        <div className="payment-methods-card">
          <div className="payment-method-item">
            <div className="method-icon">💳</div>
            <div className="method-info">
              <span className="method-name">Credit/Debit Card</span>
              <span className="method-desc">Visa, Mastercard, American Express</span>
            </div>
            <span className="method-status active">Active</span>
          </div>
          <div className="payment-method-item">
            <div className="method-icon">📱</div>
            <div className="method-info">
              <span className="method-name">Mobile Money</span>
              <span className="method-desc">Orange Money, MTN Mobile Money</span>
            </div>
            <span className="method-status active">Active</span>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="billing-section">
        <h2>Invoices</h2>
        {invoices.length === 0 ? (
          <div className="empty-invoices">
            <span className="empty-icon">📄</span>
            <p>No invoices yet</p>
            <span className="empty-desc">Invoices will appear here after your first payment</span>
          </div>
        ) : (
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="invoice-number">{invoice.invoice_number}</td>
                    <td>{formatDate(invoice.created_at)}</td>
                    <td>{invoice.description || 'Subscription payment'}</td>
                    <td className="invoice-amount">
                      {formatCurrency(invoice.amount_due, invoice.currency)}
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>
                      <button className="btn-download" title="Download PDF">
                        📥
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
      />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Subscription?</h3>
            <p>
              Are you sure you want to cancel your subscription? You'll still have access 
              until the end of your current billing period ({subscription && formatDate(subscription.current_period_end)}).
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Keep Subscription
              </button>
              <button className="btn-danger" onClick={handleCancelSubscription}>
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
