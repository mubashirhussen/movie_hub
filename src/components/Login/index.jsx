import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './index.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="cineverse-auth-backdrop">
      <div className="cineverse-glass-card animate-fade-in">
        <div className="auth-card-top-icon">
          <LogIn size={24} />
        </div>

        <h2 className="auth-card-title">Login to CineVerse</h2>
        <p className="auth-card-subtitle">Unlock your personalized watchlist, favorites & history</p>

        {errorMessage && (
          <div className="auth-error-banner animate-fade-in">
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="auth-form-layout" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="auth-input-group">
            <input
              type="email"
              id="login-email"
              className="auth-underline-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail size={16} className="auth-input-icon" />
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <input
              type="password"
              id="login-password"
              className="auth-underline-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock size={16} className="auth-input-icon" />
          </div>

          {/* Options Row */}
          <div className="auth-options-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <Link to="/register" className="auth-forgot-link">
              Need an account? Register
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-switch-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
