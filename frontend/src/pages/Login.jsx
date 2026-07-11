import React, { useState } from 'react';
import { API_HOST } from '../utils/api';
import { Database, Lock, User, LogIn, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`${API_HOST}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isRegistering) {
        setMessage('Registration successful! Please login.');
        setIsRegistering(false);
        setPassword('');
      } else {
        localStorage.setItem('crm_token', data.token);
        localStorage.setItem('crm_user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Background Glows */}
      <div className="bg-glow-purple"></div>
      <div className="bg-glow-indigo"></div>

      <div style={styles.cardWrapper}>
        <div style={styles.logoArea}>
          <div style={styles.logoBg}>
            <Database size={36} color="#6366f1" />
          </div>
          <h1 style={styles.brandTitle}>MetaCRM</h1>
          <p style={styles.brandSub}>Meta Ads Lead Management Console</p>
        </div>

        <div className="glass-card" style={styles.glassCardOver}>
          <h2 style={styles.formTitle}>
            {isRegistering ? 'Create Console Account' : 'Console Login'}
          </h2>
          <p style={styles.formSubtitle}>
            {isRegistering ? 'Register credentials to access lead system' : 'Sign in to access your dashboard'}
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}
          {message && <div style={styles.successBox}>{message}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Username</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter console ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isRegistering ? 'Register Console' : 'Access Console'}</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          {/* Seed info help box */}
          {!isRegistering && (
            <div style={styles.helpBox}>
              <Sparkles size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontWeight: 600 }}>Default Login:</span>
                <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>admin / admin123</span>
              </div>
            </div>
          )}

          <div style={styles.toggleFooter}>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setMessage('');
              }}
              style={styles.toggleBtn}
              disabled={loading}
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need another account? Register here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07090e',
    position: 'relative',
    overflow: 'hidden',
  },
  cardWrapper: {
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1rem',
    zIndex: 10,
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoBg: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '16px',
    padding: '0.75rem',
    marginBottom: '0.75rem',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    display: 'inline-flex',
    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #f8fafc 30%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.03em',
  },
  brandSub: {
    color: '#64748b',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
    fontWeight: 500,
  },
  glassCardOver: {
    padding: '2.25rem 2rem',
    backgroundColor: 'rgba(18, 22, 32, 0.75)',
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '0.35rem',
    marginBottom: '1.75rem',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none',
  },
  submitBtn: {
    width: '100%',
    marginTop: '0.5rem',
    padding: '0.8rem',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  helpBox: {
    marginTop: '1.25rem',
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    color: '#94a3b8',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    lineHeight: '1.4',
  },
  toggleFooter: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.2s',
  },
};
