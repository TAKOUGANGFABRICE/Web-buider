import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  { title: 'Drag & Drop Builder', description: 'Build pages visually without code using our intuitive builder.', icon: '🧱' },
  { title: 'Ready-Made Templates', description: 'Launch faster with professional templates for every niche.', icon: '📋' },
  { title: 'Built-in E-Commerce', description: 'Sell products with storefronts, carts, and checkout.', icon: '🛍️' },
  { title: 'SEO & Analytics', description: 'Track performance and optimize for search engines.', icon: '📊' },
  { title: 'Team Collaboration', description: 'Work together with role-based access controls.', icon: '👥' },
  { title: 'Custom Domains', description: 'Publish to your own branded domain instantly.', icon: '🌐' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out SiteForge',
    features: ['1 Website', 'Basic Templates', 'Platform Subdomain (mysite.websitebuilder.com)', '5GB Storage', 'Basic Analytics'],
    cta: 'Start Free',
    href: '/register',
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/month',
    description: 'For professionals and growing businesses',
    features: ['Unlimited Websites', 'All Premium Templates', 'Custom Domain', '100GB Storage', 'Advanced Analytics', 'Priority Support', 'SSL Certificate'],
    cta: 'Get Premium',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams with advanced needs',
    features: ['Everything in Premium', 'Team Collaboration', 'API Access', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee'],
    cta: 'Contact Sales',
    href: '/register',
  },
];

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">🚀 SiteForge</div>
        <div className="nav-actions">
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
          <Link className="btn btn-primary" to="/register">Get Started</Link>
        </div>
      </header>

      <section className="hero">
        <h1>Build. Launch. Grow.</h1>
        <p>Create professional websites, stores, and blogs with an all-in-one builder made for modern creators.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-large" to="/register">Start Building Free</Link>
          <Link className="btn btn-secondary btn-large" to="/gallery">Browse Templates</Link>
        </div>
      </section>

      <section className="features">
        <h2>Everything you need to launch online</h2>
        <div className="features-grid">
          {FEATURES.map(item => (
            <div key={item.title} className="feature-card">
              <span className="feature-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-section">
        <h2>Simple, Transparent Pricing</h2>
        <p className="pricing-subtitle">Choose the plan that fits your needs</p>
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
              {plan.highlighted && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map(feature => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <Link to={plan.href} className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-large`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to build your website?</h2>
        <p>Join creators and businesses already building with SiteForge.</p>
        <Link className="btn btn-primary btn-large" to="/register">Create your account</Link>
      </section>

      <footer className="landing-footer">
        <div className="brand">🚀 SiteForge</div>
        <p>© {new Date().getFullYear()} SiteForge. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
