import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

function VerifyEmail() {
  const navigate = useNavigate();

  useEffect(() => {
    // Email verification was deprecated - redirect to login
    const timer = setTimeout(() => navigate('/login'), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="status-icon">ℹ</div>
        <h2>Email Verification Removed</h2>
        <p>Email verification is no longer required. You can now log in directly.</p>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}

export default VerifyEmail;