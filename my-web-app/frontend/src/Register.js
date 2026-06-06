import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './App.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
    
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleChange = (e) => {
    if (submitted) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      setSubmitted(true);
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        if (data.access && data.refresh) {
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', data.refresh);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setAuth(data.access, data.refresh, data.user);
          }
          localStorage.setItem('has_selected_plan', 'true');
          setTimeout(() => { window.location.href = '/dashboard'; }, 100);
          return;
        }
        window.location.href = '/login';
      } else {
        let errorMsg = 'Registration failed';
        if (data.username) {
          errorMsg = `Username: ${data.username[0]}`;
        } else if (data.email) {
          errorMsg = `Email: ${data.email[0]}`;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
        console.error('Registration error:', data);
        setError(errorMsg);
        setSubmitted(false);
      }
    } catch (err) {
      setError('Network error');
      setSubmitted(false);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Get started with your website builder</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="johndoe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;


