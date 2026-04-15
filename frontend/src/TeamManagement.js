import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Settings.css';

const API_URL = 'http://localhost:8000/api';

const TeamManagement = ({ websiteId }) => {
  const { authenticatedFetch } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  React.useEffect(() => {
    if (websiteId) {
      fetchTeamMembers();
    }
  }, [websiteId]);

  const fetchTeamMembers = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setMessage('');

    try {
      const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/invite/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      if (response.ok) {
        setMessage('Invitation sent successfully!');
        setInviteEmail('');
        fetchTeamMembers();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setMessage('Error sending invitation');
    }
    setInviting(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemoveMember = async (memberId) => {
    setShowConfirmDialog({
      show: true,
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this team member?',
      onConfirm: async () => {
        try {
          const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/${memberId}/`, {
            method: 'DELETE'
          });

          if (response.ok) {
            fetchTeamMembers();
            setMessage('Team member removed successfully');
          }
        } catch (err) {
          console.error('Error removing member:', err);
          setMessage('Error removing team member');
        }
        setShowConfirmDialog(null);
        setTimeout(() => setMessage(''), 3000);
      }
    });
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/websites/${websiteId}/team/${memberId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchTeamMembers();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  if (!websiteId) {
    return (
      <div className="team-empty">
        <p>Select a website to manage team members</p>
      </div>
    );
  }

  if (loading) {
    return <div className="team-loading">Loading team members...</div>;
  }

  return (
    <div className="team-management">
      <div className="team-section">
        <h4>Invite Team Member</h4>
        <form onSubmit={handleInvite} className="invite-form">
          <input
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn-primary" disabled={inviting}>
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
        {message && (
          <div className={`team-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="team-section">
        <h4>Team Members</h4>
        {teamMembers.length === 0 ? (
          <p className="no-members">No team members yet. Invite someone to collaborate!</p>
        ) : (
          <div className="team-list">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-member">
                <div className="member-avatar">
                  {member.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="member-info">
                  <p className="member-name">{member.username}</p>
                  <p className="member-email">{member.email}</p>
                </div>
                <div className="member-role">
                  {member.role === 'owner' ? (
                    <span className="role-badge owner">Owner</span>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}
                </div>
                {member.role !== 'owner' && (
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveMember(member.id)}
                    title="Remove member"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="team-section">
        <h4>Role Permissions</h4>
        <div className="role-info">
          <div className="role-item">
            <strong>Owner</strong> - Full control, can delete website
          </div>
          <div className="role-item">
            <strong>Admin</strong> - Can manage team and settings
          </div>
          <div className="role-item">
            <strong>Editor</strong> - Can edit website content
          </div>
          <div className="role-item">
            <strong>Viewer</strong> - Read-only access
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;