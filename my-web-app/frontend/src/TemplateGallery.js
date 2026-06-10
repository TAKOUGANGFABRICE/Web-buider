import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatePreview from './TemplatePreview';
import './TemplateGallery.css';

const TEMPLATE_PREVIEW_MAP = {
  'biz-1': 'corporate',
  'biz-2': 'consulting',
  'biz-3': 'agency',
  'biz-4': 'startup',
  'biz-5': 'finance',
  'biz-6': 'corporate-blue',
  'port-1': 'minimal',
  'port-2': 'grid',
  'port-3': 'creative',
  'port-4': 'dark-mode',
  'port-5': 'masonry',
  'port-6': 'one-page',
  'ecom-1': 'shop',
  'ecom-2': 'marketplace',
  'ecom-3': 'boutique',
  'ecom-4': 'fashion',
  'ecom-5': 'electronics',
  'ecom-6': 'food-delivery',
  'blog-1': 'minimal-blog',
  'blog-2': 'magazine',
  'blog-3': 'news',
  'blog-4': 'personal',
  'blog-5': 'tech-blog',
  'blog-6': 'lifestyle',
  'land-1': 'startup',
  'land-2': 'saas',
  'land-3': 'event',
  'land-4': 'app-download',
  'land-5': 'product-hunt',
  'land-6': 'conference',
};

const CATEGORY_COLORS = {
  business: '#1e293b',
  portfolio: '#7c3aed',
  ecommerce: '#db2777',
  blog: '#0d9488',
  landing: '#ea580c',
};

const HERO_IMAGES = {
  'biz-1': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  'biz-2': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
  'biz-3': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
  'biz-4': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80',
  'biz-5': 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1200&q=80',
  'biz-6': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  'port-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
  'port-2': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80',
  'port-3': 'https://images.unsplash.com/photo-1542744040-25c4d430006a?w=1200&q=80',
  'port-4': 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  'port-5': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  'port-6': 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&q=80',
  'ecom-1': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  'ecom-2': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
  'ecom-3': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80',
  'ecom-4': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
  'ecom-5': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  'ecom-6': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
  'blog-1': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80',
  'blog-2': 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1200&q=80',
  'blog-3': 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1200&q=80',
  'blog-4': 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80',
  'blog-5': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
  'blog-6': 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=80',
  'land-1': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  'land-2': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80',
  'land-3': 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80',
  'land-4': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
  'land-5': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
  'land-6': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
};

const TEMPLATES = {
  business: [
    { id: 'biz-1', name: 'Corporate', description: 'Professional business template', longDescription: 'A clean, corporate layout built for consulting firms and enterprise startups.', responsive: true },
    { id: 'biz-2', name: 'Consulting', description: 'Consulting firm layout', longDescription: 'Optimized for service-based businesses with case studies and client logos.', responsive: true },
    { id: 'biz-3', name: 'Agency', description: 'Creative agency template', longDescription: 'Bold sections, clear CTAs, and portfolio-ready blocks for digital agencies.', responsive: true },
    { id: 'biz-4', name: 'Startup', description: 'Modern startup landing', longDescription: 'Clean, modern design for SaaS startups and tech companies.', responsive: true },
    { id: 'biz-5', name: 'Finance', description: 'Financial services template', longDescription: 'Trustworthy design for banks, advisors, and fintech.', responsive: true },
    { id: 'biz-6', name: 'Corporate Blue', description: 'Enterprise corporate template', longDescription: 'Professional blue-themed design for large corporations.', responsive: true },
  ],
  portfolio: [
    { id: 'port-1', name: 'Minimal', description: 'Clean portfolio showcase', longDescription: 'Minimalist design focused on imagery and typography for creatives.', responsive: true },
    { id: 'port-2', name: 'Grid', description: 'Masonry grid portfolio', longDescription: 'Responsive grid layout for photographers and designers.', responsive: true },
    { id: 'port-3', name: 'Creative', description: 'Artistic portfolio design', longDescription: 'Experimental layout with animations and visual storytelling.', responsive: true },
    { id: 'port-4', name: 'Dark Mode', description: 'Dark theme portfolio', longDescription: 'Sleek dark design for designers and developers.', responsive: true },
    { id: 'port-5', name: 'Masonry', description: 'Pinterest-style grid', longDescription: 'Dynamic masonry layout for visual artists.', responsive: true },
    { id: 'port-6', name: 'One Page', description: 'Single page portfolio', longDescription: 'Compact single-page design with smooth scrolling.', responsive: true },
  ],
  ecommerce: [
    { id: 'ecom-1', name: 'Shop', description: 'Online store template', longDescription: 'Product grids, cart drawer, and checkout-ready sections.', responsive: true },
    { id: 'ecom-2', name: 'Marketplace', description: 'Multi-vendor marketplace', longDescription: 'Seller profiles, product filters, and vendor onboarding layout.', responsive: true },
    { id: 'ecom-3', name: 'Boutique', description: 'Luxury brand shop', longDescription: 'Refined typography and high-end product presentation.', responsive: true },
    { id: 'ecom-4', name: 'Fashion Store', description: 'Fashion e-commerce template', longDescription: 'Trendy design for clothing and accessory stores.', responsive: true },
    { id: 'ecom-5', name: 'Electronics', description: 'Tech product store', longDescription: 'Modern layout for electronics and gadgets.', responsive: true },
    { id: 'ecom-6', name: 'Food Delivery', description: 'Restaurant ordering template', longDescription: 'Menu-focused design with online ordering.', responsive: true },
  ],
  blog: [
    { id: 'blog-1', name: 'Minimal', description: 'Clean blog layout', longDescription: 'Content-first design with readable typography and shareable cards.', responsive: true },
    { id: 'blog-2', name: 'Magazine', description: 'Magazine-style blog', longDescription: 'Multi-column hero sections for breaking news and featured posts.', responsive: true },
    { id: 'blog-3', name: 'News', description: 'News portal design', longDescription: 'Schema-ready layout optimized for SEO and ad placements.', responsive: true },
    { id: 'blog-4', name: 'Personal', description: 'Personal blog template', longDescription: 'Simple, clean design for personal bloggers.', responsive: true },
    { id: 'blog-5', name: 'Tech Blog', description: 'Technology blog layout', longDescription: 'Code-friendly design for tech tutorials and reviews.', responsive: true },
    { id: 'blog-6', name: 'Lifestyle', description: 'Lifestyle blog template', longDescription: 'Warm, inviting design for lifestyle content.', responsive: true },
  ],
  landing: [
    { id: 'land-1', name: 'Startup', description: 'Product launch page', longDescription: 'High-converting hero with social proof and pricing blocks.', responsive: true },
    { id: 'land-2', name: 'SaaS', description: 'Software landing page', longDescription: 'Feature comparison, integrations, and trial CTA sections.', responsive: true },
    { id: 'land-3', name: 'Event', description: 'Event promotion template', longDescription: 'Countdown timer, speaker cards, and RSVP forms.', responsive: true },
    { id: 'land-4', name: 'App Download', description: 'Mobile app landing', longDescription: 'App store download focus with feature highlights.', responsive: true },
    { id: 'land-5', name: 'Product Hunt', description: 'Product launch template', longDescription: 'Clean launch page with social proof and CTAs.', responsive: true },
    { id: 'land-6', name: 'Conference', description: 'Conference event page', longDescription: 'Agenda, speakers, and registration-focused design.', responsive: true },
  ],
};

