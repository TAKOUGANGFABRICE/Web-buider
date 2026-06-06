import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Password reset email sent. Check your inbox.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.error || data.detail || 'Failed to send reset email');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {message && (
            <div className={message.includes('sent') ? 'auth-success' : 'auth-error'}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;