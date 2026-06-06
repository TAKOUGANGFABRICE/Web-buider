import React, { useState } from 'react';
import './PageManagement.css';

const SITE_PAGES = [
  { id: '1', name: 'Home', slug: '', route: '', is_homepage: true, is_published: true, parent_id: null },
  { id: '2', name: 'About', slug: 'about', route: '/about', is_homepage: false, is_published: true, parent_id: null },
  { id: '3', name: 'Contact', slug: 'contact', route: '/contact', is_homepage: false, is_published: true, parent_id: null },
  { id: '4', name: 'Services', slug: 'services', route: '/services', is_homepage: false, is_published: true, parent_id: null },
  { id: '5', name: 'Web Design', slug: 'web-design', route: '/services/web-design', is_homepage: false, is_published: true, parent_id: '4' },
  { id: '6', name: 'SEO', slug: 'seo', route: '/services/seo', is_homepage: false, is_published: true, parent_id: '4' },
];

function PageManagement() {
  const [pages, setPages] = useState(SITE_PAGES);
  const [activeId, setActiveId] = useState('1');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const addRoot = () => {
    const page = {
      id: `local-${Date.now()}`,
      name: 'New Page',
      slug: 'new-page',
      route: '/new-page',
      is_homepage: false,
      is_published: true,
      parent_id: null,
    };
    setPages([...pages, page]);
    setActiveId(page.id);
    setEditing({ ...page });
  };

  const addChild = (parentId) => {
    const parent = pages.find((p) => p.id === parentId);
    if (!parent || parent.is_homepage) return;
    const page = {
      id: `local-${Date.now()}`,
      name: 'New Subpage',
      slug: `${parent.slug || 'home'}/new-page`,
      route: `${parent.route || ''}/new-page`,
      is_homepage: false,
      is_published: true,
      parent_id: parentId,
    };
    setPages([...pages, page]);
    setActiveId(page.id);
    setEditing({ ...page });
  };

  const duplicate = (page) => {
    const copy = {
      ...page,
      id: `local-${Date.now()}`,
      name: `${page.name} (Copy)`,
      slug: `${page.slug}-copy`,
      route: page.route ? `${page.route}-copy` : '',
    };
    setPages([...pages, copy]);
    setActiveId(copy.id);
  };

  const remove = (id) => {
    const descendants = new Set([id]);
    let changed = true;
    const pagesRef = pages;
    while (changed) {
      changed = false;
      for (const p of pagesRef) {
        if (p.parent_id && descendants.has(p.parent_id) && !descendants.has(p.id)) {
          descendants.add(p.id);
          changed = true;
        }
      }
    }
    const next = pages.filter((p) => !descendants.has(p.id));
    setPages(next);
    if (descendants.has(activeId)) {
      setActiveId(null);
      setEditing(null);
    }
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError('Page name is required');
      return;
    }
    setPages(pages.map((p) => (p.id === editing.id ? { ...editing } : p)));
    setEditing(null);
    setError('');
  };

  const move = (pageId, direction) => {
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= pages.length) return;
    const next = [...pages];
    const tmp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = tmp;
    setPages(next);
  };

  const roots = pages.filter((p) => !p.parent_id);

  const renderTree = (page, depth = 0) => {
    const children = pages.filter((p) => p.parent_id === page.id);
    const isActive = activeId === page.id;
    return (
      <div key={page.id}>
        <div
          className={`page-item ${isActive ? 'selected' : ''}`}
          style={{ paddingLeft: depth * 18 }}
          onClick={() => {
            setActiveId(page.id);
            setEditing({ ...page });
          }}
        >
          <span className="page-icon">{page.is_homepage ? '🏠' : '📄'}</span>
          <span className="page-name">{page.name || 'Untitled'}</span>
          <div className="page-actions" onClick={(e) => e.stopPropagation()}>
            <button title="Add subpage" onClick={() => addChild(page.id)}>＋</button>
            <button title="Duplicate" onClick={() => duplicate(page)}>⧉</button>
            <button title="Move up" onClick={() => move(page.id, 'up')}>↑</button>
            <button title="Move down" onClick={() => move(page.id, 'down')}>↓</button>
            <button title="Delete" onClick={() => remove(page.id)}>🗑</button>
          </div>
        </div>
        {children.map((child) => renderTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="page-management">
      <div className="page-sidebar">
        <div className="sidebar-header">
          <h3>Pages</h3>
          <button onClick={addRoot}>＋</button>
        </div>
        <div className="page-tree">
          {roots.map((page) => renderTree(page))}
        </div>
      </div>

      <div className="page-editor">
        {editing ? (
          <div className="editor-content">
            <h2>Edit Page</h2>
            {error && <div className="editor-error">{error}</div>}
            <div className="form-group">
              <label>Page Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="about"
              />
              <small>Final URL: {editing.is_homepage ? '/' : `/${editing.slug || ''}`}</small>
            </div>

            <div className="form-group">
              <label>Custom Route</label>
              <input
                type="text"
                value={editing.route}
                onChange={(e) => setEditing({ ...editing, route: e.target.value })}
                placeholder="/about-us"
              />
            </div>

            <div className="form-group">
              <label>SEO Title</label>
              <input
                type="text"
                value={editing.seo_title || ''}
                onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })}
                placeholder="SEO title for search engines"
              />
            </div>

            <div className="form-group">
              <label>SEO Description</label>
              <textarea
                value={editing.seo_description || ''}
                onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })}
                placeholder="SEO description for search engines"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editing.is_homepage}
                  onChange={(e) => setEditing({ ...editing, is_homepage: e.target.checked })}
                />
                Homepage
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editing.is_published}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                />
                Published
              </label>
            </div>

            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save Page</button>
            </div>
          </div>
        ) : (
          <div className="empty-editor">
            <p>Select a page to edit or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PageManagement;
