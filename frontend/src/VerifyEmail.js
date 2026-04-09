import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './VerifyEmail.css';

const API_URL = 'http://localhost:8000/api';

function VerifyEmail() {
  const { authenticatedFetch, logout } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, []);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_URL}/verify-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/resend-verification/`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification email sent!');
      } else {
        setMessage(data.error || 'Failed to resend email');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'loading' && (
          <>
            <div className="loading-icon">
              <span className="loading-spinner"></span>
            </div>
            <h2>Verifying your email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <button 
              className="verify-button primary"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="verify-actions">
              <button 
                className="verify-button secondary"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button 
                className="verify-button link"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
