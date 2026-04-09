import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './styles.css';

const API_URL = 'http://localhost:8000/api';

function CreateWebsite() {
  const [websiteName, setWebsiteName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  
  // Template data with more templates for pagination demo
  const [templates] = useState([
    { id: 1, name: 'Business', description: 'Professional business template', icon: '💼', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, name: 'Portfolio', description: 'Showcase your work', icon: '🎨', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 3, name: 'Blog', description: 'Perfect for blogging', icon: '📝', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 4, name: 'E-Commerce', description: 'Sell products online', icon: '🛒', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 5, name: 'Restaurant', description: 'Menu and reservation site', icon: '🍽️', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 6, name: 'Photography', description: 'Photo gallery website', icon: '📷', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 7, name: 'Fitness', description: 'Gym and fitness site', icon: '💪', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { id: 8, name: 'Travel', description: 'Travel agency website', icon: '✈️', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 9, name: 'Education', description: 'Online learning platform', icon: '📚', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 10, name: 'Real Estate', description: 'Property listings site', icon: '🏠', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { id: 11, name: 'Music', description: 'Band or musician site', icon: '🎵', color: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)' },
    { id: 12, name: 'Wedding', description: 'Wedding invitation site', icon: '💍', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  ]);
  
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [templatesPerPage] = useState(3);

  // Get current templates for pagination
  const indexOfLastTemplate = currentPage * templatesPerPage;
  const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage;
  const currentTemplates = templates.slice(indexOfFirstTemplate, indexOfLastTemplate);
  
  // Calculate total pages
  const totalPages = Math.ceil(templates.length / templatesPerPage);
  
  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const [isHovered, setIsHovered] = useState(false);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!websiteName.trim()) {
      setMessage('Please enter a website name');
      return;
    }
    if (!selectedTemplate) {
      setMessage('Please select a template');
      return;
    }
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await authenticatedFetch(`${API_URL}/websites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: websiteName,
          template_id: selectedTemplate
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Website "${data.name || websiteName}" created successfully!`);
        setTimeout(() => navigate(`/builder?id=${data.id}`), 1000);
        setWebsiteName('');
        setSelectedTemplate(null);
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to create website. Please try again.');
      }
    } catch (err) {
      console.error('Error creating website:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-website-container" style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      {/* Header with Create Website button at top right */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 16,
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '28px' }}>Create a New Website</h1>
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ 
            padding: '12px 24px',
            backgroundColor: isLoading ? '#93c5fd' : (isHovered ? '#1d4ed8' : '#2563eb'),
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
          }}
          onMouseEnter={() => !isLoading && setIsHovered(true)}
          onMouseLeave={() => !isLoading && setIsHovered(false)}
        >
          {isLoading ? 'Creating...' : 'Create Website'}
        </button>
      </div>

      {/* Website Name Input */}
      <div style={{ marginBottom: 30 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 10, 
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '14px'
        }}>
          Website Name
        </label>
        <input
          type="text"
          value={websiteName}
          onChange={(e) => setWebsiteName(e.target.value)}
          placeholder="Enter website name"
          style={{ 
            width: '100%', 
            padding: '12px 16px', 
            borderRadius: 8, 
            border: '1px solid #e2e8f0',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Select Template Section */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 15, 
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '14px'
        }}>
          Select Template
        </label>
      </div>

      {/* Templates Grid */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        marginBottom: 30
      }}>
        {currentTemplates.map((template) => (
          <div 
            key={template.id} 
            onClick={() => handleTemplateSelect(template.id)}
            style={{ 
              border: selectedTemplate === template.id ? '2px solid #2563eb' : '2px solid transparent',
              borderRadius: 12, 
              overflow: 'hidden',
              backgroundColor: 'white',
              boxShadow: selectedTemplate === template.id 
                ? '0 0 0 3px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: selectedTemplate === template.id ? 'scale(1.01)' : 'scale(1)'
            }}
          >
            {/* Template Preview */}
            <div style={{ 
              height: 150, 
              background: template.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px'
            }}>
              {template.icon}
            </div>
            
            {/* Template Info */}
            <div style={{ padding: 20 }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: 600
              }}>
                {template.name}
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#64748b', 
                fontSize: '14px'
              }}>
                {template.description}
              </p>
            </div>
            
            {/* Selected Indicator */}
            {selectedTemplate === template.id && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 24,
                height: 24,
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px'
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 8,
          marginTop: 30,
          marginBottom: 20
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '10px 16px',
              backgroundColor: currentPage === 1 ? '#e2e8f0' : '#2563eb',
              color: currentPage === 1 ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: 8,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            &laquo; Previous
          </button>
          
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              style={{
                padding: '10px 16px',
                backgroundColor: currentPage === number ? '#2563eb' : 'white',
                color: currentPage === number ? 'white' : '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                minWidth: '44px',
                transition: 'all 0.2s ease'
              }}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 16px',
              backgroundColor: currentPage === totalPages ? '#e2e8f0' : '#2563eb',
              color: currentPage === totalPages ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: 8,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {totalPages > 1 && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 30, 
          color: '#64748b',
          fontSize: '14px'
        }}>
          Showing {indexOfFirstTemplate + 1} to {Math.min(indexOfLastTemplate, templates.length)} of {templates.length} templates
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{ 
          padding: '16px 20px',
          backgroundColor: message.includes('successfully') ? '#dcfce7' : '#fee2e2',
          color: message.includes('successfully') ? '#166534' : '#dc2626',
          borderRadius: 8,
          marginTop: 20,
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CreateWebsite;
