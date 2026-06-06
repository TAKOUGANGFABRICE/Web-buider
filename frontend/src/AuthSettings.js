import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './AuthSettings.css';

const API_URL = 'http://localhost:8000/api';

function AuthSettings() {
  const { user, authenticatedFetch, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrUrl, setTwoFactorQrUrl] = useState('');
  const [showSetup2fa, setShowSetup2fa] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  const [showDisable2fa, setShowDisable2fa] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  
  const [magicEmail, setMagicEmail] = useState('');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  useEffect(() => {
    fetchLoginHistory();
    fetchSessions();
    check2faStatus();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/login-history/`);
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data);
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/sessions/`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const check2faStatus = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/user-profile/`);
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.profile?.two_factor_enabled || false);
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
    }
  };

  const handleSetup2fa = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/2fa/setup/`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setTwoFactorSecret(data.secret);
        setTwoFactorQrUrl(data.qr_url);
        setShowSetup2fa(true);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setLoading(false);
  };

  const handleVerify2fa = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/2fa/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setTwoFactorEnabled(true);
        setBackupCodes(data.backup_codes || []);
        setShowBackupCodes(true);
        setShowSetup2fa(false);
        setMessage('2FA enabled successfully! Save your backup codes.');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setLoading(false);
  };

  const handleDisable2fa = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/2fa/disable/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setTwoFactorEnabled(false);
        setShowDisable2fa(false);
        setDisablePassword('');
        setMessage('2FA disabled successfully');
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setLoading(false);
  };

  const handleRevokeSession = async (sessionId) => {
    setShowConfirmDialog({
      show: true,
      title: 'Revoke Session',
      message: 'Are you sure you want to revoke this session?',
      onConfirm: async () => {
        try {
          const response = await authenticatedFetch(`${API_URL}/sessions/${sessionId}/revoke/`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setSessions(sessions.filter(s => s.id !== sessionId));
            setMessage('Session revoked successfully');
          }
        } catch (err) {
          setError('Failed to revoke session');
        }
        setShowConfirmDialog(null);
      }
    });
  };

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/magic-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('If an account exists, a magic link has been sent to your email');
        setMagicEmail('');
      } else {
        setError(data.error || 'Failed to send magic link');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setLoading(false);
  };

  const copyBackupCode = (code) => {
    navigator.clipboard.writeText(code);
    setMessage('Code copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className='auth-settings-container'>
      <div className='auth-settings-header'>
        <h2>Security Settings</h2>
        <p>Manage your account security and login options</p>
      </div>

      {message && (
        <div className='auth-settings-message success'>
          {message}
        </div>
      )}
      {error && (
        <div className='auth-settings-message error'>
          {error}
        </div>
      )}

      <div className='auth-settings-tabs'>
        <button 
          className={`auth-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔐 Security
        </button>
        <button 
          className={`auth-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          💻 Sessions
        </button>
        <button 
          className={`auth-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Login History
        </button>
        <button 
          className={`auth-tab ${activeTab === 'magic' ? 'active' : ''}`}
          onClick={() => setActiveTab('magic')}
        >
          ✨ Magic Link
        </button>
      </div>

      <div className='auth-settings-content'>
        {activeTab === 'security' && (
          <div className='security-section'>
            <div className='security-card'>
              <h3>Two-Factor Authentication</h3>
              <p>Add an extra layer of security to your account using an authenticator app.</p>
              
              {twoFactorEnabled ? (
                <div className='two-factor-enabled'>
                  <div className='status-badge enabled'>✓ 2FA Enabled</div>
                  <button 
                    className='btn-secondary'
                    onClick={() => setShowDisable2fa(true)}
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button 
                  className='btn-primary'
                  onClick={handleSetup2fa}
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              )}

              {showSetup2fa && (
                <div className='setup-2fa-modal'>
                  <h4>Setup Two-Factor Authentication</h4>
                  <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  
                  <div className='qr-code'>
                    {twoFactorQrUrl && (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorQrUrl)}`} 
                        alt='2FA QR Code'
                      />
                    )}
                  </div>
                  
                  <p className='secret-text'>
                    Or enter this code manually: <strong>{twoFactorSecret}</strong>
                  </p>
                  
                  <div className='verify-input'>
                    <input
                      type='text'
                      placeholder='Enter 6-digit code'
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      maxLength={6}
                    />
                    <button 
                      className='btn-primary'
                      onClick={handleVerify2fa}
                      disabled={loading || verifyCode.length !== 6}
                    >
                      Verify & Enable
                    </button>
                  </div>
                  
                  <button 
                    className='btn-link'
                    onClick={() => {
                      setShowSetup2fa(false);
                      setTwoFactorSecret('');
                      setVerifyCode('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {showBackupCodes && (
                <div className='backup-codes-modal'>
                  <h4>Backup Codes</h4>
                  <p>Save these codes in a safe place. You can use them to access your account if you lose your authenticator.</p>
                  <div className='backup-codes-grid'>
                    {backupCodes.map((code, index) => (
                      <div 
                        key={index} 
                        className='backup-code'
                        onClick={() => copyBackupCode(code)}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <button 
                    className='btn-primary'
                    onClick={() => setShowBackupCodes(false)}
                  >
                    I've Saved My Codes
                  </button>
                </div>
              )}

              {showDisable2fa && (
                <div className='disable-2fa-modal'>
                  <h4>Disable 2FA</h4>
                  <p>Enter your password to confirm disabling two-factor authentication.</p>
                  <input
                    type='password'
                    placeholder='Enter your password'
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                  <div className='modal-actions'>
                    <button 
                      className='btn-secondary'
                      onClick={() => {
                        setShowDisable2fa(false);
                        setDisablePassword('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className='btn-danger'
                      onClick={handleDisable2fa}
                      disabled={loading || !disablePassword}
                    >
                      Disable 2FA
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className='sessions-section'>
            <div className='sessions-card'>
              <h3>Active Sessions</h3>
              <p>Manage your active login sessions. Revoke sessions you no longer need.</p>
              
              {sessions.length === 0 ? (
                <div className='no-sessions'>
                  <p>No active sessions found</p>
                </div>
              ) : (
                <div className='sessions-list'>
                  {sessions.map((session) => (
                    <div key={session.id} className='session-item'>
                      <div className='session-info'>
                        <span className='session-device'>{session.device_info || 'Unknown Device'}</span>
                        <span className='session-ip'>{session.ip_address || 'Unknown IP'}</span>
                        <span className='session-time'>
                          Last active: {new Date(session.last_activity).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        className='btn-danger-small'
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button className='btn-secondary' onClick={fetchSessions}>
                Refresh Sessions
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className='history-section'>
            <div className='history-card'>
              <h3>Login History</h3>
              <p>View your recent login activity</p>
              
              {loginHistory.length === 0 ? (
                <div className='no-history'>
                  <p>No login history available</p>
                </div>
              ) : (
                <div className='history-list'>
                  {loginHistory.map((login) => (
                    <div key={login.id} className={`history-item ${login.login_successful ? 'success' : 'failed'}`}>
                      <div className='history-info'>
                        <span className='history-status'>
                          {login.login_successful ? '✓ Successful' : '✕ Failed'}
                        </span>
                        <span className='history-ip'>{login.ip_address || 'Unknown IP'}</span>
                        <span className='history-time'>
                          {new Date(login.login_time).toLocaleString()}
                        </span>
                        {login.location && (
                          <span className='history-location'>{login.location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button className='btn-secondary' onClick={fetchLoginHistory}>
                Refresh History
              </button>
            </div>
          </div>
        )}

        {activeTab === 'magic' && (
          <div className='magic-section'>
            <div className='magic-card'>
              <h3>Magic Link Login</h3>
              <p>Receive a secure login link via email. No password needed!</p>
              
              <form onSubmit={handleSendMagicLink} className='magic-form'>
                <div className='form-group'>
                  <label>Email Address</label>
                  <input
                    type='email'
                    placeholder='you@example.com'
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type='submit' 
                  className='btn-primary'
                  disabled={loading || !magicEmail}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
              
              <div className='magic-info'>
                <h4>How it works:</h4>
                <ol>
                  <li>Enter your email address</li>
                  <li>Check your email for the login link</li>
                  <li>Click the link to log in instantly</li>
                  <li>Link expires in 15 minutes for security</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthSettings;