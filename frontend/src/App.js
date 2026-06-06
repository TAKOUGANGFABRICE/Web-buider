import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import "./styles.css";
import LandingPage from "./LandingPage";
import Billing from "./Billing";
import PlanSelection from "./PlanSelection";
import TemplateGallery from "./TemplateGallery";
import OrderTemplate from "./OrderTemplate";
import CreateWebsitePage from "./CreateWebsite";
import VerifyEmail from "./VerifyEmail";
import OAuthCallback from "./OAuthCallback";
import { AuthProvider, useAuth } from "./AuthContext";
import { ToastProvider, useToast } from "./ToastContext";
import WebsiteBuilder from "./WebsiteBuilder";
import Gallery from "./Gallery";
import Toast from "./Toast";

// Sidebar Layout Component
const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  
  // Get username from user object or localStorage
  const username = user?.username || user?.first_name || localStorage.getItem("username") || "User";

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">💎</span>
            <span>WaaS</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`sidebar-nav-item ${isActive("/dashboard") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/websites" className={`sidebar-nav-item ${isActive("/websites") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">🌐</span>
            <span>My Websites</span>
          </Link>
          <Link to="/gallery" className={`sidebar-nav-item ${isActive("/gallery") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">🖼️</span>
            <span>Templates</span>
          </Link>
          <Link to="/media" className={`sidebar-nav-item ${isActive("/media") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">📁</span>
            <span>Media Gallery</span>
          </Link>
          <Link to="/order-template" className={`sidebar-nav-item ${isActive("/order-template") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">🎨</span>
            <span>Order Custom</span>
          </Link>
          <Link to="/billing" className={`sidebar-nav-item ${isActive("/billing") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">💳</span>
            <span>Billing</span>
          </Link>
          <Link to="/settings" className={`sidebar-nav-item ${isActive("/settings") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: "100%" }}>
            <span className="sidebar-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <h1>{document.title || "Dashboard"}</h1>
          <div className="user-menu">
            <div className="user-avatar">
              {username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

// Auth Pages
export const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const checkAndRedirect = React.useCallback(() => {
    // After login/register, go directly to dashboard
    // Plan selection can be done later from Billing page
    navigate('/dashboard');
  }, [navigate]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      checkAndRedirect();
    }
  }, [user, checkAndRedirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        await checkAndRedirect();
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💎</span>
            <span className="auth-logo-text">WaaS</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Login to your account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {error && <div className="form-error mb-4">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export const Signup = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!name.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: name,
        email: email,
        password: password,
        password2: password
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💎</span>
            <span className="auth-logo-text">WaaS</span>
          </div>
          <h1>Create Account</h1>
          <p>Sign up to get started</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <div className="form-error mb-4">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

// Dashboard Page
export const Dashboard = () => {
  const { user, authenticatedFetch } = useAuth();
  const [websites, setWebsites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showQuickUpload, setShowQuickUpload] = React.useState(false);
  const [quickWebsiteName, setQuickWebsiteName] = React.useState('');
  const [quickZipFile, setQuickZipFile] = React.useState(null);
  const [quickUploading, setQuickUploading] = React.useState(false);
  const [quickUploadStatus, setQuickUploadStatus] = React.useState('');
  const navigate = useNavigate();
  
  const username = user?.username || user?.first_name || localStorage.getItem("username") || "User";
  const currentPlan = localStorage.getItem('selected_plan_name') || "Free";
  
  React.useEffect(() => {
    document.title = "Dashboard";
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/crud/websites/crud/');
      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
      }
    } catch (err) {
      console.error('Error fetching websites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickZipUpload = async () => {
    if (!quickWebsiteName.trim()) {
      setQuickUploadStatus('Please enter a website name');
      return;
    }
    if (!quickZipFile) {
      setQuickUploadStatus('Please select a ZIP file');
      return;
    }
    
    setQuickUploading(true);
    setQuickUploadStatus('Uploading...');
    
    try {
      const formData = new FormData();
      formData.append('name', quickWebsiteName);
      formData.append('zip_file', quickZipFile);
      
      const response = await authenticatedFetch('http://localhost:8000/api/custom-uploads/', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setQuickUploadStatus('Extracting files...');
        
        // Poll for status
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusResponse = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${result.id}/`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'ready') {
            setQuickUploadStatus('Ready!');
            navigate(`/preview?id=${result.id}`);
            return;
          } else if (statusData.status === 'failed') {
            setQuickUploadStatus(statusData.error_message || 'Extraction failed');
            setQuickUploading(false);
            return;
          }
        }
        setQuickUploadStatus('Processing timed out');
      } else {
        setQuickUploadStatus(result.error || result.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading:', err);
      setQuickUploadStatus('Network error');
    }
    setQuickUploading(false);
  };

  const publishedCount = websites.filter(w => w.is_published).length;

  return (
    <SidebarLayout>
      <div style={{ marginBottom: "8px", color: "var(--text-secondary)" }}>
        Welcome, {username} 👋
      </div>
      
      {/* Quick ZIP Upload Panel */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>📦 Quick Import from ZIP</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Upload a cPanel ZIP backup and get started instantly</p>
          </div>
          <button 
            onClick={() => setShowQuickUpload(!showQuickUpload)}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {showQuickUpload ? '✕ Close' : '+ Upload ZIP'}
          </button>
        </div>
        
        {showQuickUpload && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Website Name"
                value={quickWebsiteName}
                onChange={(e) => setQuickWebsiteName(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem'
                }}
              />
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setQuickZipFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="quick-zip-input"
              />
              <label 
                htmlFor="quick-zip-input"
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  border: '2px dashed rgba(255,255,255,0.4)'
                }}
              >
                {quickZipFile ? quickZipFile.name : '📁 Select ZIP File'}
              </label>
              <button 
                onClick={handleQuickZipUpload}
                disabled={quickUploading}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: quickUploading ? 'not-allowed' : 'pointer',
                  opacity: quickUploading ? 0.7 : 1
                }}
              >
                {quickUploading ? '⏳ Uploading...' : '🚀 Upload & Import'}
              </button>
            </div>
            {quickUploadStatus && (
              <div style={{ marginTop: '12px', color: quickUploadStatus.includes('error') || quickUploadStatus.includes('failed') || quickUploadStatus.includes('Please') ? '#ffcccc' : '#ccffcc' }}>
                {quickUploadStatus}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Websites</span>
            <span className="stat-icon">🌐</span>
          </div>
          <div className="stat-value">{websites.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Published</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value">{publishedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Current Plan</span>
            <span className="stat-icon">💎</span>
          </div>
          <div className="stat-value" style={{ fontSize: "1.5rem" }}>{currentPlan}</div>
        </div>
      </div>
      <div className="recent-section">
        <div className="section-header">
          <h3>Recent Websites</h3>
          <Link to="/create" className="btn-primary btn-icon">➕ Create New</Link>
        </div>
        {loading ? (
          <div className="spinner"></div>
        ) : websites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No websites yet. Create your first website!</p>
            <Link to="/create" className="btn-primary" style={{ marginTop: '16px' }}>Create Website</Link>
          </div>
        ) : (
          <div className="website-list">
            {websites.slice(0, 5).map((site) => (
              <div key={site.id} className="website-list-item">
                <div className="website-thumbnail">🌐</div>
                <div className="website-info">
                  <h4>{site.name}</h4>
                  <p>{site.is_published ? "🟢 Published" : "⚪ Draft"} • Updated {new Date(site.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="website-actions">
                  <Link to={`/builder?id=${site.id}`} className="btn-secondary">Edit</Link>
                  <Link to={`/preview?id=${site.id}`} className="btn-secondary">Preview</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

// My Websites Page
export const Websites = () => {
  const { authenticatedFetch } = useAuth();
  const [websites, setWebsites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "My Websites";
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      // Fetch regular websites
      const response = await authenticatedFetch('http://localhost:8000/api/crud/websites/crud/');
      let data = [];
      if (response.ok) {
        data = await response.json();
      }
      
      // Also fetch custom uploads (ZIP uploads)
      try {
        const uploadResponse = await authenticatedFetch('http://localhost:8000/api/custom-uploads/');
        if (uploadResponse.ok) {
          const uploads = await uploadResponse.json();
          // Add uploads to websites list with type indicator
          const uploadWebsites = uploads.map(upload => ({
            ...upload,
            is_custom_upload: true,
            template_used_id: 'zip_upload'
          }));
          data = [...data, ...uploadWebsites];
        }
      } catch (e) {
        console.log('No custom uploads found');
      }
      
      setWebsites(data);
    } catch (err) {
      console.error('Error fetching websites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (websiteId, isCustomUpload = false) => {
    if (!window.confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      return;
    }
    
    try {
      let response;
      if (isCustomUpload) {
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${websiteId}/`, {
          method: 'DELETE',
        });
      } else {
        response = await authenticatedFetch(`http://localhost:8000/api/crud/websites/crud/${websiteId}/`, {
          method: 'DELETE',
        });
      }
      
      if (response.ok) {
        setWebsites(websites.filter(w => w.id !== websiteId));
      } else {
        alert('Failed to delete website');
      }
    } catch (err) {
      console.error('Error deleting website:', err);
      alert('Failed to delete website');
    }
  };

  const handlePublish = async (website) => {
    try {
      let response;
      if (website.is_custom_upload) {
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${website.id}/publish/`, {
          method: 'POST',
        });
      } else {
        response = await authenticatedFetch(`http://localhost:8000/api/websites/${website.id}/publish/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (response.ok) {
        setWebsites(websites.map(w => w.id === website.id ? { ...w, is_published: true } : w));
      }
    } catch (err) {
      console.error('Error publishing website:', err);
    }
  };

  const handleUnpublish = async (website) => {
    try {
      let response;
      if (website.is_custom_upload) {
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${website.id}/unpublish/`, {
          method: 'POST',
        });
      } else {
        response = await authenticatedFetch(`http://localhost:8000/api/websites/${website.id}/unpublish/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (response.ok) {
        setWebsites(websites.map(w => w.id === website.id ? { ...w, is_published: false } : w));
      }
    } catch (err) {
      console.error('Error unpublishing website:', err);
    }
  };

  const getTemplateName = (templateId) => {
    if (!templateId) return 'Custom';
    const templates = {
      'portfolio': 'Portfolio',
      'business': 'Business',
      'ecommerce': 'E-Commerce',
      'blog': 'Blog',
      'landing': 'Landing Page',
      'restaurant': 'Restaurant',
      'real_estate': 'Real Estate',
      'education': 'Education',
      'nonprofit': 'Non-Profit',
      'zip_upload': 'ZIP Upload',
    };
    return templates[templateId] || 'Custom';
  };

  const getTemplateIcon = (templateId) => {
    if (!templateId) return '✨';
    const icons = {
      'portfolio': '🎨',
      'business': '💼',
      'ecommerce': '🛒',
      'blog': '📝',
      'landing': '🚀',
      'restaurant': '🍽️',
      'real_estate': '🏠',
      'education': '📚',
      'nonprofit': '❤️',
      'zip_upload': '📦',
    };
    return icons[templateId] || '🌐';
  };

  return (
    <SidebarLayout>
      <div className="websites-page-header">
        <div>
          <h2 className="websites-page-title">My Websites</h2>
          <p className="websites-page-subtitle">Manage and organize all your websites</p>
        </div>
        <Link to="/create" className="btn-primary">
          <span>➕</span> Create New Website
        </Link>
      </div>

      {loading ? (
        <div className="websites-loading">
          <div className="spinner"></div>
          <p>Loading your websites...</p>
        </div>
      ) : websites.length === 0 ? (
        <div className="websites-empty">
          <div className="websites-empty-icon">🌐</div>
          <h3>No websites yet</h3>
          <p>Create your first website to get started!</p>
          <Link to="/create" className="btn-primary">Create Website</Link>
        </div>
      ) : (
        <div className="websites-cards-grid">
          {websites.map((site) => (
            <div key={site.id} className="website-card">
              <div className="website-card-header">
                <div className="website-card-title-row">
                  <span className="website-card-icon">{getTemplateIcon(site.template_used_id)}</span>
                  <h3 className="website-card-title">{site.name}</h3>
                </div>
                <span className={`website-status-badge ${site.is_published ? 'published' : 'draft'}`}>
                  {site.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="website-card-body">
                <div className="website-card-thumbnail">
                  <div className="website-template-preview">
                    <span className="template-icon-large">{getTemplateIcon(site.template_used_id)}</span>
                  </div>
                </div>
                <div className="website-card-meta">
                  <div className="meta-row">
                    <span className="meta-label">Template:</span>
                    <span className="meta-value">{getTemplateName(site.template_used_id)}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Last updated:</span>
                    <span className="meta-value">{new Date(site.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="website-card-actions">
                <Link to={`/builder?id=${site.id}`} className="btn-action btn-edit">
                  <span>✏️</span> Edit
                </Link>
                <Link to={`/preview?id=${site.id}`} className="btn-action btn-preview">
                  <span>👁️</span> Preview
                </Link>
                {site.is_published ? (
                  <button onClick={() => handleUnpublish(site)} className="btn-action btn-unpublish">
                    <span>📤</span> Unpublish
                  </button>
                ) : (
                  <button onClick={() => handlePublish(site)} className="btn-action btn-publish">
                    <span>🚀</span> Publish
                  </button>
                )}
                <button onClick={() => handleDelete(site.id, site.is_custom_upload)} className="btn-action btn-delete">
                  <span>🗑️</span> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
};

// Create Website Page
export const CreateWebsite = () => {
  const [name, setName] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState("business");
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Create Website";
  }, []);

  const templates = [
    { id: "business", name: "Business", icon: "💼", description: "Professional business template" },
    { id: "portfolio", name: "Portfolio", icon: "🎨", description: "Showcase your work" },
    { id: "blog", name: "Blog", icon: "📝", description: "Perfect for blogging" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/builder");
  };

  return (
    <SidebarLayout>
      <div className="page-header">
        <h2>Create a New Website</h2>
      </div>
      <div className="create-website-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Website Name</label>
            <input
              type="text"
              placeholder="Enter website name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="template-selection">
            <h3>Select Template</h3>
            <div className="templates-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? "selected" : ""}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="template-preview">{template.icon}</div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary btn-large">
            Create Website
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
};

// Remove the old inline Builder component since we now have a separate file

// Preview Page
export const Preview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticatedFetch } = useAuth();
  const [publishing, setPublishing] = React.useState(false);
  const [website, setWebsite] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const websiteId = new URLSearchParams(location.search).get('id');

  React.useEffect(() => {
    if (websiteId) {
      fetchWebsite();
    }
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      // First try websites endpoint
      let response = await authenticatedFetch(`http://localhost:8000/api/crud/websites/crud/${websiteId}/`);
      let data = null;
      
      if (response.ok) {
        data = await response.json();
      } else if (response.status === 404) {
        // Try custom-uploads endpoint
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${websiteId}/`);
        if (response.ok) {
          data = await response.json();
          // Convert to website format
          data = {
            ...data,
            name: data.name,
            is_published: data.is_published,
          };
        }
      }
      
      if (data) {
        setWebsite(data);
      }
    } catch (err) {
      console.error('Error fetching website:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!websiteId) return;
    
    setPublishing(true);
    try {
      // Try websites endpoint first
      let response = await authenticatedFetch(`http://localhost:8000/api/websites/${websiteId}/publish/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        // Try custom-uploads endpoint
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${websiteId}/publish/`, {
          method: 'POST',
        });
      }

      if (response.ok) {
        setWebsite({ ...website, is_published: true });
        navigate('/websites');
      }
    } catch (err) {
      console.error('Publish failed:', err);
    }
    setPublishing(false);
  };
  
  const handleUnpublish = async () => {
    if (!websiteId) return;
    
    setPublishing(true);
    try {
      // Try websites endpoint first
      let response = await authenticatedFetch(`http://localhost:8000/api/websites/${websiteId}/unpublish/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        // Try custom-uploads endpoint
        response = await authenticatedFetch(`http://localhost:8000/api/custom-uploads/${websiteId}/unpublish/`, {
          method: 'POST',
        });
      }

      if (response.ok) {
        setWebsite({ ...website, is_published: false });
        navigate('/websites');
      }
    } catch (err) {
      console.error('Unpublish failed:', err);
    }
    setPublishing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!website) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <p>Website not found</p>
        <button onClick={() => navigate('/websites')} className="btn-primary">Back to My Websites</button>
      </div>
    );
  }

  // Check if this is a ZIP-uploaded website with extracted content
  const isZipUpload = website.extracted_path || website.status === 'ready';

  return (
    <div className="preview-container">
      <div className="preview-banner">
        <span className="preview-banner-icon">👁️</span>
        Preview Mode — {website.name} — This is how your site will look when published
      </div>
      <div className="preview-actions">
        <button className="btn-secondary" onClick={() => navigate(`/builder?id=${websiteId}`)}>← Back to Editor</button>
        {website.is_published ? (
          <button className="btn-secondary" onClick={handleUnpublish} disabled={publishing}>
            {publishing ? "Unpublishing..." : "Unpublish Website"}
          </button>
        ) : (
          <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing..." : "Publish Website"}
          </button>
        )}
      </div>
      {isZipUpload ? (
        <iframe 
          src={`/media/${website.extracted_path}/index.html`}
          title={website.name}
          style={{ width: '100%', height: 'calc(100vh - 140px)', border: 'none' }}
        />
      ) : (
        <div className="preview-website">
          <nav style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700 }}>{website.name}</div>
            <div style={{ display: "flex", gap: "24px" }}>
              <span>Home</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          </nav>
          <div className="preview-hero" style={{ borderRadius: 0 }}>
            <h1>Welcome to {website.name}</h1>
            <p>This is a description of my website. Click to edit the text and make it your own.</p>
            <button className="preview-btn">Click Me</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Page
export const Settings = () => {
  const [activeTab, setActiveTab] = React.useState("profile");

  React.useEffect(() => {
    document.title = "Settings";
  }, []);

  return (
    <SidebarLayout>
      <h2 style={{ marginBottom: "24px" }}>Settings</h2>
      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button 
          className={`settings-tab ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button 
          className={`settings-tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
      </div>
      <div className="settings-content">
        {activeTab === "profile" && (
          <div className="settings-section">
            <h3>Profile Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" defaultValue={localStorage.getItem("username") || ""} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows="3" placeholder="Tell us about yourself..."></textarea>
            </div>
            <button className="btn-primary">Save Changes</button>
          </div>
        )}
        {activeTab === "account" && (
          <div className="settings-section">
            <h3>Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <button className="btn-primary">Update Password</button>
          </div>
        )}
        {activeTab === "notifications" && (
          <div className="settings-section">
            <h3>Notification Preferences</h3>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="email-notif" defaultChecked />
              <label htmlFor="email-notif" style={{ margin: 0 }}>Email notifications</label>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" id="marketing" />
              <label htmlFor="marketing" style={{ margin: 0 }}>Marketing emails</label>
            </div>
            <button className="btn-primary">Save Preferences</button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

// Protected Route Component - checks for plan selection
const ProtectedRoute = ({ children, checkPlan = true }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem('access');
      
      if (!token) {
        navigate('/login');
        return;
      }

      if (checkPlan) {
        // Skip backend check - use localStorage flag instead
        const hasSelectedPlan = localStorage.getItem('has_selected_plan');
        if (hasSelectedPlan !== 'true') {
          navigate('/select-plan');
          return;
        }
      }

      setHasAccess(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [navigate, checkPlan]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return hasAccess ? children : null;
};

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ToastWrapper />
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

function ToastWrapper() {
  const { toast, hideToast } = useToast();
  return <Toast message={toast} onClose={hideToast} />;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/select-plan" element={<PlanSelection />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/websites" element={<ProtectedRoute><Websites /></ProtectedRoute>} />
        <Route path="/builder" element={<ProtectedRoute><WebsiteBuilder /></ProtectedRoute>} />
        <Route path="/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><SidebarLayout><CreateWebsitePage /></SidebarLayout></ProtectedRoute>} />
        <Route path="/media" element={<ProtectedRoute><SidebarLayout><Gallery /></SidebarLayout></ProtectedRoute>} />
        <Route path="/order-template" element={<ProtectedRoute><SidebarLayout><OrderTemplate /></SidebarLayout></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/oauth/google/callback" element={<OAuthCallback />} />
        <Route path="/oauth/facebook/callback" element={<OAuthCallback />} />
      </Routes>
    </Router>
  );
}
