import React from 'react';
import './TemplatePreview.css';

const HERO_IMAGES = {
  corporate: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80',
  consulting: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=80',
  agency: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1400&q=80',
  startup: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&q=80',
  finance: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1400&q=80',
  'corporate-blue': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=80',
  minimal: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80',
  grid: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1400&q=80',
  creative: 'https://images.unsplash.com/photo-1542744040-25c4d430006a?w=1400&q=80',
  'dark-mode': 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1400&q=80',
  masonry: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80',
  'one-page': 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1400&q=80',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80',
  marketplace: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
  boutique: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&q=80',
  electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80',
  'food-delivery': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80',
  'minimal-blog': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1400&q=80',
  magazine: 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1400&q=80',
  news: 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1400&q=80',
  personal: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1400&q=80',
  'tech-blog': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1400&q=80',
  event: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1400&q=80',
  'app-download': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1400&q=80',
  'product-hunt': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1400&q=80',
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
  saas: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&q=80',
};

function getImage(key) {
  const src = HERO_IMAGES[key] || 'https://placehold.co/860x240/1e293b/ffffff?text=' + encodeURIComponent(key);
  return src.replace('w=1400', 'w=860');
}

const TEMPLATE_PREVIEWS = {
  corporate: {
    name: 'Corporate',
    description: 'Professional business template with clean design',
    category: 'business',
    image: getImage('corporate'),
    html: `
      <div class="tp-page">
        <header class="tp-header">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">Corporate<span>Pro</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <button class="tp-btn tp-btn-primary">Get Quote</button>
          </div>
        </header>
        <section class="tp-hero tp-hero-image">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.corporate}" alt="Corporate" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Enterprise Solutions for Modern Business</h1>
              <p>We deliver scalable platforms, secure infrastructure, and measurable growth for ambitious companies.</p>
              <div class="tp-actions">
                <button class="tp-btn tp-btn-primary">Start Project</button>
                <button class="tp-btn tp-btn-ghost">View Case Studies</button>
              </div>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">What we do</h2>
            <div class="tp-grid tp-grid-3">
              <div class="tp-card"><div class="tp-icon">📊</div><h3>Strategy & Analytics</h3><p>Data-driven roadmaps with clear KPIs and reporting.</p></div>
              <div class="tp-card"><div class="tp-icon">🔒</div><h3>Security & Compliance</h3><p>Enterprise-grade controls and audit-ready documentation.</p></div>
              <div class="tp-card"><div class="tp-icon">⚡</div><h3>Performance</h3><p>Fast deployments, resilient systems, and low latency.</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">Corporate<span>Pro</span></div><p>Building reliable digital products since 2012.</p></div>
              <div><h4>Company</h4><a href="#">About</a><a href="#">Careers</a><a href="#">Press</a></div>
              <div><h4>Support</h4><a href="#">Help Center</a><a href="#">Contact</a><a href="#">Status</a></div>
              <div><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 CorporatePro Inc.</div>
          </div>
        </footer>
      </div>
    `,
  },
  consulting: {
    name: 'Consulting',
    description: 'Consulting firm layout with case studies',
    category: 'business',
    image: getImage('consulting'),
    html: `
      <div class="tp-page">
        <header class="tp-header">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">North<span>Bridge</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <button class="tp-btn tp-btn-primary">Book Consultation</button>
          </div>
        </header>
        <section class="tp-hero tp-hero-image">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.consulting}" alt="Consulting" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Strategic Consulting for Complex Markets</h1>
              <p>We partner with leaders to navigate uncertainty, prioritize initiatives, and accelerate outcomes.</p>
              <button class="tp-btn tp-btn-primary">Book Consultation</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">Engagements</h2>
            <div class="tp-grid tp-grid-3">
              <div class="tp-card"><h3>Operating Model</h3><p>Organization design, governance, and workflow optimization.</p></div>
              <div class="tp-card"><h3>Growth Strategy</h3><p>Market entry, pricing, and commercial strategy.</p></div>
              <div class="tp-card"><h3>Transformation</h3><p>Change programs and modern operating targets.</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">North<span>Bridge</span></div><p>Advisory for senior leadership teams.</p></div>
              <div><h4>Firm</h4><a href="#">About</a><a href="#">Team</a><a href="#">Offices</a></div>
              <div><h4>Contact</h4><a href="#">hello@northbridge.example</a><a href="#">+1 (555) 000-0000</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 NorthBridge Advisory</div>
          </div>
        </footer>
      </div>
    `,
  },
  agency: {
    name: 'Agency',
    description: 'Creative agency with bold sections and CTAs',
    category: 'business',
    image: getImage('agency'),
    html: `
      <div class="tp-page">
        <header class="tp-header tp-header-gradient">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">Studio<span>Nine</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <button class="tp-btn tp-btn-primary tp-btn-light">Start a Project</button>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-gradient">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.agency}" alt="Agency" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>We craft digital experiences</h1>
              <p>Brand, design, and engineering for growth-minded teams.</p>
              <div class="tp-actions">
                <button class="tp-btn tp-btn-primary">View Work</button>
                <button class="tp-btn tp-btn-ghost">Our Process</button>
              </div>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">Selected work</h2>
            <div class="tp-grid tp-grid-2">
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1542744040-25c4d430006a?w=720&q=80" alt="project" /><h3>Brand Identity</h3><p>Fintech startup</p></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=720&q=80" alt="project" /><h3>Commerce Platform</h3><p>DTC brand</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">Studio<span>Nine</span></div><p>Creative agency for modern brands.</p></div>
              <div><h4>Studio</h4><a href="#">Work</a><a href="#">Services</a><a href="#">Journal</a></div>
              <div><h4>Contact</h4><a href="#">studio@example.com</a><a href="#">New York, NY</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 StudioNine</div>
          </div>
        </footer>
      </div>
    `,
  },
  minimal: {
    name: 'Minimal Portfolio',
    description: 'Clean portfolio showcase with focus on typography',
    category: 'portfolio',
    image: getImage('minimal'),
    html: `
      <div class="tp-page tp-theme-light">
        <header class="tp-header tp-header-minimal">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">Sofia<span>Lee</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-minimal">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.minimal}" alt="Minimal Portfolio" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Designer & Developer</h1>
              <p>Minimal interfaces, clear typography, and thoughtful interactions.</p>
              <button class="tp-btn tp-btn-ghost tp-btn-dark">Selected Works</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-2">
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=720&q=80" alt="project" /><h3>Project A</h3><p>Brand & web</p></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=720&q=80" alt="project" /><h3>Project B</h3><p>Editorial</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-minimal">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">Sofia<span>Lee</span></div><p>Available for freelance.</p></div>
              <div><h4>Social</h4><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">Dribbble</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Sofia Lee</div>
          </div>
        </footer>
      </div>
    `,
  },
  grid: {
    name: 'Grid Portfolio',
    description: 'Masonry grid for photographers and designers',
    category: 'portfolio',
    image: getImage('grid'),
    html: `
      <div class="tp-page tp-theme-dark">
        <header class="tp-header tp-header-minimal">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo tp-logo-light">Frames</div>
            <nav class="tp-nav tp-nav-light">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.grid}" alt="Grid Portfolio" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1 class="tp-h1-dark">Photography</h1>
              <p class="tp-sub-dark">Visual stories in curated frames.</p>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-3 tp-gallery">
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=420&q=80" alt="photo" /></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=420&q=80" alt="photo" /></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=420&q=80" alt="photo" /></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1542744040-25c4d430006a?w=420&q=80" alt="photo" /></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=420&q=80" alt="photo" /></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=420&q=80" alt="photo" /></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-minimal">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo tp-logo-light">Frames</div><p>Photography studio.</p></div>
              <div><h4>Info</h4><a href="#">Licensing</a><a href="#">Prints</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Frames Studio</div>
          </div>
        </footer>
      </div>
    `,
  },
  creative: {
    name: 'Creative Portfolio',
    description: 'Artistic portfolio with experimental layout',
    category: 'portfolio',
    image: getImage('creative'),
    html: `
      <div class="tp-page">
        <header class="tp-header tp-header-gradient tp-header-accent">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">Studio<span>Noir</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-creative">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.creative}" alt="Creative Portfolio" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Where art meets technology</h1>
              <p>Experimental typography, immersive interactions, and visual storytelling.</p>
              <button class="tp-btn tp-btn-primary">Explore Projects</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-2">
              <div class="tp-card tp-card-media tp-card-feature"><img src="https://images.unsplash.com/photo-1542744040-25c4d430006a?w=720&q=80" alt="project" /><h3>Installation</h3><p>Museum exhibit</p></div>
              <div class="tp-card tp-card-media tp-card-feature"><img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=720&q=80" alt="project" /><h3>Publication</h3><p>Limited edition</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">Studio<span>Noir</span></div><p>Creative studio based in Berlin.</p></div>
              <div><h4>Studio</h4><a href="#">Work</a><a href="#">Journal</a><a href="#">Contact</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Studio Noir</div>
          </div>
        </footer>
      </div>
    `,
  },
  shop: {
    name: 'Shop',
    description: 'Modern online store template',
    category: 'ecommerce',
    image: getImage('shop'),
    html: `
      <div class="tp-page">
        <header class="tp-header">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">Maison</div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <div class="tp-header-actions">
              <a href="#">Search</a><a href="#">Cart (0)</a>
            </div>
          </div>
        </header>
        <section class="tp-hero tp-hero-image">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.shop}" alt="Shop" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Summer Essentials</h1>
              <p>Breathable fabrics, neutral palettes, and everyday versatility.</p>
              <button class="tp-btn tp-btn-primary">Shop New Arrivals</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">Trending</h2>
            <div class="tp-grid tp-grid-4">
              <div class="tp-card tp-card-product"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80" alt="product" /><h3>Linen Shirt</h3><p>$89</p></div>
              <div class="tp-card tp-card-product"><img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80" alt="product" /><h3>Relaxed Trousers</h3><p>$120</p></div>
              <div class="tp-card tp-card-product"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80" alt="product" /><h3>Weekend Bag</h3><p>$145</p></div>
              <div class="tp-card tp-card-product"><img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80" alt="product" /><h3>Leather Sneakers</h3><p>$160</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">Maison</div><p>Slow fashion essentials.</p></div>
              <div><h4>Shop</h4><a href="#">New</a><a href="#">Best sellers</a><a href="#">Gift cards</a></div>
              <div><h4>Help</h4><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Contact</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Maison</div>
          </div>
        </footer>
      </div>
    `,
  },
  boutique: {
    name: 'Boutique',
    description: 'Luxury brand shop with refined typography',
    category: 'ecommerce',
    image: getImage('boutique'),
    html: `
      <div class="tp-page tp-theme-dark tp-theme-gold">
        <header class="tp-header tp-header-minimal tp-header-luxury">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo tp-logo-light">Aurélie</div>
            <nav class="tp-nav tp-nav-light">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-luxury">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.boutique}" alt="Boutique" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>The Aurélie Edit</h1>
              <p>Curated luxury essentials crafted with intention.</p>
              <button class="tp-btn tp-btn-outline-gold">Shop Collection</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-3">
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=560&q=80" alt="product" /><h3>Leather Goods</h3><p>Hand finished.</p></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=560&q=80" alt="product" /><h3>Silk Scarves</h3><p>Limited run.</p></div>
              <div class="tp-card tp-card-media"><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=560&q=80" alt="product" /><h3>Jewelry</h3><p>Artisan made.</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-minimal">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo tp-logo-light">Aurélie</div><p>Boutique since 1998.</p></div>
              <div><h4>Boutique</h4><a href="#">Visit</a><a href="#">Contact</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Aurélie</div>
          </div>
        </footer>
      </div>
    `,
  },
  'minimal-blog': {
    name: 'Minimal Blog',
    description: 'Clean blog layout with readable typography',
    category: 'blog',
    image: getImage('minimal-blog'),
    html: `
      <div class="tp-page tp-theme-light">
        <header class="tp-header tp-header-minimal">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">The<span>Column</span></div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-minimal">
          <img class="tp-hero-image-img" src="${HERO_IMAGES['minimal-blog']}" alt="Minimal Blog" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Simple thoughts, clearly expressed</h1>
              <p>A publication about design, systems, and slow creativity.</p>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-2">
              <article class="tp-card tp-card-article">
                <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=720&q=80" alt="article" />
                <h3>On quiet design systems</h3>
                <p>Why rest, whitespace, and restraint still matter.</p>
              </article>
              <article class="tp-card tp-card-article">
                <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=720&q=80" alt="article" />
                <h3>A writing workflow for makers</h3>
                <p>Capture, revise, and ship long-form work faster.</p>
              </article>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-minimal">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">The<span>Column</span></div><p>Weekly essays.</p></div>
              <div><h4>Follow</h4><a href="#">RSS</a><a href="#">Newsletter</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 The Column</div>
          </div>
        </footer>
      </div>
    `,
  },
  magazine: {
    name: 'Magazine Blog',
    description: 'Magazine-style blog with hero sections',
    category: 'blog',
    image: getImage('magazine'),
    html: `
      <div class="tp-page tp-theme-magazine">
        <header class="tp-header tp-header-magazine">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo tp-logo-light tp-logo-mega">POINT</div>
            <nav class="tp-nav tp-nav-light">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-magazine">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.magazine}" alt="Magazine" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <span class="tp-kicker">Featured</span>
              <h1>The unseen cost of rapid scaling</h1>
              <p>An investigation into infrastructure debt and how teams can recover without slowing down.</p>
              <button class="tp-btn tp-btn-primary">Read Story</button>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title tp-section-title-light">Latest</h2>
            <div class="tp-grid tp-grid-3">
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=640&q=80" alt="story" /><h3>Urban mobility</h3><p>Transportation</p></div>
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=80" alt="story" /><h3>AI in newsrooms</h3><p>Technology</p></div>
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=640&q=80" alt="story" /><h3>Design of trust</h3><p>Design</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-magazine">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo tp-logo-light tp-logo-mega">POINT</div><p>Independent reporting.</p></div>
              <div><h4>Magazine</h4><a href="#">Masthead</a><a href="#">Ethics</a><a href="#">Careers</a></div>
              <div><h4>Subscribe</h4><a href="#">Monthly</a><a href="#">Annual</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 Point Magazine</div>
          </div>
        </footer>
      </div>
    `,
  },
  news: {
    name: 'News Portal',
    description: 'News portal with breaking headlines',
    category: 'blog',
    image: getImage('news'),
    html: `
      <div class="tp-page tp-theme-news">
        <header class="tp-header tp-header-news">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo tp-logo-light tp-logo-mega">CITYWIRE</div>
            <div class="tp-news-meta">Live · ${new Date().toLocaleDateString()}</div>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-news">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.news}" alt="News" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Breaking News</h1>
              <p>Stay informed with real-time updates and in-depth reporting.</p>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <div class="tp-grid tp-grid-3">
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=640&q=80" alt="story" /><h3>Markets open higher</h3><p>Finance</p></div>
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=640&q=80" alt="story" /><h3>Heatwave forecast</h3><p>Weather</p></div>
              <div class="tp-card tp-card-article"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80" alt="story" /><h3>Championship preview</h3><p>Sports</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-magazine">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo tp-logo-light tp-logo-mega">CITYWIRE</div><p>City coverage, no noise.</p></div>
              <div><h4>Sections</h4><a href="#">Politics</a><a href="#">Business</a><a href="#">Tech</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 CityWire News</div>
          </div>
        </footer>
      </div>
    `,
  },
  startup: {
    name: 'Startup Landing',
    description: 'Product launch page with social proof',
    category: 'landing',
    image: getImage('startup'),
    html: `
      <div class="tp-page">
        <header class="tp-header">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo">LaunchPad</div>
            <nav class="tp-nav">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <button class="tp-btn tp-btn-primary">Get Early Access</button>
          </div>
        </header>
        <section class="tp-hero tp-hero-image">
          <img class="tp-hero-image-img" src="${HERO_IMAGES.startup}" alt="Startup" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Ship faster with less overhead</h1>
              <p>LaunchPad gives founders deployment pipelines, usage analytics, and billing in one place.</p>
              <div class="tp-actions">
                <button class="tp-btn tp-btn-primary">Start Free Trial</button>
                <button class="tp-btn tp-btn-ghost">See How It Works</button>
              </div>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">Highlights</h2>
            <div class="tp-grid tp-grid-3">
              <div class="tp-card"><h3>Fast Launch</h3><p>Go live in minutes with built-in CI and preview URLs.</p></div>
              <div class="tp-card"><h3>Usage Insights</h3><p>Understand visitors, conversions, and retention.</p></div>
              <div class="tp-card"><h3>Billing Built In</h3><p>Subscriptions, invoicing, and tax handling handled.</p></div>
            </div>
          </div>
        </section>
        <section class="tp-section tp-section-alt">
          <div class="tp-container">
            <h2 class="tp-section-title">Trusted by operators</h2>
            <div class="tp-logos">
              <div class="tp-logo-chip">Vercel</div><div class="tp-logo-chip">Linear</div><div class="tp-logo-chip">Resend</div><div class="tp-logo-chip">Clerk</div>
            </div>
          </div>
        </section>
        <footer class="tp-footer">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo">LaunchPad</div><p>Founder-friendly infrastructure.</p></div>
              <div><h4>Product</h4><a href="#">Features</a><a href="#">Pricing</a><a href="#">Docs</a></div>
              <div><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 LaunchPad</div>
          </div>
        </footer>
      </div>
    `,
  },
  'corporate-blue': {
    name: 'Corporate Blue',
    description: 'Enterprise corporate template with professional blue theme',
    category: 'business',
    image: getImage('corporate-blue'),
    html: `
      <div class="tp-page tp-theme-blue">
        <header class="tp-header tp-header-blue">
          <div class="tp-container tp-header-inner">
            <div class="tp-logo tp-logo-blue">Blue<span>Corp</span></div>
            <nav class="tp-nav tp-nav-blue">
              <a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a>
            </nav>
            <button class="tp-btn tp-btn-blue">Contact Us</button>
          </div>
        </header>
        <section class="tp-hero tp-hero-image tp-hero-blue">
          <img class="tp-hero-image-img" src="${HERO_IMAGES['corporate-blue']}" alt="Corporate Blue" />
          <div class="tp-hero-overlay">
            <div class="tp-container">
              <h1>Enterprise Solutions for Modern Business</h1>
              <p>Professional corporate design for large organizations and enterprise teams.</p>
              <div class="tp-actions">
                <button class="tp-btn tp-btn-blue">Get Started</button>
                <button class="tp-btn tp-btn-ghost">Learn More</button>
              </div>
            </div>
          </div>
        </section>
        <section class="tp-section">
          <div class="tp-container">
            <h2 class="tp-section-title">Our Services</h2>
            <div class="tp-grid tp-grid-3">
              <div class="tp-card"><div class="tp-icon">🏢</div><h3>Enterprise Solutions</h3><p>Scalable platforms for large organizations.</p></div>
              <div class="tp-card"><div class="tp-icon">🔐</div><h3>Security</h3><p>Enterprise-grade security and compliance.</p></div>
              <div class="tp-card"><div class="tp-icon">📈</div><h3>Growth</h3><p>Data-driven strategies for measurable results.</p></div>
            </div>
          </div>
        </section>
        <footer class="tp-footer tp-footer-blue">
          <div class="tp-container">
            <div class="tp-footer-grid">
              <div><div class="tp-logo tp-logo-blue">Blue<span>Corp</span></div><p>Trusted by Fortune 500 companies.</p></div>
              <div><h4>Company</h4><a href="#">About</a><a href="#">Careers</a><a href="#">Press</a></div>
              <div><h4>Support</h4><a href="#">Help Center</a><a href="#">Contact</a></div>
              <div><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a></div>
            </div>
            <div class="tp-footer-bottom">© 2025 BlueCorp Inc.</div>
          </div>
        </footer>
      </div>
    `,
  },
};

function TemplatePreview({ templateId, onClose, onEdit }) {
  const template = TEMPLATE_PREVIEWS[templateId];
  if (!template) return null;
  return (
    <div className="preview-modal" onClick={onClose}>
      <div className="preview-content" onClick={(e) => e.stopPropagation()}>
        <button className="preview-close" onClick={onClose}>✕</button>
        
        <div className="preview-frame">
          <div className="browser-bar">
            <div className="browser-controls">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="browser-url-bar">
              <span>www.yourwebsite.com</span>
            </div>
          </div>
          
          <div className="website-preview" dangerouslySetInnerHTML={{ __html: template.html }} />
        </div>
        
        <div className="preview-body">
          <h2>{template.name}</h2>
          <div className="preview-image">
            <img src={template.image} alt={template.name} onError={(e) => {
              e.target.src = `https://placehold.co/860x240/1e293b/ffffff?text=${encodeURIComponent(template.name)}`;
            }} />
          </div>
          <p className="preview-description">{template.description}</p>
          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={onEdit}>Edit Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplatePreview;
