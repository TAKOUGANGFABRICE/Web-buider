import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderTemplate.css';

const OrderTemplate = () => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('custom_design');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [canOrder, setCanOrder] = useState(false);

  const orderTypes = [
    { value: 'custom_design', label: 'Custom Design', icon: '🎨', description: 'Get a fully custom website design tailored to your needs' },
    { value: 'template_customization', label: 'Template Customization', icon: '✨', description: 'Customize an existing template to match your brand' },
    { value: 'modification', label: 'Modification Request', icon: '🔧', description: 'Request changes or additions to an existing website' },
  ];

  useEffect(() => {
    checkUserPlan();
  }, []);

  const checkUserPlan = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/billing/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPlan(data);
        
        if (data.plan && data.plan.can_order_custom_template) {
          setCanOrder(true);
        } else {
          setCanOrder(false);
          setError('Your current plan does not support custom template orders. Please upgrade to access this feature.');
        }
      }
    } catch (err) {
      setError('Failed to verify your subscription. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access');
      const response = await fetch('http://localhost:8000/api/template-orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_type: orderType,
          title,
          description,
          requirements
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        // In a real app, you would show invoice details here
        setTimeout(() => {
          navigate('/billing');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit order');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="order-template-page">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h2>Order Submitted Successfully!</h2>
          <p>Your custom template order has been received. We will review your requirements and send you an invoice shortly.</p>
          <p>Redirecting to billing page...</p>
        </div>
      </div>
    );
  }

  if (!canOrder) {
    return (
      <div className="order-template-page">
        <div className="order-restricted">
          <div className="restricted-icon">🔒</div>
          <h2>Upgrade Required</h2>
          <p>{error}</p>
          <button className="btn-upgrade-plan" onClick={() => navigate('/billing')}>
            View Available Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-template-page">
      <div className="order-header">
        <h1>Order Custom Template</h1>
        <p>Request a custom website design or template customization</p>
      </div>

      {error && <div className="order-error">{error}</div>}

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="order-types">
          <label>Order Type</label>
          <div className="order-types-grid">
            {orderTypes.map((type) => (
              <div
                key={type.value}
                className={`order-type-card ${orderType === type.value ? 'selected' : ''}`}
                onClick={() => setOrderType(type.value)}
              >
                <span className="type-icon">{type.icon}</span>
                <h4>{type.label}</h4>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="title">Project Title</label>
          <input
            type="text"
            id="title"
            placeholder="e.g., E-commerce Website for Fashion Brand"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows="4"
            placeholder="Describe your project in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Additional Requirements (Optional)</label>
          <textarea
            id="requirements"
            rows="3"
            placeholder="Any specific features, colors, or functionality you need..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </div>

        <div className="form-info">
          <h4>What happens next?</h4>
          <ol>
            <li>Our team will review your request</li>
            <li>We'll send you a detailed quote via email</li>
            <li>Upon approval, an invoice will be generated</li>
            <li>Once paid, work will begin on your custom template</li>
          </ol>
        </div>

        <button type="submit" className="btn-submit-order" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Order Request'}
        </button>
      </form>
    </div>
  );
};

export default OrderTemplate;
