import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './WebsiteBuilder.css';

const VIEWPORTS = {
  desktop: { name: 'Desktop', width: '100%', icon: '💻' },
  tablet: { name: 'Tablet', width: '768px', icon: '📱' },
  mobile: { name: 'Mobile', width: '375px', icon: '📱' },
};

const ELEMENTS = {
  basic: [
    { type: 'heading', icon: 'H', name: 'Heading' },
    { type: 'text', icon: 'T', name: 'Text' },
    { type: 'button', icon: 'B', name: 'Button' },
    { type: 'image', icon: '🖼', name: 'Image' },
    { type: 'video', icon: '🎬', name: 'Video' },
  ],
  layout: [
    { type: 'container', icon: '□', name: 'Container' },
    { type: 'columns', icon: '|||', name: 'Columns' },
    { type: 'spacer', icon: '⏹', name: 'Spacer' },
    { type: 'divider', icon: '—', name: 'Divider' },
  ],
  sections: [
    { type: 'navbar', icon: '☰', name: 'Navbar' },
    { type: 'footer', icon: '©', name: 'Footer' },
    { type: 'hero', icon: '★', name: 'Hero' },
    { type: 'card', icon: '▭', name: 'Card' },
    { type: 'gallery', icon: '🌆', name: 'Gallery' },
    { type: 'form', icon: '📝', name: 'Form' },
    { type: 'map', icon: '🗺', name: 'Map' },
  ],
};

