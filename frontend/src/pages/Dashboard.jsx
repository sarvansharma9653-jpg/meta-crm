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

  const { summary, recentLeads, upcomingFollowups, recentPayments } = stats;
  const statusCounts = summary.statusCounts || {};
  
  // Calculate pipeline and conversions
  const conversionRate = summary.totalLeads > 0 
    ? ((statusCounts.PAID / summary.totalLeads) * 100).toFixed(1) 
    : 0;

  // Formatting Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>CRM Overview</h1>
          <p style={styles.subtitle}>Welcome back! Here is a summary of your Meta Ads campaigns and sales activity.</p>
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

      {/* Metric Cards Grid */}
      <div style={styles.metricsGrid}>
        {/* Total Leads */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Leads</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>
              <Users size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={styles.cardValue}>{summary.totalLeads}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{statusCounts.NEW} New</span>
            <span style={styles.footerText}> received recently</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Payments</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <IndianRupee size={20} color="#10b981" />
            </div>
          </div>
          <div style={styles.cardValue}>{formatCurrency(summary.totalRevenue)}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{statusCounts.PAID} deals</span>
            <span style={styles.footerText}> paid successfully</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Conversion Rate</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <TrendingUp size={20} color="#8b5cf6" />
            </div>
          </div>
          <div style={styles.cardValue}>{conversionRate}%</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{statusCounts.PAID} / {summary.totalLeads}</span>
            <span style={styles.footerText}> closed paid customers</span>
          </div>
        </div>

        {/* Calls Logged */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Calls Logged</span>
            <div style={{ ...styles.iconBg, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <PhoneCall size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={styles.cardValue}>{summary.totalCalls}</div>
          <div style={styles.cardFooter}>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{statusCounts.CALLED} Called</span>
            <span style={styles.footerText}> leads in discussion</span>
          </div>
        </div>
      </div>

      {/* Secondary Status Counts Grid */}
      <div style={styles.secondaryGrid}>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-callback)' }}></div>
          <span style={styles.smallStatLabel}>Call Back Later</span>
          <span style={styles.smallStatValue}>{statusCounts.CALLBACK || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-followup)' }}></div>
          <span style={styles.smallStatLabel}>Under Follow-up</span>
          <span style={styles.smallStatValue}>{statusCounts.FOLLOWUP || 0}</span>
        </div>
        <div className="glass-card" style={styles.smallStatCard}>
          <div style={{ ...styles.statusIndicator, backgroundColor: 'var(--color-lost)' }}></div>
          <span style={styles.smallStatLabel}>Lost Leads</span>
          <span style={styles.smallStatValue}>{statusCounts.LOST || 0}</span>
        </div>
      </div>

      {/* Main Analytics Content Section */}
      <div style={styles.dashboardGrid}>
        
        {/* Left Side: Upcoming Followups & Recent Actions */}
        <div style={styles.leftCol}>
          
          {/* Upcoming Followups */}
          <div className="glass-card" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleGroup}>
                <Calendar size={18} color="#8b5cf6" />
                <h3 style={styles.sectionTitle}>Follow-ups List</h3>
              </div>
              <span style={styles.sectionBadge}>{upcomingFollowups.length} Pending</span>
            </div>
            
            <div style={styles.listContainer}>
              {upcomingFollowups.length === 0 ? (
                <div style={styles.emptyState}>
                  <Clock size={32} color="var(--text-muted)" />
                  <p>No pending follow-ups scheduled today.</p>
                </div>
              ) : (
                upcomingFollowups.map(item => (
                  <div key={item.id} style={styles.listItem} onClick={() => onSelectLead(item.lead_id)}>
                    <div style={styles.listItemMain}>
                      <div style={styles.followupName}>{item.lead_name}</div>
                      <div style={styles.followupNote}>"{item.note || 'No followup note added'}"</div>
                      <div style={styles.followupContact}>{item.lead_phone}</div>
                    </div>
                    <div style={styles.listItemSide}>
                      <span style={styles.followupDateBadge}>
                        {new Date(item.followup_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <ArrowRight size={14} color="var(--text-muted)" style={styles.listArrow} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="glass-card" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleGroup}>
                <IndianRupee size={18} color="#10b981" />
                <h3 style={styles.sectionTitle}>Recent Payments</h3>
              </div>
            </div>
            
            <div style={styles.listContainer}>
              {recentPayments.length === 0 ? (
                <div style={styles.emptyState}>
                  <IndianRupee size={32} color="var(--text-muted)" />
                  <p>No payments recorded yet.</p>
                </div>
              ) : (
                recentPayments.map(payment => (
                  <div key={payment.id} style={styles.listItem} onClick={() => onSelectLead(payment.lead_id)}>
                    <div style={styles.listItemMain}>
                      <div style={styles.followupName}>{payment.lead_name}</div>
                      <div style={styles.paymentMethod}>Paid via {payment.method || 'UPI'}</div>
                    </div>
                    <div style={styles.listItemSide}>
                      <span style={styles.paymentAmount}>{formatCurrency(payment.amount)}</span>
                      <span style={styles.paymentDate}>
                        {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Lead Status SVG Chart & Recent Leads */}
        <div style={styles.rightCol}>
          
          {/* Custom SVG Lead Status Chart */}
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
                    
                    if (status === 'NEW') { color = 'var(--color-new)'; label = 'Naya Lead (New)'; }
                    if (status === 'CALLED') { color = 'var(--color-called)'; label = 'Call Kiya (Called)'; }
                    if (status === 'CALLBACK') { color = 'var(--color-callback)'; label = 'Call Later'; }
                    if (status === 'FOLLOWUP') { color = 'var(--color-followup)'; label = 'Follow-up'; }
                    if (status === 'PAID') { color = 'var(--color-paid)'; label = 'Payment Received'; }
                    if (status === 'LOST') { color = 'var(--color-lost)'; label = 'Lost'; }

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

          {/* Recent Leads */}
          <div className="glass-card" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleGroup}>
                <Users size={18} color="#38bdf8" />
                <h3 style={styles.sectionTitle}>Recent Leads</h3>
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
                  if (lead.status === 'CALLED') badgeClass = 'badge-called';
                  if (lead.status === 'CALLBACK') badgeClass = 'badge-callback';
                  if (lead.status === 'FOLLOWUP') badgeClass = 'badge-followup';
                  if (lead.status === 'PAID') badgeClass = 'badge-paid';
                  if (lead.status === 'LOST') badgeClass = 'badge-lost';

                  return (
                    <div key={lead.id} style={styles.listItem} onClick={() => onSelectLead(lead.id)}>
                      <div style={styles.listItemMain}>
                        <div style={styles.followupName}>{lead.name}</div>
                        <div style={styles.leadSource}>
                          {lead.source} &bull; {lead.campaign_name || 'No campaign'}
                        </div>
                      </div>
                      <div style={styles.listItemSide}>
                        <span className={`badge ${badgeClass}`}>{lead.status}</span>
                        <span style={styles.paymentDate}>
                          {new Date(lead.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
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
    padding: '0.5rem',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '1.85rem',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-title)',
    lineHeight: '1.2',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.75rem',
    fontSize: '0.75rem',
  },
  footerText: {
    color: 'var(--text-muted)',
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  smallStatCard: {
    padding: '1rem 1.25rem',
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
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    flexGrow: 1,
  },
  smallStatValue: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
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
    fontSize: '1.1rem',
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#a855f7',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '380px',
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
  followupNote: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  followupContact: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  followupDateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  listArrow: {
    opacity: 0,
    transform: 'translateX(-5px)',
    transition: 'all 0.2s ease',
  },
  paymentMethod: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  paymentAmount: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: '#10b981',
  },
  paymentDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  leadSource: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    textAlign: 'center',
    gap: '0.75rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
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
