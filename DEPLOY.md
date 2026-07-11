# MetaCRM Deployment Guide

This guide explains how to deploy the MetaCRM system to production so that it runs 24/7 on the internet and can receive real-time leads from Meta Ads (Facebook/Instagram).

---

## Method 1: Deploying as a Single Web Service on Render (Recommended & Free)

You can host both the frontend and backend together as a single Node.js application on Render's free tier.

### Step 1: Create a GitHub Repository
1. Open terminal in the project folder `D:\CRM`.
2. Run the following commands to initialize Git and commit files:
   ```bash
   git init
   # Create a .gitignore file (see template below)
   git add .
   git commit -m "Initial commit of MetaCRM"
   ```
3. Create a new repository on [GitHub](https://github.com/) (e.g., `metacrm-system`).
4. Link your local folder to GitHub and push:
   ```bash
   git remote add origin https://github.com/your-username/metacrm-system.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Configure Render
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `metacrm-system` repository.
4. Set the following configuration details:
   - **Name**: `metacrm-system` (or any name you prefer)
   - **Region**: Select closest to your audience (e.g., Singapore or US East)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables
Under the **Environment** tab on Render, add the following variables:
- `PORT` = `5000` (Render will map this automatically, but manually defining ensures Express config matches)
- `JWT_SECRET` = `your_own_super_secure_random_string` (Replace with a random string to secure logins)

### Step 4: Handle SQLite Persistence on Render
> [!WARNING]
> **Data Persistence Warning**: Render's **Free Tier** web services have "ephemeral" disks. This means if the server restarts or redeploys, your SQLite database (`crm.db`) will reset and you will lose your leads data.
> To prevent data loss, you have three options:
> 1. **Render Persistent Disk (Paid)**: Add a paid persistent disk ($5/month) on Render, mount it to `/data`, and set an environment variable `DB_PATH = /data/crm.db`.
> 2. **Deploy on Railway (Free Tier with Disk)**: Deploy to [Railway.app](https://railway.app/). Railway allows you to mount a free persistent volume/disk to your service, keeping your SQLite database 100% safe for free.
> 3. **Connect to PostgreSQL (Supabase - Free)**: You can easily modify `db.js` to connect to a free PostgreSQL database provided by [Supabase](https://supabase.com/).

---

## Method 2: Local Hosting + Public Webhook Tunneling (For testing/Internal use)

If you only want to run it on your office/home computer, you can run it locally and use a secure tunnel to receive Meta Ads webhooks.

### Step 1: Run local server
1. Open the project folder `D:\CRM`.
2. Double-click `start.bat`. This starts the backend and frontend dev servers.

### Step 2: Set up ngrok for Webhook
Since Meta Ads webhooks cannot send lead data to `localhost`, you must create a public URL pointing to your local server:
1. Download and install [ngrok](https://ngrok.com/).
2. Run ngrok pointing to your backend port (`5000`):
   ```bash
   ngrok http 5000
   ```
3. Ngrok will generate a public HTTPS URL (e.g., `https://a1b2-34-56-78.ngrok-free.app`).
4. Copy this URL and append `/api/webhook/facebook` to it.
   - Example: `https://a1b2-34-56-78.ngrok-free.app/api/webhook/facebook`
5. Go to your Facebook Developer Console and use this URL as the **Callback URL**. Set your verification token, and click verify!

---

## .gitignore Template (Save in root folder as `.gitignore`)
```text
# Dependency directories
node/
node_modules/

# Local databases
backend/crm.db
backend/crm.db-journal

# Compiled frontend files
frontend/dist/

# Local env files
.env
.env.local

# OS system files
.DS_Store
Thumbs.db
```
