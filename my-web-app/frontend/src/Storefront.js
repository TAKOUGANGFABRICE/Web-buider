import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './Storefront.css';

function Storefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_active: true,
    inventory: 0,
    images: '',
  });
  const { websiteId } = useParams();

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/crud/products/crud/?website_id=${websiteId}`),
        fetch(`/api/crud/product_categories/crud/?website_id=${websiteId}`),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingProduct
        ? `/api/crud/products/crud/${editingProduct.id}/`
        : '/api/crud/products/crud/';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: websiteId,
          price: parseFloat(formData.price),
          inventory: parseInt(formData.inventory),
          images: formData.images.split('\n').filter(i => i.trim()),
        }),
      });

      if (response.ok) {
        fetchData();
        setShowProductForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          is_active: true,
          inventory: 0,
          images: '',
        });
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`/api/crud/products/crud/${productId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category || '',
      is_active: product.is_active,
      inventory: product.inventory,
      images: product.images?.join('\n') || '',
    });
    setShowProductForm(true);
  };

  return (
    <div className="storefront">
      <header className="page-header">
        <h1>Storefront Management</h1>
        <button className="btn btn-primary" onClick={() => setShowProductForm(true)}>
          Add Product
        </button>
      </header>

      <section className="stats-section">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Products</span>
          <span className="stat-value">{products.filter(p => p.is_active).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{categories.length}</span>
        </div>
      </section>

      <section className="products-section">
        <h2>Products</h2>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Inventory</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.name} className="product-thumb" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>${parseFloat(product.price).toFixed(2)}</td>
                  <td>{product.inventory}</td>
                  <td>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => editProduct(product)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showProductForm && (
        <div className="modal-overlay" onClick={() => setShowProductForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Inventory</label>
                  <input
                    type="number"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Image URLs (one per line)</label>
                <textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Storefront;