import React, { useState, useEffect } from 'react';
import { User, Bookmark, Heart, History, LogOut, Calendar, Shield, Edit3, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import { formatDate } from '../../utils/formatDate';
import './index.css';

const Profile = () => {
  const { currentUser, logout, setCurrentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ watchlistCount: 0, favoriteCount: 0, historyCount: 0 });
  const [loading, setLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res?.data) {
          setProfileData(res.data.user || currentUser);
          setStats(res.data.stats || { watchlistCount: 0, favoriteCount: 0, historyCount: 0 });
          setName(res.data.user?.name || currentUser?.name || '');
          setAvatar(res.data.user?.avatar || currentUser?.avatar || '');
        }
      } catch (err) {
        console.warn('Error fetching profile stats:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');

    try {
      const res = await authService.updateProfile({ name, avatar });
      if (res?.success) {
        setStatusMsg('Profile updated successfully!');
        setIsEditing(false);
        if (setCurrentUser) {
          setCurrentUser((prev) => ({ ...prev, name, avatar }));
        }
      }
    } catch (err) {
      setStatusMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const user = profileData || currentUser;

  return (
    <div className="cineverse-profile-card animate-fade-in">
      {/* Header Banner */}
      <div className="profile-banner-glow" />

      <div className="profile-card-content">
        <div className="profile-header-layout">
          {/* Avatar */}
          <div className="profile-avatar-frame">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User Profile'}
              className="profile-avatar-img"
            />
          </div>

          {/* User Details */}
          <div className="profile-info-column">
            <div className="profile-name-row">
              <h1 className="profile-display-name">{user?.name || 'CineVerse User'}</h1>
              <span className="profile-role-badge">
                <Shield size={12} />
                <span>{user?.role === 'admin' ? 'Administrator' : 'Verified Member'}</span>
              </span>
            </div>

            <p className="profile-email-text">{user?.email}</p>

            <div className="profile-join-date">
              <Calendar size={14} />
              <span>Joined {formatDate(user?.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-top-actions">
            <button
              type="button"
              className="btn-edit-profile"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={15} />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              type="button"
              className="btn-profile-logout"
              onClick={logout}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Edit Form Dropdown */}
        {isEditing && (
          <form className="profile-edit-form animate-fade-in" onSubmit={handleSaveProfile}>
            <h3 className="edit-form-title">Update Your Details</h3>

            {statusMsg && <div className="profile-status-alert">{statusMsg}</div>}

            <div className="edit-form-grid">
              <div className="edit-input-wrap">
                <label>Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="edit-input-wrap">
                <label>Avatar Image URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <button type="submit" className="btn-save-profile" disabled={saving}>
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        )}

        {/* Statistics Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap purple">
              <Bookmark size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-number">{stats.watchlistCount}</span>
              <span className="stat-title">In Watchlist</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap pink">
              <Heart size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-number">{stats.favoriteCount}</span>
              <span className="stat-title">Favorites</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap blue">
              <History size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-number">{stats.historyCount}</span>
              <span className="stat-title">Movies Watched</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
