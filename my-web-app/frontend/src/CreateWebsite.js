import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './CreateWebsite.css';

const CATEGORY_GRADIENTS = {
  business: ['#2563eb', '#1d4ed8'],
  portfolio: ['#8b5cf6', '#6366f1'],
  ecommerce: ['#ec4899', '#be185d'],
  blog: ['#14b8a6', '#0d9488'],
  landing: ['#f59e0b', '#d97706'],
  restaurant: ['#ef4444', '#dc2626'],
  real_estate: ['#10b981', '#059669'],
  education: ['#3b82f6', '#2563eb'],
  nonprofit: ['#f97316', '#ea580c'],
};

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🌐' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'portfolio', label: 'Portfolio', icon: '🎨' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
  { value: 'blog', label: 'Blog', icon: '📝' },
  { value: 'landing', label: 'Landing', icon: '🚀' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'nonprofit', label: 'Non-Profit', icon: '❤️' },
];

const BUILT_IN_TEMPLATES = [
  { id: 'business', name: 'Business', category: 'business', description: 'Professional business website', icon: '💼' },
  { id: 'portfolio', name: 'Portfolio', category: 'portfolio', description: 'Showcase your work', icon: '🎨' },
  { id: 'ecommerce', name: 'E-commerce', category: 'ecommerce', description: 'Online store', icon: '🛍️' },
  { id: 'blog', name: 'Blog', category: 'blog', description: 'Content blog', icon: '📝' },
  { id: 'landing', name: 'Landing Page', category: 'landing', description: 'Product landing', icon: '🚀' },
  { id: 'restaurant', name: 'Restaurant', category: 'restaurant', description: 'Restaurant website', icon: '🍽️' },
  { id: 'real_estate', name: 'Real Estate', category: 'real_estate', description: 'Property listings', icon: '🏠' },
  { id: 'education', name: 'Education', category: 'education', description: 'Learning platform', icon: '📚' },
  { id: 'nonprofit', name: 'Non-Profit', category: 'nonprofit', description: 'Charity website', icon: '❤️' },
  { id: 'scratch', name: 'From Scratch', category: 'other', description: 'Start with blank canvas', icon: '✨' },
];

function CreateWebsite() {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('business');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbTemplates, setDbTemplates] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticatedFetch } = useAuth();

  const templateId = searchParams.get('template');

  useEffect(() => {
    fetchDbTemplates();
    if (templateId) {
      setSelectedTemplate(templateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDbTemplates = async () => {
    try {
      const response = await fetch('/api/crud/templates/crud/');
      if (response.ok) {
        const data = await response.json();
        setDbTemplates(data);
      }
    } catch (err) {
      console.log('No DB templates');
    }
  };

  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...dbTemplates.map(t => ({
      id: `db-${t.id}`,
      name: t.name,
      category: t.category || 'other',
      description: t.description,
      icon: t.preview_image ? '🖼️' : '📄',
      isPremium: t.is_premium,
      isFree: t.is_free,
    }))
  ];

  const filteredTemplates = allTemplates
    .filter(t => category === 'all' || t.category === category)
    .filter(t => searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        name,
        template_used_id: selectedTemplate,
        is_scratch: selectedTemplate === 'scratch',
      };

      const response = await authenticatedFetch('/api/websites/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/builder?id=${data.id}`);
      }
    } catch (err) {
      console.error('Error creating website:', err);
    }

    setLoading(false);
  };

  return (
    <div className="create-page">
      <header className="create-header">
        <h1>Create New Website</h1>
      </header>

      <div className="create-content">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Website Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Awesome Website"
            />
          </div>

          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                className={category === cat.value ? 'active' : ''}
                onClick={() => setCategory(cat.value)}
              >
                <span className="cat-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Templates</label>
            <div className="templates-grid">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${template.isPremium ? 'premium' : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  {template.isPremium && <span className="premium-badge">PREMIUM</span>}
                  <div
                    className="template-preview"
                    style={{
                      background: template.category && CATEGORY_GRADIENTS[template.category]
                        ? `linear-gradient(135deg, ${CATEGORY_GRADIENTS[template.category][0]} 0%, ${CATEGORY_GRADIENTS[template.category][1]} 100%)`
                        : '#f1f5f9'
                    }}
                  >
                    <span className="template-icon">{template.icon}</span>
                  </div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !name}>
            {loading ? 'Creating...' : 'Create Website'}
          </button>
        </form>
      </div>

    </div>
  );
}

export default CreateWebsite;