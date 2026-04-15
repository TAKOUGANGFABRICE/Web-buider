import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('If an account exists with this email, you will receive a password reset link shortly.');
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💎</span>
            <span className="auth-logo-text">WaaS</span>
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        {message && (
          <div className="form-success mb-4" style={{ 
            padding: '12px', 
            background: '#e8f5e9', 
            color: '#2e7d32', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div className="form-error mb-4" style={{ 
            padding: '12px', 
            background: '#ffebee', 
            color: '#c62828', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;