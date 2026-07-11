import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Settings, 
  LogOut, 
  Database
} from 'lucide-react';

// Custom Facebook SVG Icon since brand icons are removed in newer Lucide versions
const Facebook = ({ size = 18, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', name: 'Leads List', icon: Users },
    { id: 'board', name: 'Pipeline Board', icon: Kanban },
    { id: 'meta-settings', name: 'Meta Settings', icon: Facebook },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>
          <Database size={24} color="#6366f1" />
        </div>
        <div style={styles.brandName}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MetaCRM
          </h2>
          <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Console
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    ...styles.navLink,
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    borderColor: isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                    color: isActive ? '#f8fafc' : '#94a3b8',
                  }}
                >
                  <Icon size={18} color={isActive ? '#6366f1' : '#94a3b8'} style={{ transition: 'color var(--transition-fast)' }} />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer Profile */}
      <div style={styles.footer}>
        <div style={styles.userProfile}>
          <div style={styles.avatar}>
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user?.username || 'Admin User'}</span>
            <span style={styles.role}>Administrator</span>
          </div>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn} title="Log Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'rgba(18, 22, 32, 0.9)',
    backdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 100,
  },
  brand: {
    padding: '1.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  brandLogo: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '10px',
    padding: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  brandName: {
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    flexGrow: 1,
    padding: '1.5rem 1rem',
  },
  navLink: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "var(--font-body)",
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  footer: {
    padding: '1.25rem 1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    overflow: 'hidden',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  username: {
    color: '#f8fafc',
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  role: {
    color: '#64748b',
    fontSize: '0.7rem',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};
// Add hover styles in JS
styles.logoutBtn[':hover'] = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
};
