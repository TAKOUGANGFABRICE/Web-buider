import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlanSelection.css';

const PlanSelection = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/billing-plans/');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan.id);
    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('access');
      const response = await fetch('http://localhost:8000/api/billing/select/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: plan.id })
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to select plan');
        setSelectedPlan(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSelectedPlan(null);
    }
    
    setProcessing(false);
  };

  const getFeatureIcon = (value) => {
    if (value === true) return '✓';
    if (value === false) return '✗';
    return value;
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('starter')) return '🚀';
    if (name.includes('pro')) return '⭐';
    if (name.includes('business') || name.includes('enterprise')) return '🏢';
    return '📦';
  };

  if (loading) {
    return (
      <div className="plan-selection-page">
        <div className="plan-loading">
          <div className="spinner"></div>
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-selection-page">
      <div className="plan-header">
        <div className="auth-logo">
          <span className="auth-logo-icon">💎</span>
          <span className="auth-logo-text">WaaS</span>
        </div>
        <h1>Choose Your Plan</h1>
        <p>Select a billing plan to get started with your website builder</p>
      </div>

      {error && <div className="plan-error">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => !processing && setSelectedPlan(plan.id)}
          >
            <div className="plan-card-header">
              <span className="plan-icon">{getPlanIcon(plan.name)}</span>
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">${parseFloat(plan.price).toFixed(2)}</span>
                <span className="period">/{plan.billing_period}</span>
              </div>
              {plan.description && (
                <p className="plan-description">{plan.description}</p>
              )}
            </div>

            <div className="plan-features">
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.max_websites === -1 ? '∞' : plan.max_websites)}</span>
                <span>Max Websites: {plan.max_websites === -1 ? 'Unlimited' : plan.max_websites}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.can_use_custom_domain)}</span>
                <span>Custom Domain</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.can_remove_branding)}</span>
                <span>Remove Branding</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.can_access_api)}</span>
                <span>API Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.can_have_team_members)}</span>
                <span>Team Members: {plan.max_team_members || 0}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.has_priority_support)}</span>
                <span>Priority Support</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.has_analytics)}</span>
                <span>Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.has_white_label)}</span>
                <span>White Label</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">{getFeatureIcon(plan.can_order_custom_template)}</span>
                <span>Custom Template Orders</span>
              </div>
            </div>

            <button 
              className={`btn-select-plan ${selectedPlan === plan.id ? 'btn-selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePlanSelect(plan);
              }}
              disabled={processing}
            >
              {processing && selectedPlan === plan.id ? 'Processing...' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="plan-footer">
        <p>All plans include a 14-day money-back guarantee</p>
      </div>
    </div>
  );
};

export default PlanSelection;
