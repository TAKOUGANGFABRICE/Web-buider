import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  const features = [
    {
      icon: '🎨',
      title: 'Easy Website Builder',
      description: 'Create beautiful websites with our simple editor.'
    },
    {
      icon: '🖼️',
      title: 'Media Gallery',
      description: 'Upload and manage your images with ease.'
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Upgrade to premium with secure payment options.'
    },
    {
      icon: '👁️',
      title: 'Preview & Publish',
      description: 'Test your site before going live with one click.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav animate-fade-in">
        <div className="landing-nav-logo">
          <span className="logo-icon">💎</span>
          <span>WaaS</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-in-up">
          <h1>Build Your Website Easily</h1>
          <p className="hero-subtitle">
            The all-in-one platform to create, preview, and publish professional websites — no coding required.
          </p>
          <Link to="/signup" className="btn-primary btn-large">Get Started</Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card animate-fade-in-up animate-delay-${index + 1}`}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-header animate-fade-in-up">
          <h2>Simple Pricing</h2>
          <p>Choose the plan that's right for you.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card animate-fade-in-up animate-delay-1">
            <h3>Starter</h3>
            <div className="price">$0</div>
            <p className="price-period">Forever free</p>
            <ul className="pricing-features">
              <li>✅ 1 Website</li>
              <li>✅ 3 Free Templates</li>
              <li>✅ Website Builder</li>
              <li>✅ Preview Mode</li>
              <li>❌ Custom Domain</li>
              <li>❌ Team Members</li>
              <li>❌ Priority Support</li>
              <li>❌ Analytics</li>
            </ul>
            <Link to="/signup" className="btn-outline">Get Started</Link>
          </div>
          <div className="pricing-card featured animate-fade-in-up animate-delay-2">
            <div className="popular-badge">Most Popular</div>
            <h3>Basic</h3>
            <div className="price">$10<span>/month</span></div>
            <p className="price-period">Great for personal sites</p>
            <ul className="pricing-features">
              <li>✅ 3 Websites</li>
              <li>✅ All Templates</li>
              <li>✅ Custom Domain</li>
              <li>✅ Basic Analytics</li>
              <li>❌ Team Members</li>
              <li>❌ Remove Branding</li>
            </ul>
            <Link to="/signup" className="btn-primary">Get Started</Link>
          </div>
          <div className="pricing-card animate-fade-in-up animate-delay-3">
            <h3>Pro</h3>
            <div className="price">$30<span>/month</span></div>
            <p className="price-period">For growing businesses</p>
            <ul className="pricing-features">
              <li>✅ 10 Websites</li>
              <li>✅ All Templates</li>
              <li>✅ Custom Domain</li>
              <li>✅ Team Members (5)</li>
              <li>✅ Priority Support</li>
              <li>✅ API Access</li>
              <li>✅ Advanced Analytics</li>
            </ul>
            <Link to="/signup" className="btn-outline">Get Started</Link>
          </div>
          <div className="pricing-card animate-fade-in-up animate-delay-4">
            <h3>Enterprise</h3>
            <div className="price">$100<span>/month</span></div>
            <p className="price-period">For large organizations</p>
            <ul className="pricing-features">
              <li>✅ Unlimited Websites</li>
              <li>✅ Unlimited Team Members</li>
              <li>✅ White Label</li>
              <li>✅ 24/7 Support</li>
              <li>✅ SSO/SAML</li>
              <li>✅ Custom Templates</li>
            </ul>
            <Link to="/signup" className="btn-outline">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2025 WaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