function WebsiteBuilder() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activePanel, setActivePanel] = useState('elements');
  const [showPreview, setShowPreview] = useState(false);
  const [viewport, setViewport] = useState('desktop');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loadedTemplate, setLoadedTemplate] = useState(null);

  // layout mode for container/columns
  const [layoutMode, setLayoutMode] = useState('block'); // block | flex | grid

  const TEMPLATE_ELEMENTS = {
    'biz-1': [
      { type: 'navbar', data: { logo: 'CorporatePro', links: ['Home', 'About', 'Services', 'Work', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Enterprise Solutions for Modern Business', subtitle: 'We deliver scalable platforms, secure infrastructure, and measurable growth for ambitious companies.', bg: '#0f172a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Start Project', url: '#', align: 'center' } },
      { type: 'button', data: { text: 'View Case Studies', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'What we do', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Data-driven roadmaps with clear KPIs and reporting.', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Strategy & Analytics', content: 'Data-driven roadmaps with clear KPIs and reporting.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Security & Compliance', content: 'Enterprise-grade controls and audit-ready documentation.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Performance', content: 'Fast deployments, resilient systems, and low latency.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Trusted by industry leaders', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Join thousands of companies that trust our platform.', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Ready to transform your business?', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Get Started', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 CorporatePro Inc.', columns: 3 } },
    ],
    'biz-2': [
      { type: 'navbar', data: { logo: 'NorthBridge', links: ['Home', 'About', 'Services', 'Work', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Strategic Consulting for Complex Markets', subtitle: 'We partner with leaders to navigate uncertainty, prioritize initiatives, and accelerate outcomes.', bg: '#0f172a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Book Consultation', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Our Expertise', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Operating Model', content: 'Organization design, governance, and workflow optimization.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Growth Strategy', content: 'Market entry, pricing, and commercial strategy.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Transformation', content: 'Change programs and modern operating targets.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Client Success Stories', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: '"NorthBridge helped us increase revenue by 40% in 18 months." — CEO, Fortune 500', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Let\'s work together', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Schedule a Call', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 NorthBridge Advisory', columns: 3 } },
    ],
    'biz-3': [
      { type: 'navbar', data: { logo: 'StudioNine', links: ['Home', 'Work', 'Services', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'We craft digital experiences', subtitle: 'Brand, design, and engineering for growth-minded teams.', bg: '#667eea', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'View Our Work', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Selected Work', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 2, gap: 20 } },
      { type: 'card', data: { title: 'Brand Identity', content: 'Fintech startup — Complete rebrand and digital presence.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Commerce Platform', content: 'DTC brand — Full-stack e-commerce experience.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Our Process', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Discovery → Strategy → Design → Build → Launch → Scale', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Start a project', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Get in Touch', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 StudioNine', columns: 3 } },
    ],
    'biz-4': [
      { type: 'navbar', data: { logo: 'LaunchPad', links: ['Home', 'Features', 'Pricing', 'Docs', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Ship faster with less overhead', subtitle: 'LaunchPad gives founders deployment pipelines, usage analytics, and billing in one place.', bg: '#0f172a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Start Free Trial', url: '#', align: 'center' } },
      { type: 'button', data: { text: 'See How It Works', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Why teams choose LaunchPad', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Fast Launch', content: 'Go live in minutes with built-in CI and preview URLs.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Usage Insights', content: 'Understand visitors, conversions, and retention.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Billing Built In', content: 'Subscriptions, invoicing, and tax handling handled.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Trusted by operators', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Vercel · Linear · Resend · Clerk', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Ready to launch?', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Get Started', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 LaunchPad', columns: 3 } },
    ],
    'biz-5': [
      { type: 'navbar', data: { logo: 'FinanceHub', links: ['Home', 'Services', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Trustworthy Financial Services', subtitle: 'Expert advice for banks, advisors, and fintech companies.', bg: '#0f172a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Schedule Consultation', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Comprehensive Solutions', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Wealth Management', content: 'Personalized investment strategies for long-term growth.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Risk Assessment', content: 'Identify and mitigate financial risks proactively.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Fintech Advisory', content: 'Modern solutions for digital finance transformation.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Awards & Recognition', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Top 10 Financial Advisors 2025 — Global Finance Magazine', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Start your journey', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Contact Us', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 FinanceHub', columns: 3 } },
    ],
    'biz-6': [
      { type: 'navbar', data: { logo: 'Enterprise', links: ['Home', 'Solutions', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Enterprise Solutions', subtitle: 'Professional blue-themed design for large corporations.', bg: '#1e3a8a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Request Demo', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Enterprise-Grade Features', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Scalable Infrastructure', content: 'Cloud-native architecture built for global scale.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Dedicated Support', content: '24/7 support with dedicated account managers.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Security First', content: 'SOC 2 compliant with end-to-end encryption.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Trusted by 500+ enterprises', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Fortune 500 companies rely on our solutions daily.', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Get in touch', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Contact Sales', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Enterprise Corp', columns: 3 } },
    ],
    'port-1': [
      { type: 'navbar', data: { logo: 'SofiaLee', links: ['Home', 'Work', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Sofia Lee', subtitle: 'Designer & Developer — Minimal interfaces, clear typography, and thoughtful interactions.', bg: '#f5f5f4', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'View Projects', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Selected Works', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 2, gap: 20 } },
      { type: 'card', data: { title: 'Project A', content: 'Brand & web design for a tech startup.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Project B', content: 'Editorial design for a magazine.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Skills & Expertise', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'UI/UX Design · Brand Identity · Web Development · Motion Design', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Let\'s collaborate', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Get in Touch', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Sofia Lee', columns: 2 } },
    ],
    'port-2': [
      { type: 'navbar', data: { logo: 'Frames', links: ['Home', 'Gallery', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Frames Studio', subtitle: 'Photography — Visual stories in curated frames.', bg: '#0a0a0a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'View Gallery', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Featured Collections', level: 'h2', align: 'center' } },
      { type: 'gallery', data: { images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'], columns: 3, gap: 12 } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'About the Artist', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Professional photographer with 10+ years of experience capturing moments that matter.', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Book a session', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Contact', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Frames Studio', columns: 2 } },
    ],
    'port-3': [
      { type: 'navbar', data: { logo: 'StudioNoir', links: ['Home', 'Work', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Where art meets technology', subtitle: 'Experimental typography, immersive interactions, and visual storytelling.', bg: '#1a1a2e', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Explore Projects', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Featured Projects', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 2, gap: 20 } },
      { type: 'card', data: { title: 'Installation', content: 'Museum exhibit — Interactive digital art experience.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Publication', content: 'Limited edition art book with augmented reality.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Services', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Brand Identity · Web Design · Motion Graphics · Art Direction', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Start a collaboration', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Get in Touch', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Studio Noir', columns: 2 } },
    ],
    'port-4': [
      { type: 'navbar', data: { logo: 'DarkFolio', links: ['Home', 'Work', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Dark Mode Portfolio', subtitle: 'Sleek dark design for designers and developers.', bg: '#0a0a0a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'View Projects', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Featured Work', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 2, gap: 20 } },
      { type: 'card', data: { title: 'E-commerce Redesign', content: 'Complete UX overhaul for a fashion brand.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Dashboard UI', content: 'Analytics platform for SaaS companies.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Tech Stack', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'React · TypeScript · Tailwind CSS · Figma · Framer', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Available for freelance', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Hire Me', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 DarkFolio', columns: 2 } },
    ],
    'port-5': [
      { type: 'navbar', data: { logo: 'Masonry', links: ['Home', 'Gallery', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Visual Arts Gallery', subtitle: 'Dynamic masonry layout for visual artists and photographers.', bg: '#0a0a0a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Explore Gallery', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Latest Collections', level: 'h2', align: 'center' } },
      { type: 'gallery', data: { images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'], columns: 4, gap: 10 } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Exhibitions', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Upcoming: Modern Perspectives — June 2025, New York Gallery', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Commission a piece', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Inquire', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Masonry Gallery', columns: 2 } },
    ],
    'port-6': [
      { type: 'navbar', data: { logo: 'OnePage', links: ['Home', 'About', 'Services', 'Portfolio', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Alex Morgan', subtitle: 'Full-Stack Developer & Designer — Building digital products with purpose.', bg: '#0f172a', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Download Resume', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'About Me', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'I create accessible, pixel-perfect, and performant web experiences. With 8+ years of experience, I\'ve helped startups and enterprises bring their ideas to life.', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Skills', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'JavaScript · React · Node.js · Python · UI/UX Design', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Let\'s work together', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Say Hello', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Alex Morgan', columns: 2 } },
    ],
    'ecom-1': [
      { type: 'navbar', data: { logo: 'Maison', links: ['Home', 'Shop', 'New Arrivals', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Summer Essentials 2025', subtitle: 'Breathable fabrics, neutral palettes, and everyday versatility.', bg: '#f8fafc', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Shop New Arrivals', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Trending Now', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 4, gap: 16 } },
      { type: 'card', data: { title: 'Linen Shirt', content: '$89 — Premium cotton blend', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Relaxed Trousers', content: '$120 — Comfort fit', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Weekend Bag', content: '$145 — Leather accents', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Leather Sneakers', content: '$160 — Handcrafted', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Why Shop With Us', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Free Shipping', content: 'On all orders over $100', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Easy Returns', content: '30-day return policy', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Secure Checkout', content: 'SSL encrypted payment', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Join 50,000+ happy customers', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Start Shopping', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Maison', columns: 3 } },
    ],
    'ecom-2': [
      { type: 'navbar', data: { logo: 'Marketplace', links: ['Home', 'Browse', 'Sell', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Discover Unique Products', subtitle: 'Multi-vendor marketplace with seller profiles and product filters.', bg: '#f093fb', align: 'center', height: 520, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'button', data: { text: 'Start Shopping', url: '#', align: 'center' } },
      { type: 'button', data: { text: 'Become a Seller', url: '#', align: 'center' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Featured Products', level: 'h2', align: 'center' } },
      { type: 'columns', data: { count: 3, gap: 20 } },
      { type: 'card', data: { title: 'Handmade Ceramics', content: '$45 — Artisan crafted', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Vintage Watch', content: '$120 — Rare find', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'card', data: { title: 'Custom Jewelry', content: '$80 — Made to order', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' } },
      { type: 'spacer', data: { height: 40 } },
      { type: 'heading', data: { text: 'Why Choose Us', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Verified sellers · Buyer protection · Global shipping · 24/7 support', align: 'center' } },
      { type: 'spacer', data: { height: 20 } },
      { type: 'heading', data: { text: 'Join 10,000+ sellers', level: 'h2', align: 'center' } },
      { type: 'button', data: { text: 'Start Selling', url: '#', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Marketplace', columns: 3 } },
    ],
    'ecom-3': [
      { type: 'navbar', data: { logo: 'Aurélie', links: ['Home', 'Shop', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'The Aurélie Edit', subtitle: 'Curated luxury essentials crafted with intention.', bg: '#1a1510', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Collections', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Leather Goods — Hand finished.', align: 'center' } },
      { type: 'text', data: { text: 'Silk Scarves — Limited run.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Aurélie', columns: 2 } },
    ],
    'ecom-4': [
      { type: 'navbar', data: { logo: 'FashionStore', links: ['Home', 'Shop', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Fashion Store', subtitle: 'Trendy design for clothing and accessory stores.', bg: '#f5f5f4', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'New Arrivals', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Latest trends in fashion.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 FashionStore', columns: 3 } },
    ],
    'ecom-5': [
      { type: 'navbar', data: { logo: 'TechStore', links: ['Home', 'Products', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Tech Products', subtitle: 'Modern layout for electronics and gadgets.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Featured', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Latest gadgets and electronics.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 TechStore', columns: 3 } },
    ],
    'ecom-6': [
      { type: 'navbar', data: { logo: 'FoodDelivery', links: ['Home', 'Menu', 'About', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Food Delivery', subtitle: 'Menu-focused design with online ordering.', bg: '#1c1917', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Our Menu', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Fresh meals delivered to your door.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 FoodDelivery', columns: 3 } },
    ],
    'blog-1': [
      { type: 'navbar', data: { logo: 'TheColumn', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Simple thoughts, clearly expressed', subtitle: 'A publication about design, systems, and slow creativity.', bg: '#ffffff', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Latest Posts', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'On quiet design systems — Why rest, whitespace, and restraint still matter.', align: 'center' } },
      { type: 'text', data: { text: 'A writing workflow for makers — Capture, revise, and ship long-form work faster.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 The Column', columns: 2 } },
    ],
    'blog-2': [
      { type: 'navbar', data: { logo: 'POINT', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'The unseen cost of rapid scaling', subtitle: 'An investigation into infrastructure debt and how teams can recover without slowing down.', bg: '#1f2937', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Latest', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Urban mobility — Transportation', align: 'center' } },
      { type: 'text', data: { text: 'AI in newsrooms — Technology', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Point Magazine', columns: 3 } },
    ],
    'blog-3': [
      { type: 'navbar', data: { logo: 'CITYWIRE', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Breaking News', subtitle: 'Stay informed with real-time updates and in-depth reporting.', bg: '#c0392b', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Top Stories', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Markets open higher — Finance', align: 'center' } },
      { type: 'text', data: { text: 'Heatwave forecast — Weather', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 CityWire News', columns: 3 } },
    ],
    'blog-4': [
      { type: 'navbar', data: { logo: 'PersonalBlog', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Personal Blog', subtitle: 'Simple, clean design for personal bloggers.', bg: '#f8fafc', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Recent Posts', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Thoughts and stories from daily life.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Personal Blog', columns: 2 } },
    ],
    'blog-5': [
      { type: 'navbar', data: { logo: 'TechBlog', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Technology Blog', subtitle: 'Code-friendly design for tech tutorials and reviews.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Latest Articles', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Tutorials, reviews, and tech insights.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 TechBlog', columns: 2 } },
    ],
    'blog-6': [
      { type: 'navbar', data: { logo: 'Lifestyle', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Lifestyle Blog', subtitle: 'Warm, inviting design for lifestyle content.', bg: '#fef3c7', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Lifestyle', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Travel, food, and everyday inspiration.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Lifestyle', columns: 2 } },
    ],
    'land-1': [
      { type: 'navbar', data: { logo: 'LaunchPad', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Product Launch', subtitle: 'High-converting hero with social proof and pricing blocks.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Trusted by operators', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Vercel, Linear, Resend, Clerk', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 LaunchPad', columns: 3 } },
    ],
    'land-2': [
      { type: 'navbar', data: { logo: 'SaaS', links: ['Home', 'Features', 'Pricing', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'SaaS Dashboard', subtitle: 'Feature comparison, integrations, and trial CTA sections.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Features', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'All-in-one platform for modern teams.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 SaaS', columns: 3 } },
    ],
    'land-3': [
      { type: 'navbar', data: { logo: 'Event', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Event Promotion', subtitle: 'Countdown timer, speaker cards, and RSVP forms.', bg: '#f093fb', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Speakers', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Industry leaders and innovators.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Event', columns: 2 } },
    ],
    'land-4': [
      { type: 'navbar', data: { logo: 'AppDownload', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Mobile App Landing', subtitle: 'App store download focus with feature highlights.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Download Now', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Available on iOS and Android.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 AppDownload', columns: 2 } },
    ],
    'land-5': [
      { type: 'navbar', data: { logo: 'ProductHunt', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Product Launch', subtitle: 'Clean launch page with social proof and CTAs.', bg: '#0f172a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Join the waitlist', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Be the first to know when we launch.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 ProductHunt', columns: 2 } },
    ],
    'land-6': [
      { type: 'navbar', data: { logo: 'Conference', links: ['Home', 'About', 'Services', 'Contact'], sticky: true } },
      { type: 'hero', data: { title: 'Conference Event Page', subtitle: 'Agenda, speakers, and registration-focused design.', bg: '#1e3a8a', align: 'center', height: 420, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', objectFit: 'cover' } },
      { type: 'heading', data: { text: 'Register Now', level: 'h2', align: 'center' } },
      { type: 'text', data: { text: 'Join us for three days of learning.', align: 'center' } },
      { type: 'footer', data: { text: '© 2025 Conference', columns: 2 } },
    ],
  };

  const pushHistory = useCallback((next) => {
    const slice = history.slice(0, historyIndex + 1);
    slice.push(next);
    setHistory(slice);
    setHistoryIndex(slice.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    if (templateId && TEMPLATE_ELEMENTS[templateId] && !loadedTemplate) {
      const templateElements = TEMPLATE_ELEMENTS[templateId].map((el, idx) => ({
        ...el,
        id: `el-template-${templateId}-${idx}-${Date.now()}`,
      }));
      setElements(templateElements);
      setHistory([templateElements]);
      setHistoryIndex(0);
      setLoadedTemplate(templateId);
    }
  }, [templateId, loadedTemplate]);

  useEffect(() => {
    if (elements.length === 0 && history.length === 0) {
      pushHistory([]);
    }
  }, [elements.length, history.length, pushHistory]);

  const setAndRecord = (next) => {
    setElements(next);
    pushHistory(next);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const addElement = (type, index) => {
    const el = {
      id: `el-${Date.now()}`,
      type,
      data: getDefaults(type),
    };
    const next = [...elements];
    if (typeof index === 'number') {
      next.splice(index, 0, el);
    } else {
      next.push(el);
    }
    setAndRecord(next);
    setSelectedId(el.id);
  };

  const getDefaults = (type) => {
    const map = {
      heading: { text: 'Heading Text', level: 'h1', align: 'left' },
      text: { text: 'Enter your text here...', align: 'left' },
      button: { text: 'Click Me', url: '#', align: 'left' },
      image: { src: '', alt: 'Image', align: 'center', width: 100 },
      video: { url: '', align: 'center', width: 100 },
      container: { layout: 'block', padding: 20, gap: 12, align: 'stretch', columns: 2 },
      columns: { count: 2, gap: 12 },
      spacer: { height: 40 },
      divider: { color: '#e2e8f0', thickness: 1 },
      navbar: { logo: 'Logo', links: ['Home', 'About', 'Contact'], sticky: true },
      footer: { text: '© 2025 Your Company', columns: 3 },
      hero: { title: 'Welcome', subtitle: 'Your subtitle', bg: '#667eea', align: 'center', height: 320, image: '', objectFit: 'cover' },
      card: { title: 'Card Title', content: 'Card content', image: '' },
      gallery: { images: [], columns: 3, gap: 10 },
      form: { fields: [{ name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com' }], submit: 'Submit' },
      map: { address: 'New York, NY', height: 220 },
    };
    return map[type] || {};
  };

  const updateSelected = (patch) => {
    const next = elements.map((el) => (el.id === selectedId ? { ...el, data: { ...el.data, ...patch } } : el));
    setAndRecord(next);
  };

  const move = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= elements.length) return;
    const next = [...elements];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setAndRecord(next);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setAndRecord(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const idx = elements.findIndex((el) => el.id === selectedId);
    if (idx < 0) return;
    const source = elements[idx];
    const clone = { ...source, id: `el-${Date.now()}`, data: { ...source.data } };
    const next = [...elements];
    next.splice(idx + 1, 0, clone);
    setAndRecord(next);
    setSelectedId(clone.id);
  };

  const selected = elements.find((el) => el.id === selectedId) || null;

  return (
    <div className="builder-layout">
      <header className="builder-header">
        <div className="builder-title">
          <h2>Website Builder</h2>
          <p>Drag, design, preview, and publish responsive pages.</p>
        </div>
        <div className="builder-actions">
          <div className="viewport-selector">
            {Object.entries(VIEWPORTS).map(([key, vp]) => (
              <button key={key} className={viewport === key ? 'active' : ''} onClick={() => setViewport(key)} title={vp.name}>
                {vp.icon}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={undo} disabled={historyIndex <= 0}>Undo</button>
          <button className="btn-secondary" onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</button>
          <button className="btn-secondary" onClick={() => setShowPreview(true)}>Preview</button>
          <button className="btn-primary" onClick={() => alert('Saved')}>Save</button>
        </div>
      </header>

      <div className="builder-body">
        <aside className="builder-sidebar">
          <nav className="panel-tabs">
            <button className={activePanel === 'elements' ? 'active' : ''} onClick={() => setActivePanel('elements')}>Elements</button>
            <button className={activePanel === 'layout' ? 'active' : ''} onClick={() => setActivePanel('layout')}>Layout</button>
            <button className={activePanel === 'properties' ? 'active' : ''} onClick={() => setActivePanel('properties')}>Properties</button>
          </nav>
          <div className="panel-content">
            {activePanel === 'elements' && (
              <div className="elements-panel">
                {Object.entries(ELEMENTS).map(([category, items]) => (
                  <div key={category} className="element-category">
                    <h4>{category[0].toUpperCase() + category.slice(1)}</h4>
                    <div className="elements-grid">
                      {items.map((item) => (
                        <div
                          key={item.type}
                          className="element-item"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', item.type)}
                        >
                          <span className="element-icon">{item.icon}</span>
                          <span className="element-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activePanel === 'layout' && (
              <div className="layout-panel">
                <h4>Layout Mode</h4>
                <div className="layout-options">
                  {['block', 'flex', 'grid'].map((mode) => (
                    <button key={mode} className={layoutMode === mode ? 'active' : ''} onClick={() => setLayoutMode(mode)}>
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="panel-hint">Applied to new containers and columns.</p>
              </div>
            )}
            {activePanel === 'properties' && (
              <PropertiesPanel selected={selected} onUpdate={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected} onMove={move} elements={elements} selectedId={selectedId} />
            )}
          </div>
        </aside>

        <main className="builder-canvas" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); if (type) addElement(type); }}>
          <div className={`canvas-wrapper ${viewport} layout-${layoutMode}`}>
            {elements.length === 0 ? (
              <div className="canvas-empty">
                <p>Drag elements from the sidebar to start building</p>
              </div>
            ) : (
              <div className="canvas-elements">
                {elements.map((el, idx) => (
                  <CanvasElement
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onClick={() => setSelectedId(el.id)}
                    onUpdate={(patch) => updateSelected(patch)}
                    layoutMode={layoutMode}
                    onMoveUp={() => move(idx, idx - 1)}
                    onMoveDown={() => move(idx, idx + 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="builder-inspector">
          <div className="inspector-heading">
            <span>Style</span>
            <strong>{selected ? selected.type : 'No element'}</strong>
          </div>
          <PropertiesPanel selected={selected} onUpdate={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected} onMove={move} elements={elements} selectedId={selectedId} />
        </aside>
      </div>

      {showPreview && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={() => setShowPreview(false)}>✕</button>
            <div className={`canvas-preview ${viewport}`}>
              {elements.map((el) => (
                <PreviewElement key={el.id} element={el} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesPanel({ selected, onUpdate, onDelete, onDuplicate, onMove, elements, selectedId }) {
  if (!selected) {
    return (
      <div className="properties-empty">
        <p>Select an element to edit its properties</p>
      </div>
    );
  }

  const idx = elements.findIndex((el) => el.id === selectedId);
  return (
    <div className="properties-form">
      <h3>Properties: {selected.type}</h3>
      <PropertyFields element={selected} onChange={(patch) => onUpdate(patch)} />
      <div className="property-actions">
        <button className="btn-secondary" onClick={() => onMove(idx, idx - 1)} disabled={idx <= 0}>Move Up</button>
        <button className="btn-secondary" onClick={() => onMove(idx, idx + 1)} disabled={idx >= elements.length - 1}>Move Down</button>
        <button className="btn-secondary" onClick={onDuplicate}>Duplicate</button>
        <button className="btn-delete" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function PropertyFields({ element, onChange }) {
  const { data } = element;
  const set = (patch) => onChange(patch);

  if (element.type === 'heading' || element.type === 'text' || element.type === 'button') {
    return (
      <>
        <Field label="Text" value={data.text} onChange={(text) => set({ text })} />
        <Field label="Align" value={data.align} onChange={(align) => set({ align })} as="select" options={['left', 'center', 'right']} />
      </>
    );
  }
  if (element.type === 'image') {
    return (
      <>
        <Field label="Image URL" value={data.src} onChange={(src) => set({ src })} />
        <Field label="Alt" value={data.alt} onChange={(alt) => set({ alt })} />
        <Field label="Width %" value={data.width} onChange={(width) => set({ width })} type="number" min={10} max={100} />
      </>
    );
  }
  if (element.type === 'video') {
    return (
      <>
        <Field label="Video URL" value={data.url} onChange={(url) => set({ url })} />
        <Field label="Width %" value={data.width} onChange={(width) => set({ width })} type="number" min={10} max={100} />
      </>
    );
  }
  if (element.type === 'container') {
    return (
      <>
        <Field label="Layout" value={data.layout} onChange={(layout) => set({ layout })} as="select" options={['block', 'flex', 'grid']} />
        <Field label="Padding" value={data.padding} onChange={(padding) => set({ padding })} type="number" min={0} max={200} />
        <Field label="Gap" value={data.gap} onChange={(gap) => set({ gap })} type="number" min={0} max={200} />
        <Field label="Columns" value={data.columns} onChange={(columns) => set({ columns })} type="number" min={1} max={6} />
      </>
    );
  }
  if (element.type === 'columns') {
    return <Field label="Columns count" value={data.count} onChange={(count) => set({ count })} type="number" min={1} max={6} />;
  }
  if (element.type === 'spacer') {
    return <Field label="Height" value={data.height} onChange={(height) => set({ height })} type="number" min={4} max={600} />;
  }
  if (element.type === 'divider') {
    return (
      <>
        <Field label="Color" value={data.color} onChange={(color) => set({ color })} type="color" />
        <Field label="Thickness" value={data.thickness} onChange={(thickness) => set({ thickness })} type="number" min={1} max={20} />
      </>
    );
  }
  if (element.type === 'navbar') {
    return (
      <>
        <Field label="Logo" value={data.logo} onChange={(logo) => set({ logo })} />
        <JsonListField label="Links" value={data.links} onChange={(links) => set({ links })} />
      </>
    );
  }
  if (element.type === 'hero') {
    return (
      <>
        <Field label="Title" value={data.title} onChange={(title) => set({ title })} />
        <Field label="Subtitle" value={data.subtitle} onChange={(subtitle) => set({ subtitle })} />
        <Field label="Background color" value={data.bg} onChange={(bg) => set({ bg })} type="color" />
        <Field label="Image URL" value={data.image} onChange={(image) => set({ image })} />
        <Field label="Height" value={data.height} onChange={(height) => set({ height })} type="number" min={120} max={900} />
        <Field label="Object fit" value={data.objectFit} onChange={(objectFit) => set({ objectFit })} as="select" options={['cover', 'contain', 'fill']} />
      </>
    );
  }
  if (element.type === 'card') {
    return (
      <>
        <Field label="Title" value={data.title} onChange={(title) => set({ title })} />
        <Field label="Content" value={data.content} onChange={(content) => set({ content })} />
        <Field label="Image URL" value={data.image} onChange={(image) => set({ image })} />
      </>
    );
  }
  if (element.type === 'gallery') {
    return <JsonListField label="Images" value={data.images} onChange={(images) => set({ images })} />;
  }
  if (element.type === 'form') {
    return (
      <>
        <JsonListField label="Fields" value={data.fields} onChange={(fields) => set({ fields })} />
        <Field label="Submit text" value={data.submit} onChange={(submit) => set({ submit })} />
      </>
    );
  }
  if (element.type === 'map') {
    return <Field label="Address" value={data.address} onChange={(address) => set({ address })} />;
  }
  return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>;
}

function Field({ label, value, onChange, type = 'text', min, max, as = 'input', options = [] }) {
  if (as === 'select') {
    return (
      <label className="field-label">
        <span>{label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="field-label">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} min={min} max={max} />
    </label>
  );
}

function JsonListField({ label, value, onChange }) {
  return (
    <label className="field-label">
      <span>{label} (JSON)</span>
      <textarea
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {}
        }}
      />
    </label>
  );
}

function CanvasElement({ element, isSelected, onClick, onUpdate, layoutMode, onMoveUp, onMoveDown }) {
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const start = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const beginResize = (dir, e) => {
    e.stopPropagation();
    setResizing(true);
    setResizeDir(dir);
    start.current = { x: e.clientX, y: e.clientY, w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight };
  };

  useEffect(() => {
    if (!resizing) return;
    const move = (e) => {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (resizeDir.includes('e')) onUpdate({ width: Math.max(120, start.current.w + dx) });
      if (resizeDir.includes('s')) {
        if (element.type === 'spacer') onUpdate({ height: Math.max(4, start.current.h + dy) });
        if (element.type === 'map') onUpdate({ height: Math.max(120, start.current.h + dy) });
        if (element.type === 'image') onUpdate({ height: Math.max(60, start.current.h + dy) });
      }
    };
    const up = () => setResizing(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [resizing, resizeDir, element.type, onUpdate]);

  return (
    <div
      className={`canvas-element ${isSelected ? 'selected' : ''} ${layoutMode !== 'block' ? `layout-${layoutMode}` : ''}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      {isSelected && (
        <div className="element-toolbar">
          <button onClick={onMoveUp} disabled={false}>↑</button>
          <button onClick={onMoveDown}>↓</button>
          <button onClick={() => alert('Delete?')}>🗑</button>
        </div>
      )}
      <RenderElementContent element={element} />
      {isSelected && (
        <>
          <div className="resize-handle r-east" onMouseDown={(e) => beginResize('e', e)} />
          <div className="resize-handle r-south" onMouseDown={(e) => beginResize('s', e)} />
          <div className="resize-handle r-southeast" onMouseDown={(e) => beginResize('se', e)} />
        </>
      )}
    </div>
  );
}

function RenderElementContent({ element }) {
  const { type, data } = element;
  const base = {
    textAlign: data.align || 'left',
    width: data.width != null ? `${data.width}%` : undefined,
    boxSizing: 'border-box',
  };

  switch (type) {
    case 'heading': {
      const Tag = data.level || 'h1';
      return <Tag style={{ ...base, margin: 0 }}>{data.text}</Tag>;
    }
    case 'text':
      return <p style={{ ...base, margin: 0 }}>{data.text}</p>;
    case 'button':
      return (
        <div style={{ ...base }}>
          <button style={{ background: '#667eea', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px' }}>{data.text}</button>
        </div>
      );
    case 'image':
      return (
        <div style={{ ...base }}>
          {data.src ? (
            <img src={data.src} alt={data.alt} style={{ width: '100%', height: data.height ? `${data.height}px` : 'auto', objectFit: data.objectFit || 'cover', borderRadius: 8 }} />
          ) : (
            <div style={{ border: '1px dashed #cbd5e1', padding: 24, borderRadius: 8, color: '#64748b' }}>Image placeholder</div>
          )}
        </div>
      );
    case 'video':
      return (
        <div style={{ ...base }}>
          {data.url ? (
            <video src={data.url} controls style={{ width: '100%', borderRadius: 8 }} />
          ) : (
            <div style={{ border: '1px dashed #cbd5e1', padding: 24, borderRadius: 8, color: '#64748b' }}>Video placeholder</div>
          )}
        </div>
      );
    case 'container':
      const containerStyle = {
        ...base,
        display: data.layout === 'flex' ? 'flex' : data.layout === 'grid' ? 'grid' : 'block',
        flexDirection: data.layout === 'flex' ? 'row' : undefined,
        gridTemplateColumns: data.layout === 'grid' ? `repeat(${data.columns || 2}, 1fr)` : undefined,
        gap: data.gap,
        padding: data.padding,
        background: '#f8fafc',
        border: '1px dashed #cbd5e1',
        borderRadius: 10,
        alignItems: 'stretch',
        minHeight: 120,
      };
      return (
        <div style={containerStyle}>
          <div style={{ color: '#94a3b8', padding: 16 }}>Container: {data.layout}</div>
        </div>
      );
    case 'columns': {
      const colStyle = {
        display: 'flex',
        gap: data.gap,
        ...base,
      };
      return (
        <div style={colStyle}>
          {Array.from({ length: data.count }).map((_, i) => (
            <div key={i} style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16, color: '#64748b' }}>
              Column {i + 1}
            </div>
          ))}
        </div>
      );
    }
    case 'spacer':
      return <div style={{ ...base, height: data.height }} />;
    case 'divider':
      return <hr style={{ border: 'none', borderTop: `${data.thickness}px solid ${data.color}`, margin: 0 }} />;
    case 'navbar':
      return (
        <nav style={{ ...base, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: 'white', padding: '18px 24px', borderRadius: 8 }}>
          <span style={{ fontWeight: 700 }}>{data.logo}</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {data.links.map((l, i) => (
              <span key={i} style={{ opacity: 0.9 }}>{l}</span>
            ))}
          </div>
        </nav>
      );
    case 'footer':
      return (
        <footer style={{ ...base, background: '#0f172a', color: '#e2e8f0', padding: '24px', borderRadius: 8 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: 20 }}>
            <div>{data.text}</div>
            <div style={{ color: '#94a3b8' }}>Company</div>
            <div style={{ color: '#94a3b8' }}>Legal</div>
          </div>
        </footer>
      );
    case 'hero':
      return (
        <section style={{ ...base, position: 'relative', minHeight: data.height, background: data.bg, color: 'white', borderRadius: 8, overflow: 'hidden' }}>
          {data.image && <img src={data.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: data.objectFit || 'cover', opacity: 0.25 }} />}
          <div style={{ position: 'relative', padding: '40px 24px', textAlign: data.align || 'center' }}>
            <h1 style={{ margin: 0, fontSize: 36 }}>{data.title}</h1>
            <p style={{ margin: '10px 0 0', opacity: 0.9 }}>{data.subtitle}</p>
          </div>
        </section>
      );
    case 'card':
      return (
        <div style={{ ...base, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {data.image && <img src={data.image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
          <div style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>{data.title}</h3>
            <p style={{ margin: 0, color: '#475569' }}>{data.content}</p>
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div style={{ ...base }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: data.gap }}>
            {(data.images || []).length ? data.images.map((img, i) => <img key={i} src={img} alt="" style={{ width: '100%', borderRadius: 6 }} />) : <div style={{ color: '#64748b' }}>Add image URLs</div>}
          </div>
        </div>
      );
    case 'form':
      return (
        <form style={{ ...base, background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 10 }} onSubmit={(e) => e.preventDefault()}>
          {(data.fields || []).map((f, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#475569' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
            </div>
          ))}
          <button type="submit" style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8 }}>{data.submit || 'Submit'}</button>
        </form>
      );
    case 'map':
      return (
        <iframe
          title="Map"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&output=embed`}
          style={{ width: '100%', height: data.height, border: 'none', borderRadius: 8 }}
        />
      );
    default:
      return <div style={{ padding: 12, color: '#64748b' }}>Unknown component</div>;
  }
}

function PreviewElement({ element }) {
  return <div key={element.id}><RenderElementContent element={element} /></div>;
}

export default WebsiteBuilder;
