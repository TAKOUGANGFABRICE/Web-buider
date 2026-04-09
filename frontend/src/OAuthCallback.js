import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './OAuthCallback.css';

const API_URL = 'http://localhost:8000/api';

function OAuthCallback() {
  const { login } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Processing your login...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      const errorDesc = params.get('error_description') || error;
      setMessage(errorDesc || 'Authentication failed');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    const provider = window.location.pathname.includes('google') ? 'google' : 'facebook';

    try {
      const response = await fetch(`${API_URL}/social-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          access_token: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        setStatus('success');
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred during login');
    }
  };

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-card">
        {status === 'loading' && (
          <>
            <div className="loading-icon">
              <span className="loading-spinner"></span>
            </div>
            <h2>Processing Login</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Welcome!</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✕</div>
            <h2>Login Failed</h2>
            <p>{message}</p>
            <button 
              className="oauth-button primary"
              onClick={() => window.location.href = '/login'}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
