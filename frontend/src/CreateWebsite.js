import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './styles.css';

const API_URL = 'http://localhost:8000/api';

const categoryGradients = {
  portfolio: ['#8b5cf6', '#6366f1'],
  business: ['#2563eb', '#1d4ed8'],
  ecommerce: ['#ec4899', '#be185d'],
  blog: ['#14b8a6', '#0d9488'],
  landing: ['#f59e0b', '#d97706'],
  restaurant: ['#ef4444', '#dc2626'],
  real_estate: ['#10b981', '#059669'],
  education: ['#3b82f6', '#2563eb'],
  nonprofit: ['#f97316', '#ea580c'],
  other: ['#64748b', '#475569'],
};

const UploadZipIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const categoryContent = {
  portfolio: {
    heroTitle: 'Creative Portfolio',
    heroSubtitle: 'Showcasing my work and creative journey',
    heroDescription: 'Welcome to my portfolio website where I showcase my creative projects, design work, and professional journey.',
    featureTitle: 'Featured Projects',
    featureDescription: 'A selection of my recent work',
    cardTitles: ['Brand Identity', 'Web Development', 'UI/UX Design'],
    cardDescriptions: ['Complete brand packages', 'Modern responsive sites', 'User-centered solutions'],
    navLinks: ['Work', 'About', 'Services', 'Contact'],
    logo: 'CREATIVE',
    heroImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop'
    ],
    ctaText: 'View My Work',
    aboutTitle: 'About Me',
    aboutText: 'I am a passionate creative professional with over 5 years of experience.',
    contactTitle: 'Get In Touch',
    contactText: 'Interested in working together? Lets discuss your project.',
    email: 'hello@portfolio.com',
    features: ['Responsive Design', 'Project Gallery', 'Contact Form', 'Social Links', 'Analytics'],
  },
  business: {
    heroTitle: 'Grow Your Business',
    heroSubtitle: 'Professional solutions that drive real results',
    heroDescription: 'Transform your business with our expert consulting services.',
    featureTitle: 'Our Services',
    featureDescription: 'Comprehensive business solutions',
    cardTitles: ['Business Consulting', 'Marketing Strategy', 'Growth Solutions'],
    cardDescriptions: ['Expert guidance', 'Data-driven strategies', 'Proven growth'],
    navLinks: ['Services', 'About', 'Case Studies', 'Contact'],
    logo: 'CONSULT',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop'
    ],
    ctaText: 'Get Started',
    aboutTitle: 'Why Choose Us',
    aboutText: 'With over 10 years of experience, we have helped hundreds of businesses.',
    contactTitle: 'Contact Us',
    contactText: 'Ready to take your business to the next level?',
    email: 'info@consulting.com',
    features: ['Lead Capture', 'Service Pages', 'Testimonials', 'Team Section', 'Appointment Booking'],
  },
  ecommerce: {
    heroTitle: 'Premium Online Store',
    heroSubtitle: 'Quality products for discerning customers',
    heroDescription: 'Discover our curated collection of premium products.',
    featureTitle: 'Popular Products',
    featureDescription: 'Our most loved items',
    cardTitles: ['New Arrivals', 'Best Sellers', 'Sale Items'],
    cardDescriptions: ['Latest additions', 'Top-rated products', 'Great deals'],
    navLinks: ['Shop', 'Deals', 'About', 'Cart'],
    logo: 'STORE',
    heroImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=400&fit=crop'
    ],
    ctaText: 'Shop Now',
    aboutTitle: 'About Our Store',
    aboutText: 'We have been providing quality products to customers worldwide since 2010.',
    contactTitle: 'Customer Service',
    contactText: 'Have questions? Our team is here to help.',
    email: 'support@store.com',
    features: ['Product Catalog', 'Shopping Cart', 'Wishlist', 'Quick View', 'Newsletter'],
  },
  blog: {
    heroTitle: 'Insights & Ideas',
    heroSubtitle: 'Thought leadership on business and technology',
    heroDescription: 'Explore our blog for the latest insights and expert analysis.',
    featureTitle: 'Latest Articles',
    featureDescription: 'Fresh perspectives and expert analysis',
    cardTitles: ['Technology Trends', 'Business Growth', 'Innovation'],
    cardDescriptions: ['Stay ahead with latest tech', 'Tips for growing your business', 'Inspiring stories'],
    navLinks: ['Articles', 'Categories', 'Newsletter', 'About'],
    logo: 'INSIGHTS',
    heroImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba027d1c2a?w=600&h=400&fit=crop'
    ],
    ctaText: 'Read More',
    aboutTitle: 'About Our Blog',
    aboutText: 'We share insights from industry experts and thought leaders.',
    contactTitle: 'Write For Us',
    contactText: 'Interested in contributing? Wed love to hear from you.',
    email: 'editor@insights.com',
    features: ['Blog Posts', 'Categories', 'Author Profiles', 'Comment System', 'Social Sharing'],
  },
  landing: {
    heroTitle: 'Launch Your Idea',
    heroSubtitle: 'The all-in-one platform for modern startups',
    heroDescription: 'Build, launch, and scale your startup with our powerful platform.',
    featureTitle: 'Powerful Features',
    featureDescription: 'Everything you need to succeed',
    cardTitles: ['Easy Setup', 'Analytics', 'Scalable'],
    cardDescriptions: ['Get started in minutes', 'Track your growth', 'Scale without limits'],
    navLinks: ['Features', 'Pricing', 'Resources', 'Sign Up'],
    logo: 'LAUNCH',
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop'
    ],
    ctaText: 'Start Free Trial',
    aboutTitle: 'Why Choose Us',
    aboutText: 'Join over 10,000 startups that trust our platform.',
    contactTitle: 'Contact Sales',
    contactText: 'Have questions? Talk to our team directly.',
    email: 'sales@launch.com',
    features: ['Lead Generation', 'A/B Testing', 'Integration', 'Analytics Dashboard', 'Exit Intent'],
  },
  restaurant: {
    heroTitle: 'Taste of Excellence',
    heroSubtitle: 'Fine dining experience you will remember',
    heroDescription: 'Experience culinary excellence at its finest.',
    featureTitle: 'Menu Highlights',
    featureDescription: 'Signature dishes crafted with passion',
    cardTitles: ['Signature Entrees', 'Chef Specials', 'Wine Selection'],
    cardDescriptions: ['Our most beloved dishes', 'Seasonal creations', 'Curated wines'],
    navLinks: ['Menu', 'Reservations', 'Events', 'Contact'],
    logo: 'DINING',
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'
    ],
    ctaText: 'Reserve a Table',
    aboutTitle: 'Our Story',
    aboutText: 'For over 20 years, we have been serving the community.',
    contactTitle: 'Private Events',
    contactText: 'Host your special occasions with us.',
    email: 'reservations@dining.com',
    features: ['Online Reservations', 'Menu Display', 'Photo Gallery', 'Special Events', 'Reviews'],
  },
  real_estate: {
    heroTitle: 'Find Your Dream Home',
    heroSubtitle: 'Premium properties in the best locations',
    heroDescription: 'Discover your perfect home with our extensive collection.',
    featureTitle: 'Featured Properties',
    featureDescription: 'Handpicked properties for discerning buyers',
    cardTitles: ['Luxury Homes', 'Modern Apartments', 'Waterfront'],
    cardDescriptions: ['Stunning homes with premium amenities', 'Contemporary living in prime locations', 'Beautiful properties with water views'],
    navLinks: ['Properties', 'Buyers', 'Sellers', 'Contact'],
    logo: 'HOMES',
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'
    ],
    ctaText: 'Browse Properties',
    aboutTitle: 'About Our Agency',
    aboutText: 'With 15 years in real estate, we have helped hundreds find their dream homes.',
    contactTitle: 'Contact Us',
    contactText: 'Ready to find your dream home? Lets start looking.',
    email: 'info@luxehomes.com',
    features: ['Property Listings', 'Advanced Search', 'Map View', 'Agent Profiles', 'Mortgage Calculator'],
  },
  education: {
    heroTitle: 'Learn Without Limits',
    heroSubtitle: 'Quality education from world-class instructors',
    heroDescription: 'Unlock your potential with our comprehensive online courses.',
    featureTitle: 'Popular Courses',
    featureDescription: 'Start your learning journey today',
    cardTitles: ['Online Courses', 'Certificates', 'Workshops'],
    cardDescriptions: ['Access 500+ courses', 'Earn certificates', 'Live interactive workshops'],
    navLinks: ['Courses', 'Programs', 'About', 'Enroll'],
    logo: 'EDUPLUS',
    heroImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop'
    ],
    ctaText: 'Start Learning',
    aboutTitle: 'Why Learn With Us',
    aboutText: 'Over 50,000 students have transformed their careers.',
    contactTitle: 'Student Support',
    contactText: 'Need help? Our support team is here for you.',
    email: 'support@eduplus.com',
    features: ['Course Catalog', 'Video Lessons', 'Progress Tracking', 'Certificates', 'Discussion Forums'],
  },
  nonprofit: {
    heroTitle: 'Make An Impact',
    heroSubtitle: 'Together we can change the world',
    heroDescription: 'Join our mission to create positive change in communities.',
    featureTitle: 'Our Programs',
    featureDescription: 'How we create change together',
    cardTitles: ['Education', 'Healthcare', 'Community'],
    cardDescriptions: ['Quality education for underserved', 'Healthcare access', 'Building stronger communities'],
    navLinks: ['Causes', 'Get Involved', 'Donate', 'About'],
    logo: 'IMPACT',
    heroImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=800&fit=crop',
    cardImages: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1531206715517-5c0ba1408404?w=600&h=400&fit=crop'
    ],
    ctaText: 'Get Involved',
    aboutTitle: 'Our Mission',
    aboutText: 'We have been creating positive change since 2005.',
    contactTitle: 'Volunteer',
    contactText: 'Want to make a difference? Join our volunteer program.',
    email: 'volunteer@impact.org',
    features: ['Donation Form', 'Event Calendar', 'Volunteer Sign-up', 'Newsletter', 'Impact Tracker'],
  },
};

