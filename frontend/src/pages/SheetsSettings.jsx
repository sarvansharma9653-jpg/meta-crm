import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  FileSpreadsheet, 
  Settings, 
  Save, 
  RefreshCw, 
  HelpCircle, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SheetsSettings() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetColName, setSheetColName] = useState('Name');
  const [sheetColPhone, setSheetColPhone] = useState('Phone');
  const [sheetColEmail, setSheetColEmail] = useState('Email');
  const [sheetColCampaign, setSheetColCampaign] = useState('Campaign');
  const [lastSync, setLastSync] = useState('');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  
  const [syncSuccess, setSyncSuccess] = useState('');
  const [syncError, setSyncError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/sheets/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      
      setSheetUrl(data.sheet_url || '');
      setSheetColName(data.sheet_col_name || 'Name');
      setSheetColPhone(data.sheet_col_phone || 'Phone');
      setSheetColEmail(data.sheet_col_email || 'Email');
      setSheetColCampaign(data.sheet_col_campaign || 'Campaign');
      setLastSync(data.sheet_last_sync || '');
    } catch (err) {
      console.error(err);
      setSaveError('Could not load Google Sheets sync configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/sheets/settings', {
        method: 'POST',
        body: JSON.stringify({
          sheet_url: sheetUrl,
          sheet_col_name: sheetColName,
          sheet_col_phone: sheetColPhone,
          sheet_col_email: sheetColEmail,
          sheet_col_campaign: sheetColCampaign
        })
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSaveSuccess('Configuration saved successfully!');
      
      // Auto-trigger sync after save if URL is set
      if (sheetUrl) {
        handleSyncNow();
      }
    } catch (err) {
      setSaveError(err.message || 'Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncSuccess('');
    setSyncError('');
    setSyncing(true);

    try {
      const response = await apiFetch('/api/sheets/sync', {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncSuccess(data.message);
      if (data.lastSync) {
        setLastSync(data.lastSync);
      }
    } catch (err) {
      setSyncError(err.message || 'Connection error. Ensure backend is running.');
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (isoString) => {
    if (!isoString || isoString === 'Never') return 'Never Synced';
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Google Sheets Sync</h1>
          <p style={styles.subtitle}>Directly import leads from any Google Sheet without API key configuration.</p>
        </div>
      </div>

      <div style={styles.grid}>
        
        {/* Left Col: Configurations Form */}
        <div style={styles.colLeft}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <Settings size={18} color="#6366f1" />
              <h2 style={styles.cardTitle}>Sync Configuration</h2>
            </div>

            {saveError && <div style={styles.errorBox}>{saveError}</div>}
            {saveSuccess && <div style={styles.successBox}>{saveSuccess}</div>}

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Google Sheet URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  required
                  disabled={loading || syncing}
                />
                <small style={styles.helpText}>
                  Link must contain spreadsheet ID and the sheet should be shared as public view.
                </small>
              </div>

              {/* Column Mapping Headers */}
              <div style={styles.mappingSection}>
                <h4 style={styles.mappingTitle}>Column Header Names Mapping</h4>
                <p style={styles.mappingDesc}>
                  Enter the exact header names (case-insensitive) of the columns in your Google Sheet.
                </p>

                <div style={styles.formRow2}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Name Column *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sheetColName}
                      onChange={(e) => setSheetColName(e.target.value)}
                      required
                      disabled={loading || syncing}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Phone Column *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sheetColPhone}
                      onChange={(e) => setSheetColPhone(e.target.value)}
                      required
                      disabled={loading || syncing}
                    />
                  </div>
                </div>

                <div style={styles.formRow2}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Email Column</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sheetColEmail}
                      onChange={(e) => setSheetColEmail(e.target.value)}
                      disabled={loading || syncing}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Campaign Column</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sheetColCampaign}
                      onChange={(e) => setSheetColCampaign(e.target.value)}
                      disabled={loading || syncing}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }} 
                disabled={loading || syncing}
              >
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save & Trigger Sync'}</span>
              </button>
            </form>
          </div>

          {/* Sync Stats Control Panel */}
          {sheetUrl && (
            <div className="glass-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <RefreshCw size={18} color="#10b981" />
                <h2 style={styles.cardTitle}>Sync Control Panel</h2>
              </div>

              <div style={styles.statusBox}>
                <div style={styles.statusRow}>
                  <span style={styles.statusLabel}>Auto-Sync Interval:</span>
                  <span style={styles.statusVal}>Every 10 minutes (Active)</span>
                </div>
                <div style={styles.statusRow}>
                  <span style={styles.statusLabel}>Last Synced Time:</span>
                  <span style={styles.statusVal}>{formatLastSync(lastSync)}</span>
                </div>
              </div>

              {syncError && (
                <div style={styles.syncErrorBox}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{syncError}</span>
                </div>
              )}

              {syncSuccess && (
                <div style={styles.syncSuccessBox}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{syncSuccess}</span>
                </div>
              )}

              <button 
                onClick={handleSyncNow} 
                className="btn btn-success" 
                style={{ width: '100%', marginTop: '0.5rem' }} 
                disabled={syncing || loading}
              >
                <RefreshCw size={16} className={syncing ? 'spin-animation' : ''} />
                <span>{syncing ? 'Syncing data...' : 'Sync Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Setup Instruction Guide */}
        <div style={styles.colRight}>
          <div className="glass-card" style={styles.guideCard}>
            <div style={styles.cardHeader}>
              <FileSpreadsheet size={20} color="#10b981" />
              <h2 style={{ ...styles.cardTitle, color: '#ffffff' }}>How to link Google Sheet?</h2>
            </div>

            <div style={styles.timeline}>
              <div style={styles.step}>
                <div style={styles.stepNum}>1</div>
                <div style={styles.stepContent}>
                  <h4>Google Sheet link taiyar karein</h4>
                  <p>Apni Google Sheet open karein jahan Facebook leads save ho rahi hain.</p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNum}>2</div>
                <div style={styles.stepContent}>
                  <h4>Sharing setting "Anyone with link" karein</h4>
                  <p>Top right corner me **Share** button par click karein. General Access me **"Restricted"** ko badal kar **"Anyone with the link"** (Viewer permission) select karein aur done kar dein.</p>
                  <div style={styles.tipBox}>
                    <Info size={14} color="#38bdf8" style={{ marginTop: '2px' }} />
                    <span><strong>Note:</strong> CRM is link ka use leads read karne ke liye karega. Google account key ki zaroorat nahi hai.</span>
                  </div>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNum}>3</div>
                <div style={styles.stepContent}>
                  <h4>Sheet URL copy karke paste karein</h4>
                  <p>Sheet ka browser link copy karein aur left box me "Google Sheet URL" me paste kar dein.</p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNum}>4</div>
                <div style={styles.stepContent}>
                  <h4>Column Headers verify karein</h4>
                  <p>Apni Google Sheet ke first row ke column headers ke naam (jaise: `Name`, `Phone`, `Email`) left box me sahi-sahi likhein.</p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNum}>5</div>
                <div style={styles.stepContent}>
                  <h4>Save aur Sync karein</h4>
                  <p>**Save & Trigger Sync** par click karein. Aapka kaam poora ho gaya! CRM har 10 minute me automatic background me naye leads pull karta rahega.</p>
                </div>
              </div>
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
  header: {
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  colLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  colRight: {},
  card: {
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  helpText: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.35rem',
  },
  mappingSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
  },
  mappingTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  mappingDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    marginTop: '0.15rem',
  },
  formRow2: {
    display: 'flex',
    gap: '1rem',
  },
  statusBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  statusLabel: {
    color: 'var(--text-secondary)',
  },
  statusVal: {
    fontWeight: '600',
    color: '#ffffff',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  syncErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '0.75rem 0.85rem',
    fontSize: '0.8rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  syncSuccessBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    borderRadius: '6px',
    padding: '0.75rem 0.85rem',
    fontSize: '0.8rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  guideCard: {
    padding: '1.75rem 1.5rem',
    backgroundColor: 'rgba(26, 32, 48, 0.4)',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'relative',
    marginTop: '1.25rem',
  },
  step: {
    display: 'flex',
    gap: '1rem',
  },
  stepNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    '& h4': {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    '& p': {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      lineHeight: '1.4',
    },
  },
  tipBox: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    padding: '0.75rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    lineHeight: '1.4',
    marginTop: '0.5rem',
  },
};
