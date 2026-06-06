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
    heroTitle: 'Creative Portfolio',
    heroSubtitle: 'Showcasing my best work and creative journey',
    heroDescription: 'Welcome to my portfolio website where I showcase my creative projects, design work, and professional journey as a designer and developer.',
    featureTitle: 'Featured Projects',
    featureDescription: 'A selection of my recent work across various creative disciplines',
    cardTitles: ['Brand Identity Design', 'Web Development', 'UI/UX Projects'],
    cardDescriptions: ['Complete brand identity packages for startups and established businesses', 'Modern, responsive websites built with cutting-edge technology', 'User-centered design solutions for web and mobile applications'],
    navLinks: ['Work', 'About', 'Services', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    logo: 'CREATIVE',
    ctaText: 'View My Work',
    ctaLink: '#work',
    aboutTitle: 'About Me',
    aboutText: 'I am a passionate creative professional with over 5 years of experience in design and development.',
    contactTitle: 'Get In Touch',
    contactText: 'Interested in working together? Lets discuss your project.',
    email: 'hello@portfolio.com',
    phone: '+1 (555) 123-4567',
    socialTitle: 'Follow Me',
  },
  business: {
    heroTitle: 'Grow Your Business',
    heroSubtitle: 'Professional solutions that drive real results',
    heroDescription: 'Transform your business with our expert consulting services. We help companies achieve their goals through strategic planning and execution.',
    featureTitle: 'Our Services',
    featureDescription: 'Comprehensive business solutions tailored to your needs',
    cardTitles: ['Business Consulting', 'Marketing Strategy', 'Growth Solutions'],
    cardDescriptions: ['Expert guidance to optimize your business operations and strategy', 'Data-driven marketing strategies to reach your target audience', 'Proven growth strategies to scale your business'],
    navLinks: ['Services', 'About', 'Case Studies', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
    logo: 'CONSULT',
    ctaText: 'Get Started',
    ctaLink: '#contact',
    aboutTitle: 'Why Choose Us',
    aboutText: 'With over 10 years of experience, we have helped hundreds of businesses achieve their full potential.',
    contactTitle: 'Contact Us',
    contactText: 'Ready to take your business to the next level? Lets talk.',
    email: 'info@consulting.com',
    phone: '+1 (555) 987-6543',
    socialTitle: 'Connect With Us',
  },
  ecommerce: {
    heroTitle: 'Premium Online Store',
    heroSubtitle: 'Quality products for discerning customers',
    heroDescription: 'Discover our curated collection of premium products. We offer fast shipping, easy returns, and exceptional customer service.',
    featureTitle: 'Popular Products',
    featureDescription: 'Our most loved items by customers',
    cardTitles: ['New Arrivals', 'Best Sellers', 'Sale Items'],
    cardDescriptions: ['Check out the latest additions to our collection', 'Top-rated products loved by our customers', 'Great deals on premium items'],
    navLinks: ['Shop', 'Deals', 'About', 'Cart'],
    cardImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=400&fit=crop',
    logo: 'PREMIUM STORE',
    ctaText: 'Shop Now',
    ctaLink: '#shop',
    aboutTitle: 'About Our Store',
    aboutText: 'We have been providing quality products to customers worldwide since 2010.',
    contactTitle: 'Customer Service',
    contactText: 'Have questions? Our team is here to help you.',
    email: 'support@store.com',
    phone: '+1 (555) 456-7890',
    socialTitle: 'Follow Us',
  },
  blog: {
    heroTitle: 'Insights & Ideas',
    heroSubtitle: 'Thought leadership on business, technology, and innovation',
    heroDescription: 'Explore our blog for the latest insights, tips, and thought leadership on topics that matter to you.',
    featureTitle: 'Latest Articles',
    featureDescription: 'Fresh perspectives and expert analysis',
    cardTitles: ['Technology Trends', 'Business Growth', 'Innovation'],
    cardDescriptions: ['Stay ahead with the latest tech trends and innovations', 'Tips and strategies for growing your business', 'Inspiring stories of innovation and creativity'],
    navLinks: ['Articles', 'Categories', 'Newsletter', 'About'],
    cardImages: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba027d1c2a?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    logo: 'INSIGHTS',
    ctaText: 'Read More',
    ctaLink: '#articles',
    aboutTitle: 'About Our Blog',
    aboutText: 'We share insights from industry experts and thought leaders.',
    contactTitle: 'Write For Us',
    contactText: 'Interested in contributing? Wed love to hear from you.',
    email: 'editor@insights.com',
    phone: '+1 (555) 321-0987',
    socialTitle: 'Stay Connected',
  },
  landing: {
    heroTitle: 'Launch Your Idea',
    heroSubtitle: 'The all-in-one platform for modern startups',
    heroDescription: 'Build, launch, and scale your startup with our powerful platform. Join thousands of entrepreneurs who have turned their ideas into successful businesses.',
    featureTitle: 'Powerful Features',
    featureDescription: 'Everything you need to succeed',
    cardTitles: ['Easy Setup', 'Analytics', 'Scalable'],
    cardDescriptions: ['Get started in minutes with our intuitive setup process', 'Track your growth with detailed analytics and insights', 'Scale your business without limits'],
    navLinks: ['Features', 'Pricing', 'Resources', 'Sign Up'],
    cardImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    logo: 'LAUNCH',
    ctaText: 'Start Free Trial',
    ctaLink: '#signup',
    aboutTitle: 'Why Choose Us',
    aboutText: 'Join over 10,000 startups that trust our platform to grow their business.',
    contactTitle: 'Contact Sales',
    contactText: 'Have questions? Talk to our team directly.',
    email: 'sales@launch.com',
    phone: '+1 (555) 789-0123',
    socialTitle: 'Follow Us',
  },
  restaurant: {
    heroTitle: 'Taste of Excellence',
    heroSubtitle: 'Fine dining experience you will remember',
    heroDescription: 'Experience culinary excellence at its finest. Our award-winning chefs prepare each dish with the freshest ingredients and utmost care.',
    featureTitle: 'Menu Highlights',
    featureDescription: 'Signature dishes crafted with passion',
    cardTitles: ['Signature Entrees', 'Chef Specials', 'Wine Selection'],
    cardDescriptions: ['Our most beloved dishes, perfected over years', 'Seasonal creations from our talented chefs', 'Curated wines from around the world'],
    navLinks: ['Menu', 'Reservations', 'Events', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    logo: 'FINE DINING',
    ctaText: 'Reserve a Table',
    ctaLink: '#reservations',
    aboutTitle: 'Our Story',
    aboutText: 'For over 20 years, we have been serving the community with exceptional cuisine.',
    contactTitle: 'Private Events',
    contactText: 'Host your special occasions with us.',
    email: 'reservations@dining.com',
    phone: '+1 (555) 234-5678',
    socialTitle: 'Follow Us',
  },
  real_estate: {
    heroTitle: 'Find Your Dream Home',
    heroSubtitle: 'Premium properties in the best locations',
    heroDescription: 'Discover your perfect home with our extensive collection of premium properties. From luxury villas to cozy apartments, find your ideal space.',
    featureTitle: 'Featured Properties',
    featureDescription: 'Handpicked properties for discerning buyers',
    cardTitles: ['Luxury Homes', 'Modern Apartments', 'Waterfront Properties'],
    cardDescriptions: ['Stunning homes with premium amenities', 'Contemporary living in prime city locations', 'Beautiful properties with water views'],
    navLinks: ['Properties', 'Buyers', 'Sellers', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop',
    logo: 'LUXE HOMES',
    ctaText: 'Browse Properties',
    ctaLink: '#properties',
    aboutTitle: 'About Our Agency',
    aboutText: 'With 15 years in real estate, we have helped hundreds find their dream homes.',
    contactTitle: 'Contact Us',
    contactText: 'Ready to find your dream home? Lets start looking.',
    email: 'info@luxehomes.com',
    phone: '+1 (555) 345-6789',
    socialTitle: 'Follow Us',
  },
  education: {
    heroTitle: 'Learn Without Limits',
    heroSubtitle: 'Quality education from world-class instructors',
    heroDescription: 'Unlock your potential with our comprehensive online courses. Learn at your own pace from industry experts around the world.',
    featureTitle: 'Popular Courses',
    featureDescription: 'Start your learning journey today',
    cardTitles: ['Online Courses', 'Certificates', 'Workshops'],
    cardDescriptions: ['Access 500+ courses across various topics', 'Earn certificates to showcase your skills', 'Live interactive workshops with experts'],
    navLinks: ['Courses', 'Programs', 'About', 'Enroll'],
    cardImages: [
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop',
    logo: 'EDUPLUS',
    ctaText: 'Start Learning',
    ctaLink: '#courses',
    aboutTitle: 'Why Learn With Us',
    aboutText: 'Over 50,000 students have transformed their careers with our courses.',
    contactTitle: 'Student Support',
    contactText: 'Need help? Our support team is here for you.',
    email: 'support@eduplus.com',
    phone: '+1 (555) 567-8901',
    socialTitle: 'Follow Us',
  },
  nonprofit: {
    heroTitle: 'Make An Impact',
    heroSubtitle: 'Together we can change the world',
    heroDescription: 'Join our mission to create positive change in communities around the world. Every contribution makes a difference.',
    featureTitle: 'Our Programs',
    featureDescription: 'How we create change together',
    cardTitles: ['Education', 'Healthcare', 'Community'],
    cardDescriptions: ['Providing quality education to underserved communities', 'Healthcare access for those in need', 'Building stronger communities through support'],
    navLinks: ['Causes', 'Get Involved', 'Donate', ' About'],
    cardImages: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1531206715517-5c0ba1408404?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=400&fit=crop',
    logo: 'IMPACT',
    ctaText: 'Get Involved',
    ctaLink: '#donate',
    aboutTitle: 'Our Mission',
    aboutText: 'We have been creating positive change since 2005, impacting millions of lives.',
    contactTitle: 'Volunteer',
    contactText: 'Want to make a difference? Join our volunteer program.',
    email: 'volunteer@impact.org',
    phone: '+1 (555) 678-9012',
    socialTitle: 'Follow Us',
  },
  other: {
    heroTitle: 'Welcome',
    heroSubtitle: 'Discover amazing experiences',
    heroDescription: 'Explore our website to learn more about what we offer and how we can help you.',
    featureTitle: 'What We Offer',
    featureDescription: 'Explore our services and offerings',
    cardTitles: ['Our Services', 'Expert Team', 'Contact Us'],
    cardDescriptions: ['Professional services tailored to your needs', 'Experienced team ready to help', 'Get in touch with us today'],
    navLinks: ['Home', 'About', 'Services', 'Contact'],
    cardImages: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop'
    ],
    heroImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    logo: 'COMPANY',
    ctaText: 'Learn More',
    ctaLink: '#about',
    aboutTitle: 'About Us',
    aboutText: 'We are dedicated to providing excellent service to our customers.',
    contactTitle: 'Contact Us',
    contactText: ' wed love to hear from you.',
    email: 'info@company.com',
    phone: '+1 (555) 901-2345',
    socialTitle: 'Follow Us',
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
              {content.navLinks.slice(0, 4).map((link, i) => (
                <span key={i} className="nav-link-item">{link}</span>
              ))}
            </div>
          </div>
          <div className="mockup-hero" style={{ backgroundImage: `url(${content.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="mockup-hero-overlay"></div>
            <div className="mockup-hero-content">
              <div className="mockup-hero-title">{content.heroTitle}</div>
              <div className="mockup-hero-subtitle">{content.heroSubtitle}</div>
              <div className="mockup-hero-btn">{content.ctaText || 'Learn More'}</div>
            </div>
          </div>
          <div className="mockup-content">
            {(content.cardTitles || []).map((title, i) => (
              <div key={i} className="mockup-card">
                <div className="mockup-card-image" style={{ backgroundImage: `url(${content.cardImages?.[i]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="mockup-card-text">
                  <div className="mockup-card-title">{title}</div>
                  <div className="mockup-card-desc">{content.cardDescriptions?.[i] || 'Click to learn more'}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mockup-features" style={{ padding: '12px', background: '#fff' }}>
            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>{content.featureTitle || 'Features'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(content.cardTitles || []).slice(0, 3).map((title, i) => (
                <div key={i} style={{ fontSize: '5px', color: '#666', textAlign: 'center', padding: '4px', background: '#f5f5f5', borderRadius: '3px' }}>
                  {title}
                </div>
              ))}
            </div>
          </div>
          <div className="mockup-about" style={{ padding: '10px', background: '#f0f4f8', borderTop: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: '5px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{content.aboutTitle || 'About'}</div>
            <div style={{ fontSize: '4px', color: '#666', lineHeight: '1.3' }}>{content.aboutText?.substring(0, 60) || 'Learn more about us...'}...</div>
          </div>
          <div className="mockup-cta-section" style={{ padding: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', textAlign: 'center' }}>
            <div style={{ fontSize: '5px', color: '#fff', fontWeight: '600' }}>{content.ctaText || 'Get Started'} →</div>
          </div>
          <div className="mockup-contact" style={{ padding: '10px', background: '#fff', borderTop: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: '5px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{content.contactTitle || 'Contact'}</div>
            <div style={{ fontSize: '4px', color: '#666' }}>{content.email || 'email@example.com'}</div>
          </div>
          <div className="mockup-footer">
            <div className="mockup-footer-text">© 2025 {content.heroTitle} - {content.contactTitle || 'Contact Us'}</div>
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
  const [message, setMessage] = useState(null);

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
          setMessage({ type: 'success', text: 'Template added to your account! You can now customize it.' });
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setMessage({ type: 'info', text: 'Redirecting to payment...' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to purchase template' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
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
                          {content.navLinks?.slice(0, 4).map((link, i) => (
                            <span key={i} className="nav-link-item">{link}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mockup-hero" style={{ backgroundImage: `url(${content.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="mockup-hero-overlay"></div>
                        <div className="mockup-hero-content">
                          <div className="mockup-hero-title">{content.heroTitle}</div>
                          <div className="mockup-hero-subtitle">{content.heroSubtitle}</div>
                          <div className="mockup-hero-btn">{content.ctaText || 'Learn More'}</div>
                        </div>
                      </div>
                      <div className="mockup-content">
                        {(content.cardTitles || []).map((title, i) => (
                          <div key={i} className="mockup-card">
                            <div className="mockup-card-image" style={{ backgroundImage: `url(${content.cardImages?.[i]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <div className="mockup-card-text">
                              <div className="mockup-card-title">{title}</div>
                              <div className="mockup-card-desc">{content.cardDescriptions?.[i] || 'Click to learn more'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mockup-cta" style={{ padding: '8px', background: '#f8f9fa', textAlign: 'center' }}>
                        <span style={{ fontSize: '5px', color: '#2563eb', fontWeight: '600' }}>{content.ctaText || 'Learn More'} →</span>
                      </div>
                      <div className="mockup-features" style={{ padding: '8px', background: '#fff' }}>
                        <div style={{ fontSize: '5px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{content.featureTitle || 'Features'}</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {(content.cardTitles || []).slice(0, 3).map((title, i) => (
                            <div key={i} style={{ fontSize: '4px', color: '#666', flex: 1, textAlign: 'center', padding: '3px', background: '#f5f5f5', borderRadius: '2px' }}>
                              {title.substring(0, 12)}
                            </div>
                          ))}
                        </div>
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
                  <div className="template-actions">
                    <button 
                      className="btn-template-preview"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      Preview
                    </button>
                    <button 
                      className="btn-template-build"
                      onClick={() => handlePurchase(template)}
                      disabled={purchasing && selectedTemplate?.id === template.id}
                    >
                      {purchasing && selectedTemplate?.id === template.id ? 'Processing...' : 'Build'}
                    </button>
                  </div>
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
              <p className="modal-description">
                {(() => {
                  const content = getCategoryContent(previewTemplate.category);
                  return content?.heroDescription || previewTemplate.description;
                })()}
              </p>
              
              <div className="template-feature-list" style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1a1a2e' }}>
                  {(() => {
                    const content = getCategoryContent(previewTemplate.category);
                    return content?.featureTitle || 'Whats Included';
                  })()}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(() => {
                    const content = getCategoryContent(previewTemplate.category);
                    return (content?.cardTitles || []).map((title, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#555' }}>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                        {title}
                        <span style={{ color: '#888', fontSize: '12px', marginLeft: '4px' }}>
                          - {content?.cardDescriptions?.[i] || ''}
                        </span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a2e' }}>
                  {(() => {
                    const content = getCategoryContent(previewTemplate.category);
                    return content?.aboutTitle || 'About This Template';
                  })()}
                </h4>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                  {(() => {
                    const content = getCategoryContent(previewTemplate.category);
                    return content?.aboutText || '';
                  })()}
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#1a1a2e' }}>
                    {(() => {
                      const content = getCategoryContent(previewTemplate.category);
                      return content?.contactTitle || 'Contact';
                    })()}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    {(() => {
                      const content = getCategoryContent(previewTemplate.category);
                      return content?.contactText || '';
                    })()}
                  </p>
                </div>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#1a1a2e' }}>Email</h4>
                  <p style={{ fontSize: '12px', color: '#2563eb', margin: 0 }}>
                    {(() => {
                      const content = getCategoryContent(previewTemplate.category);
                      return content?.email || 'contact@example.com';
                    })()}
                  </p>
                </div>
              </div>
              
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
                <div className="modal-buttons">
                  <button 
                    className="btn-template-preview"
                    onClick={() => setPreviewTemplate(null)}
                  >
                    Preview
                  </button>
                  <button 
                    className="btn-template-build"
                    onClick={() => { handlePurchase(previewTemplate); setPreviewTemplate(null); }}
                    disabled={purchasing}
                  >
                    Build
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
