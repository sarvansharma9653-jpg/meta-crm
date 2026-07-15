import express from 'express';
import { dbClient } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Today's local date in YYYY-MM-DD
    const todayIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const todayStr = todayIST.toISOString().split('T')[0];

    // 1. Total Leads
    const totalLeadsRow = await dbClient.queryOne('SELECT COUNT(*) as count FROM leads');
    const totalLeads = totalLeadsRow ? parseInt(totalLeadsRow.count) : 0;

    // 2. Qualified Leads
    const qualifiedLeadsRow = await dbClient.queryOne("SELECT COUNT(*) as count FROM leads WHERE status = 'QUALIFIED'");
    const qualifiedLeads = qualifiedLeadsRow ? parseInt(qualifiedLeadsRow.count) : 0;

    // 3. Visits Scheduled this week
    const dayOfWeek = todayIST.getDay();
    const startOfWeek = new Date(todayIST);
    startOfWeek.setDate(todayIST.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    const visitsThisWeekRow = await dbClient.queryOne(
      "SELECT COUNT(*) as count FROM leads WHERE status = 'VISIT_SCHEDULED' AND visit_date >= ? AND visit_date <= ?",
      [startStr, endStr]
    );
    const visitsThisWeek = visitsThisWeekRow ? parseInt(visitsThisWeekRow.count) : 0;

    // 4. Leads by Status
    const statusRows = await dbClient.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
    const statusCounts = {
      NEW: 0,
      CONTACTED: 0,
      FOLLOWUP: 0,
      QUALIFIED: 0,
      VISIT_SCHEDULED: 0,
      VISITED: 0,
      CONVERTED: 0,
      NOT_INTERESTED: 0
    };
    statusRows.forEach(row => {
      const uStatus = row.status ? row.status.toUpperCase() : 'NEW';
      if (statusCounts[uStatus] !== undefined) {
        statusCounts[uStatus] = parseInt(row.count);
      }
    });

    // 5. Recent 5 Leads
    const recentLeads = await dbClient.query(
      'SELECT id, name, email, phone, status, source, site_project, budget, created_at FROM leads ORDER BY created_at DESC LIMIT 5'
    );

    // 6. Overdue and Today's Follow-up reminders (urgency order)
    const upcomingFollowups = await dbClient.query(
      `SELECT id, name, phone, status, followup_date, site_project, purpose 
       FROM leads 
       WHERE status NOT IN ('CONVERTED', 'NOT_INTERESTED') 
         AND followup_date IS NOT NULL 
         AND followup_date != '' 
         AND followup_date <= ? 
       ORDER BY followup_date ASC`,
      [todayStr]
    );

    // 7. Lead Source distribution
    const sourceRows = await dbClient.query('SELECT source, COUNT(*) as count FROM leads GROUP BY source');
    const sourceCounts = {};
    sourceRows.forEach(row => {
      sourceCounts[row.source] = parseInt(row.count);
    });

    res.json({
      summary: {
        totalLeads,
        qualifiedLeads,
        visitsThisWeek,
        statusCounts,
        sourceCounts
      },
      recentLeads,
      upcomingFollowups
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
  }
});

export default router;