const getCategoryGradient = (category) => categoryGradients[category] || categoryGradients.other;
const getCategoryContent = (category) => categoryContent[category] || categoryContent.other;

const builtInTemplates = [
  { id: 'portfolio', name: 'Portfolio', category: 'portfolio', description: 'Showcase your work and creative projects' },
  { id: 'business', name: 'Business', category: 'business', description: 'Professional corporate and consulting websites' },
  { id: 'ecommerce', name: 'E-Commerce', category: 'ecommerce', description: 'Online store and product showcase' },
  { id: 'blog', name: 'Blog', category: 'blog', description: 'Articles, news, and content websites' },
  { id: 'landing', name: 'Landing Page', category: 'landing', description: 'High-conversion startup landing pages' },
  { id: 'restaurant', name: 'Restaurant', category: 'restaurant', description: 'Restaurant, food, and dining websites' },
  { id: 'real_estate', name: 'Real Estate', category: 'real_estate', description: 'Property listings and agent websites' },
  { id: 'education', name: 'Education', category: 'education', description: 'Online courses and learning platforms' },
  { id: 'nonprofit', name: 'Non-Profit', category: 'nonprofit', description: 'Charity and cause-focused websites' },
  { id: 'upload_zip', name: 'Upload ZIP File', category: 'upload', description: 'Upload your own cPanel ZIP file to import a complete website', icon: 'zip' },
];

