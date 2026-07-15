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
  Sparkles,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function Leads({ onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at'); // created_at, followup_date
  
  // Manual Add Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCampaign, setNewCampaign] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPurpose, setNewPurpose] = useState('Investment');
  const [newAddress, setNewAddress] = useState('');
  const [newProfession, setNewProfession] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newSiteProject, setNewSiteProject] = useState('Balaji Estate');
  const [newCustomSiteProject, setNewCustomSiteProject] = useState('');
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newFollowupDate, setNewFollowupDate] = useState('');
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
      if (purposeFilter) params.append('purpose', purposeFilter);
      if (siteFilter) params.append('site_project', siteFilter);
      if (sortBy) params.append('sort', sortBy);

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
  }, [searchTerm, statusFilter, sourceFilter, purposeFilter, siteFilter, sortBy]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newName) {
      setAddError('Lead name is required');
      return;
    }

    setAddLoading(true);
    try {
      const finalProjectName = newSiteProject === 'Other' ? newCustomSiteProject : newSiteProject;
      const response = await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          campaign_name: newCampaign,
          source: newSource,
          status: newStatus,
          note: newNote,
          purpose: newPurpose,
          address: newAddress,
          profession: newProfession,
          budget: newBudget,
          site_project: finalProjectName,
          visit_date: newVisitDate,
          followup_date: newFollowupDate
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
      setNewNote('');
      setNewPurpose('Investment');
      setNewAddress('');
      setNewProfession('');
      setNewBudget('');
      setNewSiteProject('Balaji Estate');
      setNewCustomSiteProject('');
      setNewVisitDate('');
      setNewFollowupDate('');
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
            placeholder="Search by name, phone, address, profession..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{
          ...styles.dropdownFilters,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          width: isMobile ? '100%' : 'auto',
          marginTop: isMobile ? '0.75rem' : 0
        }}>
          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New Lead</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="VISIT_SCHEDULED">Visit Scheduled</option>
              <option value="VISITED">Visited</option>
              <option value="CONVERTED">Converted</option>
              <option value="NOT_INTERESTED">Not Interested</option>
            </select>
          </div>

          {/* Purpose Filter */}
          <div style={styles.filterGroup}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">All Purposes</option>
              <option value="Investment">Investment</option>
              <option value="Residential">Residential</option>
            </select>
          </div>

          {/* Site Filter */}
          <div style={styles.filterGroup}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">All Projects</option>
              <option value="Balaji Estate">Balaji Estate</option>
              <option value="Balaji Divine City">Balaji Divine City</option>
              <option value="Balaji Vihar">Balaji Vihar</option>
              {/* Dynamic custom projects loaded in state */}
              {leads.reduce((acc, lead) => {
                if (lead.site_project && !['Balaji Estate', 'Balaji Divine City', 'Balaji Vihar'].includes(lead.site_project) && !acc.includes(lead.site_project)) {
                  acc.push(lead.site_project);
                }
                return acc;
              }, []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div style={styles.filterGroup}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.selectInput}
            >
              <option value="created_at">Sort: Added Date</option>
              <option value="followup_date">Sort: F/up Date</option>
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
      ) : isMobile ? (
        <div style={styles.mobileLeadsList}>
          {leads.map((lead) => {
            let badgeClass = 'badge-new';
            if (lead.status === 'CONTACTED') badgeClass = 'badge-contacted';
            if (lead.status === 'FOLLOWUP') badgeClass = 'badge-followup';
            if (lead.status === 'QUALIFIED') badgeClass = 'badge-qualified';
            if (lead.status === 'VISIT_SCHEDULED') badgeClass = 'badge-visit_scheduled';
            if (lead.status === 'VISITED') badgeClass = 'badge-visited';
            if (lead.status === 'CONVERTED') badgeClass = 'badge-converted';
            if (lead.status === 'NOT_INTERESTED') badgeClass = 'badge-not_interested';

            // Calculate follow-up status indicator
            const fupIndicator = (() => {
              if (!lead.followup_date) return { text: 'No follow-up set', style: { color: 'var(--text-muted)' } };
              const todayIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
              const todayStr = todayIST.toISOString().split('T')[0];
              const fDate = new Date(lead.followup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              if (lead.followup_date < todayStr) {
                return { text: `Overdue: ${fDate}`, style: { color: '#f87171', fontWeight: 'bold' } };
              }
              if (lead.followup_date === todayStr) {
                return { text: `Today: ${fDate}`, style: { color: '#fbbf24', fontWeight: 'bold' } };
              }
              return { text: `Next F/up: ${fDate}`, style: { color: '#60a5fa' } };
            })();

            return (
              <div 
                key={lead.id} 
                className="glass-card" 
                style={styles.mobileLeadCard}
                onClick={() => onSelectLead(lead.id)}
              >
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h4 style={styles.mobileLeadName}>{lead.name}</h4>
                    {lead.site_project && (
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginTop: '0.15rem',
                        fontWeight: 500
                      }}>
                        📍 {lead.site_project}
                      </span>
                    )}
                  </div>
                  <span className={`badge ${badgeClass}`} style={{ alignSelf: 'flex-start' }}>{lead.status}</span>
                </div>

                <div style={styles.mobileCardBody}>
                  {lead.phone && (
                    <div style={styles.mobileCardRow}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  <div style={styles.mobileCardRow}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Purpose: </span>
                    <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>{lead.purpose || 'Investment'}</span>
                    {lead.budget && (
                      <>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Budget: </span>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>{lead.budget}</span>
                      </>
                    )}
                  </div>
                  <div style={styles.mobileCardRow}>
                    <span style={{ ...fupIndicator.style, fontSize: '0.8rem' }}>⏰ {fupIndicator.text}</span>
                  </div>
                  {lead.note && (
                    <div style={styles.mobileCardNote}>
                      <strong>Note:</strong> {lead.note}
                    </div>
                  )}
                </div>

                {/* Mobile direct actions footer (WhatsApp / Call / Delete) */}
                <div style={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                  {lead.phone && (
                    <>
                      <a href={`tel:${lead.phone}`} style={styles.mobileActionBtnCall}>
                        <Phone size={12} />
                        <span>Call</span>
                      </a>
                      <a 
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '').length === 10 ? '91' + lead.phone.replace(/[^0-9]/g, '') : lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.name)},%20`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={styles.mobileActionBtnWhatsapp}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.463 5.214 3.462 8.381-.003 6.535-5.328 11.859-11.859 11.859-2.001-.002-3.967-.512-5.711-1.48L0 24zm6.549-3.782c1.624.965 3.238 1.472 4.752 1.474 5.429 0 9.849-4.42 9.853-9.852.002-2.632-1.02-5.105-2.881-6.968C16.41 3.01 13.935 1.986 11.31 1.987 5.882 1.987 1.46 6.406 1.457 11.835c0 1.636.491 3.23 1.42 4.673l-.997 3.639 3.731-.979zm12.012-7.14c-.3-.15-1.776-.876-2.052-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.95 1.176-.176.2-.35.226-.65.076-.3-.15-1.267-.467-2.413-1.488-.893-.797-1.496-1.78-1.671-2.08-.176-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.676-1.626-.926-2.226-.244-.588-.492-.5-.676-.51-.176-.01-.376-.01-.576-.01-.2 0-.526.075-.802.375-.276.3-1.052 1.026-1.052 2.5s1.076 2.902 1.226 3.1c.15.2 2.117 3.232 5.129 4.53 1.109.479 1.974.767 2.651.981 1.025.326 1.958.28 2.693.17.82-.123 1.776-.726 2.026-1.399.25-.674.25-1.253.176-1.399-.076-.146-.276-.246-.576-.396z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id, lead.name, e); }}
                    style={styles.mobileActionBtnDelete}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Lead Info</th>
                <th>Project/Site</th>
                <th>Purpose & Budget</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Added Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                let badgeClass = 'badge-new';
                if (lead.status === 'CONTACTED') badgeClass = 'badge-contacted';
                if (lead.status === 'FOLLOWUP') badgeClass = 'badge-followup';
                if (lead.status === 'QUALIFIED') badgeClass = 'badge-qualified';
                if (lead.status === 'VISIT_SCHEDULED') badgeClass = 'badge-visit_scheduled';
                if (lead.status === 'VISITED') badgeClass = 'badge-visited';
                if (lead.status === 'CONVERTED') badgeClass = 'badge-converted';
                if (lead.status === 'NOT_INTERESTED') badgeClass = 'badge-not_interested';

                // Calculate follow-up status indicator
                const fupIndicator = (() => {
                  if (!lead.followup_date) return { text: 'Not scheduled', style: { color: 'var(--text-muted)' } };
                  const todayIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
                  const todayStr = todayIST.toISOString().split('T')[0];
                  const fDate = new Date(lead.followup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  if (lead.followup_date < todayStr) {
                    return { text: `Overdue: ${fDate}`, style: { color: '#f87171', fontWeight: 'bold' } };
                  }
                  if (lead.followup_date === todayStr) {
                    return { text: `Today: ${fDate}`, style: { color: '#fbbf24', fontWeight: 'bold' } };
                  }
                  return { text: fDate, style: { color: '#60a5fa' } };
                })();

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
                      <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{lead.site_project || 'N/A'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {lead.purpose || 'Investment'} &bull; <strong style={{ color: '#10b981' }}>{lead.budget || 'N/A'}</strong>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{lead.status}</span>
                    </td>
                    <td>
                      <span style={{ ...fupIndicator.style, fontSize: '0.85rem' }}>{fupIndicator.text}</span>
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
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. client@mail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Purpose</label>
                    <select
                      className="form-input"
                      value={newPurpose}
                      onChange={(e) => setNewPurpose(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="Investment">Investment</option>
                      <option value="Residential">Residential</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Budget (e.g. ₹ Range)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ₹15-20 Lakh"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Interested Site/Project</label>
                    <select
                      className="form-input"
                      value={newSiteProject}
                      onChange={(e) => setNewSiteProject(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="Balaji Estate">Balaji Estate</option>
                      <option value="Balaji Divine City">Balaji Divine City</option>
                      <option value="Balaji Vihar">Balaji Vihar</option>
                      <option value="Other">Other / Custom Site</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Profession</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Salaried, Business"
                      value={newProfession}
                      onChange={(e) => setNewProfession(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>
                </div>

                {newSiteProject === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Custom Site / Project Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter new site/project name"
                      value={newCustomSiteProject}
                      onChange={(e) => setNewCustomSiteProject(e.target.value)}
                      required
                      disabled={addLoading}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter location / city"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    disabled={addLoading}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Site Visit Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newVisitDate}
                      onChange={(e) => setNewVisitDate(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newFollowupDate}
                      onChange={(e) => setNewFollowupDate(e.target.value)}
                      disabled={addLoading}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Source</label>
                    <select
                      className="form-input"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="Manual">Manual Entry</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Referral">Referral</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-input"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="NEW">New Lead (Naya)</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="FOLLOWUP">Follow-up</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="VISIT_SCHEDULED">Visit Scheduled</option>
                      <option value="VISITED">Visited</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lead Notes / Remarks</label>
                  <textarea
                    className="form-input"
                    placeholder="Enter details (Hindi/Hinglish allowed)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={addLoading}
                    rows="2"
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1rem' }}>
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
  mobileLeadsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  mobileLeadCard: {
    padding: '1rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mobileLeadName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#f8fafc',
    margin: 0,
  },
  mobileSourceBadge: {
    display: 'inline-block',
    fontSize: '0.65rem',
    fontWeight: '600',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    marginTop: '0.25rem',
    textTransform: 'uppercase',
  },
  mobileCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  mobileCardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  mobileCardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '0.75rem',
  },
  mobileActionBtnCall: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '0.45rem 0.5rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  mobileActionBtnWhatsapp: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    backgroundColor: '#25D366',
    color: '#ffffff',
    padding: '0.45rem 0.5rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  mobileActionBtnDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  mobileCardNote: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderLeft: '3px solid #6366f1',
    padding: '0.4rem 0.6rem',
    borderRadius: '0 4px 4px 0',
    fontSize: '0.75rem',
    color: '#cbd5e1',
    marginTop: '0.25rem',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
};
