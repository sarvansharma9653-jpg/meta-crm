import express from 'express';
import { dbClient } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper to get a setting (async)
async function getSetting(key, defaultValue = '') {
  const row = await dbClient.queryOne('SELECT value FROM settings WHERE "key" = ?', [key]);
  return row ? row.value : defaultValue;
}

// Helper to set a setting (async)
async function setSetting(key, value) {
  await dbClient.run(
    'INSERT INTO settings ("key", value) VALUES (?, ?) ON CONFLICT("key") DO UPDATE SET value = EXCLUDED.value',
    [key, value]
  );
}

// GET Sheet Settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const sheetUrl = await getSetting('sheet_url');
    const sheetColName = await getSetting('sheet_col_name', 'Name');
    const sheetColPhone = await getSetting('sheet_col_phone', 'Phone');
    const sheetColEmail = await getSetting('sheet_col_email', 'Email');
    const sheetColCampaign = await getSetting('sheet_col_campaign', 'Campaign');
    const lastSync = await getSetting('sheet_last_sync', 'Never');

    res.json({
      sheet_url: sheetUrl,
      sheet_col_name: sheetColName,
      sheet_col_phone: sheetColPhone,
      sheet_col_email: sheetColEmail,
      sheet_col_campaign: sheetColCampaign,
      sheet_last_sync: lastSync
    });
  } catch (error) {
    console.error('Fetch sheet settings error:', error);
    res.status(500).json({ error: 'Failed to load sheets settings' });
  }
});