const ScratchTemplate = {
  id: 'scratch',
  name: 'Start from Scratch',
  category: 'other',
  description: 'Build your website from scratch with full control',
  features: ['Drag & Drop Editor', 'Custom Components', 'Responsive Design', 'SEO Optimization', 'Custom Branding'],
};

function CreateWebsite() {
  const [websiteName, setWebsiteName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbTemplates, setDbTemplates] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  // ZIP upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [zipFileName, setZipFileName] = useState('');
  const [uploadingZip, setUploadingZip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [createdWebsiteId, setCreatedWebsiteId] = useState(null);
  
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'business', label: 'Business' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'ecommerce', label: 'E-Commerce' },
    { value: 'blog', label: 'Blog' },
    { value: 'landing', label: 'Landing' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'education', label: 'Education' },
    { value: 'nonprofit', label: 'Non-Profit' },
  ];

  useEffect(() => {
    fetchDbTemplates();
  }, []);

  const fetchDbTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/crud/templates/crud/`);
      if (response.ok) {
        const data = await response.json();
        setDbTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch database templates:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleZipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setMessage('Please select a ZIP file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setMessage('File size must be less than 100MB');
        return;
      }
      setZipFile(file);
      setZipFileName(file.name);
      setMessage('');
    }
  };

  const handleUploadZip = async () => {
    if (!websiteName.trim()) {
      setMessage('Please enter a website name first');
      return;
    }
    if (!zipFile) {
      setMessage('Please select a ZIP file');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('access');
    if (!token) {
      setMessage('Please log in to upload a website');
      return;
    }

    setUploadingZip(true);
    setMessage('');
    setUploadProgress('Uploading ZIP file...');
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('name', websiteName);
      formData.append('zip_file', zipFile);

      const response = await authenticatedFetch(`${API_URL}/custom-uploads/`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadProgress('Extracting files...');
        setUploadStatus('extracting');
        setCreatedWebsiteId(result.id);
        
        // Poll for status
        await pollUploadStatus(result.id);
      } else {
        setMessage(result.error || result.detail || 'Failed to upload ZIP file');
        setUploadStatus('failed');
      }
    } catch (err) {
      console.error('Error uploading ZIP:', err);
      setMessage('Network error. Please try again.');
      setUploadStatus('failed');
    } finally {
      setUploadingZip(false);
    }
  };

  const pollUploadStatus = async (uploadId) => {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await authenticatedFetch(`${API_URL}/custom-uploads/${uploadId}/`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'ready') {
            setUploadProgress('Website ready!');
            setUploadStatus('ready');
            setCreatedWebsiteId(result.id);
            return result;
          } else if (result.status === 'failed') {
            setMessage(result.error_message || 'Failed to extract ZIP file');
            setUploadStatus('failed');
            return null;
          }
        }
        
        setUploadProgress(`Processing... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (err) {
        console.error('Error checking status:', err);
        attempts++;
      }
    }
    
    setMessage('Processing timed out. Please check your uploads.');
    setUploadStatus('failed');
    return null;
  };

  const handlePublishZipWebsite = async () => {
    if (!createdWebsiteId) return;
    
    setUploadProgress('Publishing website...');
    setUploadStatus('publishing');
    
    try {
      const response = await authenticatedFetch(`${API_URL}/custom-uploads/${createdWebsiteId}/publish/`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setUploadProgress('Published successfully!');
        setUploadStatus('published');
        navigate('/websites');
      } else {
        setMessage('Failed to publish website');
        setUploadStatus('failed');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      setMessage('Failed to publish website');
      setUploadStatus('failed');
    }
  };

  const handleConvertToTemplate = async () => {
    if (!createdWebsiteId) return;
    
    setUploadProgress('Converting to template...');
    
    try {
      const response = await authenticatedFetch(`${API_URL}/custom-uploads/${createdWebsiteId}/convert_to_template/`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        navigate(`/builder?id=${createdWebsiteId}`);
      } else {
        setMessage('Failed to convert to template');
      }
    } catch (err) {
      console.error('Error converting:', err);
      setMessage('Failed to convert to template');
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setZipFile(null);
    setZipFileName('');
    setMessage('');
    setUploadProgress('');
    setUploadStatus('');
    setCreatedWebsiteId(null);
  };

  const allTemplates = [
    ScratchTemplate,
    ...builtInTemplates,
    ...dbTemplates.map(t => ({
      id: `db_${t.id}`,
      name: t.name,
      category: t.category || 'other',
      description: t.description,
      isDbTemplate: true,
      dbTemplateId: t.id,
      isFree: t.is_free,
      isPremium: t.is_premium,
      price: t.price,
      previewImage: t.preview_image,
    }))
  ];

  const filteredTemplates = allTemplates
    .filter(t => category === 'all' || t.category === category)
    .filter(t => searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleBuildNow = async (template, e) => {
    if (e) e.stopPropagation();
    if (!websiteName.trim()) {
      setMessage('Please enter a website name first');
      return;
    }
    
    // Handle ZIP upload
    if (template.id === 'upload_zip') {
      setShowUploadModal(true);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const isScratch = template.id === 'scratch';
      const requestBody = {
        name: websiteName,
        is_scratch: isScratch,
      };
      
      if (!isScratch) {
        if (template.isDbTemplate) {
          requestBody.template_used_id = template.dbTemplateId;
        } else {
          requestBody.template_used_id = template.id;
        }
      }
      
      const response = await authenticatedFetch(`${API_URL}/websites/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        navigate(`/builder?id=${data.id}`);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to create website');
      }
    } catch (err) {
      console.error('Error creating website:', err);
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const WebsitePreview = ({ template }) => {
    const content = getCategoryContent(template.category);
    const gradient = getCategoryGradient(template.category);
    const isScratch = template.id === 'scratch';
    const isZipUpload = template.id === 'upload_zip';
    
    if (isZipUpload) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>UPLOAD ZIP FILE</div>
          <div style={{ fontSize: '16px', color: '#aaa', marginTop: '12px', textAlign: 'center', maxWidth: '300px' }}>Import your cPanel website backup</div>
        </div>
      );
    }
    
    if (isScratch || !content) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>BUILD FROM SCRATCH</div>
          <div style={{ fontSize: '16px', color: '#aaa', marginTop: '12px', textAlign: 'center', maxWidth: '300px' }}>Create your unique website with our drag & drop editor</div>
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '100px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Header</div>
            <div style={{ width: '100px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Content</div>
            <div style={{ width: '100px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Footer</div>
          </div>
        </div>
      );
    }
    
    // Handle case where content is undefined
    if (!content || !content.logo) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{template.name}</div>
        </div>
      );
    }
    
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ background: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>{content.logo}</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {(content.navLinks || []).slice(0, 4).map((link, i) => (
              <span key={i} style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>{link}</span>
            ))}
          </div>
        </div>
        
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          {content.heroImage && (
            <img src={content.heroImage} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, opacity: content.heroImage ? 0.35 : 0.85 }}></div>
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{content.heroTitle}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.95)', marginBottom: '16px', maxWidth: '400px', lineHeight: 1.5 }}>{content.heroSubtitle}</div>
            <div style={{ fontSize: '12px', background: 'white', color: gradient[0], padding: '10px 28px', borderRadius: '25px', display: 'inline-block', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{content.ctaText}</div>
          </div>
        </div>
        
        <div style={{ padding: '16px', background: '#fff', flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{content.featureTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {(content.cardTitles || []).slice(0, 3).map((title, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
                <div style={{ height: '50px', backgroundImage: content.cardImages?.[i] ? `url(${content.cardImages[i]})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#333' }}>{title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ padding: '12px 20px', background: '#f8f9fa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a1a2e' }}>{content.aboutTitle}</div>
            <div style={{ fontSize: '8px', color: '#666', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.aboutText}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a1a2e' }}>{content.contactTitle}</div>
            <div style={{ fontSize: '8px', color: gradient[0], fontWeight: 600 }}>{content.email}</div>
          </div>
        </div>
        
        <div style={{ padding: '8px', background: '#1a1a2e', textAlign: 'center' }}>
          <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.6)' }}>© 2025 {content.logo} - All Rights Reserved</span>
        </div>
      </div>
    );
  };

  const TemplateCard = ({ template, isSelected, onSelect, onBuild, setPreviewTemplate }) => {
    const content = getCategoryContent(template.category);
    const gradient = getCategoryGradient(template.category);
    const isScratch = template.id === 'scratch';
    const isDbTemplate = template.isDbTemplate;
    const hasCustomPreview = isDbTemplate && template.previewImage;
    const features = template.features || content?.features || [];
    
    return (
      <div 
        onClick={() => onSelect(template)}
        style={{ 
          border: isSelected ? '3px solid #2563eb' : '1px solid #e5e5e5',
          borderRadius: '20px', 
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: isSelected 
            ? '0 20px 50px rgba(37, 99, 235, 0.3)' 
            : '0 8px 30px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          position: 'relative',
          transform: isSelected ? 'translateY(-12px) scale(1.02)' : 'none',
        }}
      >
        {isDbTemplate && template.isPremium && !isScratch && (
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 20,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '25px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
            letterSpacing: '0.5px',
          }}>
            {template.price ? `$${template.price}` : 'PREMIUM'}
          </div>
        )}
        
        {isDbTemplate && template.isFree && !template.isPremium && !isScratch && (
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 20,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '25px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
            letterSpacing: '0.5px',
          }}>
            FREE
          </div>
        )}
        
        {isScratch && (
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 20,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '25px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
            letterSpacing: '0.5px',
          }}>
            ✨ CUSTOM
          </div>
        )}

        {template.id === 'upload_zip' && (
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 20,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '25px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
            letterSpacing: '0.5px',
          }}>
            📦 ZIP UPLOAD
          </div>
        )}
        
        <div style={{ 
          height: '320px', 
          background: '#f8f9fa',
          padding: '20px',
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e5e5e5',
          }}>
            {template.id === 'upload_zip' ? (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px' }}>Upload ZIP File</div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px', maxWidth: '200px', textAlign: 'center' }}>Import your cPanel website backup</div>
              </div>
            ) : hasCustomPreview ? (
              <img 
                src={template.previewImage} 
                alt={template.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <WebsitePreview template={template} />
            )}
          </div>
        </div>
        
        <div style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>{template.name}</h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#666', lineHeight: 1.7 }}>{template.description}</p>
          </div>
          
          {features.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Features</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {features.slice(0, 5).map((feature, i) => (
                  <span key={i} style={{ 
                    fontSize: '12px', 
                    padding: '6px 14px', 
                    background: '#f3f4f6', 
                    borderRadius: '20px', 
                    color: '#4b5563',
                    fontWeight: 600,
                  }}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setPreviewTemplate(template)}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '17px',
                fontWeight: 700,
                color: '#1e293b',
                transition: 'all 0.3s ease',
              }}
            >
              Preview
            </button>
            <button
              onClick={(e) => onBuild(template, e)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: isLoading ? '#93c5fd' : (isScratch ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : (isDbTemplate && template.isPremium ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)')),
                border: 'none',
                borderRadius: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '17px',
                fontWeight: 700,
                color: 'white',
                boxShadow: isLoading ? 'none' : '0 10px 30px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? 'Creating...' : 'Build'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px' }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '48px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-1px' }}>Create Your Website</h1>
        <p style={{ margin: 0, fontSize: '20px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>Choose from our professionally designed templates or build from scratch</p>
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '24px', marginBottom: '40px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e5e5e5' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 700, color: '#1e293b', fontSize: '18px' }}>Website Name</label>
        <input
          type="text"
          value={websiteName}
          onChange={(e) => setWebsiteName(e.target.value)}
          placeholder="Enter your website name (e.g., My Business)"
          style={{ width: '100%', padding: '18px 24px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '17px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: '#f8f9fa' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '14px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {categories.map(cat => (
          <button 
            key={cat.value} 
            onClick={() => setCategory(cat.value)} 
            style={{ 
              padding: '14px 28px', 
              backgroundColor: category === cat.value ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'white', 
              color: category === cat.value ? 'white' : '#1e293b', 
              border: category === cat.value ? 'none' : '2px solid #e2e8f0',
              borderRadius: '30px', 
              cursor: 'pointer', 
              fontSize: '15px', 
              fontWeight: 600,
              boxShadow: category === cat.value ? '0 10px 30px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '48px' }}>
        <span style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', opacity: 0.5 }}>🔍</span>
        <input 
          type="text"
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search templates by name or description..." 
          style={{ 
            width: '100%', 
            padding: '18px 24px 18px 56px', 
            borderRadius: '18px', 
            border: '2px solid #e2e8f0', 
            fontSize: '16px', 
            outline: 'none', 
            boxSizing: 'border-box',
            background: 'white',
            boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          }} 
        />
      </div>

      {loadingDb && (
        <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>
          <div style={{ width: '56px', height: '56px', border: '5px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading templates...</div>
        </div>
      )}

      {!loadingDb && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} isSelected={selectedTemplate?.id === template.id} onSelect={setSelectedTemplate} onBuild={handleBuildNow} setPreviewTemplate={setPreviewTemplate} />
          ))}
        </div>
      )}

      {message && (
        <div style={{ padding: '20px', backgroundColor: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#dc2626', borderRadius: '16px', marginTop: '32px', textAlign: 'center', fontWeight: 600, fontSize: '16px' }}>
          {message}
        </div>
      )}

      {previewTemplate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setPreviewTemplate(null)}>
          <div style={{ background: 'white', borderRadius: '20px', maxWidth: '900px', width: '95%', maxHeight: '95vh', overflow: 'hidden', position: 'relative', animation: 'modalSlideIn 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewTemplate(null)} style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10 }}>×</button>
            <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: `linear-gradient(135deg, ${categoryGradients[previewTemplate.category]?.[0] || '#667eea'}, ${categoryGradients[previewTemplate.category]?.[1] || '#764ba2'})` }}>
              <div style={{ width: '100%', maxWidth: '700px', height: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                <WebsitePreview template={previewTemplate} />
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', color: '#1a1a2e', marginBottom: '0.5rem' }}>{previewTemplate.name}</h2>
              <p style={{ color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>{categories.find(c => c.value === previewTemplate.category)?.label || previewTemplate.category}</p>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' }}>{previewTemplate.description}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setPreviewTemplate(null)} style={{ flex: 1, padding: '14px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', color: '#1e293b', transition: 'all 0.3s ease' }}>Close</button>
                <button onClick={(e) => { setSelectedTemplate(previewTemplate); setPreviewTemplate(null); }} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', color: 'white', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>Select Template</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '20px', maxWidth: '550px', width: '95%', overflow: 'hidden', position: 'relative', animation: 'modalSlideIn 0.3s ease' }}>
            <button onClick={closeUploadModal} style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
            
            <div style={{ padding: '32px', borderBottom: '1px solid #e5e5e5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a2e', fontWeight: 700 }}>Upload ZIP File</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Import your cPanel ZIP website</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              {/* Upload Status */}
              {uploadStatus && uploadStatus !== 'failed' && (
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  background: uploadStatus === 'ready' ? '#dcfce7' : (uploadStatus === 'published' ? '#dcfce7' : '#eff6ff'),
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {uploadStatus === 'ready' || uploadStatus === 'published' ? (
                      <span style={{ fontSize: '24px' }}>✅</span>
                    ) : (
                      <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: uploadStatus === 'ready' || uploadStatus === 'published' ? '#166534' : '#1e293b' }}>{uploadProgress}</div>
                      {uploadStatus === 'ready' && (
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Your website has been extracted successfully</div>
                      )}
                      {uploadStatus === 'published' && (
                        <div style={{ fontSize: '0.85rem', color: '#166534' }}>Website published successfully!</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Ready Status */}
              {uploadStatus === 'ready' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button 
                    onClick={handleConvertToTemplate}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                    }}
                  >
                    ✏️ Edit in Builder
                  </button>
                  <button 
                    onClick={handlePublishZipWebsite}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}
                  >
                    🚀 Publish Now
                  </button>
                </div>
              )}

              {/* Upload Form */}
              {(!uploadStatus || uploadStatus === 'failed') && (
                <>
                  <div style={{ 
                    border: '2px dashed #e2e8f0', 
                    borderRadius: '16px', 
                    padding: '40px', 
                    textAlign: 'center',
                    background: zipFile ? '#f8fafc' : '#fafafa',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                    onClick={() => document.getElementById('zipFileInput').click()}
                  >
                    <input 
                      type="file" 
                      id="zipFileInput"
                      accept=".zip"
                      onChange={handleZipFileChange}
                      style={{ display: 'none' }}
                    />
                    {zipFile ? (
                      <div>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{zipFileName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#10b981' }}>✓ File selected</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Click to select ZIP file</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Maximum file size: 100MB</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={closeUploadModal}
                      style={{ 
                        flex: 1, 
                        padding: '14px', 
                        background: 'white', 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '12px', 
                        fontSize: '15px', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        color: '#1e293b',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUploadZip}
                      disabled={uploadingZip || !zipFile}
                      style={{ 
                        flex: 1, 
                        padding: '14px', 
                        background: uploadingZip || !zipFile ? '#93c5fd' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontSize: '15px', 
                        fontWeight: 600, 
                        cursor: uploadingZip || !zipFile ? 'not-allowed' : 'pointer', 
                        color: 'white',
                        boxShadow: uploadingZip || !zipFile ? 'none' : '0 4px 15px rgba(139,92,246,0.3)',
                      }}
                    >
                      {uploadingZip ? 'Uploading...' : 'Upload & Extract'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CreateWebsite;