import express from 'express';
import { dbClient } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper to get a setting (async)
async function getSetting(key, defaultValue = '') {
  const row = await dbClient.queryOne('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : defaultValue;
}

// Helper to set a setting (async)
async function setSetting(key, value) {
  await dbClient.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// GET Meta Settings (for authenticated CRM users)
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const accessToken = await getSetting('meta_access_token');
    const verifyToken = await getSetting('meta_verify_token', 'crm_meta_verify_token_default_2026');

    res.json({
      // Mask access token for security
      meta_access_token_masked: accessToken ? `${accessToken.substring(0, 8)}...${accessToken.slice(-8)}` : '',
      meta_access_token_raw: accessToken,
      meta_verify_token: verifyToken
    });
  } catch (error) {
    console.error('Fetch Meta settings error:', error);
    res.status(500).json({ error: 'Internal server error fetching settings' });
  }
});

// POST save Meta Settings
router.post('/settings', authenticateToken, async (req, res) => {
  const { meta_access_token, meta_verify_token } = req.body;

  try {
    if (meta_access_token !== undefined) {
      await setSetting('meta_access_token', meta_access_token);
    }
    if (meta_verify_token !== undefined) {
      await setSetting('meta_verify_token', meta_verify_token);
    }
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Save Meta settings error:', error);
    res.status(500).json({ error: 'Internal server error saving settings' });
  }
});

// GET Facebook Webhook verification (called by Meta server)
router.get('/', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const localVerifyToken = await getSetting('meta_verify_token', 'crm_meta_verify_token_default_2026');

  if (mode && token) {
    if (mode === 'subscribe' && token === localVerifyToken) {
      console.log('FACEBOOK WEBHOOK VERIFIED');
      return res.status(200).send(challenge);
    } else {
      console.warn('FACEBOOK WEBHOOK VERIFICATION FAILED: Token mismatch');
      return res.status(403).send('Verification token mismatch');
    }
  }
  res.status(400).send('Bad Request');
});

// POST Facebook Webhook lead callback (called by Meta server when a lead is captured)
router.post('/', async (req, res) => {
  const body = req.body;

  console.log('Received Meta Webhook event:', JSON.stringify(body, null, 2));

  // Determine if it is a leadgen event
  if (body.object === 'page') {
    try {
      for (const entry of body.entry) {
        if (!entry.changes) continue;
        
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const formId = change.value.form_id;

            console.log(`Processing leadgen ID: ${leadgenId} for Form ID: ${formId}`);

            // Fetch lead details from Facebook Graph API
            await fetchAndStoreMetaLead(leadgenId, formId);
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error processing Meta webhook event:', error);
      // Still send 200 to Facebook so they don't retry and eventually block the webhook
      res.status(200).send('EVENT_RECEIVED_WITH_INTERNAL_ERROR');
    }
  } else {
    res.status(404).send('Not Found');
  }
});

// Helper function to fetch lead details using Graph API and store them in database
async function fetchAndStoreMetaLead(leadgenId, formId) {
  const accessToken = await getSetting('meta_access_token');
  if (!accessToken) {
    console.error('Meta Access Token is missing in CRM settings. Cannot fetch lead details.');
    // Store lead placeholder so it's not lost entirely
    await dbClient.run(
      `INSERT INTO leads (name, source, meta_lead_id, campaign_name) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(meta_lead_id) DO NOTHING`,
      [`Meta Lead (Pending Details - Token Missing)`, 'Meta Ads', leadgenId, `Form ID: ${formId}`]
    );
    return;
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Meta Graph API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log('Fetched Meta Lead Details:', JSON.stringify(data, null, 2));

    // Parse field_data array
    let name = '';
    let email = '';
    let phone = '';
    
    if (data.field_data) {
      data.field_data.forEach(field => {
        const fieldName = field.name.toLowerCase();
        const value = field.values && field.values[0] ? field.values[0] : '';
        
        if (fieldName === 'full_name' || fieldName === 'name') {
          name = value;
        } else if (fieldName === 'first_name') {
          name = value + (name ? ' ' + name : '');
        } else if (fieldName === 'last_name') {
          name = (name ? name + ' ' : '') + value;
        } else if (fieldName === 'email') {
          email = value;
        } else if (fieldName === 'phone' || fieldName === 'phone_number') {
          phone = value;
        }
      });
    }

    // Default name if not found
    if (!name) {
      name = `Meta Lead #${leadgenId.slice(-6)}`;
    }

    // Insert or update lead in database
    await dbClient.run(
      `INSERT INTO leads (name, email, phone, status, source, meta_lead_id, campaign_name) 
       VALUES (?, ?, ?, 'NEW', 'Meta Ads', ?, ?)
       ON CONFLICT(meta_lead_id) DO UPDATE SET 
         name = excluded.name, 
         email = excluded.email, 
         phone = excluded.phone,
         updated_at = CURRENT_TIMESTAMP`,
      [name, email || null, phone || null, leadgenId, `Form ID: ${formId}`]
    );

    console.log(`Lead stored successfully: ${name} (${phone})`);
  } catch (error) {
    console.error('Error fetching Meta lead details:', error);
    // Insert placeholder so lead record is preserved
    await dbClient.run(
      `INSERT INTO leads (name, source, meta_lead_id, campaign_name) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(meta_lead_id) DO NOTHING`,
      [`Meta Lead (Fetch Details Failed)`, 'Meta Ads', leadgenId, `Form ID: ${formId}`]
    );
  }
}

// Dev Mock Route: Allows mocking a Meta webhook call easily during testing without actual facebook integration
router.post('/mock-webhook', async (req, res) => {
  const { name, email, phone, campaign_name, lead_id } = req.body;
  const mockLeadId = lead_id || `mock_meta_${Math.floor(Math.random() * 10000000)}`;

  try {
    await dbClient.run(
      `INSERT INTO leads (name, email, phone, status, source, meta_lead_id, campaign_name) 
       VALUES (?, ?, ?, 'NEW', 'Meta Ads', ?, ?)
       ON CONFLICT(meta_lead_id) DO UPDATE SET 
         name = excluded.name, 
         email = excluded.email, 
         phone = excluded.phone,
         updated_at = CURRENT_TIMESTAMP`,
      [name || 'Test Meta Lead', email || 'test@example.com', phone || '+919999999999', mockLeadId, campaign_name || 'Mock Ad Campaign']
    );

    res.json({ message: 'Mock Meta Lead added successfully', leadgen_id: mockLeadId });
  } catch (error) {
    console.error('Mock webhook error:', error);
    res.status(500).json({ error: 'Mock webhook failed' });
  }
});

export default router;
