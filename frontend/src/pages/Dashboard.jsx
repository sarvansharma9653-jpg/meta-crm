import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Users, 
  TrendingUp, 
  PhoneCall, 
  Calendar, 
  IndianRupee, 
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function Dashboard({ onSelectLead, setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError('');
    try {
      const response = await apiFetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error loading dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div className="shimmer" style={{ width: '100%', height: '100px', borderRadius: '12px', marginBottom: '1.5rem' }}></div>
        <div style={styles.grid3}>
          <div className="shimmer" style={{ height: '120px', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ height: '120px', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ height: '120px', borderRadius: '12px' }}></div>
        </div>
        <div style={{ ...styles.grid2, marginTop: '2rem' }}>
          <div className="shimmer" style={{ height: '300px', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ height: '300px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <AlertCircle size={40} color="#ef4444" />
          <h3>Failed to load Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => fetchStats()} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, recentLeads, upcomingFollowups } = stats;
  const statusCounts = summary.statusCounts || {};
  
  // Calculate pipeline and conversions
  const conversionRate = summary.totalLeads > 0 
    ? ((statusCounts.CONVERTED / summary.totalLeads) * 100).toFixed(1) 
    : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Balaji Realities</h1>
          <p style={styles.subtitle}>Jabalpur Plot Developments &bull; Real Estate Sales Dashboard</p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => fetchStats(true)} 
            className="btn btn-secondary" 
            style={{ padding: '0.6rem' }}
            disabled={refreshing}
            title="Refresh statistics"
          >
            <RefreshCw size={18} className={refreshing ? 'spin-animation' : ''} />
          </button>
          <button onClick={() => setCurrentPage('leads')} className="btn btn-primary">
            <Plus size={16} />
            <span>Manage Leads</span>
          </button>
        </div>
      </div>

      {/* 1. Today's & Overdue Follow-ups (At the very top of dashboard, below header) */}
      {upcomingFollowups && upcomingFollowups.length > 0 && (
        <div className="glass-card" style={styles.remindersCard}>
          <div style={styles.remindersHeader}>
            <span style={styles.remindersTitle}>⚠️ Action Needed: Follow-up Reminders (Today & Overdue)</span>
            <span style={styles.remindersBadge}>{upcomingFollowups.length} Leads</span>
          </div>
          <div style={styles.remindersList}>
            {upcomingFollowups.map(item => {
              const todayIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
              const todayStr = todayIST.toISOString().split('T')[0];
              const isOverdue = item.followup_date < todayStr;
              
              const fupDateStr = new Date(item.followup_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              });

              return (
                <div 
                  key={item.id} 
                  style={{
                    ...styles.reminderItem,
                    borderLeftColor: isOverdue ? '#ef4444' : '#fbbf24'
                  }}
                  onClick={() => onSelectLead(item.id)}
                >
                  <div style={styles.reminderInfo}>
                    <div style={styles.reminderNameRow}>
                      <span style={styles.reminderName}>{item.name}</span>
                      <span style={{ 
                        ...styles.reminderIndicator, 
                        color: isOverdue ? '#ef4444' : '#fbbf24',
                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)'
                      }}>
                        {isOverdue ? 'Overdue' : 'Today'}
                      </span>
                    </div>
                    <div style={styles.reminderSubText}>
                      📞 {item.phone} &bull; 📍 {item.site_project || 'No Project'} &bull; {item.purpose || 'Investment'}
                    </div>
                  </div>
                  <div style={styles.reminderDate}>
                    <span style={{ color: isOverdue ? '#ef4444' : '#fbbf24', fontWeight: 600 }}>
                      {fupDateStr}
                    </span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={styles.metricsGrid}>
        {/* Total Leads -> Lead List */}
        <div 
          className="glass-card metric-card-interactive" 
          style={{ ...styles.metricCard, cursor: 'pointer' }}
          onClick={() => setCurrentPage && setCurrentPage('leads')}
        >
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Lead List</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>
              <Users size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={styles.cardValue}>{summary.totalLeads}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{statusCounts.NEW || 0} New</span>
            <span style={styles.footerText}> leads to be contacted</span>
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Qualified Leads</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>
          <div style={styles.cardValue}>{summary.qualifiedLeads}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{statusCounts.QUALIFIED || 0} Qualified</span>
            <span style={styles.footerText}> verified hot prospects</span>
          </div>
        </div>

        {/* Weekly Visits */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Visits Scheduled (Wk)</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
              <Calendar size={20} color="#a855f7" />
            </div>
          </div>
          <div style={styles.cardValue}>{summary.visitsThisWeek}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#a855f7', fontWeight: 600 }}>{statusCounts.VISIT_SCHEDULED || 0} Scheduled</span>
            <span style={styles.footerText}> site visits this week</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Conversion Rate</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
              <TrendingUp size={20} color="#ec4899" />
            </div>
          </div>
          <div style={styles.cardValue}>{conversionRate}%</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#ec4899', fontWeight: 600 }}>{statusCounts.CONVERTED || 0} Converted</span>
            <span style={styles.footerText}> booked plots/sales done</span>
          </div>
        </div>
      </div>

      {/* Secondary Status Counts Grid */}
      <div style={styles.secondaryGrid}>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-new)' }}></div>
          <span style={styles.smallStatLabel}>New Leads</span>
          <span style={styles.smallStatValue}>{statusCounts.NEW || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-contacted)' }}></div>
          <span style={styles.smallStatLabel}>Contacted</span>
          <span style={styles.smallStatValue}>{statusCounts.CONTACTED || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-followup)' }}></div>
          <span style={styles.smallStatLabel}>Follow-up</span>
          <span style={styles.smallStatValue}>{statusCounts.FOLLOWUP || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-qualified)' }}></div>
          <span style={styles.smallStatLabel}>Qualified</span>
          <span style={styles.smallStatValue}>{statusCounts.QUALIFIED || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-visit_scheduled)' }}></div>
          <span style={styles.smallStatLabel}>Visit Scheduled</span>
          <span style={styles.smallStatValue}>{statusCounts.VISIT_SCHEDULED || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-visited)' }}></div>
          <span style={styles.smallStatLabel}>Visited</span>
          <span style={styles.smallStatValue}>{statusCounts.VISITED || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-converted)' }}></div>
          <span style={styles.smallStatLabel}>Converted</span>
          <span style={styles.smallStatValue}>{statusCounts.CONVERTED || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-not_interested)' }}></div>
          <span style={styles.smallStatLabel}>Not Interested</span>
          <span style={styles.smallStatValue}>{statusCounts.NOT_INTERESTED || 0}</span>
        </div>
      </div>

      {/* Main Analytics Content Section */}
      <div style={styles.dashboardGrid}>
        
        {/* Left Side: Recent Leads */}
        <div style={styles.leftCol}>
          <div className="glass-card" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleGroup}>
                <Users size={18} color="#38bdf8" />
                <h3 style={styles.sectionTitle}>Recent Inbound Leads</h3>
              </div>
            </div>
            
            <div style={styles.listContainer}>
              {recentLeads.length === 0 ? (
                <div style={styles.emptyState}>
                  <Users size={32} color="var(--text-muted)" />
                  <p>No leads received yet.</p>
                </div>
              ) : (
                recentLeads.map(lead => {
                  let badgeClass = 'badge-new';
                  if (lead.status === 'CONTACTED') badgeClass = 'badge-contacted';
                  if (lead.status === 'FOLLOWUP') badgeClass = 'badge-followup';
                  if (lead.status === 'QUALIFIED') badgeClass = 'badge-qualified';
                  if (lead.status === 'VISIT_SCHEDULED') badgeClass = 'badge-visit_scheduled';
                  if (lead.status === 'VISITED') badgeClass = 'badge-visited';
                  if (lead.status === 'CONVERTED') badgeClass = 'badge-converted';
                  if (lead.status === 'NOT_INTERESTED') badgeClass = 'badge-not_interested';

                  return (
                    <div key={lead.id} style={styles.listItem} onClick={() => onSelectLead(lead.id)}>
                      <div style={styles.listItemMain}>
                        <div style={styles.followupName}>{lead.name}</div>
                        <div style={styles.leadSource}>
                          📍 {lead.site_project || 'No Site'} &bull; Purpose: {lead.purpose || 'Investment'} &bull; Budget: {lead.budget || 'N/A'}
                        </div>
                      </div>
                      <div style={styles.listItemSide}>
                        <span className={`badge ${badgeClass}`}>{lead.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Lead Status SVG Chart */}
        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={{ ...styles.sectionTitle, marginBottom: '1.5rem' }}>Lead Status Distribution</h3>
            
            <div style={styles.chartWrapper}>
              {summary.totalLeads === 0 ? (
                <div style={styles.emptyState}>
                  <TrendingUp size={32} color="var(--text-muted)" />
                  <p>No lead data to display chart.</p>
                </div>
              ) : (
                <div style={styles.barChartContainer}>
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const percentage = summary.totalLeads > 0 ? (count / summary.totalLeads) * 100 : 0;
                    let color = 'var(--text-muted)';
                    let label = status;
                    
                    if (status === 'NEW') { color = 'var(--color-new)'; label = 'New Lead'; }
                    if (status === 'CONTACTED') { color = 'var(--color-contacted)'; label = 'Contacted'; }
                    if (status === 'FOLLOWUP') { color = 'var(--color-followup)'; label = 'Follow-up'; }
                    if (status === 'QUALIFIED') { color = 'var(--color-qualified)'; label = 'Qualified'; }
                    if (status === 'VISIT_SCHEDULED') { color = 'var(--color-visit_scheduled)'; label = 'Visit Scheduled'; }
                    if (status === 'VISITED') { color = 'var(--color-visited)'; label = 'Visited'; }
                    if (status === 'CONVERTED') { color = 'var(--color-converted)'; label = 'Converted'; }
                    if (status === 'NOT_INTERESTED') { color = 'var(--color-not_interested)'; label = 'Not Interested'; }

                    return (
                      <div key={status} style={styles.chartRow}>
                        <div style={styles.chartRowLabel}>
                          <span>{label}</span>
                          <span style={{ fontWeight: 600, color }}>{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div style={styles.chartRowBarTrack}>
                          <div style={{ 
                            ...styles.chartRowBarFill, 
                            width: `${percentage}%`, 
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}80`
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    flexGrow: 1,
    overflowY: 'auto',
  },
  centerContainer: {
    padding: '2rem',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '80vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.25rem',
  },
  metricCard: {
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  iconBg: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: '0.5rem',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  smallStatCard: {
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  smallStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    flexGrow: 1,
  },
  smallStatValue: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionCard: {
    padding: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  sectionTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '350px',
    overflowY: 'auto',
  },
  listItem: {
    padding: '0.85rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  listItemMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflow: 'hidden',
  },
  listItemSide: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  followupName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#f8fafc',
  },
  leadSource: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  remindersCard: {
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid rgba(251, 191, 36, 0.15)',
    backgroundColor: 'rgba(251, 191, 36, 0.02)',
  },
  remindersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  remindersTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fbbf24',
  },
  remindersBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontWeight: 600,
  },
  remindersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  reminderItem: {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderLeft: '4px solid #fbbf24',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  reminderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  reminderNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  reminderName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#ffffff',
  },
  reminderIndicator: {
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  reminderSubText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  reminderDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
  },
  chartWrapper: {
    minHeight: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barChartContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  chartRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  chartRowLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  chartRowBarTrack: {
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
  },
  chartRowBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  errorCard: {
    maxWidth: '400px',
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
    padding: '2.5rem 2rem',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1.5rem',
  },
};
