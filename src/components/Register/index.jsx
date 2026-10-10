import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './index.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password, confirmPassword);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="cineverse-auth-backdrop">
      <div className="cineverse-glass-card animate-fade-in">
        <div className="auth-card-top-icon">
          <UserPlus size={24} />
        </div>

        <h2 className="auth-card-title">Create Account</h2>
        <p className="auth-card-subtitle">Join CineVerse to save movies & sync viewing history</p>

        {errorMessage && (
          <div className="auth-error-banner animate-fade-in">
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="auth-form-layout" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="auth-input-group">
            <label htmlFor="register-name" className="sr-only">Full Name</label>
            <input
              type="text"
              id="register-name"
              className="auth-underline-input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <User size={16} className="auth-input-icon" aria-hidden="true" />
          </div>

          {/* Email */}
          <div className="auth-input-group">
            <label htmlFor="register-email" className="sr-only">Email address</label>
            <input
              type="email"
              id="register-email"
              className="auth-underline-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail size={16} className="auth-input-icon" aria-hidden="true" />
          </div>

          {/* Create Password */}
          <div className="auth-input-group">
            <label htmlFor="register-password" className="sr-only">Create Password</label>
            <input
              type="password"
              id="register-password"
              className="auth-underline-input"
              placeholder="Create Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock size={16} className="auth-input-icon" aria-hidden="true" />
          </div>

          {/* Confirm Password */}
          <div className="auth-input-group">
            <label htmlFor="register-confirm-password" className="sr-only">Confirm Password</label>
            <input
              type="password"
              id="register-confirm-password"
              className="auth-underline-input"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Lock size={16} className="auth-input-icon" aria-hidden="true" />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
