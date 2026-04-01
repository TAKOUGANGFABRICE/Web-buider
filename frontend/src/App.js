import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import "./styles.css";
import LandingPage from "./LandingPage";
import Billing from "./Billing";
import PlanSelection from "./PlanSelection";
import TemplateGallery from "./TemplateGallery";
import OrderTemplate from "./OrderTemplate";
import { AuthProvider, useAuth } from "./AuthContext";

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
          <Link to="/create" className={`sidebar-nav-item ${isActive("/create") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">➕</span>
            <span>Create Website</span>
          </Link>
          <Link to="/gallery" className={`sidebar-nav-item ${isActive("/gallery") ? "active" : ""}`}>
            <span className="sidebar-nav-icon">🖼️</span>
            <span>Template Gallery</span>
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
    // Skip backend check - just go to select-plan first time, dashboard after
    const hasSelectedPlan = localStorage.getItem('has_selected_plan');
    if (!hasSelectedPlan) {
      navigate('/select-plan');
    } else {
      navigate('/dashboard');
    }
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
        // Store username for fallback display
        localStorage.setItem("username", email.split("@")[0]);
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
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/select-plan');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
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
      // Simulate registration without backend
      // Store user data in localStorage
      const fakeToken = 'fake_token_' + Date.now();
      localStorage.setItem('access', fakeToken);
      localStorage.setItem('refresh', fakeToken);
      localStorage.setItem('username', name);
      localStorage.setItem('user_email', email);
      localStorage.setItem('has_selected_plan', 'false'); // Reset plan selection flag
      
      // Store a simple user object
      localStorage.setItem('user', JSON.stringify({
        username: name,
        email: email,
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || ''
      }));
      
      // Navigate to plan selection
      navigate('/select-plan');
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
  const { user } = useAuth();
  const username = user?.username || user?.first_name || localStorage.getItem("username") || "User";
  const currentPlan = localStorage.getItem('selected_plan_name') || "Free";
  
  React.useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const recentWebsites = [
    { name: "My Portfolio", status: "draft", updated: "2 days ago" },
    { name: "Business Site", status: "published", updated: "1 week ago" },
    { name: "Landing Page", status: "draft", updated: "2 weeks ago" },
  ];

  return (
    <SidebarLayout>
      <div style={{ marginBottom: "8px", color: "var(--text-secondary)" }}>
        Welcome, {username} 👋
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Websites</span>
            <span className="stat-icon">🌐</span>
          </div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Published</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value">1</div>
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
        <div className="website-list">
          {recentWebsites.map((site, index) => (
            <div key={index} className="website-list-item">
              <div className="website-thumbnail">🌐</div>
              <div className="website-info">
                <h4>{site.name}</h4>
                <p>{site.status === "published" ? "🟢 Published" : "⚪ Draft"} • Updated {site.updated}</p>
              </div>
              <div className="website-actions">
                <button className="btn-secondary">Edit</button>
                <button className="btn-secondary">Preview</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
};

// My Websites Page
export const Websites = () => {
  React.useEffect(() => {
    document.title = "My Websites";
  }, []);

  const websites = [
    { name: "My Portfolio", status: "draft", thumbnail: "🎨" },
    { name: "Business Site", status: "published", thumbnail: "💼" },
    { name: "Landing Page", status: "draft", thumbnail: "🚀" },
    { name: "Blog", status: "published", thumbnail: "📝" },
  ];

  return (
    <SidebarLayout>
      <div className="page-header">
        <h2>My Websites</h2>
        <Link to="/create" className="btn-primary btn-icon">➕ Create New Website</Link>
      </div>
      <div className="websites-grid">
        {websites.map((site, index) => (
          <div key={index} className="website-card">
            <div className="website-card-image">{site.thumbnail}</div>
            <div className="website-card-content">
              <h3>{site.name}</h3>
              <p>
                <span className={`website-status ${site.status}`}>
                  {site.status === "published" ? "🟢 Published" : "⚪ Draft"}
                </span>
              </p>
              <div className="website-card-actions">
                <button className="btn-secondary">Edit</button>
                <button className="btn-secondary">Preview</button>
                {site.status === "draft" ? (
                  <button className="btn-primary">Publish</button>
                ) : (
                  <button className="btn-secondary">Unpublish</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
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

// Builder Page
export const Builder = () => {
  React.useEffect(() => {
    document.title = "Website Builder";
  }, []);

  const navigate = useNavigate();

  const elements = [
    { icon: "📝", name: "Text" },
    { icon: "🖼️", name: "Image" },
    { icon: "🔘", name: "Button" },
    { icon: "📦", name: "Container" },
    { icon: "📋", name: "Heading" },
    { icon: "📄", name: "Paragraph" },
  ];

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
          <div className="sidebar-nav-item active">
            <span className="sidebar-nav-icon">📝</span>
            <span>Elements</span>
          </div>
          <div className="sidebar-nav-item">
            <span className="sidebar-nav-icon">🎨</span>
            <span>Styles</span>
          </div>
          <div className="sidebar-nav-item">
            <span className="sidebar-nav-icon">⚙️</span>
            <span>Settings</span>
          </div>
        </nav>
      </aside>
      <main className="main-content" style={{ marginLeft: "var(--sidebar-width)" }}>
        <header className="top-header">
          <div className="builder-toolbar-title">
            <span style={{ marginRight: "8px" }}>📝</span>
            My Portfolio <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>• Draft</span>
          </div>
          <div className="builder-toolbar-actions">
            <button className="btn-secondary" onClick={() => navigate("/dashboard")}>Back</button>
            <button className="btn-secondary">💾 Save</button>
            <button className="btn-secondary" onClick={() => navigate("/preview")}>👁️ Preview</button>
            <button className="btn-primary" onClick={() => navigate("/preview")}>Publish</button>
          </div>
        </header>
        <div className="builder-container">
          <div className="builder-sidebar">
            <div className="builder-sidebar-header">
              <h3>Add Elements</h3>
            </div>
            <div className="builder-elements">
              {elements.map((el, index) => (
                <div key={index} className="builder-element">
                  <span className="builder-element-icon">{el.icon}</span>
                  <span className="builder-element-text">{el.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="builder-canvas">
            <div className="builder-canvas-content">
              <div className="preview-hero">
                <h1>Welcome to My Website</h1>
                <p>This is a demo of your website. Click to edit the text and make it your own.</p>
                <button className="preview-btn">Click Me</button>
              </div>
              <div style={{ padding: "40px" }}>
                <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                  Click on any element to edit it. Drag elements from the sidebar to add new content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Preview Page
export const Preview = () => {
  const navigate = useNavigate();

  return (
    <div className="preview-container">
      <div className="preview-banner">
        <span className="preview-banner-icon">👁️</span>
        Preview Mode — This is how your site will look when published
      </div>
      <div className="preview-actions">
        <button className="btn-secondary" onClick={() => navigate("/builder")}>← Back to Editor</button>
        <button className="btn-primary" onClick={() => alert("Website Published!")}>Publish Website</button>
      </div>
      <div className="preview-website">
        <nav style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700 }}>My Portfolio</div>
          <div style={{ display: "flex", gap: "24px" }}>
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </nav>
        <div className="preview-hero" style={{ borderRadius: 0 }}>
          <h1>Welcome to My Website</h1>
          <p>This is a description of my website. Click to edit the text and make it your own.</p>
          <button className="preview-btn">Click Me</button>
        </div>
      </div>
    </div>
  );
};

// Gallery Page
export const Gallery = () => {
  React.useEffect(() => {
    document.title = "Gallery";
  }, []);

  const images = [
    { id: 1, icon: "🏔️" },
    { id: 2, icon: "🌊" },
    { id: 3, icon: "🌅" },
    { id: 4, icon: "🌲" },
    { id: 5, icon: "🏙️" },
    { id: 6, icon: "🌺" },
  ];

  return (
    <SidebarLayout>
      <div className="gallery-header">
        <div>
          <h2>Gallery</h2>
          <p style={{ color: "var(--text-secondary)" }}>Upload and manage your images</p>
        </div>
        <button className="btn-primary btn-icon">⬆️ Upload Image</button>
      </div>
      <div className="gallery-grid">
        <div className="gallery-upload">
          <span className="gallery-upload-icon">➕</span>
          <span>Upload New</span>
        </div>
        {images.map((img) => (
          <div key={img.id} className="gallery-item">
            <div style={{ 
              width: "100%", 
              height: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "4rem",
              background: "linear-gradient(135deg, var(--background), white)"
            }}>
              {img.icon}
            </div>
            <div className="gallery-item-overlay">
              <button className="btn-secondary" style={{ color: "white", borderColor: "white" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </SidebarLayout>
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
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/select-plan" element={<PlanSelection />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/websites" element={<ProtectedRoute><Websites /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateWebsite /></ProtectedRoute>} />
          <Route path="/builder" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><TemplateGallery /></ProtectedRoute>} />
          <Route path="/order-template" element={<ProtectedRoute><OrderTemplate /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
