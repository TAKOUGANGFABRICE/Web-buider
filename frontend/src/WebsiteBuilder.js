import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './WebsiteBuilder.css';

const API_URL = 'http://localhost:8000/api';

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
];

export const Builder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticatedFetch } = useAuth();
  
  const websiteId = searchParams.get('id');
  const [websiteName, setWebsiteName] = useState('My Website');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeTab, setActiveTab] = useState('elements');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);

  useEffect(() => {
    document.title = "Website Builder";
    if (websiteId) {
      fetchWebsite();
    }
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/`);
      if (response.ok) {
        const data = await response.json();
        setWebsiteName(data.name);
        if (data.page_elements && data.page_elements.length > 0) {
          setElements(data.page_elements.map(el => ({
            id: el.id,
            type: el.element_type,
            data: el.element_data,
            position: el.position
          })));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const pageElements = elements.map((el, index) => ({
        element_type: el.type,
        element_data: el.data,
        position: index,
        page_name: 'index'
      }));

      if (websiteId) {
        await authenticatedFetch(`${API_URL}/websites/${websiteId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_elements: pageElements })
        });
      } else {
        const response = await authenticatedFetch(`${API_URL}/websites/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: websiteName,
            page_elements: pageElements,
            content: JSON.stringify(elements)
          })
        });
        if (response.ok) {
          const data = await response.json();
          navigate(`/builder?id=${data.id}`, { replace: true });
        }
      }
      alert('Website saved successfully!');
    } catch (err) {
      console.error('Error saving website:', err);
      alert('Failed to save website');
    } finally {
      setSaving(false);
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
          <img src={data.src} alt={data.alt} style={{ maxWidth: '100%', width: data.width }} />
        ) : (
          <div className="element-placeholder">🖼️ Click to add image URL</div>
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
          </div>

          {activeTab === 'elements' && (
            <div className="elements-panel">
              <h3>Drag or click to add elements</h3>
              <div className="elements-grid">
                {ELEMENT_TYPES.map((el) => (
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
                        ) : (
                          <input
                            type="text"
                            value={value}
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
        </aside>

        <main 
          className="builder-canvas"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="canvas-content">
            {elements.length === 0 ? (
              <div className="empty-canvas">
                <div className="empty-canvas-icon">📝</div>
                <h3>Start Building Your Website</h3>
                <p>Drag elements from the sidebar or click to add them here</p>
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