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
      <nav className="landing-nav">
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
        <div className="hero-content">
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
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-header">
          <h2>Simple Pricing</h2>
          <p>Choose the plan that's right for you.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0</div>
            <p className="price-period">Forever free</p>
            <ul className="pricing-features">
              <li>Create drafts and preview websites</li>
              <li>Basic templates</li>
              <li>Community support</li>
            </ul>
            <Link to="/signup" className="btn-outline">Get Started</Link>
          </div>
          <div className="pricing-card featured">
            <div className="popular-badge">Most Popular</div>
            <h3>Premium</h3>
            <div className="price">$10<span>/month</span></div>
            <p className="price-period">Publish your site</p>
            <ul className="pricing-features">
              <li>Everything in Free</li>
              <li>Publish unlimited websites</li>
              <li>Premium templates</li>
              <li>Custom domain</li>
              <li>Priority support</li>
            </ul>
            <Link to="/signup" className="btn-primary">Upgrade to Premium</Link>
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
