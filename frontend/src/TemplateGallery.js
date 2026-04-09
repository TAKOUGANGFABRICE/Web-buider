import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TemplateGallery.css';

const categoryGradients = {
  portfolio: ['#667eea', '#764ba2'],
  business: ['#11998e', '#38ef7d'],
  ecommerce: ['#ff9966', '#ff5e62'],
  blog: ['#4facfe', '#00f2fe'],
  landing: ['#fa709a', '#fee140'],
  restaurant: ['#f093fb', '#f5576c'],
  real_estate: ['#4ca1af', '#c4e0e5'],
  education: ['#834d9b', '#d04ed6'],
  nonprofit: ['#96fbc4', '#f9f586'],
  other: ['#667eea', '#764ba2'],
};

const categoryContent = {
  portfolio: {
    heroTitle: 'My Portfolio',
    heroSubtitle: 'Creative Designer & Developer',
    cardTitles: ['Project Alpha', 'Brand Identity', 'Web Design'],
    navLinks: ['Work', 'About', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop',
    logo: 'PORTFOLIO',
  },
  business: {
    heroTitle: 'Grow Your Business',
    heroSubtitle: 'Professional solutions for your needs',
    cardTitles: ['Our Services', 'Why Choose Us', 'Get Started'],
    navLinks: ['Services', 'About', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
    logo: 'BUSINESS',
  },
  ecommerce: {
    heroTitle: 'Shop Now',
    heroSubtitle: 'Amazing products at great prices',
    cardTitles: ['Featured Item', 'Best Seller', 'New Arrival'],
    navLinks: ['Shop', 'Cart', 'Account'],
    cardImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=200&fit=crop',
    logo: 'SHOP',
  },
  blog: {
    heroTitle: 'Our Blog',
    heroSubtitle: 'Latest news and articles',
    cardTitles: ['Blog Post One', 'Recent Article', 'Trending'],
    navLinks: ['Articles', 'Categories', 'Subscribe'],
    cardImages: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba027d1c2a?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=200&fit=crop',
    logo: 'BLOG',
  },
  landing: {
    heroTitle: 'Launch Your Idea',
    heroSubtitle: 'The best solution for your startup',
    cardTitles: ['Feature 1', 'Feature 2', 'Feature 3'],
    navLinks: ['Features', 'Pricing', 'Sign Up'],
    cardImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
    logo: 'STARTUP',
  },
  restaurant: {
    heroTitle: 'Taste Our Food',
    heroSubtitle: 'Delicious meals await you',
    cardTitles: ['Signature Dish', 'Daily Special', 'Menu'],
    navLinks: ['Menu', 'Reservations', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
    logo: 'RESTAURANT',
  },
  real_estate: {
    heroTitle: 'Find Your Dream Home',
    heroSubtitle: 'Properties that fit your lifestyle',
    cardTitles: ['Modern Villa', 'City Apartment', 'Beach House'],
    navLinks: ['Properties', 'Buy', 'Sell'],
    cardImages: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=200&fit=crop',
    logo: 'REAL ESTATE',
  },
  education: {
    heroTitle: 'Learn Online',
    heroSubtitle: 'Quality education from anywhere',
    cardTitles: ['Course One', 'Online Class', 'Workshop'],
    navLinks: ['Courses', 'About', 'Enroll'],
    cardImages: [
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=200&fit=crop',
    logo: 'EDUCATE',
  },
  nonprofit: {
    heroTitle: 'Make A Difference',
    heroSubtitle: 'Together we can change the world',
    cardTitles: ['Our Mission', 'Get Involved', 'Donate'],
    navLinks: ['Causes', 'Volunteer', 'Donate'],
    cardImages: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1531206715517-5c0ba1408404?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=200&fit=crop',
    logo: 'HELP',
  },
  other: {
    heroTitle: 'Welcome',
    heroSubtitle: 'Discover what we offer',
    cardTitles: ['Feature One', 'Feature Two', 'Feature Three'],
    navLinks: ['Home', 'About', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=150&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
    logo: 'WEBSITE',
  },
};

const getCategoryGradient = (category) => categoryGradients[category] || categoryGradients.other;
const getCategoryContent = (category) => categoryContent[category] || categoryContent.other;

const TemplatePreview = ({ template, large = false }) => {
  const content = getCategoryContent(template.category);
  const gradient = getCategoryGradient(template.category);
  
  return (
    <div className="modal-preview" style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}>
      <div className="preview-placeholder" style={{ alignItems: 'center', justifyContent: 'center', height: '100%', padding: large ? '20px' : '12px' }}>
        <div className="preview-mockup" style={large ? { maxWidth: '700px', width: '100%' } : {}}>
          <div className="mockup-header">
            <div className="mockup-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className="mockup-nav">
            <div className="mockup-nav-logo">{content.logo}</div>
            <div className="mockup-nav-links">
              {content.navLinks.slice(0, 3).map((link, i) => (
                <span key={i} className="nav-link-item">{link}</span>
              ))}
            </div>
          </div>
          <div className="mockup-hero" style={{ backgroundImage: `url(${content.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="mockup-hero-overlay"></div>
            <div className="mockup-hero-content">
              <div className="mockup-hero-title">{content.heroTitle}</div>
              <div className="mockup-hero-subtitle">{content.heroSubtitle}</div>
              <div className="mockup-hero-btn">Learn More</div>
            </div>
          </div>
          <div className="mockup-content">
            {content.cardTitles.map((title, i) => (
              <div key={i} className="mockup-card">
                <div className="mockup-card-image" style={{ backgroundImage: `url(${content.cardImages[i]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="mockup-card-text">
                  <div className="mockup-card-title">{title}</div>
                  <div className="mockup-card-desc">Click to learn more</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mockup-footer">
            <div className="mockup-footer-text">© 2025 {content.heroTitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateGallery = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, filter]);

  const fetchTemplates = async () => {
    try {
      let url = 'http://localhost:8000/api/crud/templates/crud/';
      const params = new URLSearchParams();
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      if (filter === 'free') {
        params.append('is_free', 'true');
      } else if (filter === 'premium') {
        params.append('is_premium', 'true');
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

  const filteredTemplates = templates
    .filter(t => searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch(sortBy) {
        case 'price_low': return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price_high': return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest':
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });

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

      <div className="gallery-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

          <div className="filter-group">
            <label>Sort:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="gallery-empty">
          <span className="empty-icon">🖼️</span>
          <p>No templates found in this category</p>
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map((template) => {
            const content = getCategoryContent(template.category);
            return (
            <div key={template.id} className="template-card">
              <div className="template-preview" style={{ background: `linear-gradient(135deg, ${getCategoryGradient(template.category)[0]}, ${getCategoryGradient(template.category)[1]})` }}>
                {template.preview_image ? (
                  <img src={template.preview_image} alt={template.name} />
                ) : (
                  <div className="preview-placeholder">
                    <div className="preview-mockup">
                      <div className="mockup-header">
                        <div className="mockup-dots">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                      <div className="mockup-nav">
                        <div className="mockup-nav-logo">{content.logo}</div>
                        <div className="mockup-nav-links">
                          {content.navLinks.slice(0, 3).map((link, i) => (
                            <span key={i} className="nav-link-item">{link}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mockup-hero" style={{ backgroundImage: `url(${content.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="mockup-hero-overlay"></div>
                        <div className="mockup-hero-content">
                          <div className="mockup-hero-title">{content.heroTitle}</div>
                          <div className="mockup-hero-subtitle">{content.heroSubtitle}</div>
                          <div className="mockup-hero-btn">Learn More</div>
                        </div>
                      </div>
                      <div className="mockup-content">
                        {content.cardTitles.map((title, i) => (
                          <div key={i} className="mockup-card">
                            <div className="mockup-card-image" style={{ backgroundImage: `url(${content.cardImages[i]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <div className="mockup-card-text">
                              <div className="mockup-card-title">{title}</div>
                              <div className="mockup-card-desc">Click to learn more</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mockup-footer">
                        <div className="mockup-footer-text">© 2025 {content.heroTitle}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="template-badges">
                  {template.is_free && <span className="badge badge-free">Free</span>}
                  {template.is_premium && <span className="badge badge-premium">Premium</span>}
                </div>
                <button 
                  className="preview-overlay-btn"
                  onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                >
                  <span>👁️</span> Quick View
                </button>
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
                
                {template.rating > 0 && (
                  <div className="template-rating">
                    <span className="stars">{'★'.repeat(Math.floor(template.rating))}</span>
                    <span className="rating-value">{parseFloat(template.rating).toFixed(1)}</span>
                    <span className="review-count">({template.total_reviews || 0} reviews)</span>
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
            );
          })}
        </div>
      )}

      {previewTemplate && (
        <div className="template-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewTemplate(null)}>×</button>
            <TemplatePreview template={previewTemplate} large />
            <div className="modal-details">
              <h2>{previewTemplate.name}</h2>
              <p className="modal-category">{categories.find(c => c.value === previewTemplate.category)?.label || previewTemplate.category}</p>
              <p className="modal-description">{previewTemplate.description}</p>
              
              {previewTemplate.tags && previewTemplate.tags.length > 0 && (
                <div className="modal-tags">
                  {previewTemplate.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="modal-meta">
                <span className="meta-item">📥 {previewTemplate.download_count || 0} downloads</span>
                {previewTemplate.rating > 0 && (
                  <span className="meta-item">⭐ {parseFloat(previewTemplate.rating).toFixed(1)} ({previewTemplate.total_reviews || 0} reviews)</span>
                )}
              </div>
              
              <div className="modal-actions">
                <span className="modal-price">{formatPrice(previewTemplate)}</span>
                <button 
                  className="btn-use-template"
                  onClick={() => { handlePurchase(previewTemplate); setPreviewTemplate(null); }}
                  disabled={purchasing}
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
