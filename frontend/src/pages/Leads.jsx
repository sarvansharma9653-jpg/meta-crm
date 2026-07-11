import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Filter, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function Leads({ onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Manual Add Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCampaign, setNewCampaign] = useState('');
  const [newSource, setNewSource] = useState('Manual');
  const [newStatus, setNewStatus] = useState('NEW');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const response = await apiFetch(`/api/leads?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err.message || 'Error loading leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input to avoid hitting backend on every keystroke
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, sourceFilter]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newName) {
      setAddError('Lead name is required');
      return;
    }

    setAddLoading(true);
    try {
      const response = await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          campaign_name: newCampaign,
          source: newSource,
          status: newStatus
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      setShowAddModal(false);
      // Reset fields
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewCampaign('');
      setNewSource('Manual');
      setNewStatus('NEW');
      
      // Refresh list
      fetchLeads();
    } catch (err) {
      setAddError(err.message || 'Failed to create lead');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteLead = async (id, name, e) => {
    e.stopPropagation(); // Avoid opening details modal
    if (!window.confirm(`Are you sure you want to delete lead: "${name}"?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/api/leads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      setLeads(leads.filter(l => l.id !== id));
    } catch (err) {
      alert(err.message || 'Error deleting lead');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Leads Database</h1>
          <p style={styles.subtitle}>View, filter, search, and manage your inbound sales pipeline.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Manual Add Lead</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, phone, email, or campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={styles.dropdownFilters}>
          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New Lead (Naya)</option>
              <option value="CALLED">Called (Call Kiya)</option>
              <option value="CALLBACK">Call Back Later</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="PAID">Paid (Success)</option>
              <option value="LOST">Lost (Lost)</option>
            </select>
          </div>

          {/* Source Filter */}
          <div style={styles.filterGroup}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">All Sources</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Manual">Manual Entry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table / List */}
      {loading && leads.length === 0 ? (
        <div className="custom-table-container">
          <div className="shimmer" style={{ height: '50px', margin: '0.5rem 0' }}></div>
          <div className="shimmer" style={{ height: '50px', margin: '0.5rem 0' }}></div>
          <div className="shimmer" style={{ height: '50px', margin: '0.5rem 0' }}></div>
          <div className="shimmer" style={{ height: '50px', margin: '0.5rem 0' }}></div>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <AlertCircle size={32} color="#ef4444" />
          <p>{error}</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-card" style={styles.emptyCard}>
          <Sparkles size={40} color="var(--text-muted)" />
          <h3>No Leads Found</h3>
          <p>Try modifying your filters or search keywords, or add a lead manually.</p>
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Lead Info</th>
                <th>Source</th>
                <th>Campaign/Form</th>
                <th>Status</th>
                <th>Added Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                let badgeClass = 'badge-new';
                if (lead.status === 'CALLED') badgeClass = 'badge-called';
                if (lead.status === 'CALLBACK') badgeClass = 'badge-callback';
                if (lead.status === 'FOLLOWUP') badgeClass = 'badge-followup';
                if (lead.status === 'PAID') badgeClass = 'badge-paid';
                if (lead.status === 'LOST') badgeClass = 'badge-lost';

                return (
                  <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => onSelectLead(lead.id)}>
                    <td>
                      <div style={styles.leadNameCell}>{lead.name}</div>
                      <div style={styles.leadContactCell}>
                        {lead.phone && <span>{lead.phone}</span>}
                        {lead.email && <span> &bull; {lead.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        ...styles.sourceBadge, 
                        color: lead.source === 'Meta Ads' ? '#3b5998' : '#a855f7',
                        borderColor: lead.source === 'Meta Ads' ? 'rgba(59, 89, 152, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        backgroundColor: lead.source === 'Meta Ads' ? 'rgba(59, 89, 152, 0.05)' : 'rgba(168, 85, 247, 0.05)'
                      }}>
                        {lead.source}
                      </span>
                    </td>
                    <td>
                      <span style={styles.campaignText}>{lead.campaign_name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{lead.status}</span>
                    </td>
                    <td>
                      <span style={styles.dateText}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={styles.actionCell}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onSelectLead(lead.id); }} 
                          className="btn btn-secondary" 
                          style={styles.iconBtn}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteLead(lead.id, lead.name, e)} 
                          className="btn btn-danger" 
                          style={styles.iconBtn}
                          title="Delete Lead"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Add Manual Lead</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={styles.modalCloseBtn}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddLead}>
              <div className="modal-body">
                {addError && <div style={styles.modalError}>{addError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter lead name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    disabled={addLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 10-digit phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    disabled={addLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={addLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Campaign Name / Reference</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Summer Offer, Google Search, Referrals"
                    value={newCampaign}
                    onChange={(e) => setNewCampaign(e.target.value)}
                    disabled={addLoading}
                  />
                </div>

                <div style={styles.formRow2}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Source</label>
                    <select
                      className="form-input"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="Manual">Manual</option>
                      <option value="Meta Ads">Meta Ads</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-input"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="NEW">New Lead (Naya)</option>
                      <option value="CALLED">Called (Call kiya)</option>
                      <option value="CALLBACK">Call Back Later</option>
                      <option value="FOLLOWUP">Follow-up</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    flexGrow: 1,
    overflowY: 'auto',
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
  filterCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    padding: '1.25rem 1.5rem',
  },
  searchBox: {
    position: 'relative',
    flexGrow: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  dropdownFilters: {
    display: 'flex',
    gap: '1rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    padding: '0.2rem 0.75rem',
  },
  selectInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    padding: '0.5rem 0',
    fontFamily: 'var(--font-body)',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '4rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#f87171',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: 'var(--text-muted)',
  },
  leadNameCell: {
    fontWeight: '600',
    color: '#ffffff',
    fontSize: '0.95rem',
  },
  leadContactCell: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.15rem',
  },
  sourceBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  campaignText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: '180px',
    display: 'inline-block',
  },
  dateText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  actionCell: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  iconBtn: {
    padding: '0.45rem',
    borderRadius: '6px',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.75rem',
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  formRow2: {
    display: 'flex',
    gap: '1rem',
  },
};
