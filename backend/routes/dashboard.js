import express from 'express';
import { dbClient } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, (req, res) => {
  try {
    // 1. Total Leads
    const totalLeadsRow = dbClient.queryOne('SELECT COUNT(*) as count FROM leads');
    const totalLeads = totalLeadsRow ? totalLeadsRow.count : 0;

    // 2. Leads by Status
    const statusRows = dbClient.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
    const statusCounts = {
      NEW: 0,
      CALLED: 0,
      CALLBACK: 0,
      FOLLOWUP: 0,
      PAID: 0,
      LOST: 0
    };
    statusRows.forEach(row => {
      if (statusCounts[row.status] !== undefined) {
        statusCounts[row.status] = row.count;
      }
    });

    // 3. Total Revenue Collected
    const revenueRow = dbClient.queryOne('SELECT SUM(amount) as total FROM payments');
    const totalRevenue = revenueRow && revenueRow.total ? revenueRow.total : 0;

    // 4. Total Calls Logged
    const totalCallsRow = dbClient.queryOne('SELECT COUNT(*) as count FROM calls');
    const totalCalls = totalCallsRow ? totalCallsRow.count : 0;

    // 5. Recent 5 Leads
    const recentLeads = dbClient.query(
      'SELECT id, name, email, phone, status, source, campaign_name, created_at FROM leads ORDER BY created_at DESC LIMIT 5'
    );

    // 6. Upcoming 5 Followups (only pending ones)
    const upcomingFollowups = dbClient.query(
      `SELECT f.id, f.note, f.followup_date, f.status, l.name as lead_name, l.phone as lead_phone, l.id as lead_id
       FROM followups f 
       JOIN leads l ON f.lead_id = l.id
       WHERE f.status = 'PENDING'
       ORDER BY f.followup_date ASC 
       LIMIT 5`
    );

    // 7. Recent 5 Payments
    const recentPayments = dbClient.query(
      `SELECT p.id, p.amount, p.payment_date, p.method, l.name as lead_name, l.id as lead_id
       FROM payments p
       JOIN leads l ON p.lead_id = l.id
       ORDER BY p.payment_date DESC
       LIMIT 5`
    );

    // 8. Lead Source distribution
    const sourceRows = dbClient.query('SELECT source, COUNT(*) as count FROM leads GROUP BY source');
    const sourceCounts = {};
    sourceRows.forEach(row => {
      sourceCounts[row.source] = row.count;
    });

    res.json({
      summary: {
        totalLeads,
        totalRevenue,
        totalCalls,
        statusCounts,
        sourceCounts
      },
      recentLeads,
      upcomingFollowups,
      recentPayments
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
  }
});

export default router;