function TemplateGallery() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('business');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const categories = [
    { id: 'business', name: 'Business', icon: '🏢' },
    { id: 'portfolio', name: 'Portfolio', icon: '🎨' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️' },
    { id: 'blog', name: 'Blog', icon: '📝' },
    { id: 'landing', name: 'Landing', icon: '🚀' },
  ];

  const templates = TEMPLATES[activeCategory] || [];

  const handlePreview = (template) => {
    const previewKey = TEMPLATE_PREVIEW_MAP[template.id] || template.id;
    setPreviewTemplate({ ...template, previewKey, category: activeCategory });
  };

  const handleEdit = (template) => {
    setPreviewTemplate(null);
    navigate(`/builder?template=${template.id}`);
  };

  const categoryHeroImages = {
    business: HERO_IMAGES['biz-1'],
    portfolio: HERO_IMAGES['port-2'],
    ecommerce: HERO_IMAGES['ecom-1'],
    blog: HERO_IMAGES['blog-1'],
    landing: HERO_IMAGES['land-1'],
  };

  const categoryDescriptions = {
    business: 'Professional business templates for corporate websites, startups, and consulting firms',
    portfolio: 'Showcase your work with creative portfolio templates for designers and developers',
    ecommerce: 'Build online stores with our e-commerce templates designed for sales conversion',
    blog: 'Share your thoughts with beautifully designed blog templates for every niche',
    landing: 'High-converting landing pages for product launches and marketing campaigns',
  };

  return (
    <div className="gallery-page">
      <section className="category-hero">
        <div className="hero-banner">
          <img src={categoryHeroImages[activeCategory]} alt={`${activeCategory} templates`} className="hero-banner-image" onError={(e) => {
            e.target.src = `https://placehold.co/1200x240/${CATEGORY_COLORS[activeCategory].replace('#', '')}/ffffff?text=${encodeURIComponent(activeCategory + ' templates')}`;
          }} />
          <div className="hero-banner-overlay">
            <h2>{categories.find(c => c.id === activeCategory)?.name} Templates</h2>
            <p>{categoryDescriptions[activeCategory]}</p>
          </div>
        </div>

        <div className="hero-top">
          <h1>Pre-made Templates</h1>
          <p>Start with a professionally designed template and customize every element to match your brand.</p>
          <button className="btn btn-primary header-cta" onClick={() => navigate('/builder')}>
            Start from scratch
          </button>
        </div>

        <div className="category-hero-cards">
          {categories.map(cat => {
            const heroImage = categoryHeroImages[cat.id];
            return (
              <div
                key={cat.id}
                className={`category-hero-card ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <div className="category-hero-image">
                  <img src={heroImage} alt={cat.name} onError={(e) => {
                    e.target.src = `https://placehold.co/300x160/${CATEGORY_COLORS[cat.id].replace('#', '')}/ffffff?text=${encodeURIComponent(cat.name)}`;
                  }} />
                  <div className="category-hero-overlay">
                    <span className="category-hero-icon">{cat.icon}</span>
                  </div>
                </div>
                <div className="category-hero-info">
                  <h3>{cat.name}</h3>
                  <p>{TEMPLATES[cat.id][0].longDescription}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <nav className="gallery-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={activeCategory === cat.id ? 'active' : ''}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </nav>

      <div className="templates-grid">
        {templates.map(template => {
          const heroImage = HERO_IMAGES[template.id] || `https://placehold.co/600x420/${CATEGORY_COLORS[activeCategory].replace('#', '')}/ffffff?text=${encodeURIComponent(template.name)}`;
          return (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handlePreview(template)}
            >
              <div className="template-preview">
                <img className="template-image" src={heroImage} alt={template.name} onError={(e) => {
                  e.target.src = `https://placehold.co/600x420/${CATEGORY_COLORS[activeCategory].replace('#', '')}/ffffff?text=${encodeURIComponent(template.name)}`;
                }} />
                <div className="template-overlay">
                  <span className="template-badge">Pre-made</span>
                </div>
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="template-features">
                  <span className="feature-tag">🎨 Customizable</span>
                  <span className="feature-tag">📱 Responsive</span>
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template);
                    }}
                  >
                    Preview
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewTemplate && (
        <TemplatePreview
          templateId={previewTemplate.previewKey}
          onClose={() => setPreviewTemplate(null)}
          onEdit={() => handleEdit(previewTemplate)}
        />
      )}
    </div>
  );
}

export default TemplateGallery;
