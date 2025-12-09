# Setup Guide: Analytics Logging to GitHub

## Quick Setup (3 steps)

### Step 1: Create a GitHub Personal Access Token
1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Vercel Analytics"
4. Select scopes:
   - ✅ `repo` (all)
   - ✅ `workflow`
5. Click "Generate token"
6. **Copy the token** (you won't see it again)

### Step 2: Add Token to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your "text-to-pdf-converter" project
3. Go to **Settings → Environment Variables**
4. Add new variable:
   - Name: `GITHUB_TOKEN`
   - Value: `[paste your token from Step 1]`
   - Environments: **Production** (check this)
5. Click "Save"

### Step 3: Redeploy
1. In Vercel, trigger a redeploy or push a commit to your repo

## How to View Logs

After setup, when users convert PDFs:

1. Go to your GitHub repo
2. Look for a new file: **`CONVERSION_LOGS.txt`**
3. Each line shows:
   ```
   [2025-12-09T10:30:45.123Z] Text to PDF | Country: America | IP: 192.168.1.1
   ```

## What Gets Logged
- ✅ Timestamp (when conversion happened)
- ✅ Format (Text to PDF or HTML to PDF)
- ✅ Country (approximate, based on timezone)
- ✅ IP Address (server side)

## Troubleshooting

**Logs not appearing?**
- Check that `GITHUB_TOKEN` is set in Vercel Environment Variables
- Redeploy the project
- Check browser console for errors (F12 → Console)
- Try a test conversion

**Token expired?**
- GitHub personal access tokens expire after 1 year
- Generate a new one and update Vercel

**Still not working?**
- Check Vercel Function logs: Dashboard → Functions → Logs
- Look for error messages starting with "GitHub logging failed"
