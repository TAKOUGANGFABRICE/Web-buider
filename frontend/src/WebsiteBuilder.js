import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './WebsiteBuilder.css';
import './Gallery.css';

const API_URL = 'http://localhost:8000/api';

const ELEMENT_CATEGORIES = {
  layout: {
    name: 'Layout',
    icon: '📐',
    elements: [
      { type: 'columns', icon: '📊', name: 'Columns', defaultData: { count: 2, gap: '20px', equal: true } },
      { type: 'container', icon: '📦', name: 'Container', defaultData: { maxWidth: '1200px', padding: '20px', align: 'center' } },
      { type: 'spacer', icon: '↕️', name: 'Spacer', defaultData: { height: '40px' } },
      { type: 'divider', icon: '➖', name: 'Divider', defaultData: { style: 'solid', color: '#e2e8f0', height: '1px' } },
    ]
  },
  basic: {
    name: 'Basic',
    icon: '📝',
    elements: [
      { type: 'heading', icon: '📋', name: 'Heading', defaultData: { text: 'Enter heading', level: 'h1' } },
      { type: 'paragraph', icon: '📄', name: 'Paragraph', defaultData: { text: 'Enter your text here...' } },
      { type: 'text', icon: '📝', name: 'Text Block', defaultData: { text: 'Add some text content' } },
      { type: 'button', icon: '🔘', name: 'Button', defaultData: { text: 'Click Me', url: '#', style: 'primary', size: 'medium' } },
      { type: 'link', icon: '🔗', name: 'Link', defaultData: { text: 'Click here', url: '#' } },
      { type: 'list', icon: '📋', name: 'List', defaultData: { items: ['Item 1', 'Item 2', 'Item 3'], style: 'bullet' } },
    ]
  },
  media: {
    name: 'Media',
    icon: '🎨',
    elements: [
      { type: 'image', icon: '🖼️', name: 'Image', defaultData: { src: '', alt: 'Image description', width: '100%', alignment: 'center' } },
      { type: 'video', icon: '🎬', name: 'Video', defaultData: { url: '', autoplay: false, controls: true } },
      { type: 'audio', icon: '🎵', name: 'Audio', defaultData: { src: '', autoplay: false } },
      { type: 'icon', icon: '⭐', name: 'Icon', defaultData: { icon: '⭐', size: '48px', color: '#2563eb' } },
    ]
  },
  sections: {
    name: 'Sections',
    icon: '🌟',
    elements: [
      { type: 'hero', icon: '🌟', name: 'Hero Section', defaultData: { title: 'Welcome', subtitle: 'Your subtitle here', description: 'Add your description', ctaText: 'Get Started', ctaUrl: '#', bgColor: '#667eea', bgImage: '', alignment: 'center' } },
      { type: 'features', icon: '✨', name: 'Features', defaultData: { title: 'Our Features', subtitle: 'What we offer', features: [{ icon: '💡', title: 'Feature 1', description: 'Description' }, { icon: '🚀', title: 'Feature 2', description: 'Description' }, { icon: '🔒', title: 'Feature 3', description: 'Description' }] } },
      { type: 'about', icon: '👤', name: 'About Section', defaultData: { title: 'About Us', content: 'Tell your story here...', image: '' } },
      { type: 'contact', icon: '📧', name: 'Contact Section', defaultData: { title: 'Contact Us', email: 'hello@example.com', phone: '', address: '', formEnabled: true } },
      { type: 'cta', icon: '📢', name: 'Call to Action', defaultData: { title: 'Ready to get started?', subtitle: 'Join us today', buttonText: 'Sign Up', buttonUrl: '#', bgColor: '#2563eb' } },
      { type: 'pricing', icon: '💰', name: 'Pricing Table', defaultData: { plans: [{ name: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], highlighted: false }, { name: 'Pro', price: '$19', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: true }] } },
      { type: 'testimonials', icon: '💬', name: 'Testimonials', defaultData: { title: 'What our clients say', testimonials: [{ name: 'John Doe', text: 'Great service!', avatar: '' }, { name: 'Jane Smith', text: 'Highly recommend!', avatar: '' }] } },
      { type: 'team', icon: '👥', name: 'Team Section', defaultData: { title: 'Our Team', members: [{ name: 'Team Member', role: 'Position', image: '' }] } },
    ]
  },
  navigation: {
    name: 'Navigation',
    icon: '🔗',
    elements: [
      { type: 'nav', icon: '🔗', name: 'Navigation', defaultData: { logo: 'My Website', logoUrl: '', links: [{ text: 'Home', url: '#' }, { text: 'About', url: '#about' }, { text: 'Services', url: '#services' }, { text: 'Contact', url: '#contact' }], style: 'horizontal', align: 'left' } },
      { type: 'footer', icon: '📝', name: 'Footer', defaultData: { company: 'My Website', description: 'Building amazing experiences.', links: [{ text: 'Privacy Policy', url: '#' }, { text: 'Terms of Service', url: '#' }], social: ['facebook', 'twitter', 'instagram', 'linkedin'], copyright: '© 2025 My Website. All rights reserved.' } },
      { type: 'breadcrumb', icon: '🧭', name: 'Breadcrumb', defaultData: { links: [{ text: 'Home', url: '#' }, { text: 'Current Page', url: '' }] } },
    ]
  },
  advanced: {
    name: 'Advanced',
    icon: '⚡',
    elements: [
      { type: 'gallery', icon: '🖼️', name: 'Gallery', defaultData: { images: [], columns: 3, gap: '10px' } },
      { type: 'form', icon: '📋', name: 'Form', defaultData: { fields: [{ name: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true }, { name: 'email', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true }, { name: 'message', type: 'textarea', label: 'Message', placeholder: 'Your message' }], submitText: 'Submit', submitUrl: '' } },
      { type: 'social', icon: '📱', name: 'Social Links', defaultData: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'], style: 'icon', size: '24px' } },
      { type: 'map', icon: '🗺️', name: 'Map', defaultData: { address: '', lat: '', lng: '', zoom: 15 } },
      { type: 'accordion', icon: '📑', name: 'Accordion', defaultData: { items: [{ title: 'Section 1', content: 'Content for section 1' }, { title: 'Section 2', content: 'Content for section 2' }], multiple: false } },
      { type: 'tabs', icon: '📁', name: 'Tabs', defaultData: { tabs: [{ title: 'Tab 1', content: 'Content for tab 1' }, { title: 'Tab 2', content: 'Content for tab 2' }], style: 'horizontal' } },
      { type: 'carousel', icon: '🎠', name: 'Carousel', defaultData: { slides: [{ image: '', title: '', description: '' }], autoplay: true, speed: 3000 } },
      { type: 'countdown', icon: '⏰', name: 'Countdown', defaultData: { date: '', title: 'Coming Soon' } },
      { type: 'custom_html', icon: '⚡', name: 'Custom HTML', defaultData: { html: '<!-- Add your custom HTML here -->\n<div class="custom-element">\n  <p>Your custom content</p>\n</div>' } },
      { type: 'code', icon: '💻', name: 'Code Block', defaultData: { code: '// Add your code here\nconsole.log("Hello World");', language: 'javascript' } },
    ]
  },
};

