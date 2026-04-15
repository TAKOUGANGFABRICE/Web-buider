import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './styles.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage('Password reset successfully! You can now login with your new password.');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Invalid Link</h1>
            <p>This password reset link is invalid or has expired.</p>
          </div>
          <div className="auth-footer">
            <Link to="/forgot-password">Request a new reset link</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-icon">💎</span>
              <span className="auth-logo-text">WaaS</span>
            </div>
            <h1>Password Reset!</h1>
            <div style={{ 
              padding: '16px', 
              background: '#e8f5e9', 
              color: '#2e7d32', 
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              {message}
            </div>
          </div>
          <div className="auth-footer">
            <Link to="/login">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💎</span>
            <span className="auth-logo-text">WaaS</span>
          </div>
          <h1>New Password</h1>
          <p>Enter your new password</p>
        </div>

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
            <label>New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;