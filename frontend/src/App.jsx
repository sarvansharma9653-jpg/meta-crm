import React, { useState, useEffect } from 'react';
import { apiFetch } from './utils/api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Board from './pages/Board';
import MetaSettings from './pages/MetaSettings';
import LeadModal from './components/LeadModal';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('crm_token') || null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Selected Lead Modal State
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Verify token on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('crm_token');
      if (!storedToken) {
        setAuthChecked(true);
        return;
      }

      try {
        const response = await apiFetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
      } finally {
        setAuthChecked(true);
      }
    };

    verifySession();

    // Listen for global auth expired events
    const handleAuthExpired = () => {
      handleLogout();
    };

    window.addEventListener('crm_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('crm_auth_expired', handleAuthExpired);
  }, []);

  const handleLoginSuccess = (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
    setCurrentPage('dashboard');
    setSelectedLeadId(null);
  };

  const handleSelectLead = (id) => {
    setSelectedLeadId(id);
  };

  const handleCloseLeadModal = () => {
    setSelectedLeadId(null);
  };

  if (!authChecked) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Loading MetaCRM Console...
        </span>
      </div>
    );
  }

  // Not logged in -> Show login card page
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in -> Show dashboard console shell
  return (
    <div className="app-container">
      {/* Background neon glows */}
      <div className="bg-glow-purple"></div>
      <div className="bg-glow-indigo"></div>

      {/* Sidebar Navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Console Content View */}
      <main style={styles.mainContent}>
        {currentPage === 'dashboard' && (
          <Dashboard onSelectLead={handleSelectLead} setCurrentPage={setCurrentPage} />
        )}
        
        {currentPage === 'leads' && (
          <Leads onSelectLead={handleSelectLead} />
        )}

        {currentPage === 'board' && (
          <Board onSelectLead={handleSelectLead} />
        )}

        {currentPage === 'meta-settings' && (
          <MetaSettings />
        )}
      </main>

      {/* Global Lead Details Modal Overlay */}
      {selectedLeadId && (
        <LeadModal 
          leadId={selectedLeadId} 
          onClose={handleCloseLeadModal} 
          onLeadUpdated={() => {
            // Trigger refresh on window context if needed, or page state changes
            window.dispatchEvent(new Event('crm_lead_modified'));
          }}
        />
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a0c10',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(99, 102, 241, 0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  mainContent: {
    flexGrow: 1,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
};

// Global spin keyframe rule injected dynamically if not already in CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spin-animation {
      animation: spin 1.2s linear infinite;
    }
  `;
  document.head.appendChild(style);
}
