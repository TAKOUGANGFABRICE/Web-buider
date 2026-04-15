import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';
import './Billing.css';

const API_URL = 'http://localhost:8000/api';

const Billing = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchBillingData();
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(`${API_URL}/billing-plans/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const monthlyPlans = data.filter(plan => plan.billing_period === 'monthly' && plan.is_active);
        setPlans(monthlyPlans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

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
      
      // Fetch user billing plan
      const billingResponse = await fetch('http://localhost:8000/api/billing/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        if (billingData.plan) {
          setSubscription(prev => ({
            ...prev,
            plan: billingData.plan.name?.toLowerCase() || 'free',
            planDetails: billingData.plan
          }));
        }
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

  const handleUpgrade = async (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccessMessage(true);
    fetchBillingData();
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('http://localhost:8000/api/subscription/cancel/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchBillingData();
        setConfirmDialog(null);
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    }
    setCancelLoading(false);
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

      {error && <div className="error-banner">{error}</div>}

      {/* Current Subscription */}
      <div className="billing-section">
        <h2>Current Subscription</h2>
        {subscription && (
          <div className="subscription-card">
            <div className="subscription-info">
              <div className="plan-badge">
                <span className={`plan-icon plan-${typeof subscription.plan === 'string' ? subscription.plan : 'free'}`}>
                  {(typeof subscription.plan === 'string' ? subscription.plan : 'free') === 'free' ? '🆓' : (typeof subscription.plan === 'string' ? subscription.plan : 'free') === 'premium' ? '💎' : '🏢'}
                </span>
                <div>
                  <h3>{(typeof subscription.plan === 'string' ? subscription.plan : 'Free').charAt(0).toUpperCase() + (typeof subscription.plan === 'string' ? subscription.plan : 'Free').slice(1)} Plan</h3>
                  {getSubscriptionStatusBadge(subscription.status)}
                </div>
              </div>
              
              {(typeof subscription.plan === 'string' ? subscription.plan : 'free') !== 'free' && (
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
                    <button className="btn-cancel" onClick={() => setConfirmDialog({
                      title: 'Cancel Subscription?',
                      message: `Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period (${subscription && formatDate(subscription.current_period_end)}).`,
                      confirmText: 'Cancel Subscription',
                      cancelText: 'Keep Subscription',
                      onConfirm: handleCancelSubscription
                    })}>
                      Cancel Subscription
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Plans - Fetched from API */}
      <div className="billing-section">
        <h2>Subscription Plans</h2>
        <p className="section-subtitle">Choose a plan that works for you. Pay with Card or Mobile Money.</p>
        
        {plans.length === 0 ? (
          <div className="loading-plans">
            <div className="spinner"></div>
            <p>Loading plans...</p>
          </div>
        ) : (
          <div className="pricing-plans">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`pricing-card ${plan.is_popular ? 'featured' : ''}`}
              >
                {plan.is_popular && <div className="popular-badge">Most Popular</div>}
                <div className="pricing-header">
                  <h3>{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="price">
                      {parseFloat(plan.price) === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    <span className="period">
                      {parseFloat(plan.price) > 0 ? `/${plan.billing_period}` : ''}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="plan-description">{plan.description}</p>
                  )}
                </div>
                <ul className="pricing-features">
                  <li>
                    {plan.max_websites === -1 ? '✓ Unlimited websites' : `✓ Up to ${plan.max_websites} websites`}
                  </li>
                  {plan.can_use_custom_domain && <li>✓ Custom domains</li>}
                  {plan.can_remove_branding && <li>✓ Remove branding</li>}
                  {plan.can_access_api && <li>✓ API access</li>}
                  {plan.can_have_team_members && (
                    <li>
                      {plan.max_team_members === -1 
                        ? '✓ Unlimited team members' 
                        : `✓ Up to ${plan.max_team_members} team members`}
                    </li>
                  )}
                  {plan.has_priority_support && <li>✓ Priority support</li>}
                  {plan.has_analytics && <li>✓ Analytics</li>}
                  {plan.has_white_label && <li>✓ White-label</li>}
                </ul>
                {subscription?.planDetails?.name?.toLowerCase() === plan.name.toLowerCase() ? (
                  <button className="btn-select-plan current-plan" disabled>
                    Current Plan
                  </button>
                ) : parseFloat(plan.price) === 0 ? (
                  <button className="btn-select-plan" onClick={() => handleUpgrade(plan)}>
                    Select Free
                  </button>
                ) : (
                  <button className={`btn-select-plan ${plan.is_popular ? 'btn-featured' : ''}`} onClick={() => handleUpgrade(plan)}>
                    {parseFloat(plan.price) < parseFloat(subscription?.planDetails?.price || 0) ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Cancel Confirmation Modal */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button className="btn-danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal 
          isOpen={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
          plan={selectedPlan}
        />
      )}
    </div>
  );
};

export default Billing;
