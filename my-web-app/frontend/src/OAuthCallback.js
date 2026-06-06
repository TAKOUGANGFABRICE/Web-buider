import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OAuthCallback.css';

function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Backend handles the OAuth callback and sets tokens in cookies
    // This component just waits for auth context to update
    const params = new URLSearchParams(window.location.search);
    
    // Check if we have access token in URL (for providers that return it directly)
    const token = params.get('access');
    const refresh = params.get('refresh');
    
    if (token && refresh) {
      localStorage.setItem('access', token);
      localStorage.setItem('refresh', refresh);
      navigate('/dashboard');
    } else {
      // Poll for auth state or redirect to login on failure
      const checkAuth = async () => {
        const response = await fetch('/api/users/me/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
        });
        
        if (response.ok) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      };
      checkAuth();
    }
  }, [navigate]);

  return (
    <div className="oauth-callback">
      <div className="spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
}

export default OAuthCallback;