const ELEMENT_TYPES = [
  { type: 'heading', icon: '📋', name: 'Heading', defaultData: { text: 'Enter heading', level: 'h1' } },
  { type: 'paragraph', icon: '📄', name: 'Paragraph', defaultData: { text: 'Enter your text here...' } },
  { type: 'text', icon: '📝', name: 'Text Block', defaultData: { text: 'Add some text content' } },
  { type: 'image', icon: '🖼️', name: 'Image', defaultData: { src: '', alt: 'Image description', width: '100%' } },
  { type: 'button', icon: '🔘', name: 'Button', defaultData: { text: 'Click Me', url: '#', style: 'primary' } },
  { type: 'container', icon: '📦', name: 'Container', defaultData: { children: [] } },
  { type: 'hero', icon: '🌟', name: 'Hero Section', defaultData: { title: 'Welcome', subtitle: 'Your subtitle here', bgColor: '#667eea' } },
  { type: 'spacer', icon: '↕️', name: 'Spacer', defaultData: { height: '40px' } },
  { type: 'divider', icon: '➖', name: 'Divider', defaultData: { style: 'solid', color: '#e2e8f0' } },
  { type: 'nav', icon: '🔗', name: 'Navigation', defaultData: { links: [{ text: 'Home', url: '/' }, { text: 'About', url: '/about' }] } },
  { type: 'footer', icon: '脚下', name: 'Footer', defaultData: { text: '© 2025 Your Company. All rights reserved.' } },
  { type: 'gallery', icon: '🖼️', name: 'Gallery', defaultData: { images: [] } },
  { type: 'video', icon: '🎬', name: 'Video', defaultData: { url: '', autoplay: false } },
  { type: 'form', icon: '📋', name: 'Form', defaultData: { fields: [{ name: 'email', type: 'email', label: 'Email' }] } },
  { type: 'social', icon: '📱', name: 'Social Links', defaultData: { platforms: ['facebook', 'twitter', 'instagram'] } },
  { type: 'custom_html', icon: '⚡', name: 'Custom HTML', defaultData: { html: '<!-- Add your custom HTML here -->\n<div class="custom-element">\n  <p>Your custom content</p>\n</div>' } },
  { type: 'code', icon: '💻', name: 'Code Block', defaultData: { code: '// Add your code here\nconsole.log("Hello World");', language: 'javascript' } },
];

const TEMPLATE_LAYOUTS = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design',
    icon: '🎨',
    sections: ['hero', 'features', 'about', 'contact']
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional corporate look',
    icon: '💼',
    sections: ['nav', 'hero', 'services', 'testimonials', 'contact', 'footer']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase your work',
    icon: '🖼️',
    sections: ['nav', 'hero', 'gallery', 'about', 'contact']
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'High conversion design',
    icon: '🚀',
    sections: ['nav', 'hero', 'features', 'pricing', 'cta', 'footer']
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Content-focused layout',
    icon: '📝',
    sections: ['nav', 'hero', 'posts', 'sidebar', 'footer']
  },
  {
    id: 'ecommerce',
    name: 'Store',
    description: 'Online shopping layout',
    icon: '🛒',
    sections: ['nav', 'hero', 'products', 'features', 'footer']
  }
];

