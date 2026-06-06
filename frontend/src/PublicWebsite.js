import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PublicWebsite.css';

const API_URL = 'http://localhost:8000/api';

const PublicWebsite = () => {
  const [searchParams] = useSearchParams();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const websiteId = searchParams.get('id');
  const slug = searchParams.get('slug');
  const subdomain = searchParams.get('subdomain');

  useEffect(() => {
    fetchWebsite();
  }, []);

  const fetchWebsite = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/public/website/`;
      if (websiteId) {
        url = `${API_URL}/public/website/${websiteId}/`;
      } else if (slug) {
        url = `${API_URL}/public/website/?slug=${slug}`;
      } else if (subdomain) {
        url = `${API_URL}/public/website/?subdomain=${subdomain}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Website not found');
      }

      const data = await response.json();
      setWebsite(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderElement = (element) => {
    const { element_type, element_data } = element;
    const data = typeof element_data === 'string' ? JSON.parse(element_data) : element_data;

    switch (element_type) {
      case 'heading':
        const HeadingTag = data.level || 'h1';
        return React.createElement(HeadingTag, { 
          style: { margin: 0, color: '#1e293b', fontSize: HeadingTag === 'h1' ? '2.5rem' : '2rem' } 
        }, data.text);
      
      case 'paragraph':
        return <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>{data.text}</p>;
      
      case 'text':
        return <div style={{ color: '#1e293b' }}>{data.text}</div>;
      
      case 'image':
        return data.src ? (
          <img src={data.src} alt={data.alt} style={{ maxWidth: '100%', width: data.width }} />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
            🖼️ Image Placeholder
          </div>
        );
      
      case 'button':
        const btnStyles = {
          primary: { background: '#2563eb', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer' },
          secondary: { background: '#64748b', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer' },
          outline: { background: 'transparent', color: '#2563eb', padding: '12px 24px', border: '2px solid #2563eb', borderRadius: '8px', cursor: 'pointer' }
        };
        return (
          <a href={data.url || '#'} style={btnStyles[data.style] || btnStyles.primary}>
            {data.text}
          </a>
        );
      
      case 'hero':
        return (
          <div style={{ 
            background: data.bgColor || '#667eea', 
            padding: '60px 20px', 
            textAlign: 'center',
            borderRadius: '12px'
          }}>
            <h1 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '2.5rem' }}>{data.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }}>{data.subtitle}</p>
          </div>
        );
      
      case 'spacer':
        return <div style={{ height: data.height || '40px' }} />;
      
      case 'divider':
        return <hr style={{ border: 'none', borderTop: `1px ${data.style || 'solid'} ${data.color || '#e2e8f0'}`, margin: '20px 0' }} />;
      
      case 'nav':
        return (
          <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc' }}>
            {data.links?.map((link, i) => (
              <a key={i} href={link.url} style={{ color: '#1e293b', textDecoration: 'none' }}>{link.text}</a>
            ))}
          </nav>
        );
      
      case 'footer':
        return <footer style={{ padding: '20px', textAlign: 'center', background: '#1e293b', color: 'white' }}>{data.text}</footer>;
      
      case 'gallery':
        return <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>🖼️ Gallery ({data.images?.length || 0} images)</div>;
      
      case 'video':
        return data.url ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe 
              src={data.url} 
              title="Video" 
              frameBorder="0" 
              allowFullScreen 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>🎬 Add video URL</div>
        );
      
      case 'form':
        return (
          <form style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            {data.fields?.map((field, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{field.label}</label>
                <input type={field.type} placeholder={field.label} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
              </div>
            ))}
            <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
          </form>
        );
      
      case 'social':
        return (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '20px' }}>
            {data.platforms?.map((platform, i) => (
              <span key={i} style={{ fontSize: '24px' }}>🔗</span>
            ))}
          </div>
        );
      
      case 'container':
        return <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>📦 Container</div>;
      
      default:
        return <div style={{ padding: '20px', color: '#888' }}>Unknown element: {element_type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="public-loading">
        <div className="spinner"></div>
        <p>Loading website...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-error">
        <h2>Website Not Found</h2>
        <p>{error}</p>
        <a href="/">Go to Homepage</a>
      </div>
    );
  }

  return (
    <div className="public-website">
      {website.seo_title && (
        <title>{website.seo_title}</title>
      )}
      {website.seo_description && (
        <meta name="description" content={website.seo_description} />
      )}
      
      <header className="public-header">
        <div className="public-nav">
          <span className="public-logo">💎 WaaS</span>
          {website.name && <span className="site-name">{website.name}</span>}
        </div>
      </header>

      <main className="public-content">
        {website.page_elements && website.page_elements.length > 0 ? (
          website.page_elements.map((element, index) => (
            <div key={index} className="element-wrapper">
              {renderElement(element)}
            </div>
          ))
        ) : (
          <div className="empty-site">
            <h2>This website has no content yet</h2>
            <p>The owner is still building this site.</p>
          </div>
        )}
      </main>

      <footer className="public-footer">
        <p>Powered by <a href="/">WaaS</a></p>
      </footer>
    </div>
  );
};

export default PublicWebsite;