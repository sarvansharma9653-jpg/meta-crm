import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDB, dbClient } from './db.js';

// Routers
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import dashboardRouter from './routes/dashboard.js';
import metaRouter from './routes/meta.js';
import sheetsRouter, { syncGoogleSheetsLeads } from './routes/sheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database, seed, and listen
async function startServer() {
  try {
    await initDB();
  } catch (error) {
    console.error('Failed database initialization:', error);
  }
  app.use('/api/auth', authRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/webhook/facebook', metaRouter); // Meta webhook sits directly under webhooks path
  app.use('/api/meta', metaRouter); // Meta settings endpoints
  app.use('/api/sheets', sheetsRouter); // Google Sheets sync endpoints

  // Set up Google Sheets automatic background sync every 10 minutes
  setInterval(async () => {
    try {
      console.log('Running background Google Sheets sync...');
      const syncResult = await syncGoogleSheetsLeads();
      if (syncResult.success) {
        console.log('Background Sync:', syncResult.message);
      }
    } catch (err) {
      console.error('Background Sync Error:', err.message);
    }
  }, 10 * 60 * 1000);

  // Serve static assets in production (if frontend is built)
  const frontendBuildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendBuildPath));

  // For routing all other requests to the SPA index.html in production
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
        // If build folder doesn't exist, just send a friendly greeting
        res.status(200).send('CRM Backend API is running! Frontend is in development mode.');
      }
    });
  });

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  CRM Backend server running on port ${PORT}`);
    console.log(`  Local Webhook URL: http://localhost:${PORT}/api/webhook/facebook`);
    console.log(`=========================================`);
  });
}

startServer();
