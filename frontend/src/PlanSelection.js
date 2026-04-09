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
    // Use hardcoded plans instead of fetching from backend
    const hardcodedPlans = [
      {
        id: 1,
        name: 'Free Starter',
        price: '0.00',
        billing_period: 'month',
        description: 'Perfect for getting started',
        max_websites: 1,
        can_use_custom_domain: false,
        can_remove_branding: false,
        can_access_api: false,
        max_team_members: 0,
        has_priority_support: false,
        has_analytics: false,
        has_white_label: false,
        can_order_custom_template: false,
        can_have_team_members: false
      },
      {
        id: 2,
        name: 'Pro',
        price: '19.99',
        billing_period: 'month',
        description: 'Best for growing businesses',
        max_websites: 5,
        can_use_custom_domain: true,
        can_remove_branding: true,
        can_access_api: true,
        max_team_members: 3,
        has_priority_support: true,
        has_analytics: true,
        has_white_label: false,
        can_order_custom_template: true,
        can_have_team_members: true
      },
      {
        id: 3,
        name: 'Business',
        price: '49.99',
        billing_period: 'month',
        description: 'For agencies and teams',
        max_websites: -1,
        can_use_custom_domain: true,
        can_remove_branding: true,
        can_access_api: true,
        max_team_members: 10,
        has_priority_support: true,
        has_analytics: true,
        has_white_label: true,
        can_order_custom_template: true,
        can_have_team_members: true
      }
    ];
    setPlans(hardcodedPlans);
    setLoading(false);
  }, []);

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan.id);
    setProcessing(true);
    setError('');

    try {
      // Skip backend API call - just save plan selection locally
      localStorage.setItem('has_selected_plan', 'true');
      localStorage.setItem('selected_plan_id', plan.id.toString());
      localStorage.setItem('selected_plan_name', plan.name);
      
      // Small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
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
      <div className="plan-header animate-fade-in-up">
        <div className="auth-logo">
          <span className="auth-logo-icon">💎</span>
          <span className="auth-logo-text">WaaS</span>
        </div>
        <h1>Choose Your Plan</h1>
        <p>Select a billing plan to get started with your website builder</p>
      </div>

      {error && <div className="plan-error animate-fade-in">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`plan-card animate-fade-in-up animate-delay-${index + 1} ${selectedPlan === plan.id ? 'selected' : ''}`}
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
