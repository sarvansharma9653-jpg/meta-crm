import React, { useState, useEffect } from 'react';
import { apiFetch, API_HOST } from '../utils/api';
import { 
  Settings, 
  Copy, 
  Check, 
  Save, 
  HelpCircle, 
  Play, 
  Info,
  Sparkles,
  Eye,
  EyeOff
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

export default function MetaSettings() {
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock Tester State
  const [mockName, setMockName] = useState('Rahul Kumar (Meta Test)');
  const [mockEmail, setMockEmail] = useState('rahul.test@gmail.com');
  const [mockPhone, setMockPhone] = useState('+919876543210');
  const [mockCampaign, setMockCampaign] = useState('Meta Lead Gen Campaign');
  const [mockLoading, setMockLoading] = useState(false);
  const [mockSuccess, setMockSuccess] = useState('');

  const fetchSettings = async () => {
    try {
      const response = await apiFetch('/api/meta/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      setAccessToken(data.meta_access_token_raw || '');
      setVerifyToken(data.meta_verify_token || '');
    } catch (err) {
      console.error(err);
      setError('Could not load Meta integration settings.');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/meta/settings', {
        method: 'POST',
        body: JSON.stringify({
          meta_access_token: accessToken,
          meta_verify_token: verifyToken
        })
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err.message || 'Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMockLead = async (e) => {
    e.preventDefault();
    setMockSuccess('');
    setMockLoading(true);

    try {
      const response = await apiFetch('/api/meta/mock-webhook', {
        method: 'POST',
        body: JSON.stringify({
          name: mockName,
          email: mockEmail,
          phone: mockPhone,
          campaign_name: mockCampaign
        })
      });

      if (!response.ok) throw new Error('Mocking webhook failed');
      const data = await response.json();
      setMockSuccess(`Success! Mock Lead Gen ID: ${data.leadgen_id} successfully stored in CRM database.`);
      
      // Reset Tester Form
      setMockName('Rahul Kumar (Meta Test)');
      setMockEmail('rahul.test@gmail.com');
      setMockPhone('+919876543210');
      setMockCampaign('Meta Lead Gen Campaign');
    } catch (err) {
      alert(err.message || 'Mock webhook failed');
    } finally {
      setMockLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const localWebhookUrl = `${API_HOST}/api/webhook/facebook`;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Meta Ads Integration</h1>
          <p style={styles.subtitle}>Connect your Facebook and Instagram Lead Generation Forms to receive leads in real-time.</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Side: Settings Fields & Mock Lead Tester */}
        <div style={styles.colLeft}>
          {/* Settings Form */}
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <Settings size={18} color="#6366f1" />
              <h2 style={styles.cardTitle}>Integration Settings</h2>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
            {success && <div style={styles.successBox}>{success}</div>}

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Webhook Callback URL (Read-only)</label>
                <div style={styles.inputWithCopy}>
                  <input
                    type="text"
                    className="form-input"
                    value={localWebhookUrl}
                    readOnly
                    style={styles.readOnlyInput}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      navigator.clipboard.writeText(localWebhookUrl);
                      alert('Webhook URL copied!');
                    }}
                    style={{ padding: '0.7rem' }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <small style={styles.helpText}>
                  This is the URL you must configure in the Meta Developer Dashboard under Webhooks.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Verify Token (For Webhook Verification)</label>
                <div style={styles.inputWithCopy}>
                  <input
                    type="text"
                    className="form-input"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter verification token"
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={copyToClipboard}
                    style={{ padding: '0.7rem' }}
                    title="Copy token"
                  >
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
                <small style={styles.helpText}>
                  This can be any custom string. Meta will send this token to verify your server.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Facebook Page Access Token</label>
                <div style={styles.inputWithCopy}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="form-input"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    disabled={loading}
                    placeholder="Paste Page Access Token (EAAG...)"
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowToken(!showToken)}
                    style={{ padding: '0.7rem' }}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <small style={styles.helpText}>
                  Needed to fetch lead contact details (email, phone, name) from Meta Graph API.
                </small>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save Meta Configuration'}</span>
              </button>
            </form>
          </div>

          {/* Webhook Tester Box */}
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <Play size={18} color="#10b981" />
              <h2 style={styles.cardTitle}>Webhook Lead Tester (Mock)</h2>
            </div>
            <p style={styles.testerDesc}>
              Aap actual Facebook integrations se pehle dummy leads generate karke check kar sakte hain ki data base me save ho raha hai ya nahi.
            </p>

            {mockSuccess && <div style={styles.successBox}>{mockSuccess}</div>}

            <form onSubmit={handleSendMockLead}>
              <div className="form-group">
                <label className="form-label">Lead Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={mockName}
                  onChange={(e) => setMockName(e.target.value)}
                  required
                  disabled={mockLoading}
                />
              </div>

              <div style={styles.formRow2}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={mockPhone}
                    onChange={(e) => setMockPhone(e.target.value)}
                    required
                    disabled={mockLoading}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    required
                    disabled={mockLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={mockCampaign}
                  onChange={(e) => setMockCampaign(e.target.value)}
                  required
                  disabled={mockLoading}
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={mockLoading}>
                <Sparkles size={16} />
                <span>{mockLoading ? 'Generating...' : 'Submit Test Lead'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Setup Instructions Guide */}
        <div style={styles.colRight}>
          <div className="glass-card" style={styles.instructionsCard}>
            <div style={styles.cardHeader}>
              <Facebook size={20} color="#3b5998" />
              <h2 style={{ ...styles.cardTitle, color: '#ffffff' }}>Facebook Integration Setup Guide</h2>
            </div>
            
            <div style={styles.guideTimeline}>
              
              <div style={styles.guideStep}>
                <div style={styles.stepNum}>1</div>
                <div style={styles.stepContent}>
                  <h4>Create a Facebook Developer App</h4>
                  <p>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={styles.link}>developers.facebook.com</a>. Create a new App of type <strong>Business</strong>.</p>
                </div>
              </div>

              <div style={styles.guideStep}>
                <div style={styles.stepNum}>2</div>
                <div style={styles.stepContent}>
                  <h4>Configure Webhooks</h4>
                  <p>In your Meta App Dashboard, find <strong>Webhooks</strong>. Click Set Up, select <strong>Page</strong> in the dropdown, and subscribe to <strong>leadgen</strong>.</p>
                </div>
              </div>

              <div style={styles.guideStep}>
                <div style={styles.stepNum}>3</div>
                <div style={styles.stepContent}>
                  <h4>Connect Webhook Callback URL</h4>
                  <p>Paste the CRM's Webhook URL (copied from the left form) and the <strong>Verify Token</strong> into Meta. Click "Verify and Save".</p>
                  <div style={styles.tipBox}>
                    <Info size={14} color="#38bdf8" style={{ marginTop: '2px' }} />
                    <span><strong>Local Testing Tip:</strong> If running locally on localhost, use a tunnel tool like <strong>ngrok</strong> to generate a public HTTPS URL (e.g. `ngrok http 5000`) and use that URL.</span>
                  </div>
                </div>
              </div>

              <div style={styles.guideStep}>
                <div style={styles.stepNum}>4</div>
                <div style={styles.stepContent}>
                  <h4>Get Page Access Token</h4>
                  <p>Go to Graph API Explorer, select your App, select your Facebook Page, grant permissions <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_ads</code>, and <code>leads_retrieval</code>. Copy the generated Page Access Token and paste it here.</p>
                </div>
              </div>

              <div style={styles.guideStep}>
                <div style={styles.stepNum}>5</div>
                <div style={styles.stepContent}>
                  <h4>Subscribe App to Page</h4>
                  <p>Finally, ensure your App is subscribed to lead notifications from your Page using Meta Developer Console dashboard or Graph API endpoint <code>POST /&#123;page-id&#125;/subscribed_apps</code>.</p>
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
    gridTemplateColumns: '1fr 1fr',
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
  inputWithCopy: {
    display: 'flex',
    gap: '0.5rem',
  },
  readOnlyInput: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: 'var(--text-secondary)',
    cursor: 'not-allowed',
  },
  helpText: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.35rem',
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
  testerDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginBottom: '1.25rem',
  },
  formRow2: {
    display: 'flex',
    gap: '1rem',
  },
  instructionsCard: {
    padding: '1.75rem 1.5rem',
    backgroundColor: 'rgba(26, 32, 48, 0.4)',
  },
  guideTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'relative',
    marginTop: '1.25rem',
  },
  guideStep: {
    display: 'flex',
    gap: '1rem',
  },
  stepNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
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
  link: {
    color: '#6366f1',
    textDecoration: 'underline',
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
