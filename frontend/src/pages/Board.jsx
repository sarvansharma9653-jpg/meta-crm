import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Plus,
  RefreshCw,
  Phone,
  User,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
  Settings,
  Sparkles
} from 'lucide-react';

const COLUMNS = [
  { id: 'NEW', title: 'New Leads', color: 'var(--color-new)' },
  { id: 'CALLED', title: 'Called', color: 'var(--color-called)' },
  { id: 'CALLBACK', title: 'Call Back Later', color: 'var(--color-callback)' },
  { id: 'FOLLOWUP', title: 'Follow-up', color: 'var(--color-followup)' },
  { id: 'PAID', title: 'Won (Paid)', color: 'var(--color-paid)' },
  { id: 'LOST', title: 'Lost', color: 'var(--color-lost)' },
];

export default function Board({ onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await apiFetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads for board:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Update lead status in database
  const moveLead = async (leadId, newStatus) => {
    try {
      // Optimistic update in UI
      setLeads(prevLeads => 
        prevLeads.map(l => l.id === leadId ? { ...l, status: newStatus, updated_at: new Date().toISOString() } : l)
      );

      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update lead status');
    } catch (err) {
      console.error(err);
      // Revert if failed
      fetchLeads(true);
    }
  };

  const getLeadsByStatus = (statusId) => {
    return leads.filter(lead => lead.status === statusId);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div className="shimmer" style={{ width: '250px', height: '40px', borderRadius: '8px' }}></div>
        </div>
        <div style={styles.shimmerBoard}>
          <div className="shimmer" style={{ flex: '1', height: '60vh', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ flex: '1', height: '60vh', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ flex: '1', height: '60vh', borderRadius: '12px' }}></div>
          <div className="shimmer" style={{ flex: '1', height: '60vh', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Pipeline Board</h1>
          <p style={styles.subtitle}>Track deal progression across statuses. Click cards to view details.</p>
        </div>
        <button 
          onClick={() => fetchLeads(true)} 
          className="btn btn-secondary" 
          disabled={refreshing}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Board Layout */}
      <div className="board-columns-container">
        {COLUMNS.map((column, colIdx) => {
          const columnLeads = getLeadsByStatus(column.id);
          return (
            <div key={column.id} className="board-column">
              <div className="board-column-header">
                <div className="board-column-title" style={{ color: column.color }}>
                  <div style={{ ...styles.colorDot, backgroundColor: column.color }}></div>
                  <span>{column.title}</span>
                </div>
                <span className="board-column-count">{columnLeads.length}</span>
              </div>

              <div className="board-cards-list">
                {columnLeads.length === 0 ? (
                  <div style={styles.emptyColumn}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No leads</span>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      className="board-card"
                      onClick={() => onSelectLead(lead.id)}
                    >
                      <div className="board-card-name">{lead.name}</div>
                      
                      <div className="board-card-info">
                        {lead.phone && (
                          <span style={styles.cardInfoItem}>
                            <Phone size={10} style={{ marginRight: '3px' }} />
                            {lead.phone}
                          </span>
                        )}
                        <span style={styles.cardInfoItem}>
                          <Sparkles size={10} style={{ marginRight: '3px' }} />
                          {lead.source}
                        </span>
                        {lead.campaign_name && (
                          <span style={styles.cardCampaign} title={lead.campaign_name}>
                            {lead.campaign_name}
                          </span>
                        )}
                      </div>

                      {/* Card Moving Actions */}
                      <div style={styles.cardActions} onClick={e => e.stopPropagation()}>
                        {colIdx > 0 && (
                          <button 
                            onClick={() => moveLead(lead.id, COLUMNS[colIdx - 1].id)}
                            style={styles.moveBtn}
                            title={`Move to ${COLUMNS[colIdx - 1].title}`}
                          >
                            <ChevronLeft size={14} />
                          </button>
                        )}
                        <span style={{ flexGrow: 1 }}></span>
                        {colIdx < COLUMNS.length - 1 && (
                          <button 
                            onClick={() => moveLead(lead.id, COLUMNS[colIdx + 1].id)}
                            style={styles.moveBtn}
                            title={`Move to ${COLUMNS[colIdx + 1].title}`}
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
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
  shimmerBoard: {
    display: 'flex',
    gap: '1rem',
  },
  colorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  emptyColumn: {
    border: '1px dashed rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '2rem 1rem',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  cardInfoItem: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
  },
  cardCampaign: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginTop: '0.15rem',
    display: 'block',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    gap: '0.25rem',
  },
  moveBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.2rem',
    transition: 'all 0.2s',
  },
};
