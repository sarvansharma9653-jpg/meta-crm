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
                <option value="CALLBACK">Call Back Later</option>
                <option value="FOLLOWUP">Follow-up</option>
                <option value="PAID">Paid (Success)</option>
                <option value="LOST">Lost (Lost)</option>
              </select>
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