// POST save Sheet Settings
router.post('/settings', authenticateToken, async (req, res) => {
  const { sheet_url, sheet_col_name, sheet_col_phone, sheet_col_email, sheet_col_campaign } = req.body;

  try {
    if (sheet_url !== undefined) await setSetting('sheet_url', sheet_url);
    if (sheet_col_name !== undefined) await setSetting('sheet_col_name', sheet_col_name);
    if (sheet_col_phone !== undefined) await setSetting('sheet_col_phone', sheet_col_phone);
    if (sheet_col_email !== undefined) await setSetting('sheet_col_email', sheet_col_email);
    if (sheet_col_campaign !== undefined) await setSetting('sheet_col_campaign', sheet_col_campaign);

    res.json({ message: 'Sheets sync settings saved successfully!' });
  } catch (error) {
    console.error('Save sheet settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// POST trigger Google Sheets sync
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const result = await syncGoogleSheetsLeads();
    res.json(result);
  } catch (error) {
    console.error('Manual sheet sync error:', error);
    res.status(500).json({ error: error.message || 'Sheets sync failed' });
  }
});

// Core Sync Function (shared between manual and background sync)
export async function syncGoogleSheetsLeads() {
  const sheetUrl = await getSetting('sheet_url');
  if (!sheetUrl) {
    return { success: false, message: 'Google Sheet URL is not configured.' };
  }

  // Parse spreadsheet ID from Google Sheet URL
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match ? match[1] : null;
  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL format. Make sure it contains "/d/[SPREADSHEET_ID]/"');
  }

  const sheetColName = await getSetting('sheet_col_name', 'Name');
  const sheetColPhone = await getSetting('sheet_col_phone', 'Phone');
  const sheetColEmail = await getSetting('sheet_col_email', 'Email');
  const sheetColCampaign = await getSetting('sheet_col_campaign', 'Campaign');

  // Fetch public CSV export of the Google Sheet
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error('Failed to access Google Sheet. Verify that the sheet sharing setting is set to "Anyone with the link can view".');
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    return { success: true, newLeadsSynced: 0, message: 'Google Sheet is empty or contains no lead rows.' };
  }

  // Read Headers (Row 0)
  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  // Try to find configured columns first
  let nameIdx = headers.indexOf(sheetColName.trim().toLowerCase());
  let phoneIdx = headers.indexOf(sheetColPhone.trim().toLowerCase());
  let emailIdx = headers.indexOf(sheetColEmail.trim().toLowerCase());
  let campaignIdx = headers.indexOf(sheetColCampaign.trim().toLowerCase());

  // Smart Auto-Detect if configured column is missing or default headers not found
  if (nameIdx === -1) {
    nameIdx = headers.findIndex(h => 
      (h.includes('name') && !h.includes('campaign') && !h.includes('ad') && !h.includes('form')) || 
      h.includes('fullname') || h.includes('first') || 
      h.includes('naam') || h.includes('customer') || h.includes('client') || h === 'nama'
    );
  }
  if (phoneIdx === -1) {
    phoneIdx = headers.findIndex(h => 
      h.includes('phone') || h.includes('mobile') || h.includes('contact') || 
      h.includes('number') || h.includes('tel') || h.includes('whatsapp') || h === 'ph' || h === 'mob'
    );
  }
  if (emailIdx === -1) {
    emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
  }
  if (campaignIdx === -1) {
    campaignIdx = headers.findIndex(h => 
      h.includes('campaign') || h.includes('ad') || h.includes('source') || h.includes('form') || h.includes('ref')
    );
  }

  // Auto-detect note column
  let noteIdx = headers.indexOf('note');
  if (noteIdx === -1) {
    noteIdx = headers.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('remark') || h.includes('detail'));
  }

  // Final fallback to typical column indices if still not found
  if (nameIdx === -1) nameIdx = 0; // Default to 1st column for Name
  if (phoneIdx === -1) phoneIdx = nameIdx === 1 ? 0 : 1; // Default to 2nd column for Phone
  if (emailIdx === -1) emailIdx = (nameIdx === 2 || phoneIdx === 2) ? 3 : 2; // Default to 3rd column for Email

  let insertedCount = 0;
  let duplicateCount = 0;

  // Process data rows (1 to N)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Extract values dynamically based on index mapping
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
    const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : '';
    const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : '';
    const campaign = campaignIdx !== -1 && row[campaignIdx] ? row[campaignIdx].trim() : '';
    const note = noteIdx !== -1 && row[noteIdx] ? row[noteIdx].trim() : '';

    // Skip empty rows
    if (!name && !phone && !email) continue;

    // Compile custom fields (any columns that are not mapped to standard fields)
    const customFieldsObj = {};
    headers.forEach((h, idx) => {
      if (
        idx !== nameIdx && 
        idx !== phoneIdx && 
        idx !== emailIdx && 
        idx !== campaignIdx && 
        idx !== noteIdx && 
        h !== 'id' && 
        h !== 'created_time' && 
        h !== 'lead_status'
      ) {
        const headerName = rows[0][idx] || h;
        customFieldsObj[headerName] = row[idx] ? row[idx].trim() : '';
      }
    });
    const customFieldsJSON = JSON.stringify(customFieldsObj);

    // Check if lead already exists in database (Idempotent Sync)
    let existingLead = null;

    if (phone) {
      existingLead = await dbClient.queryOne('SELECT id FROM leads WHERE phone = ?', [phone]);
    }
    if (!existingLead && email) {
      existingLead = await dbClient.queryOne('SELECT id FROM leads WHERE email = ?', [email]);
    }
    if (!existingLead && name) {
      existingLead = await dbClient.queryOne('SELECT id FROM leads WHERE name = ? AND phone = ?', [name, phone || '']);
    }

    if (existingLead) {
      // Update custom_fields and metadata for existing leads to ensure we capture sheet answers
      await dbClient.run(
        `UPDATE leads SET custom_fields = ? WHERE id = ?`,
        [customFieldsJSON, existingLead.id]
      );
      duplicateCount++;
      continue;
    }

    // Insert new lead
    await dbClient.run(
      `INSERT INTO leads (name, email, phone, status, source, campaign_name, note, custom_fields) 
       VALUES (?, ?, ?, 'NEW', 'Google Sheets', ?, ?, ?)`,
      [name, email || null, phone || null, campaign || 'Google Sheet Sync', note || null, customFieldsJSON]
    );
    insertedCount++;
  }

  // Update last sync timestamp
  const nowStr = new Date().toISOString();
  await setSetting('sheet_last_sync', nowStr);

  return {
    success: true,
    newLeadsSynced: insertedCount,
    duplicatesSkipped: duplicateCount,
    lastSync: nowStr,
    message: `Sync complete! Synced ${insertedCount} new lead(s) and skipped ${duplicateCount} duplicate(s).`
  };
}

// Zero-dependency robust CSV parser
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }

  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }

  return lines;
}

export default router;
