import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './PlanSelection.css';

const API_URL = 'http://localhost:8000/api';

const PlanSelection = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/billing-plans/`);
      if (response.ok) {
        const data = await response.json();
        const monthlyPlans = data.filter(plan => plan.billing_period === 'monthly');
        setPlans(monthlyPlans);
      } else {
        setPlans(getFallbackPlans());
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans(getFallbackPlans());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPlans = () => [
    { id: 1, name: 'Free', price: '0.00', billing_period: 'monthly', description: 'Perfect for getting started', max_websites: 1, can_use_custom_domain: false, can_remove_branding: false, can_access_api: false, can_have_team_members: false, max_team_members: 0, has_priority_support: false, has_analytics: false, has_white_label: false, can_order_custom_template: false, is_popular: false },
    { id: 2, name: 'Basic', price: '9.99', billing_period: 'monthly', description: 'Great for personal websites', max_websites: 3, can_use_custom_domain: true, can_remove_branding: false, can_access_api: false, can_have_team_members: false, max_team_members: 0, has_priority_support: false, has_analytics: true, has_white_label: false, can_order_custom_template: false, is_popular: false },
    { id: 3, name: 'Pro', price: '29.99', billing_period: 'monthly', description: 'For growing businesses', max_websites: 10, can_use_custom_domain: true, can_remove_branding: true, can_access_api: true, can_have_team_members: true, max_team_members: 5, has_priority_support: true, has_analytics: true, has_white_label: false, can_order_custom_template: true, is_popular: true },
    { id: 4, name: 'Enterprise', price: '99.99', billing_period: 'monthly', description: 'For large organizations', max_websites: -1, can_use_custom_domain: true, can_remove_branding: true, can_access_api: true, can_have_team_members: true, max_team_members: -1, has_priority_support: true, has_analytics: true, has_white_label: true, can_order_custom_template: true, is_popular: false },
  ];

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan.id);
    setProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await authenticatedFetch(`${API_URL}/billing/select/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      
      if (response.ok) {
        setSuccessMessage(`You have selected the ${plan.name} plan!`);
        localStorage.setItem('has_selected_plan', 'true');
        localStorage.setItem('selected_plan_id', plan.id.toString());
        localStorage.setItem('selected_plan_name', plan.name);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to select plan. Please try again.');
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('has_selected_plan', 'true');
    localStorage.setItem('selected_plan_id', '1');
    navigate('/dashboard');
  };

  const getFeatureIcon = (value) => {
    if (value === true) return '✓';
    if (value === false) return '✗';
    return value;
  };

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('free')) return '🚀';
    if (name.includes('basic')) return '📦';
    if (name.includes('pro')) return '⭐';
    if (name.includes('enterprise')) return '🏢';
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
      <div className="plan-header animate-fade-in-up">
        <div className="auth-logo">
          <span className="auth-logo-icon">💎</span>
          <span className="auth-logo-text">WaaS</span>
        </div>
        <span className="header-badge">✨ Choose Your Perfect Plan</span>
        <h1>Choose Your Plan</h1>
        <p>Select a billing plan to unlock the full potential of your website builder journey</p>
      </div>

      {error && (
        <div className="plan-error animate-fade-in">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="plan-success animate-fade-in">
          {successMessage}
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`plan-card animate-fade-in-up ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => !processing && setSelectedPlan(plan.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {plan.is_popular && <span className="plan-badge">Most Popular</span>}
            
            <div className="plan-card-header">
              <span className="plan-icon">{getPlanIcon(plan.name)}</span>
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">
                  ${parseFloat(plan.price || 0).toFixed(2)}
                  {parseFloat(plan.price || 0) > 0 && <span>/mo</span>}
                </span>
              </div>
              {plan.description && (
                <p className="plan-description">{plan.description}</p>
              )}
            </div>

            <div className="plan-features">
              <div className="feature-item">
                <span className="feature-icon">🖥️</span>
                <span>Hosting: {plan.hosting_type === 'shared' ? 'Shared' : plan.hosting_type === 'vps' ? 'VPS' : plan.hosting_type === 'dedicated' ? 'Dedicated' : plan.hosting_type === 'cloud' ? 'Cloud' : plan.hosting_type}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💾</span>
                <span>Disk Space: {plan.disk_space_gb === -1 ? 'Unlimited' : `${plan.disk_space_gb} GB`}</span>
              </div>
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
                <span>Team Members: {plan.max_team_members === -1 ? 'Unlimited' : plan.max_team_members || 0}</span>
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
        <button onClick={handleSkip}>
          Skip for now (Free plan)
        </button>
        <p>All plans include a 14-day money-back guarantee</p>
        <div className="guarantee-badge">
          <span>🛡️</span>
          <span>30-Day Money-Back Guarantee</span>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;