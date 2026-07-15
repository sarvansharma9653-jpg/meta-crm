import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  PhoneCall, 
  Calendar, 
  IndianRupee, 
  Clock, 
  MessageSquare, 
  CreditCard, 
  Activity,
  Plus
} from 'lucide-react';

export default function LeadModal({ leadId, onClose, onLeadUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('call'); // call, followup, payment

  // Real estate lead fields states
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPurpose, setLeadPurpose] = useState('Investment');
  const [leadBudget, setLeadBudget] = useState('');
  const [leadSiteProject, setLeadSiteProject] = useState('');
  const [leadAddress, setLeadAddress] = useState('');
  const [leadProfession, setLeadProfession] = useState('');
  const [leadVisitDate, setLeadVisitDate] = useState('');
  const [leadFollowupDate, setLeadFollowupDate] = useState('');
  const [leadStatus, setLeadStatus] = useState('NEW');

  // Remarks state
  const [newRemarkText, setNewRemarkText] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Logger forms state
  const [callNote, setCallNote] = useState('');
  const [callDuration, setCallDuration] = useState('60'); // in seconds
  const [logLoading, setLogLoading] = useState(false);

  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentTxnId, setPaymentTxnId] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}`);
      if (!response.ok) throw new Error('Failed to load lead details');
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      alert('Could not fetch lead logs');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLeadDetails();
  }, [leadId]);

  useEffect(() => {
    if (data && data.lead) {
      const l = data.lead;
      setLeadName(l.name || '');
      setLeadPhone(l.phone || '');
      setLeadEmail(l.email || '');
      setLeadPurpose(l.purpose || 'Investment');
      setLeadBudget(l.budget || '');
      setLeadSiteProject(l.site_project || '');
      setLeadAddress(l.address || '');
      setLeadProfession(l.profession || '');
      setLeadVisitDate(l.visit_date || '');
      setLeadFollowupDate(l.followup_date || '');
      setLeadStatus(l.status || 'NEW');
    }
  }, [data]);

  // Handle status update of the lead
  const handleStatusChange = async (newStatus) => {
    setLeadStatus(newStatus);
    try {
      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Status update failed');
      
      // Update local state
      setData(prev => ({
        ...prev,
        lead: { ...prev.lead, status: newStatus }
      }));
      
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save all lead details
  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          email: leadEmail,
          purpose: leadPurpose,
          budget: leadBudget,
          site_project: leadSiteProject,
          address: leadAddress,
          profession: leadProfession,
          visit_date: leadVisitDate,
          followup_date: leadFollowupDate,
          status: leadStatus
        })
      });
      if (!response.ok) throw new Error('Failed to save lead details');
      alert('Lead details saved successfully!');
      if (onLeadUpdated) onLeadUpdated();
      await fetchLeadDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Quick follow-up handler
  const handleQuickFollowup = async (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dStr = d.toISOString().split('T')[0];
    setLeadFollowupDate(dStr);
    
    try {
      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ followup_date: dStr })
      });
      if (!response.ok) throw new Error('Failed to update follow-up date');
      if (onLeadUpdated) onLeadUpdated();
      await fetchLeadDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add new remark to timeline
  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;
    try {
      const response = await apiFetch(`/api/leads/${leadId}/remarks`, {
        method: 'POST',
        body: JSON.stringify({ note: newRemarkText })
      });
      if (!response.ok) throw new Error('Failed to add remark');
      setNewRemarkText('');
      await fetchLeadDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit logged call
  const handleLogCall = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}/calls`, {
        method: 'POST',
        body: JSON.stringify({
          note: callNote,
          duration: parseInt(callDuration)
        })
      });

      if (!response.ok) throw new Error('Failed to log call');
      setCallNote('');
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setLogLoading(false);
    }
  };

  // Submit scheduled followup
  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate) {
      alert('Please select a date and time');
      return;
    }

    setLogLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}/followups`, {
        method: 'POST',
        body: JSON.stringify({
          note: followupNote,
          followup_date: followupDate
        })
      });

      if (!response.ok) throw new Error('Failed to schedule followup');
      setFollowupNote('');
      setFollowupDate('');
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setLogLoading(false);
    }
  };

  // Submit recorded payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    setLogLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          transaction_id: paymentTxnId
        })
      });

      if (!response.ok) throw new Error('Failed to record payment');
      setPaymentAmount('');
      setPaymentTxnId('');
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setLogLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '600px', padding: '3rem', textAlign: 'center' }}>
          <div className="shimmer" style={{ height: '40px', width: '200px', margin: '0 auto 1.5rem auto', borderRadius: '8px' }}></div>
          <div className="shimmer" style={{ height: '150px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  const { lead, history } = data;

  // Compile full timeline sorted chronologically
  const timelineEvents = [];
  
  // Add creation event
  timelineEvents.push({
    type: 'create',
    title: `Lead Created (${lead.source})`,
    description: lead.campaign_name ? `Campaign: ${lead.campaign_name}` : 'Manual entry',
    date: lead.created_at,
    icon: Activity,
    color: '#6366f1'
  });

  // Add calls
  history.calls.forEach(call => {
    timelineEvents.push({
      type: 'call',
      title: 'Call Logged',
      description: `Note: "${call.note}" (Duration: ${call.duration}s)`,
      date: call.call_date,
      icon: PhoneCall,
      color: '#f59e0b'
    });
  });

  // Add followups
  history.followups.forEach(fup => {
    timelineEvents.push({
      type: 'followup',
      title: 'Follow-up Scheduled',
      description: `Date: ${new Date(fup.followup_date).toLocaleString('en-IN')} &bull; Status: ${fup.status} &bull; Note: "${fup.note}"`,
      date: fup.created_at,
      icon: Calendar,
      color: '#8b5cf6'
    });
  });

  // Add payments
  history.payments.forEach(pay => {
    timelineEvents.push({
      type: 'payment',
      title: 'Payment Received',
      description: `Amount: INR ${pay.amount} via ${pay.method} ${pay.transaction_id ? `(Txn ID: ${pay.transaction_id})` : ''}`,
      date: pay.payment_date,
      icon: IndianRupee,
      color: '#10b981'
    });
  });

  // Sort timeline chronologically (latest first)
  timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={styles.modalContentWide} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={styles.headerTitleGroup}>
            <h3 style={styles.modalTitle}>{lead.name}</h3>
            <span style={{ 
              ...styles.sourceBadge, 
              color: lead.source === 'Meta Ads' ? '#38bdf8' : '#a855f7',
              backgroundColor: lead.source === 'Meta Ads' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(168, 85, 247, 0.1)'
            }}>
              {lead.source}
            </span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Body (Grid split layout) */}
        <div style={{
          ...styles.modalBodyGrid,
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
        }}>
          
          {/* Left Column: Lead Info Form */}
          <div style={styles.colLeft}>
            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leadPhone}
                    onChange={e => setLeadPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div style={styles.quickActionsContainer}>
                {leadPhone && (
                  <>
                    <a href={`tel:${leadPhone}`} style={styles.actionBtnCall}>
                      <PhoneCall size={14} />
                      <span>Call Now</span>
                    </a>
                    <a 
                      href={`https://wa.me/${leadPhone.replace(/[^0-9]/g, '').length === 10 ? '91' + leadPhone.replace(/[^0-9]/g, '') : leadPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(leadName)},%20`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={styles.actionBtnWhatsapp}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.463 5.214 3.462 8.381-.003 6.535-5.328 11.859-11.859 11.859-2.001-.002-3.967-.512-5.711-1.48L0 24zm6.549-3.782c1.624.965 3.238 1.472 4.752 1.474 5.429 0 9.849-4.42 9.853-9.852.002-2.632-1.02-5.105-2.881-6.968C16.41 3.01 13.935 1.986 11.31 1.987 5.882 1.987 1.46 6.406 1.457 11.835c0 1.636.491 3.23 1.42 4.673l-.997 3.639 3.731-.979zm12.012-7.14c-.3-.15-1.776-.876-2.052-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.95 1.176-.176.2-.35.226-.65.076-.3-.15-1.267-.467-2.413-1.488-.893-.797-1.496-1.78-1.671-2.08-.176-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.676-1.626-.926-2.226-.244-.588-.492-.5-.676-.51-.176-.01-.376-.01-.576-.01-.2 0-.526.075-.802.375-.276.3-1.052 1.026-1.052 2.5s1.076 2.902 1.226 3.1c.15.2 2.117 3.232 5.129 4.53 1.109.479 1.974.767 2.651.981 1.025.326 1.958.28 2.693.17.82-.123 1.776-.726 2.026-1.399.25-.674.25-1.253.176-1.399-.076-.146-.276-.246-.576-.396z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Purpose</label>
                  <select
                    className="form-input"
                    value={leadPurpose}
                    onChange={e => setLeadPurpose(e.target.value)}
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
                    placeholder="e.g. ₹20-25 Lakh"
                    value={leadBudget}
                    onChange={e => setLeadBudget(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Interested Site/Project</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Balaji Estate"
                    value={leadSiteProject}
                    onChange={e => setLeadSiteProject(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Profession</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Business, Govt Job"
                    value={leadProfession}
                    onChange={e => setLeadProfession(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Lead location/address"
                  value={leadAddress}
                  onChange={e => setLeadAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Site Visit Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leadVisitDate}
                    onChange={e => setLeadVisitDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leadFollowupDate}
                    onChange={e => setLeadFollowupDate(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                    <button type="button" onClick={() => handleQuickFollowup(2)} className="btn btn-secondary" style={{ padding: '0.25rem 0.4rem', fontSize: '0.7rem', flex: 1, minWidth: 0 }}>+2 Days</button>
                    <button type="button" onClick={() => handleQuickFollowup(7)} className="btn btn-secondary" style={{ padding: '0.25rem 0.4rem', fontSize: '0.7rem', flex: 1, minWidth: 0 }}>+1 Wk</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lead Status / Stage</label>
                <select
                  value={leadStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="form-input"
                  style={{ ...styles.statusSelect, borderColor: `var(--color-${leadStatus.toLowerCase()})` }}
                >
                  <option value="NEW">New Lead (Naya)</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="FOLLOWUP">Follow-up</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="VISIT_SCHEDULED">Visit Scheduled</option>
                  <option value="VISITED">Visited</option>
                  <option value="CONVERTED">Converted (Deals Done)</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} 
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : 'Save Lead Details'}
              </button>
            </form>

            {/* Custom Google Sheets Fields & Questions */}
            {data && data.lead && data.lead.custom_fields && (
              (() => {
                try {
                  const fields = JSON.parse(data.lead.custom_fields);
                  const entries = Object.entries(fields).filter(([_, val]) => val !== undefined && val !== null && val !== '');
                  if (entries.length === 0) return null;
                  return (
                    <div style={styles.customFieldsSection}>
                      <h4 style={styles.customFieldsHeader}>Google Sheet Questions / Survey Answers</h4>
                      <div style={styles.customFieldsList}>
                        {entries.map(([question, answer]) => (
                          <div key={question} style={styles.customFieldItem}>
                            <span style={styles.customFieldKey}>{question.replace(/_/g, ' ')}</span>
                            <span style={styles.customFieldValue}>{answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()
            )}

            {/* Quick Action Input logger tabs (In Left column at the bottom) */}
            <div style={{ ...styles.loggerSection, marginTop: '1.25rem' }}>
              <div style={styles.tabHeaders}>
                <button 
                  onClick={() => setActiveTab('call')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'call' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'call' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <PhoneCall size={13} />
                  <span>Log Call</span>
                </button>
                <button 
                  onClick={() => setActiveTab('followup')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'followup' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'followup' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <Calendar size={13} />
                  <span>Log F/up</span>
                </button>
                <button 
                  onClick={() => setActiveTab('payment')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'payment' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'payment' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <IndianRupee size={13} />
                  <span>Token</span>
                </button>
              </div>

              <div style={styles.tabBody}>
                {activeTab === 'call' && (
                  <form onSubmit={handleLogCall}>
                    <textarea
                      className="form-input"
                      placeholder="Call conversation note..."
                      value={callNote}
                      onChange={(e) => setCallNote(e.target.value)}
                      rows={2}
                      required
                      style={{ resize: 'none', height: '60px', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}>
                      Log Call
                    </button>
                  </form>
                )}

                {activeTab === 'followup' && (
                  <form onSubmit={handleScheduleFollowup}>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      required
                      style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                    />
                    <textarea
                      className="form-input"
                      placeholder="Next action plan..."
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      rows={2}
                      style={{ resize: 'none', height: '60px', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}>
                      Set Next F/up
                    </button>
                  </form>
                )}

                {activeTab === 'payment' && (
                  <form onSubmit={handleRecordPayment}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Amount (₹)"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      />
                      <select
                        className="form-input"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}>
                      Log Token/Receipt
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Historical Remarks Timeline Feed */}
          <div style={{
            ...styles.colRight,
            borderLeft: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
            paddingLeft: isMobile ? 0 : '1.5rem',
            marginTop: isMobile ? '1.5rem' : 0
          }}>
            <h4 style={styles.timelineTitle}>Remarks Timeline (Notes)</h4>
            
            {/* Quick Add Remark Form */}
            <form onSubmit={handleAddRemark} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <textarea
                className="form-input"
                placeholder="Type a new remark... (Hindi/Hinglish allowed)"
                value={newRemarkText}
                onChange={e => setNewRemarkText(e.target.value)}
                rows="2"
                required
                style={{ resize: 'none', backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                Add Remark
              </button>
            </form>

            <div style={styles.timelineList}>
              {timelineEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No timeline remarks logged.
                </div>
              ) : (
                timelineEvents.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={idx} style={styles.timelineItem}>
                      {idx < timelineEvents.length - 1 && <div style={styles.timelineLine}></div>}
                      
                      <div style={{ ...styles.timelineIconBg, backgroundColor: `${event.color}15`, border: `1px solid ${event.color}30` }}>
                        <Icon size={13} color={event.color} />
                      </div>

                      <div style={styles.timelineContent}>
                        <div style={styles.timelineHeader}>
                          <span style={styles.eventTitle}>{event.title}</span>
                          <span style={styles.eventDate}>
                            {new Date(event.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div 
                          style={styles.eventDesc} 
                          dangerouslySetInnerHTML={{ __html: event.description }}
                        ></div>
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
  modalContentWide: {
    maxWidth: '900px',
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  sourceBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  modalBodyGrid: {
    display: 'grid',
    gap: '1.5rem',
    padding: '1.5rem',
    overflowY: 'auto',
    flexGrow: 1,
  },
  colLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  colRight: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '75vh',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  quickActionsContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  actionBtnCall: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '0.55rem 0.75rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  actionBtnWhatsapp: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    backgroundColor: '#25D366',
    color: '#ffffff',
    padding: '0.55rem 0.75rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  statusSelect: {
    borderWidth: '1.5px',
    fontWeight: 600,
    fontSize: '0.9rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
  },
  loggerSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  tabHeaders: {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid var(--glass-border)',
  },
  tabBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '0.75rem 0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    transition: 'all 0.2s',
  },
  tabBody: {
    padding: '1rem',
  },
  timelineTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '1rem',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    overflowY: 'auto',
    flexGrow: 1,
    paddingRight: '0.5rem',
  },
  timelineItem: {
    display: 'flex',
    gap: '1rem',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: '13px',
    top: '28px',
    bottom: '-20px',
    width: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  timelineIconBg: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 2,
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    flexGrow: 1,
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  eventTitle: {
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#ffffff',
  },
  eventDate: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  eventDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  customFieldsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    padding: '1.25rem',
    marginTop: '1.25rem',
  },
  customFieldsHeader: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    paddingBottom: '0.5rem',
  },
  customFieldsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  customFieldItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  customFieldKey: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
  },
  customFieldValue: {
    fontSize: '0.85rem',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
};
