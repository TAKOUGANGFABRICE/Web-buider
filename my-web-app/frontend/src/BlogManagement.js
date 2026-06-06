import React, { useState } from 'react';
import BlogPostsManager from './BlogPostsManager';
import CategoriesManager from './CategoriesManager';
import TagsManager from './TagsManager';
import './BlogManagement.css';

const BlogManagement = () => {
  const [activeTab, setActiveTab] = useState('posts');

  const tabs = [
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <BlogPostsManager />;
      case 'categories':
        return <CategoriesManager />;
      case 'tags':
        return <TagsManager />;
      default:
        return <BlogPostsManager />;
    }
  };

  return (
    <div className="blog-management">
      <div className="blog-header">
        <h2>Blog & CMS</h2>
        <p className="blog-subtitle">Create and manage your blog content, categories, and tags</p>
      </div>

      <div className="blog-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`blog-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="blog-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default BlogManagement;
