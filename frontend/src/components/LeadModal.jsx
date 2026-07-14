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
  const [activeTab, setActiveTab] = useState('call'); // call, followup, payment
  const [generalNote, setGeneralNote] = useState('');
  const [saveNoteLoading, setSaveNoteLoading] = useState(false);
  
  // Logger forms state
  const [callNote, setCallNote] = useState('');
  const [callDuration, setCallDuration] = useState('60'); // in seconds
  const [logLoading, setLogLoading] = useState(false);

  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentTxnId, setPaymentTxnId] = useState('');

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}`);
      if (!response.ok) throw new Error('Failed to load lead details');
      const json = await response.json();
      setData(json);
      setGeneralNote(json.lead.note || '');
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

  // Handle status update of the lead
  const handleStatusChange = async (newStatus) => {
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

  // Save general lead note
  const handleSaveGeneralNote = async () => {
    setSaveNoteLoading(true);
    try {
      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ note: generalNote })
      });

      if (!response.ok) throw new Error('Failed to save note');
      
      // Update local state
      setData(prev => ({
        ...prev,
        lead: { ...prev.lead, note: generalNote }
      }));
      
      alert('Note saved successfully!');
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveNoteLoading(false);
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
        <div style={styles.modalBodyGrid}>
          
          {/* Left Column: Lead Info and Action Selector */}
          <div style={styles.colLeft}>
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Contact Details</h4>
              <div style={styles.contactList}>
                {lead.phone && (
                  <div style={styles.contactItem}>
                    <Phone size={16} color="var(--text-muted)" />
                    <span style={styles.contactText}>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div style={styles.contactItem}>
                    <Mail size={16} color="var(--text-muted)" />
                    <span style={styles.contactText}>{lead.email}</span>
                  </div>
                )}
                {lead.campaign_name && (
                  <div style={styles.contactItem}>
                    <MessageSquare size={16} color="var(--text-muted)" />
                    <span style={styles.contactText}>Campaign: {lead.campaign_name}</span>
                  </div>
                )}
              </div>

              {/* Quick Communication Actions */}
              <div style={styles.quickActionsContainer}>
                {lead.phone && (
                  <>
                    <a 
                      href={`tel:${lead.phone}`} 
                      style={styles.actionBtnCall}
                      title="Open Dialpad"
                    >
                      <PhoneCall size={14} />
                      <span>Call Now</span>
                    </a>
                    
                    <a 
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '').length === 10 ? '91' + lead.phone.replace(/[^0-9]/g, '') : lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.name)},%20`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={styles.actionBtnWhatsapp}
                      title="Chat on WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.463 5.214 3.462 8.381-.003 6.535-5.328 11.859-11.859 11.859-2.001-.002-3.967-.512-5.711-1.48L0 24zm6.549-3.782c1.624.965 3.238 1.472 4.752 1.474 5.429 0 9.849-4.42 9.853-9.852.002-2.632-1.02-5.105-2.881-6.968C16.41 3.01 13.935 1.986 11.31 1.987 5.882 1.987 1.46 6.406 1.457 11.835c0 1.636.491 3.23 1.42 4.673l-.997 3.639 3.731-.979zm12.012-7.14c-.3-.15-1.776-.876-2.052-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.95 1.176-.176.2-.35.226-.65.076-.3-.15-1.267-.467-2.413-1.488-.893-.797-1.496-1.78-1.671-2.08-.176-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.676-1.626-.926-2.226-.244-.588-.492-.5-.676-.51-.176-.01-.376-.01-.576-.01-.2 0-.526.075-.802.375-.276.3-1.052 1.026-1.052 2.5s1.076 2.902 1.226 3.1c.15.2 2.117 3.232 5.129 4.53 1.109.479 1.974.767 2.651.981 1.025.326 1.958.28 2.693.17.82-.123 1.776-.726 2.026-1.399.25-.674.25-1.253.176-1.399-.076-.146-.276-.246-.576-.396z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
                
                {lead.email && (
                  <a 
                    href={`mailto:${lead.email}?subject=Meta%20CRM%20Follow-up`} 
                    style={styles.actionBtnEmail}
                    title="Send Email"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Lead Stage / Status</h4>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="form-input"
                style={{ ...styles.statusSelect, borderColor: `var(--color-${lead.status.toLowerCase()})` }}
              >
                <option value="NEW">New Lead (Naya)</option>
                <option value="CALLED">Called (Call kiya)</option>
                <option value="QUALIFIED">Qualified Lead</option>
                <option value="CALLBACK">Call Back Later</option>
                <option value="FOLLOWUP">Follow-up</option>
                <option value="PAID">Paid (Success)</option>
                <option value="LOST">Lost (Lost)</option>
              </select>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>General Lead Note</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Write details, callback schedule, or notes here..."
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem', backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}
                />
                <button 
                  onClick={handleSaveGeneralNote} 
                  className="btn btn-secondary" 
                  style={{ alignSelf: 'flex-end', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  disabled={saveNoteLoading}
                >
                  {saveNoteLoading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>

            {/* Quick Action Input logger tabs */}
            <div style={styles.loggerSection}>
              <div style={styles.tabHeaders}>
                <button 
                  onClick={() => setActiveTab('call')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'call' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'call' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <PhoneCall size={14} />
                  <span>Log Call</span>
                </button>
                <button 
                  onClick={() => setActiveTab('followup')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'followup' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'followup' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <Calendar size={14} />
                  <span>Follow-up</span>
                </button>
                <button 
                  onClick={() => setActiveTab('payment')}
                  style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'payment' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'payment' ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <IndianRupee size={14} />
                  <span>Payment</span>
                </button>
              </div>

              <div style={styles.tabBody}>
                {/* 1. Log Call Form */}
                {activeTab === 'call' && (
                  <form onSubmit={handleLogCall}>
                    <div className="form-group">
                      <label className="form-label">Call Discussion Note</label>
                      <textarea
                        className="form-input"
                        placeholder="Log what was spoken during the call..."
                        value={callNote}
                        onChange={(e) => setCallNote(e.target.value)}
                        rows={3}
                        required
                        disabled={logLoading}
                        style={{ resize: 'none', height: '80px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <select
                        className="form-input"
                        value={callDuration}
                        onChange={(e) => setCallDuration(e.target.value)}
                        disabled={logLoading}
                      >
                        <option value="15">15 seconds (Short/Busy)</option>
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="180">3 minutes</option>
                        <option value="300">5+ minutes</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={logLoading}>
                      <Plus size={14} />
                      <span>Log Call Details</span>
                    </button>
                  </form>
                )}

                {/* 2. Schedule Follow-up Form */}
                {activeTab === 'followup' && (
                  <form onSubmit={handleScheduleFollowup}>
                    <div className="form-group">
                      <label className="form-label">Follow-up Date & Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        required
                        disabled={logLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Follow-up Goal / Remarks</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Call to discuss prices, Send brochure"
                        value={followupNote}
                        onChange={(e) => setFollowupNote(e.target.value)}
                        disabled={logLoading}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={logLoading}>
                      <Plus size={14} />
                      <span>Schedule Followup</span>
                    </button>
                  </form>
                )}

                {/* 3. Record Payment Form */}
                {activeTab === 'payment' && (
                  <form onSubmit={handleRecordPayment}>
                    <div className="form-group">
                      <label className="form-label">Amount Received (INR) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter amount (e.g. 5000)"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                        disabled={logLoading}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Method</label>
                        <select
                          className="form-input"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          disabled={logLoading}
                        >
                          <option value="UPI">UPI (GPay/PhonePe)</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Card">Credit/Debit Card</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1.5 }}>
                        <label className="form-label">Transaction ID</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ref. No (Optional)"
                          value={paymentTxnId}
                          onChange={(e) => setPaymentTxnId(e.target.value)}
                          disabled={logLoading}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={logLoading}>
                      <Plus size={14} />
                      <span>Log Payment</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Historical Timeline Activity Feed */}
          <div style={styles.colRight}>
            <h4 style={styles.timelineTitle}>Activity Timeline (History)</h4>
            
            <div style={styles.timelineList}>
              {timelineEvents.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={idx} style={styles.timelineItem}>
                    {/* Line connection */}
                    {idx < timelineEvents.length - 1 && <div style={styles.timelineLine}></div>}
                    
                    <div style={{ ...styles.timelineIconBg, backgroundColor: `${event.color}15`, border: `1px solid ${event.color}30` }}>
                      <Icon size={14} color={event.color} />
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
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  modalContentWide: {
    maxWidth: '850px',
    width: '100%',
    maxHeight: '90vh',
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
    gridTemplateColumns: '1fr 1.1fr',
    gap: '1.75rem',
    padding: '1.5rem',
    overflowY: 'auto',
    flexGrow: 1,
  },
  colLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  colRight: {
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    paddingLeft: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  contactText: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
  },
  quickActionsContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
  },
  actionBtnCall: {
    flex: 1,
    minWidth: '90px',
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
    minWidth: '90px',
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
  actionBtnEmail: {
    flex: 1,
    minWidth: '90px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    backgroundColor: '#3b82f6',
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
};
