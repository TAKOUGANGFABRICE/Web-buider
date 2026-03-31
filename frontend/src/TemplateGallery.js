import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './TemplateGallery.css';

const TemplateGallery = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'business', label: 'Business' },
    { value: 'ecommerce', label: 'E-Commerce' },
    { value: 'blog', label: 'Blog' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'education', label: 'Education' },
    { value: 'nonprofit', label: 'Non-Profit' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [category, filter]);

  const fetchTemplates = async () => {
    try {
      let url = 'http://localhost:8000/api/templates/';
      const params = new URLSearchParams();
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      if (filter === 'free') {
        params.append('free', 'true');
      } else if (filter === 'premium') {
        params.append('premium', 'true');
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (template) => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    setSelectedTemplate(template);

    try {
      const response = await fetch('http://localhost:8000/api/templates/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ template_id: template.id })
      });

      const data = await response.json();

      if (response.ok) {
        if (template.is_free || data.payment_status === 'completed') {
          alert('Template added to your account! You can now customize it.');
          navigate('/dashboard');
        } else {
          // Handle paid template purchase - redirect to payment
          alert('Redirecting to payment...');
          // Here you would integrate with payment modal
        }
      } else {
        alert(data.error || 'Failed to purchase template');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setPurchasing(false);
      setSelectedTemplate(null);
    }
  };

  const formatPrice = (template) => {
    if (template.is_free) return 'Free';
    return `$${parseFloat(template.price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="gallery-loading">
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>Template Gallery</h1>
        <p>Choose from our collection of professionally designed templates</p>
      </div>

      <div className="gallery-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="free">Free Only</option>
            <option value="premium">Premium Only</option>
          </select>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="gallery-empty">
          <span className="empty-icon">🖼️</span>
          <p>No templates found in this category</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-preview">
                {template.preview_image ? (
                  <img src={template.preview_image} alt={template.name} />
                ) : (
                  <div className="preview-placeholder">
                    <span>🖼️</span>
                  </div>
                )}
                <div className="template-badges">
                  {template.is_free && <span className="badge badge-free">Free</span>}
                  {template.is_premium && <span className="badge badge-premium">Premium</span>}
                </div>
              </div>
              
              <div className="template-info">
                <h3>{template.name}</h3>
                <p className="template-category">
                  {categories.find(c => c.value === template.category)?.label || template.category}
                </p>
                <p className="template-description">{template.description}</p>
                
                {template.tags && template.tags.length > 0 && (
                  <div className="template-tags">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                
                <div className="template-footer">
                  <span className="template-price">{formatPrice(template)}</span>
                  <button 
                    className="btn-use-template"
                    onClick={() => handlePurchase(template)}
                    disabled={purchasing && selectedTemplate?.id === template.id}
                  >
                    {purchasing && selectedTemplate?.id === template.id ? 'Processing...' : 'Use Template'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
