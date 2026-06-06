 import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Blog.css';

export function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await authenticatedFetch('/api/crud/blog-posts/?status=published');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [authenticatedFetch]);

  if (loading) return <div className="blog-loading">Loading...</div>;
  if (!posts.length) return <div className="blog-empty">No blog posts found.</div>;

  return (
    <div className="blog-list">
      {posts.map(post => (
        <div className="blog-list-item" key={post.id}>
          <Link to={`/blog/${post.slug}`} className="blog-title">{post.title}</Link>
          <div className="blog-meta">
            <span>{post.author?.username || 'Unknown author'}</span>
            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
          </div>
          <div className="blog-excerpt">{post.excerpt}</div>
        </div>
      ))}
    </div>
  );
}

export function BlogDetail() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authenticatedFetch } = useAuth();
  const { slug } = useParams();

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const res = await authenticatedFetch(`/api/crud/blog-posts/?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data[0] || null);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchPost();
  }, [slug, authenticatedFetch]);

  if (loading) return <div className="blog-loading">Loading...</div>;
  if (!post) return <div className="blog-empty">Blog post not found.</div>;

  return (
    <div className="blog-detail">
      <h1>{post.title}</h1>
      <div className="blog-meta">
        <span>{post.author?.username || 'Unknown author'}</span>
        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
      </div>
      {post.featured_image && <img src={post.featured_image} alt="Featured" className="blog-featured-image" />}
      <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="blog-tags">
        {post.tags?.map(tag => <span key={tag.id} className="blog-tag">#{tag.name}</span>)}
      </div>
    </div>
  );
}
