import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import './App.css';

function ResetPassword() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract token from query params on mount
  React.useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully. You can now log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.error || data.detail || 'Password reset failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }

    setLoading(false);
  };

  // If token is missing, show error and redirect to login
  if (!token) {
    setMessage('Invalid or missing token');
    setTimeout(() => navigate('/login'), 2000);
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Please check your email for the reset link</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {message && (
            <div className={message.includes('successfully') ? 'auth-success' : 'auth-error'}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;