import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';

const API_URL = 'http://localhost:8000/api';

function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const { login, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    setError('');

    try {
      if (provider === 'google') {
        const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
        const redirectUri = `${window.location.origin}/oauth/google/callback`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile&access_type=offline`;
        window.location.href = authUrl;
      } else if (provider === 'facebook') {
        const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || 'your-facebook-app-id';
        const redirectUri = `${window.location.origin}/oauth/facebook/callback`;
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email`;
        window.location.href = authUrl;
      }
    } catch (err) {
      setError(`${provider} login failed. Please try again.`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {(error || authError) && (
            <div className="error-message">
              {error || authError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="forgot-password-link">
            <a 
              href="#forgot" 
              onClick={(e) => {
                e.preventDefault();
                if (onSwitchToForgotPassword) onSwitchToForgotPassword();
              }}
            >
              Forgot password?
            </a>
          </div>
 
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="social-login-divider">
          <span>or continue with</span>
        </div>

        <div className="social-login-buttons">
          <button 
            type="button"
            className="social-button google"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading === 'google'}
          >
            {socialLoading === 'google' ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google
          </button>

          <button 
            type="button"
            className="social-button facebook"
            onClick={() => handleSocialLogin('facebook')}
            disabled={socialLoading === 'facebook'}
          >
            {socialLoading === 'facebook' ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            Facebook
          </button>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <a 
              href="#register" 
              onClick={(e) => {
                e.preventDefault();
                if (onSwitchToRegister) onSwitchToRegister();
              }}
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
