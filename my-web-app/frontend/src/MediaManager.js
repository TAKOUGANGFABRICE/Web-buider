import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './MediaManager.css';

function MediaManager() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { authenticatedFetch } = useAuth();

  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await authenticatedFetch('/api/media/images/');
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const response = await fetch('/api/media/images/', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setMedia([...media, data]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
  };

  const deleteMedia = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    
    try {
      const response = await authenticatedFetch(`/api/media/images/${id}/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMedia(media.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredMedia = media.filter(item => {
    if (selectedType !== 'all' && item.media_type !== selectedType) {
      return false;
    }
    if (searchQuery && !item.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="media-page">
      <header className="media-header">
        <h1>Media Library</h1>
        <div className="media-actions">
          <input 
            type="file" 
            id="upload-input" 
            multiple 
            accept="image/*,video/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="upload-input" className="btn btn-primary">
            {uploading ? 'Uploading...' : 'Upload Files'}
          </label>
        </div>
      </header>

      <div className="media-filters">
        <div className="type-filters">
          <button 
            className={selectedType === 'all' ? 'active' : ''}
            onClick={() => setSelectedType('all')}
          >
            All
          </button>
          <button 
            className={selectedType === 'image' ? 'active' : ''}
            onClick={() => setSelectedType('image')}
          >
            Images
          </button>
          <button 
            className={selectedType === 'video' ? 'active' : ''}
            onClick={() => setSelectedType('video')}
          >
            Videos
          </button>
        </div>
        <input 
          type="text" 
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading media...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="empty-state">
          <p>No media files found</p>
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map(item => (
            <div key={item.id} className="media-item">
              {item.media_type === 'image' ? (
                <img src={item.image_url || item.image} alt={item.name} />
              ) : (
                <video src={item.video_url} />
              )}
              <div className="media-info">
                <span className="media-name">{item.name || item.title}</span>
                <button 
                  className="btn-delete"
                  onClick={() => deleteMedia(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaManager;