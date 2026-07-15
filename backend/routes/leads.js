import express from 'express';
import { dbClient } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET all leads (with search, status, source, purpose, site_project, dates, sorting)
router.get('/', authenticateToken, async (req, res) => {
  const { search, status, source, purpose, site_project, followup_start, followup_end, sort } = req.query;

  try {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR campaign_name LIKE ? OR address LIKE ? OR profession LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (source) {
      sql += ' AND source = ?';
      params.push(source);
    }

    if (purpose) {
      sql += ' AND purpose = ?';
      params.push(purpose);
    }

    if (site_project) {
      sql += ' AND site_project = ?';
      params.push(site_project);
    }

    if (followup_start && followup_end) {
      sql += ' AND followup_date >= ? AND followup_date <= ?';
      params.push(followup_start, followup_end);
    } else if (followup_start) {
      sql += ' AND followup_date >= ?';
      params.push(followup_start);
    } else if (followup_end) {
      sql += ' AND followup_date <= ?';
      params.push(followup_end);
    }

    if (sort === 'followup_date') {
      sql += " ORDER BY CASE WHEN followup_date IS NULL OR followup_date = '' THEN 1 ELSE 0 END, followup_date ASC, created_at DESC";
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const leads = await dbClient.query(sql, params);
    res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ error: 'Internal server error fetching leads' });
  }
});

// GET single lead detail with history (calls, followups, payments, remarks)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const calls = await dbClient.query('SELECT * FROM calls WHERE lead_id = ? ORDER BY call_date DESC', [id]);
    const followups = await dbClient.query('SELECT * FROM followups WHERE lead_id = ? ORDER BY followup_date ASC', [id]);
    const payments = await dbClient.query('SELECT * FROM payments WHERE lead_id = ? ORDER BY payment_date DESC', [id]);
    const remarks = await dbClient.query('SELECT * FROM remarks WHERE lead_id = ? ORDER BY created_at DESC', [id]);

    res.json({
      lead,
      history: {
        calls,
        followups,
        payments,
        remarks
      }
    });
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    res.status(500).json({ error: 'Internal server error fetching lead detail' });
  }
});

// POST manually create a lead (with real estate parameters)
router.post('/', authenticateToken, async (req, res) => {
  const { name, email, phone, status, source, campaign_name, note, purpose, address, profession, budget, site_project, visit_date, followup_date } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Lead name is required' });
  }

  try {
    const result = await dbClient.run(
      `INSERT INTO leads (name, email, phone, status, source, campaign_name, note, purpose, address, profession, budget, site_project, visit_date, followup_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email || null,
        phone || null,
        status || 'NEW',
        source || 'Manual',
        campaign_name || null,
        note || null,
        purpose || null,
        address || null,
        profession || null,
        budget || null,
        site_project || null,
        visit_date || null,
        followup_date || null
      ]
    );

    const newLead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error creating lead' });
  }
});

// PUT update lead (status, contact info, real estate attributes, etc.)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status, campaign_name, note, purpose, address, profession, budget, site_project, visit_date, followup_date } = req.body;

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbClient.run(
      `UPDATE leads 
       SET name = ?, email = ?, phone = ?, status = ?, campaign_name = ?, note = ?,
           purpose = ?, address = ?, profession = ?, budget = ?, site_project = ?,
           visit_date = ?, followup_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name !== undefined ? name : lead.name,
        email !== undefined ? email : lead.email,
        phone !== undefined ? phone : lead.phone,
        status !== undefined ? status : lead.status,
        campaign_name !== undefined ? campaign_name : lead.campaign_name,
        note !== undefined ? note : lead.note,
        purpose !== undefined ? purpose : lead.purpose,
        address !== undefined ? address : lead.address,
        profession !== undefined ? profession : lead.profession,
        budget !== undefined ? budget : lead.budget,
        site_project !== undefined ? site_project : lead.site_project,
        visit_date !== undefined ? visit_date : lead.visit_date,
        followup_date !== undefined ? followup_date : lead.followup_date,
        id
      ]
    );

    const updatedLead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error updating lead' });
  }
});

// POST log a call for a lead
router.post('/:id/calls', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { note, duration, call_date } = req.body;

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbClient.run(
      'INSERT INTO calls (lead_id, note, duration, call_date) VALUES (?, ?, ?, ?)',
      [id, note || '', duration || 0, call_date || new Date().toISOString()]
    );

    // Automatically transition lead status to 'CALLED' if it's currently 'NEW'
    if (lead.status === 'NEW') {
      await dbClient.run("UPDATE leads SET status = 'CALLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    }

    res.status(201).json({ message: 'Call logged successfully' });
  } catch (error) {
    console.error('Log call error:', error);
    res.status(500).json({ error: 'Internal server error logging call' });
  }
});

// POST schedule a followup
router.post('/:id/followups', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { note, followup_date } = req.body;

  if (!followup_date) {
    return res.status(400).json({ error: 'Followup date is required' });
  }

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbClient.run(
      'INSERT INTO followups (lead_id, note, followup_date, status) VALUES (?, ?, ?, ?)',
      [id, note || '', followup_date, 'PENDING']
    );

    // Automatically transition lead status to 'FOLLOWUP' if status is NEW or CALLED
    if (lead.status === 'NEW' || lead.status === 'CALLED') {
      await dbClient.run("UPDATE leads SET status = 'FOLLOWUP', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    }

    res.status(201).json({ message: 'Followup scheduled successfully' });
  } catch (error) {
    console.error('Schedule followup error:', error);
    res.status(500).json({ error: 'Internal server error scheduling followup' });
  }
});

// PUT complete or edit followup status
router.put('/:id/followups/:followupId', authenticateToken, async (req, res) => {
  const { followupId } = req.params;
  const { status } = req.body; // PENDING, COMPLETED, MISSED

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    await dbClient.run('UPDATE followups SET status = ? WHERE id = ?', [status, followupId]);
    res.json({ message: 'Followup updated successfully' });
  } catch (error) {
    console.error('Update followup error:', error);
    res.status(500).json({ error: 'Internal server error updating followup' });
  }
});

// POST record a payment
router.post('/:id/payments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, method, transaction_id, payment_date } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbClient.run(
      'INSERT INTO payments (lead_id, amount, payment_date, method, transaction_id) VALUES (?, ?, ?, ?, ?)',
      [id, parseFloat(amount), payment_date || new Date().toISOString(), method || 'UPI', transaction_id || '']
    );

    // Mark lead status as 'PAID'
    await dbClient.run("UPDATE leads SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    res.status(201).json({ message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Internal server error recording payment' });
  }
});

// DELETE a lead
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbClient.run('DELETE FROM leads WHERE id = ?', [id]);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Internal server error deleting lead' });
  }
});

// GET chronological remarks list for a lead
router.get('/:id/remarks', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const remarks = await dbClient.query('SELECT * FROM remarks WHERE lead_id = ? ORDER BY created_at DESC', [id]);
    res.json(remarks);
  } catch (error) {
    console.error('Fetch remarks error:', error);
    res.status(500).json({ error: 'Internal server error fetching remarks' });
  }
});

// POST add a remark to a lead
router.post('/:id/remarks', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Remark content is required' });
  }

  try {
    const lead = await dbClient.queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await dbClient.run(
      'INSERT INTO remarks (lead_id, note) VALUES (?, ?)',
      [id, note]
    );

    const newRemark = await dbClient.queryOne('SELECT * FROM remarks WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newRemark);
  } catch (error) {
    console.error('Create remark error:', error);
    res.status(500).json({ error: 'Internal server error creating remark' });
  }
});

export default router;
