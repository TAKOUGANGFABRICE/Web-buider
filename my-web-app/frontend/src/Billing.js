import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentModal from './PaymentModal';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailed from './PaymentFailed';
import PaymentHistory from './PaymentHistory';
import Invoices from './Invoices';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import './Billing.css';

const API_URL = '/api';

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBillingData();
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const failed = searchParams.get('failed');
    const tx_ref = searchParams.get('tx_ref');

    if (success === 'true') {
      verifyPayment(tx_ref);
    } else if (failed === 'true') {
      setPaymentResult({ status: 'failed', reason: searchParams.get('reason') || 'Payment failed' });
      setShowPaymentFailed(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access');

      const [subRes, invoicesRes, methodsRes, paymentsRes, plansRes] = await Promise.all([
        fetch('/api/subscription/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/invoices/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/payment-methods/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/payments/history/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/billing-plans/', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const subData = subRes.ok ? await subRes.json() : null;
      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : [];
      const methodsData = methodsRes.ok ? await methodsRes.json() : [];
      const [paymentsData] = paymentsRes.ok ? await paymentsRes.json() : [];
      const plansData = plansRes.ok ? await plansRes.json() : [];

      setSubscription(subData);
      setInvoices(invoicesData);
      setPaymentMethods(methodsData);
      setPayments(paymentsData);
      setPlans(plansData.filter(p => p.billing_period === 'monthly' && p.is_active));
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (tx_ref) => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/flutterwave/verify/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx_ref }),
      });

      const data = await response.json();
      if (data.success && data.status === 'successful') {
        setPaymentResult({
          status: 'success',
          transaction_id: data.transaction_id,
          amount: data.amount,
          plan: selectedPlan?.name || 'Premium',
        });
        setShowPaymentSuccess(true);
      }
      setSearchParams({});
    } catch (err) {
      setPaymentResult({ status: 'failed', reason: err.message });
      setShowPaymentFailed(true);
    }
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const setDefaultPaymentMethod = async (methodId) => {
    const token = localStorage.getItem('access');
    await fetch(`/api/payment-methods/${methodId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_default: true }),
    });
    fetchBillingData();
  };

  const removePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;
    const token = localStorage.getItem('access');
    await fetch(`/api/payment-methods/${methodId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    fetchBillingData();
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/subscription/cancel/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchBillingData();
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

  if (loading) {
    return (
      <div className="billing-page">
        <div className="billing-container">
          <div className="billing-loading">
            <div className="spinner"></div>
            <p>Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  const planDisplay = subscription?.plan || 'free';
  const planDetails = plans.find(p => p.slug?.toLowerCase() === planDisplay.toLowerCase());
  const websitesCount = payments.filter(p => p.status === 'completed').length || 0;

  return (
    <div className="billing-page">
      <div className="billing-container">

        <div className="billing-header">
          <div className="billing-header-left">
            <h1>Billing & Subscription</h1>
            <p>Manage plans, payments, invoices, and subscriptions</p>
          </div>
          <div className="billing-header-actions">
            {planDetails && planDetails.price > 0 && (
              <button className="btn-header-outline" onClick={() => handleUpgrade(planDetails)}>
                Upgrade Plan
              </button>
            )}
            <button className="btn-header" onClick={() => navigate('/billing/history')}>
              Payment History
            </button>
            <button className="btn-header-outline" onClick={() => navigate('/billing/invoices')}>
              Download Invoice
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="bills-card-grid">
          <div className="billing-card current-subscription">
            <div className="card-header-row">
              <h2>Current Subscription</h2>
              {subscription && (
                <span className={`status-badge ${subscription.status || 'active'}`}>
                  {subscription.status || 'active'}
                </span>
              )}
            </div>

            {planDetails ? (
              <>
                <div className="current-plan-display">
                  <h3>{planDetails.name} Plan</h3>
                  <div className="plan-price-large">{formatCurrency(planDetails.price, 'USD')}<span>/month</span></div>
                </div>

                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="detail-label">Renewal Date</span>
                    <span className="detail-value">
                      {subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Websites Used</span>
                    <span className="detail-value">
                      {websitesCount} / {planDetails.max_websites === -1 ? 'Unlimited' : planDetails.max_websites}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Storage Used</span>
                    <span className="detail-value">
                      {Math.round((websitesCount * 5) / 10)}GB / {planDetails.disk_space_gb === -1 ? 'Unlimited' : `${planDetails.disk_space_gb}GB`}
                    </span>
                  </div>
                </div>

                <div className="subscription-actions">
                  <button className="btn btn-primary" onClick={() => handleUpgrade(planDetails)}>
                    Upgrade Plan
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowAddPaymentMethod(true)}>
                    Change Plan
                  </button>
                  {subscription?.status === 'active' && planDetails.price > 0 && (
                    <button className="btn btn-danger" onClick={handleCancelSubscription}>
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="detail-row">
                <span className="detail-label">Plan</span>
                <span className="detail-value">Free Plan</span>
              </div>
            )}
          </div>
        </div>

        <div className="billing-card">
          <div className="card-header-row">
            <h2>Subscription Plans</h2>
            <span className="billing-cycle">Monthly billing</span>
          </div>

          <div className="plans-container">
            {plans.map((plan) => {
              const isCurrent = plan.slug?.toLowerCase() === planDisplay.toLowerCase();
              const isPopular = plan.price === 29;

              return (
                <div
                  key={plan.id}
                  className={`plan-card ${isPopular ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  {isPopular && <div className="popular-tag">Popular</div>}
                  {isCurrent && <div className="current-tag">Current</div>}

                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      {plan.price > 0 && <span>/month</span>}
                    </div>
                  </div>

                  <ul className="plan-features">
                    <li>
                      <span className="feature-check">✓</span>
                      <span>{plan.max_websites === -1 ? 'Unlimited websites' : `Up to ${plan.max_websites} websites`}</span>
                    </li>
                    {plan.can_use_custom_domain && (
                      <li><span className="feature-check">✓</span><span>Custom Domains</span></li>
                    )}
                    {plan.can_remove_branding && (
                      <li><span className="feature-check">✓</span><span>Remove Branding</span></li>
                    )}
                    {plan.has_analytics && (
                      <li><span className="feature-check">✓</span><span>Advanced Analytics</span></li>
                    )}
                    {plan.can_have_team_members && (
                      <li><span className="feature-check">✓</span><span>Team Collaboration</span></li>
                    )}
                    {plan.has_priority_support && (
                      <li><span className="feature-check">✓</span><span>Priority Support</span></li>
                    )}
                  </ul>

                  <button
                    className={`btn-select-plan ${isCurrent ? 'current' : isPopular ? 'primary' : 'secondary'}`}
                    onClick={() => !isCurrent && handleUpgrade(plan)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="billing-card">
          <div className="card-header-row">
            <h2>Payment Methods</h2>
            <button className="btn-add" onClick={() => setShowAddPaymentMethod(true)}>
              + Add New
            </button>
          </div>

          <div className="payment-methods-list">
            {paymentMethods.length === 0 ? (
              <div className="empty-state">
                <p>No payment methods saved. Add a payment method for faster checkout.</p>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <div key={method.id} className={`payment-method-card ${method.is_default ? 'default' : ''}`}>
                  <div className="payment-method-info">
                    <div className={`provider-logo ${method.provider}`}>
                      {method.provider === 'mtn' && '📱'}
                      {method.provider === 'orange' && '🍊'}
                      {method.provider === 'visa' && '💳'}
                      {method.provider === 'mastercard' && '💳'}
                      {method.provider === 'flutterwave_voucher' && '🎫'}
                    </div>
                    <div>
                      <div className="payment-method-title">
                        {method.provider === 'mtn' && 'MTN Mobile Money'}
                        {method.provider === 'orange' && 'Orange Money'}
                        {method.provider === 'visa' && 'Visa'}
                        {method.provider === 'mastercard' && 'MasterCard'}
                        {method.provider === 'flutterwave_voucher' && 'Virtual Card'}
                      </div>
                      <div className="payment-method-subtitle">
                        {method.masked_number || method.phone_number}
                        {method.expiry_month && ` • Expires ${method.expiry_month}/${method.expiry_year}`}
                      </div>
                    </div>
                  </div>

                  <div className="payment-method-actions">
                    {method.is_default ? (
                      <span className="badge-default">Default</span>
                    ) : (
                      <button
                        className="btn-set-default"
                        onClick={() => setDefaultPaymentMethod(method.id)}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      className="btn-remove"
                      onClick={() => removePaymentMethod(method.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="billing-cards-row">
          <div className="billing-card">
            <h2>Billing Summary</h2>
            <div className="summary-row">
              <span>Current Plan</span>
              <span>{planDetails?.name || 'Free'}</span>
            </div>
            <div className="summary-row">
              <span>Monthly Price</span>
              <span>{planDetails?.price > 0 ? formatCurrency(planDetails.price) : 'Free'}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{planDetails?.price > 0 ? formatCurrency(planDetails.price) : '$0.00'}</span>
            </div>
          </div>

          <div className="billing-card">
            <h2>Recent Payments</h2>
            <div className="recent-payments">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="payment-item">
                  <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                  <span className={`payment-status ${payment.status}`}>{payment.status}</span>
                  <span className="payment-date">{formatDate(payment.created_at)}</span>
                </div>
              ))}
              {payments.length === 0 && <p>No recent payments</p>}
            </div>
          </div>
        </div>

        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            plan={selectedPlan}
            onSuccess={(result) => {
              setPaymentResult(result);
              setShowPaymentSuccess(true);
            }}
          />
        )}

        {showAddPaymentMethod && (
          <AddPaymentMethodModal
            isOpen={showAddPaymentMethod}
            onClose={() => setShowAddPaymentMethod(false)}
            onSuccess={fetchBillingData}
          />
        )}

        {showPaymentSuccess && (
          <PaymentSuccess
            isOpen={showPaymentSuccess}
            onClose={() => setShowPaymentSuccess(false)}
            result={paymentResult}
          />
        )}

        {showPaymentFailed && (
          <PaymentFailed
            isOpen={showPaymentFailed}
            onClose={() => setShowPaymentFailed(false)}
            result={paymentResult}
          />
        )}
      </div>
    </div>
  );
};

export default Billing;