const TEMPLATE_SECTIONS = {
  nav: {
    type: 'nav',
    name: 'Navigation Bar',
    defaultData: {
      logo: 'My Website',
      links: [
        { text: 'Home', url: '#' },
        { text: 'About', url: '#about' },
        { text: 'Services', url: '#services' },
        { text: 'Contact', url: '#contact' }
      ]
    }
  },
  hero: {
    type: 'hero',
    name: 'Hero Section',
    defaultData: {
      title: 'Welcome to My Website',
      subtitle: 'We create amazing experiences for your business',
      description: 'Get started today and build something great.',
      ctaText: 'Get Started',
      ctaUrl: '#contact',
      bgColor: '#667eea',
      bgImage: ''
    }
  },
  features: {
    type: 'features',
    name: 'Features Section',
    defaultData: {
      title: 'Our Features',
      subtitle: 'What makes us special',
      features: [
        { icon: '⚡', title: 'Fast Performance', description: 'Lightning fast load times' },
        { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: '📱', title: 'Responsive', description: 'Works on all devices' }
      ]
    }
  },
  services: {
    type: 'services',
    name: 'Services Section',
    defaultData: {
      title: 'Our Services',
      subtitle: 'What we offer',
      services: [
        { icon: '🎨', title: 'Design', description: 'Beautiful designs' },
        { icon: '💻', title: 'Development', description: 'Clean code' },
        { icon: '📈', title: 'Marketing', description: 'Grow your business' }
      ]
    }
  },
  gallery: {
    type: 'gallery',
    name: 'Gallery Section',
    defaultData: {
      title: 'Our Work',
      images: [
        { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', alt: 'Project 1' },
        { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', alt: 'Project 2' },
        { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop', alt: 'Project 3' }
      ]
    }
  },
  about: {
    type: 'about',
    name: 'About Section',
    defaultData: {
      title: 'About Us',
      content: 'We are a team of passionate professionals dedicated to delivering exceptional results.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop'
    }
  },
  posts: {
    type: 'posts',
    name: 'Blog Posts',
    defaultData: {
      posts: [
        { title: 'Getting Started', date: 'Jan 1, 2025', excerpt: 'Learn how to get started with our platform...' },
        { title: 'Best Practices', date: 'Jan 15, 2025', excerpt: 'Follow these best practices for success...' },
        { title: 'Tips & Tricks', date: 'Feb 1, 2025', excerpt: 'Discover hidden features and tips...' }
      ]
    }
  },
  sidebar: {
    type: 'sidebar',
    name: 'Sidebar',
    defaultData: {
      search: true,
      categories: ['Technology', 'Design', 'Business'],
      recentPosts: ['Post 1', 'Post 2', 'Post 3']
    }
  },
  products: {
    type: 'products',
    name: 'Products Section',
    defaultData: {
      title: 'Our Products',
      products: [
        { name: 'Product 1', price: '$99', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop' },
        { name: 'Product 2', price: '$149', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop' },
        { name: 'Product 3', price: '$199', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop' }
      ]
    }
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing Section',
    defaultData: {
      title: 'Pricing Plans',
      plans: [
        { name: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'] },
        { name: 'Pro', price: '$29', period: '/month', features: ['All Basic', 'Feature 4', 'Feature 5'], featured: true },
        { name: 'Enterprise', price: '$99', period: '/month', features: ['All Pro', 'Support', 'Custom'] }
      ]
    }
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    defaultData: {
      title: 'What Clients Say',
      testimonials: [
        { name: 'John Doe', role: 'CEO', text: 'Amazing service! Highly recommended.', avatar: 'JD' },
        { name: 'Jane Smith', role: 'Designer', text: 'Beautiful designs and great support.', avatar: 'JS' }
      ]
    }
  },
  cta: {
    type: 'cta',
    name: 'Call to Action',
    defaultData: {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of happy customers today.',
      buttonText: 'Sign Up Now',
      buttonUrl: '#signup',
      bgColor: '#2563eb'
    }
  },
  contact: {
    type: 'contact',
    name: 'Contact Section',
    defaultData: {
      title: 'Contact Us',
      subtitle: 'We would love to hear from you',
      email: 'hello@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Street, City, Country',
      formFields: [
        { name: 'name', type: 'text', label: 'Name', placeholder: 'Your name' },
        { name: 'email', type: 'email', label: 'Email', placeholder: 'Your email' },
        { name: 'message', type: 'textarea', label: 'Message', placeholder: 'Your message' }
      ]
    }
  },
  footer: {
    type: 'footer',
    name: 'Footer',
    defaultData: {
      company: 'My Website',
      description: 'Building amazing experiences.',
      links: [
        { text: 'Privacy Policy', url: '#' },
        { text: 'Terms of Service', url: '#' }
      ],
      social: ['facebook', 'twitter', 'instagram', 'linkedin'],
      copyright: '© 2025 My Website. All rights reserved.'
    }
  }
};

const ImageSelector = ({ onSelect }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const token = localStorage.getItem('access');
  
  useEffect(() => {
    fetchImages();
  }, []);
  
  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_URL}/media/images/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation();
    setConfirmDialog({
      show: true,
      title: 'Delete Image',
      message: 'Are you sure you want to delete this image?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/media/images/${imageId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            setImages(images.filter(img => img.id !== imageId));
            if (selectedImage?.id === imageId) {
              setSelectedImage(null);
            }
          }
        } catch (err) {
          console.error('Error deleting image:', err);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleSelectImage = (image) => {
    setSelectedImage(image);
    if (onSelect) {
      onSelect(image);
    }
  };
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }
  
  if (images.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🖼️</div>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>No images uploaded</p>
        <a href="/gallery" style={{ color: '#2563eb', fontSize: '14px' }}>
          Go to Gallery →
        </a>
      </div>
    );
  }
  
  return (
    <div className="image-selector">
      <div className="image-selector-grid">
        {images.map((image) => (
          <div
            key={image.id}
            className={`image-selector-item ${selectedImage?.id === image.id ? 'selected' : ''}`}
            onClick={() => handleSelectImage(image)}
          >
            <img src={image.image_url || image.image} alt={image.name} />
            <button 
              className="delete-btn"
              onClick={(e) => handleDeleteImage(image.id, e)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <a href="/gallery" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#2563eb', fontSize: '13px' }}>
        Manage in Gallery →
      </a>
    </div>
  );
};

export const Builder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticatedFetch } = useAuth();
  
  const websiteId = searchParams.get('id');
  const [websiteName, setWebsiteName] = useState('My Website');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeTab, setActiveTab] = useState('elements');
  const [canvasWidth, setCanvasWidth] = useState('boxed'); // full, boxed, narrow
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  
  // Template Editor state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  
  // SEO state
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  
  // Team state
  const [teamMembers, setTeamMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMessage, setTeamMessage] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  // Image selection state
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Element category state
  const [activeCategory, setActiveCategory] = useState('basic');
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageSelect = (image) => {
    if (selectedElement) {
      const imageUrl = image.image_url || image.image;
      handleUpdateElement(selectedElement, { src: imageUrl, alt: image.name });
    }
    setShowImagePicker(false);
  };

  useEffect(() => {
    document.title = "Website Builder";
    if (websiteId) {
      fetchWebsite();
    }
  }, [websiteId]);

  const loadExtractedWebsite = async (extractedPath) => {
    try {
      // Get the file list from the custom upload
      const response = await authenticatedFetch(`${API_URL}/custom-uploads/${websiteId}/get_file_list/`);
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          // Try to find and load index.html
          const indexFile = data.files.find(f => 
            f.name.toLowerCase() === 'index.html' || 
            f.name.toLowerCase() === 'index.htm'
          );
          
          if (indexFile) {
            // The file is accessible via MEDIA_URL
            const fileUrl = `/media/${extractedPath}/${indexFile.name}`;
            
            // Fetch the HTML content
            const htmlResponse = await fetch(fileUrl);
            if (htmlResponse.ok) {
              const htmlContent = await htmlResponse.text();
              
              // Parse HTML and convert to elements
              const parsedElements = parseHtmlToElements(htmlContent);
              setElements(parsedElements);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading extracted website:', err);
    }
  };

  const parseHtmlToElements = (htmlContent) => {
    // Simple HTML parser to convert HTML to builder elements
    const elements = [];
    
    // Parse body content
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
    
    // Extract headings
    const headingMatches = bodyContent.match(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi);
    if (headingMatches) {
      headingMatches.forEach((match, i) => {
        const levelMatch = match.match(/<h([1-6])/i);
        const textMatch = match.replace(/<[^>]+>/g, '').trim();
        if (textMatch) {
          elements.push({
            id: `heading-${Date.now()}-${i}`,
            type: 'heading',
            data: {
              text: textMatch,
              level: levelMatch ? `h${levelMatch[1]}` : 'h1'
            },
            position: elements.length
          });
        }
      });
    }
    
    // Extract paragraphs
    const pMatches = bodyContent.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches) {
      pMatches.forEach((match, i) => {
        const textMatch = match.replace(/<[^>]+>/g, '').trim();
        if (textMatch) {
          elements.push({
            id: `paragraph-${Date.now()}-${i}`,
            type: 'paragraph',
            data: { text: textMatch },
            position: elements.length
          });
        }
      });
    }
    
    // Extract images
    const imgMatches = bodyContent.match(/<img[^>]+>/gi);
    if (imgMatches) {
      imgMatches.forEach((match, i) => {
        const srcMatch = match.match(/src=["']([^"']+)["']/i);
        const altMatch = match.match(/alt=["']([^"']*)["']/i);
        if (srcMatch) {
          elements.push({
            id: `image-${Date.now()}-${i}`,
            type: 'image',
            data: {
              src: srcMatch[1],
              alt: altMatch ? altMatch[1] : 'Image'
            },
            position: elements.length
          });
        }
      });
    }
    
    return elements;
  };

  const fetchWebsite = async () => {
    try {
      // First try to fetch from websites endpoint
      let response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/`);
      let data = null;
      
      if (response.ok) {
        data = await response.json();
      } else if (response.status === 404) {
        // Try custom-uploads endpoint for ZIP-uploaded websites
        response = await authenticatedFetch(`${API_URL}/custom-uploads/${websiteId}/`);
        if (response.ok) {
          data = await response.json();
          // Convert custom upload data to website format
          if (data.status === 'ready' && data.extracted_path) {
            data = {
              id: data.id,
              name: data.name,
              is_scratch: false,
              template_used_id: null,
              seo_title: '',
              seo_description: '',
              page_elements: [],
              content: null,
              is_published: data.is_published,
              extracted_path: data.extracted_path
            };
          }
        }
      }
      
      if (data) {
        setWebsiteName(data.name);
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        
        // Check if website was created from scratch
        const isScratch = data.is_scratch || false;
        
        if (data.page_elements && data.page_elements.length > 0) {
          setElements(data.page_elements.map(el => ({
            id: el.id,
            type: el.element_type,
            data: el.element_data,
            position: el.position
          })));
        } else if (isScratch && data.content) {
          // For scratch websites, try to parse initial content
          try {
            const parsedContent = JSON.parse(data.content);
            if (Array.isArray(parsedContent)) {
              setElements(parsedContent);
            }
          } catch (e) {
            console.log('No initial content to load');
          }
        } else if (data.extracted_path) {
          // For ZIP-uploaded websites, load the extracted HTML
          loadExtractedWebsite(data.extracted_path);
        }
        
        // Fetch team members
        const teamResponse = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamMembers(teamData);
        }
      }
      } catch (err) {
        console.error('Error fetching website:', err);
      }
    };

  const handleAddElement = (elementType) => {
    const newElement = {
      id: Date.now().toString(),
      type: elementType.type,
      data: { ...elementType.defaultData },
      position: elements.length
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setActiveTab('properties');
  };

  const handleDragStart = (e, elementType) => {
    setDraggedElement(elementType);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedElement) {
      handleAddElement(draggedElement);
      setDraggedElement(null);
    }
  };

  const handleElementClick = (elementId) => {
    setSelectedElement(elementId);
    setActiveTab('properties');
  };

  const handleUpdateElement = (elementId, updatedData) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, data: { ...el.data, ...updatedData } } : el
    ));
  };

  const handleDeleteElement = (elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleDuplicateElement = (elementId) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (elementToDuplicate) {
      const newElement = {
        id: Date.now().toString(),
        type: elementToDuplicate.type,
        data: { ...elementToDuplicate.data },
        position: elements.length
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const handleMoveUp = (elementId) => {
    const index = elements.findIndex(el => el.id === elementId);
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      newElements.forEach((el, i) => el.position = i);
      setElements(newElements);
    }
  };

  const handleMoveDown = (elementId) => {
    const index = elements.findIndex(el => el.id === elementId);
    if (index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      newElements.forEach((el, i) => el.position = i);
      setElements(newElements);
    }
  };

  const handleInviteTeamMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !websiteId) return;
    
    setTeamLoading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      if (response.ok) {
        setTeamMessage({ type: 'success', text: 'Invitation sent successfully!' });
        setInviteEmail('');
        fetchWebsite(); // Refresh team members
      } else {
        const data = await response.json();
        setTeamMessage({ type: 'error', text: data.error || 'Failed to send invitation' });
      }
    } catch (err) {
      setTeamMessage({ type: 'error', text: 'Error sending invitation' });
    }
    setTeamLoading(false);
  };

  const handleRemoveTeamMember = async (memberId) => {
    setShowConfirmDialog({ 
      show: true, 
      title: 'Remove Team Member', 
      message: 'Are you sure you want to remove this team member?', 
      onConfirm: async () => {
        try {
          const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/${memberId}/`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setTeamMessage({ type: 'success', text: 'Team member removed successfully!' });
            fetchWebsite();
          }
        } catch (err) {
          setTeamMessage({ type: 'error', text: 'Error removing team member' });
        }
        setShowConfirmDialog(null);
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const pageElements = elements.map((el, index) => ({
        element_type: el.type,
        element_data: el.data,
        position: index,
        page_name: 'index'
      }));

      const websiteData = {
        name: websiteName,
        seo_title: seoTitle,
        seo_description: seoDescription,
        page_elements: pageElements
      };

      if (websiteId) {
        await authenticatedFetch(`${API_URL}/websites/${websiteId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(websiteData)
        });
      } else {
        websiteData.content = JSON.stringify(elements);
        const response = await authenticatedFetch(`${API_URL}/websites/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(websiteData)
        });
        if (response.ok) {
          const data = await response.json();
          navigate(`/builder?id=${data.id}`, { replace: true });
        }
      }
      setTeamMessage({ type: 'success', text: 'Website saved successfully!' });
    } catch (err) {
      console.error('Error saving website:', err);
      setTeamMessage({ type: 'error', text: 'Failed to save website' });
    } finally {
      setSaving(false);
    }
  };

  // Template Editor Functions
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // Set default layout for the template
    const layouts = TEMPLATE_LAYOUTS.filter(l => 
      template.category === 'portfolio' && ['portfolio', 'minimal'].includes(l.id) ||
      template.category === 'business' && ['business', 'landing'].includes(l.id) ||
      template.category === 'ecommerce' && ['ecommerce', 'store'].includes(l.id) ||
      template.category === 'blog' && ['blog'].includes(l.id) ||
      template.category === 'landing' && ['landing'].includes(l.id) ||
      template.category === 'restaurant' && ['business'].includes(l.id) ||
      template.category === 'real_estate' && ['business'].includes(l.id) ||
      template.category === 'education' && ['blog'].includes(l.id) ||
      template.category === 'nonprofit' && ['business'].includes(l.id) ||
      template.category === 'other' && ['minimal'].includes(l.id)
    );
    setSelectedLayout(layouts[0] || TEMPLATE_LAYOUTS[0]);
  };

  const handleApplyLayout = () => {
    if (!selectedLayout) return;
    
    // Create elements from layout sections
    const newElements = selectedLayout.sections.map((sectionKey, index) => {
      const sectionConfig = TEMPLATE_SECTIONS[sectionKey];
      return {
        id: Date.now().toString() + index,
        type: sectionConfig.type,
        sectionKey: sectionKey,
        data: { ...sectionConfig.defaultData },
        position: index
      };
    });
    
    setElements(newElements);
    setSelectedTemplate(null);
    setSelectedLayout(null);
    setActiveTab('elements');
  };

  const handleAddSection = (sectionKey) => {
    const sectionConfig = TEMPLATE_SECTIONS[sectionKey];
    const newElement = {
      id: Date.now().toString(),
      type: sectionConfig.type,
      sectionKey: sectionKey,
      data: { ...sectionConfig.defaultData },
      position: elements.length
    };
    setElements([...elements, newElement]);
  };

  const handleSectionClick = (elementId) => {
    setSelectedElement(elementId);
    setActiveTab('sections');
  };

  const renderSectionPreview = (element) => {
    const { type, data } = element;
    
    switch (type) {
      case 'nav':
        return (
          <div className="section-preview nav-preview">
            <div className="nav-logo">{data.logo}</div>
            <div className="nav-links">
              {data.links?.map((link, i) => (
                <span key={i}>{link.text}</span>
              ))}
            </div>
          </div>
        );
      case 'hero':
        return (
          <div className="section-preview hero-preview" style={{ background: data.bgColor || '#667eea' }}>
            <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '8px' }}>{data.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '16px' }}>{data.subtitle}</p>
            {data.description && <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>{data.description}</p>}
            {data.ctaText && <button style={{ background: 'white', color: data.bgColor, padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: '600' }}>{data.ctaText}</button>}
          </div>
        );
      case 'features':
        return (
          <div className="section-preview features-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{data.title}</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '16px' }}>{data.subtitle}</p>
            <div className="features-grid">
              {data.features?.map((feature, i) => (
                <div key={i} className="feature-item">
                  <span className="feature-icon">{feature.icon}</span>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="section-preview services-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{data.title}</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '16px' }}>{data.subtitle}</p>
            <div className="services-grid">
              {data.services?.map((service, i) => (
                <div key={i} className="service-item">
                  <span className="service-icon">{service.icon}</span>
                  <h4>{service.title}</h4>
                  <p>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="section-preview gallery-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{data.title}</h2>
            <div className="gallery-grid">
              {data.images?.map((img, i) => (
                <img key={i} src={img.src} alt={img.alt} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="section-preview about-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{data.title}</h2>
            <p style={{ textAlign: 'center', color: '#555', lineHeight: 1.6 }}>{data.content}</p>
          </div>
        );
      case 'posts':
        return (
          <div className="section-preview posts-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Latest Posts</h2>
            <div className="posts-grid">
              {data.posts?.map((post, i) => (
                <div key={i} className="post-item">
                  <h4>{post.title}</h4>
                  <span className="post-date">{post.date}</span>
                  <p>{post.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="section-preview products-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{data.title}</h2>
            <div className="products-grid">
              {data.products?.map((product, i) => (
                <div key={i} className="product-item">
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                  <h4>{product.name}</h4>
                  <span className="product-price">{product.price}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'pricing':
        return (
          <div className="section-preview pricing-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{data.title}</h2>
            <div className="pricing-grid">
              {data.plans?.map((plan, i) => (
                <div key={i} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                  <h4>{plan.name}</h4>
                  <div className="price">{plan.price}<span>{plan.period}</span></div>
                  <ul>
                    {plan.features.map((f, j) => <li key={j}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case 'testimonials':
        return (
          <div className="section-preview testimonials-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{data.title}</h2>
            <div className="testimonials-grid">
              {data.testimonials?.map((testimonial, i) => (
                <div key={i} className="testimonial-item">
                  <p>"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <span className="avatar">{testimonial.avatar}</span>
                    <div>
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cta':
        return (
          <div className="section-preview cta-preview" style={{ background: data.bgColor || '#2563eb' }}>
            <h2 style={{ color: 'white', textAlign: 'center' }}>{data.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{data.subtitle}</p>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button style={{ background: 'white', color: data.bgColor, padding: '12px 24px', border: 'none', borderRadius: '4px', fontWeight: '600' }}>{data.buttonText}</button>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="section-preview contact-preview">
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{data.title}</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '16px' }}>{data.subtitle}</p>
            <div className="contact-info">
              <div>📧 {data.email}</div>
              <div>📞 {data.phone}</div>
              <div>📍 {data.address}</div>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div className="section-preview footer-preview">
            <div className="footer-content">
              <div className="footer-company">
                <h4>{data.company}</h4>
                <p>{data.description}</p>
              </div>
              <div className="footer-links">
                {data.links?.map((link, i) => (
                  <a key={i} href={link.url}>{link.text}</a>
                ))}
              </div>
              <div className="footer-social">
                {data.social?.map((s, i) => <span key={i}>🔗</span>)}
              </div>
            </div>
            <div className="footer-copyright">{data.copyright}</div>
          </div>
        );
      default:
        return <div className="section-preview">Section: {type}</div>;
    }
  };

  const renderElementPreview = (element) => {
    const { type, data } = element;
    
    switch (type) {
      case 'heading':
        const HeadingTag = data.level || 'h1';
        return <HeadingTag style={{ margin: 0, color: '#1e293b' }}>{data.text}</HeadingTag>;
      case 'paragraph':
        return <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>{data.text}</p>;
      case 'text':
        return <div style={{ color: '#1e293b' }}>{data.text}</div>;
      case 'image':
        return data.src ? (
          <div style={{ position: 'relative' }}>
            <img src={data.src} alt={data.alt} style={{ maxWidth: '100%', width: data.width }} />
          </div>
        ) : (
          <div className="element-placeholder" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('images')}>
            🖼️ Click to select from Gallery
          </div>
        );
      case 'button':
        return (
          <button className={`builder-btn builder-btn-${data.style || 'primary'}`}>
            {data.text}
          </button>
        );
      case 'hero':
        return (
          <div className="builder-hero" style={{ background: data.bgColor || '#667eea' }}>
            <h1 style={{ color: 'white', margin: 0 }}>{data.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>{data.subtitle}</p>
          </div>
        );
      case 'spacer':
        return <div style={{ height: data.height || '40px' }} />;
      case 'divider':
        return <hr style={{ border: 'none', borderTop: `1px ${data.style || 'solid'} ${data.color || '#e2e8f0'}`, margin: '20px 0' }} />;
      case 'nav':
        return (
          <nav className="builder-nav">
            {data.links?.map((link, i) => (
              <a key={i} href={link.url}>{link.text}</a>
            ))}
          </nav>
        );
      case 'footer':
        return <footer className="builder-footer">{data.text}</footer>;
      case 'gallery':
        return <div className="builder-gallery">🖼️ Gallery ({data.images?.length || 0} images)</div>;
      case 'video':
        return data.url ? (
          <div className="builder-video">
            <iframe src={data.url} title="Video" frameBorder="0" allowFullScreen />
          </div>
        ) : (
          <div className="element-placeholder">🎬 Add video URL</div>
        );
      case 'form':
        return (
          <div className="builder-form">
            {data.fields?.map((field, i) => (
              <div key={i} className="form-field">
                <label>{field.label}</label>
                <input type={field.type} placeholder={field.label} disabled />
              </div>
            ))}
            <button className="builder-btn builder-btn-primary">Submit</button>
          </div>
        );
      case 'social':
        return (
          <div className="builder-social">
            {data.platforms?.map((platform, i) => (
              <span key={i} className="social-icon">🔗</span>
            ))}
          </div>
        );
      case 'container':
        return <div className="builder-container-element">📦 Container</div>;
      case 'custom_html':
        return (
          <div className="builder-html-element" style={{ 
            border: '2px dashed #8b5cf6', 
            padding: '16px', 
            borderRadius: '8px',
            background: '#f5f3ff',
            minHeight: '60px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>⚡</span>
              <span style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '14px' }}>Custom HTML</span>
            </div>
            <pre style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#666',
              background: '#1a1a2e',
              color: '#a5b4fc',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {data.html?.substring(0, 50)}...
            </pre>
          </div>
        );
      case 'code':
        return (
          <div className="builder-code-element" style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#1e1e1e',
          }}>
            <div style={{ 
              background: '#2d2d2d', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color: '#888', fontSize: '12px' }}>{data.language || 'code'}</span>
            </div>
            <pre style={{ 
              margin: 0, 
              padding: '12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#d4d4d4',
              overflow: 'auto',
            }}>
              {data.code?.substring(0, 100)}
            </pre>
          </div>
        );
      case 'link':
        return <a href={data.url} style={{ color: '#2563eb', textDecoration: 'underline' }}>{data.text}</a>;
      case 'list':
        const ListTag = data.style === 'numbered' ? 'ol' : 'ul';
        return (
          <ListTag style={{ paddingLeft: '20px', margin: 0 }}>
            {data.items?.map((item, i) => <li key={i}>{item}</li>)}
          </ListTag>
        );
      case 'audio':
        return data.src ? (
          <audio controls src={data.src} style={{ width: '100%' }} />
        ) : (
          <div className="element-placeholder">🎵 Add audio URL</div>
        );
      case 'icon':
        return <span style={{ fontSize: data.size || '48px', color: data.color || '#2563eb' }}>{data.icon || '⭐'}</span>;
      case 'columns':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.count || 2}, 1fr)`, gap: data.gap || '20px' }}>
            {[...Array(data.count || 2)].map((_, i) => (
              <div key={i} style={{ background: '#f1f5f9', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
                Column {i + 1}
              </div>
            ))}
          </div>
        );
      case 'features':
      case 'services':
      case 'gallery':
      case 'about':
      case 'posts':
      case 'sidebar':
      case 'products':
      case 'pricing':
      case 'testimonials':
      case 'cta':
      case 'contact':
      case 'breadcrumb':
      case 'accordion':
      case 'tabs':
      case 'carousel':
      case 'countdown':
      case 'map':
      case 'team':
        return renderSectionPreview(element);
      default:
        return <div className="element-placeholder">Unknown element</div>;
    }
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (showPreview) {
    return (
      <div className="preview-container">
        <div className="preview-banner">
          <span className="preview-banner-icon">👁️</span>
          Preview Mode — This is how your site will look when published
        </div>
        <div className="preview-actions">
          <button className="btn-secondary" onClick={() => setShowPreview(false)}>← Back to Editor</button>
          <button className="btn-primary" onClick={handleSave}>Publish Website</button>
        </div>
        <div className="preview-website">
          {elements.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <p>Your website is empty. Add some elements to get started!</p>
            </div>
          ) : (
            elements.map(el => (
              <div key={el.id} style={{ padding: '20px' }}>
                {renderElementPreview(el)}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="builder-app">
      <header className="builder-header">
        <div className="builder-header-left">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>← Back</button>
          <input
            type="text"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
            className="website-name-input"
            placeholder="Website Name"
          />
        </div>
        <div className="builder-header-right">
          <button className="btn-secondary" onClick={() => setShowPreview(true)}>👁️ Preview</button>
          <button className="btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? '💾 Saving...' : '💾 Save'}
          </button>
          <button className="btn-primary" onClick={() => setShowPreview(true)}>🚀 Publish</button>
        </div>
      </header>

      <div className="builder-main">
        <aside className="builder-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              🎨 Templates
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'sections' ? 'active' : ''}`}
              onClick={() => setActiveTab('sections')}
            >
              📑 Sections
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'elements' ? 'active' : ''}`}
              onClick={() => setActiveTab('elements')}
            >
              📝 Elements
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              ⚙️ Properties
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              🔍 SEO
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              👥 Team
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              🖼️ Images
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="templates-panel">
              <h3>Start with a Template</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Choose a pre-built layout to get started quickly
              </p>
              <div className="layout-grid">
                {TEMPLATE_LAYOUTS.map((layout) => (
                  <div
                    key={layout.id}
                    className={`layout-card ${selectedLayout?.id === layout.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLayout(layout)}
                  >
                    <span className="layout-icon">{layout.icon}</span>
                    <div className="layout-info">
                      <h4>{layout.name}</h4>
                      <p>{layout.description}</p>
                    </div>
                    <div className="layout-sections">
                      {layout.sections.length} sections
                    </div>
                  </div>
                ))}
              </div>
              {selectedLayout && (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '16px' }}
                  onClick={handleApplyLayout}
                >
                  Apply This Layout
                </button>
              )}
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="sections-panel">
              <h3>Add Pre-built Sections</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Click to add professionally designed sections
              </p>
              <div className="sections-grid">
                {Object.entries(TEMPLATE_SECTIONS).map(([key, section]) => (
                  <div
                    key={key}
                    className="section-item"
                    onClick={() => handleAddSection(key)}
                  >
                    <span className="section-icon">📄</span>
                    <span className="section-name">{section.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'elements' && (
            <div className="elements-panel">
              <div className="elements-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {searchQuery ? (
                <div className="elements-grid">
                  {Object.values(ELEMENT_CATEGORIES).flatMap(cat => cat.elements)
                    .filter(el => el.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((el) => (
                      <div
                        key={el.type}
                        className="element-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, el)}
                        onClick={() => handleAddElement(el)}
                      >
                        <span className="element-icon">{el.icon}</span>
                        <span className="element-name">{el.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <>
                  <div className="category-tabs">
                    {Object.entries(ELEMENT_CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                        onClick={() => setActiveCategory(key)}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="elements-grid">
                    {ELEMENT_CATEGORIES[activeCategory]?.elements.map((el) => (
                      <div
                        key={el.type}
                        className="element-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, el)}
                        onClick={() => handleAddElement(el)}
                      >
                        <span className="element-icon">{el.icon}</span>
                        <span className="element-name">{el.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="properties-panel">
              {selectedElementData ? (
                <>
                  <div className="properties-header">
                    <h3>Edit {selectedElementData.type}</h3>
                    <div className="element-actions">
                      <button onClick={() => handleMoveUp(selectedElement)} title="Move Up">⬆️</button>
                      <button onClick={() => handleMoveDown(selectedElement)} title="Move Down">⬇️</button>
                      <button onClick={() => handleDuplicateElement(selectedElement)} title="Duplicate">📋</button>
                      <button onClick={() => handleDeleteElement(selectedElement)} title="Delete">🗑️</button>
                    </div>
                  </div>
                  <div className="properties-form">
                    {Object.entries(selectedElementData.data).map(([key, value]) => (
                      <div key={key} className="form-group">
                        <label>{key.replace(/_/g, ' ')}</label>
                        {key === 'level' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                          </select>
                        ) : key === 'style' && selectedElementData.type === 'button' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="outline">Outline</option>
                          </select>
                        ) : key === 'bgColor' ? (
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          />
                        ) : key === 'height' ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                            placeholder="e.g., 40px"
                          />
                        ) : key === 'src' && selectedElementData.type === 'image' ? (
                          <div>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                              placeholder="Image URL"
                            />
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ marginTop: '8px', width: '100%' }}
                              onClick={() => setActiveTab('images')}
                            >
                              🖼️ Select from Gallery
                            </button>
                          </div>
                        ) : (key === 'html' || key === 'code') && (selectedElementData.type === 'custom_html' || selectedElementData.type === 'code') ? (
                          <textarea
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                            placeholder={key === 'html' ? 'Enter your custom HTML code...' : 'Enter your code...'}
                            rows={8}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              padding: '8px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              width: '100%',
                              resize: 'vertical',
                            }}
                          />
                        ) : key === 'language' && selectedElementData.type === 'code' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="json">JSON</option>
                            <option value="sql">SQL</option>
                            <option value="bash">Bash</option>
                          </select>
                        ) : key === 'count' && selectedElementData.type === 'columns' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: parseInt(e.target.value) })}
                          >
                            <option value="2">2 Columns</option>
                            <option value="3">3 Columns</option>
                            <option value="4">4 Columns</option>
                          </select>
                        ) : key === 'alignment' || key === 'align' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        ) : key === 'size' && selectedElementData.type === 'button' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        ) : key === 'size' && selectedElementData.type === 'icon' ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                            placeholder="e.g., 48px"
                          />
                        ) : key === 'color' && selectedElementData.type === 'icon' ? (
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          />
                        ) : key === 'style' && selectedElementData.type === 'list' ? (
                          <select
                            value={value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          >
                            <option value="bullet">Bullet List</option>
                            <option value="numbered">Numbered List</option>
                          </select>
                        ) : key === 'items' && selectedElementData.type === 'list' ? (
                          <textarea
                            value={Array.isArray(value) ? value.join('\n') : value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value.split('\n') })}
                            placeholder="Enter items, one per line"
                            rows={4}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                        ) : key === 'platforms' && selectedElementData.type === 'social' ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'github'].map(p => (
                              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={value?.includes(p)}
                                  onChange={(e) => {
                                    const newPlatforms = e.target.checked
                                      ? [...(value || []), p]
                                      : value?.filter(platform => platform !== p) || [];
                                    handleUpdateElement(selectedElement, { [key]: newPlatforms });
                                  }}
                                />
                                {p}
                              </label>
                            ))}
                          </div>
                        ) : (key === 'features' || key === 'plans' || key === 'testimonials' || key === 'members') && Array.isArray(value) ? (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {value.length} items configured
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                const newItem = key === 'features' ? { icon: '💡', title: 'New Feature', description: 'Description' }
                                  : key === 'plans' ? { name: 'Plan', price: '$9', period: '/month', features: ['Feature 1'], highlighted: false }
                                  : key === 'testimonials' ? { name: 'Name', text: 'Testimonial', avatar: '' }
                                  : { name: 'Name', role: 'Role', image: '' };
                                handleUpdateElement(selectedElement, { [key]: [...value, newItem] });
                              }}
                            >
                              + Add Item
                            </button>
                          </div>
                        ) : key === 'links' && Array.isArray(value) ? (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {value.length} links
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                handleUpdateElement(selectedElement, { [key]: [...value, { text: 'New Link', url: '#' }] });
                              }}
                            >
                              + Add Link
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={typeof value === 'object' ? JSON.stringify(value) : value}
                            onChange={(e) => handleUpdateElement(selectedElement, { [key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select an element on the canvas to edit its properties</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="seo-panel">
              <h3>Search Engine Optimization</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Improve your website's visibility in search engines
              </p>
              <div className="form-group">
                <label>SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Enter SEO title"
                  maxLength={200}
                />
                <small style={{ color: '#888' }}>{seoTitle.length}/200</small>
              </div>
              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Enter meta description"
                  rows={4}
                  maxLength={500}
                />
                <small style={{ color: '#888' }}>{seoDescription.length}/500</small>
              </div>
              <button className="btn-primary" onClick={handleSave} style={{ marginTop: '12px' }}>
                {saving ? 'Saving...' : 'Save SEO'}
              </button>
            </div>
          )}

          {activeTab === 'team' && websiteId && (
            <div className="team-panel">
              <h3>Team Members</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Invite others to collaborate on this website
              </p>
              
              <form onSubmit={handleInviteTeamMember} className="invite-form">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="submit" className="btn-primary" disabled={teamLoading}>
                  {teamLoading ? 'Sending...' : 'Invite'}
                </button>
              </form>

              <div className="team-list">
                {teamMembers.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                    No team members yet
                  </p>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className="team-member-item">
                      <div className="member-avatar">
                        {member.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{member.username}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                      {member.role !== 'owner' && (
                        <button 
                          className="btn-remove" 
                          onClick={() => handleRemoveTeamMember(member.id)}
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="role-info" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <strong>Roles:</strong>
                <div>Admin - Full access</div>
                <div>Editor - Can edit content</div>
                <div>Viewer - Read only</div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="images-panel">
              <h3>My Images</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Select an image to use in your website elements
              </p>
              <ImageSelector onSelect={handleImageSelect} />
            </div>
          )}
        </aside>

        <main 
          className="builder-canvas"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Canvas Width Controls */}
          <div className="canvas-controls">
            <span style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>Canvas:</span>
            <button 
              className={`canvas-width-btn ${canvasWidth === 'full' ? 'active' : ''}`}
              onClick={() => setCanvasWidth('full')}
              title="Full Width"
            >
              ↔ Full
            </button>
            <button 
              className={`canvas-width-btn ${canvasWidth === 'boxed' ? 'active' : ''}`}
              onClick={() => setCanvasWidth('boxed')}
              title="Boxed"
            >
              ⬜ Boxed
            </button>
            <button 
              className={`canvas-width-btn ${canvasWidth === 'narrow' ? 'active' : ''}`}
              onClick={() => setCanvasWidth('narrow')}
              title="Narrow"
            >
              ↔ Narrow
            </button>
          </div>
          
          <div className={`canvas-content ${canvasWidth}`}>
            {elements.length === 0 ? (
              <div className="empty-canvas">
                <div className="empty-canvas-icon">✨</div>
                <h3>Start Building Your Website</h3>
                <p>Drag elements from the sidebar or click to add them here</p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '13px', color: '#666' }}>📐 Layout</span>
                  <span style={{ padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '13px', color: '#666' }}>📝 Basic</span>
                  <span style={{ padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '13px', color: '#666' }}>🎨 Media</span>
                  <span style={{ padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '13px', color: '#666' }}>🌟 Sections</span>
                </div>
              </div>
            ) : (
              elements.map((element) => (
                <div
                  key={element.id}
                  className={`canvas-element ${selectedElement === element.id ? 'selected' : ''}`}
                  onClick={() => handleElementClick(element.id)}
                >
                  {renderElementPreview(element)}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Builder;