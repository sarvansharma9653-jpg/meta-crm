import React, { useState, useEffect } from 'react';
import { apiFetch } from './utils/api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Board from './pages/Board';
import MetaSettings from './pages/MetaSettings';
import SheetsSettings from './pages/SheetsSettings';
import LeadModal from './components/LeadModal';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('crm_token') || null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };
  
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

  // Dynamic layout styling
  const appContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100vh',
    position: 'relative'
  };

  const mainContentStyle = {
    ...styles.mainContent,
    height: isMobile ? 'calc(100vh - 56px)' : '100vh',
  };

  return (
    <div className="app-container" style={appContainerStyle}>
      {/* Background neon glows */}
      <div className="bg-glow-purple"></div>
      <div className="bg-glow-indigo"></div>

      {/* Mobile Top Header */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 style={styles.mobileTitle}>MetaCRM</h1>
          <div style={{ width: '22px' }}></div> {/* spacer to center title */}
        </div>
      )}

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handlePageChange} 
        user={user} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Console Content View */}
      <main style={mainContentStyle}>
        {currentPage === 'dashboard' && (
          <Dashboard onSelectLead={handleSelectLead} setCurrentPage={handlePageChange} />
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

        {currentPage === 'sheets-settings' && (
          <SheetsSettings />
        )}
      </main>

      {/* Global Lead Details Modal Overlay */}
      {selectedLeadId && (
        <LeadModal 
          leadId={selectedLeadId} 
          onClose={handleCloseLeadModal} 
          onLeadUpdated={() => {
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
  mobileHeader: {
    height: '56px',
    backgroundColor: 'rgba(18, 22, 32, 0.9)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    position: 'sticky',
    top: 0,
    zIndex: 99,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
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
