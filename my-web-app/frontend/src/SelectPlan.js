import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './SelectPlan.css';

function SelectPlan() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing-plans/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const monthlyPlans = data.filter(plan => plan.billing_period === 'monthly' && plan.is_active);
        setPlans(monthlyPlans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      // Fallback to hardcoded plans if API fails
      setPlans([
        { id: 1, slug: 'free', name: 'Free', price: '0' },
        { id: 2, slug: 'starter', name: 'Starter', price: '9' },
        { id: 3, slug: 'pro', name: 'Pro', price: '29' },
      ]);
    }
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    
    try {
      const response = await authenticatedFetch('/api/billing/select/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlan })
      });

      if (response.ok) {
        localStorage.setItem('has_selected_plan', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
    }
    
    setLoading(false);
  };

  return (
    <div className="select-plan-page">
      <header className="select-header">
        <h1>Choose Your Plan</h1>
        <p>Select a plan to start building your website</p>
      </header>

      <div className="plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <h3>{plan.name}</h3>
            <div className="plan-price">${plan.price}<span>/month</span></div>
            <ul className="features-list">
              {plan.max_websites === -1 ? (
                <li>✓ Unlimited websites</li>
              ) : (
                <li>✓ Up to {plan.max_websites} websites</li>
              )}
              {plan.can_use_custom_domain && <li>✓ Custom domains</li>}
              {plan.has_analytics && <li>✓ Analytics</li>}
            </ul>
          </div>
        ))}
      </div>

      <button 
        className="btn btn-primary"
        onClick={handleSelectPlan}
        disabled={!selectedPlan || loading}
      >
        {loading ? 'Saving...' : 'Get Started'}
      </button>
    </div>
  );
}

export default SelectPlan;