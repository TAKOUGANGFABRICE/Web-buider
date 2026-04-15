import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Gallery.css';

const API_URL = 'http://localhost:8000/api';

const Gallery = ({ onSelectImage, selectMode = false }) => {
  const [searchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const fileInputRef = useRef(null);

  const websiteId = searchParams.get('id');
  const token = localStorage.getItem('access');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_URL}/media/images/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', file.name);

      const response = await fetch(`${API_URL}/media/images/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const newImage = await response.json();
        setImages([newImage, ...images]);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Error uploading image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId) => {
    setShowConfirmDialog({
      show: true,
      title: 'Delete Image',
      message: 'Are you sure you want to delete this image?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/media/images/${imageId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setMessage({ type: 'success', text: 'Image deleted successfully!' });
            setImages(images.filter(img => img.id !== imageId));
            if (selectedImage?.id === imageId) {
              setSelectedImage(null);
            }
          }
        } catch (err) {
          console.error('Error deleting image:', err);
          setMessage({ type: 'error', text: 'Error deleting image' });
        }
        setShowConfirmDialog(null);
      }
    });
  };

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url);
    setError('Image URL copied to clipboard!');
    setTimeout(() => setError(''), 2000);
  };

  const handleImageClick = (image) => {
    if (selectMode && onSelectImage) {
      onSelectImage(image);
    } else {
      setSelectedImage(image);
    }
  };

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (img.alt_text && img.alt_text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="gallery-loading">
          <div className="spinner"></div>
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div className="gallery-header-left">
          <h1>{selectMode ? 'Select Image' : 'Media Gallery'}</h1>
          <p>{images.length} images • Upload images to use in your website builder</p>
        </div>
        <div className="gallery-header-right">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading...' : '+ Add Images'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple
          />
        </div>
      </div>

      <div className="gallery-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className={`gallery-message ${error.includes('copied') ? 'success' : 'error'}`}>
          {error}
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span>Uploading...</span>
        </div>
      )}

      {filteredImages.length === 0 ? (
        <div className="gallery-empty">
          <div className="empty-icon">🖼️</div>
          <h3>No images yet</h3>
          <p>Upload images to use in your website builder</p>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
            Click the "+ Add Images" button above to upload
          </p>
        </div>
      ) : (
        <div className={`gallery-content ${viewMode}`}>
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`gallery-item ${selectedImage?.id === image.id ? 'selected' : ''} ${selectMode ? 'selectable' : ''}`}
              onClick={() => handleImageClick(image)}
            >
              <div className="image-wrapper">
                <img
                  src={image.image_url || image.image}
                  alt={image.alt_text || image.name}
                />
                <div className="image-overlay">
                  {!selectMode && (
                    <div className="image-actions">
                      <button 
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  {selectMode && (
                    <button className="select-btn">Select</button>
                  )}
                </div>
              </div>
              <div className="image-info">
                <span className="image-name">{image.name}</span>
                {image.width && image.height && (
                  <span className="image-size">{image.width} × {image.height}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;