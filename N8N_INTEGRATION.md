# 🔗 DocuVerse Studio - n8n Webhook Integration Guide

## 📋 Overview

This guide explains how to set up and use n8n webhooks with DocuVerse Studio for automated workflows, notifications, and integrations.

## 🎯 What You Can Do

With n8n integration, you can:
- ✅ Send notifications when SRS documents are generated
- ✅ Trigger actions when projects are created
- ✅ Send email/Slack alerts automatically
- ✅ Integrate with 300+ apps (Gmail, Discord, Telegram, etc.)
- ✅ Build custom automation workflows
- ✅ Track user activity and analytics

---

## 🚀 Quick Setup

### Step 1: Start n8n with Docker

```bash
cd D:\Desktop\AutoSRS
docker-compose up -d
```

Access n8n at: http://localhost:5678

### Step 2: Configure Environment

Your `.env` file already has:
```ini
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=your_secret_key_here
```

**Change `your_secret_key_here` to a secure random string!**

### Step 3: Import Workflow Templates

1. Open n8n: http://localhost:5678
2. Click "Workflows" → "Add workflow" → "Import from File"
3. Import these files:
   - `n8n_workflows/srs-generated-workflow.json`
   - `n8n_workflows/project-created-workflow.json`
   - `n8n_workflows/health-check-workflow.json`

### Step 4: Test Connection

```bash
# Start your backend
cd backend
npm run dev
```

Test in another terminal:
```bash
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📡 Available Webhooks

### Outgoing Webhooks (DocuVerse → n8n)

DocuVerse automatically sends these events to n8n:

#### 1. **SRS Generated**
**Endpoint:** `http://localhost:5678/webhook/srs-generated`

**Triggered when:** SRS document is successfully generated

**Payload:**
```json
{
  "event": "srs.generated",
  "timestamp": "2026-02-09T16:00:00.000Z",
  "project": {
    "id": "65f...",
    "name": "E-Commerce Platform",
    "domain": "Retail",
    "shareId": "abc123",
    "documentPath": "/download_srs/...",
    "author": "user_id",
    "createdAt": "2026-02-09T15:00:00.000Z"
  },
  "links": {
    "view": "http://localhost:5173/projects/abc123",
    "download": "http://localhost:8000/download_srs/..."
  }
}
```

#### 2. **Project Created**
**Endpoint:** `http://localhost:5678/webhook/project-created`

**Triggered when:** New project is saved

**Payload:**
```json
{
  "event": "project.created",
  "timestamp": "2026-02-09T16:00:00.000Z",
  "project": {
    "id": "65f...",
    "name": "Project Name",
    "domain": "Domain",
    "shareId": "abc123",
    "userId": "user_id"
  }
}
```

#### 3. **Prototype Generated**
**Endpoint:** `http://localhost:5678/webhook/prototype-generated`

**Triggered when:** HTML prototype is created

**Payload:**
```json
{
  "event": "prototype.generated",
  "timestamp": "2026-02-09T16:00:00.000Z",
  "project": {
    "id": "65f...",
    "name": "Project Name",
    "shareId": "abc123",
    "prototypeUrl": "/demo/65f..."
  },
  "links": {
    "demo": "http://localhost:5173/demo/65f..."
  }
}
```

#### 4. **User Activity**
**Endpoint:** `http://localhost:5678/webhook/user-activity`

**Triggered when:** User performs tracked actions

**Payload:**
```json
{
  "event": "user.activity",
  "timestamp": "2026-02-09T16:00:00.000Z",
  "user": { "id": "user_id" },
  "action": "action_name",
  "metadata": {}
}
```

---

### Incoming Webhooks (n8n → DocuVerse)

n8n can trigger actions in DocuVerse:

#### 1. **Regenerate SRS**
**Endpoint:** `http://localhost:5000/api/webhooks/n8n/regenerate-srs`

**Request:**
```json
{
  "projectId": "65f...",
  "options": {}
}
```

**Headers:**
```
X-Webhook-Secret: your_secret_key_here
```

#### 2. **Update Project**
**Endpoint:** `http://localhost:5000/api/webhooks/n8n/update-project`

**Request:**
```json
{
  "projectId": "65f...",
  "updates": {
    "title": "New Title",
    "domain": "New Domain"
  }
}
```

#### 3. **Send Email Notification**
**Endpoint:** `http://localhost:5000/api/webhooks/n8n/send-email-notification`

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Subject",
  "body": "Email body"
}
```

---

## 🎨 Example Use Cases

### Use Case 1: Send Slack Notification on SRS Generation

1. In n8n, edit `srs-generated-workflow`
2. Add your Slack credentials
3. Update the channel ID in the "Send Slack Notification" node
4. Activate the workflow

Now every time an SRS is generated, you'll get a Slack message!

### Use Case 2: Send Email Alerts

1. In n8n workflow, configure the "Send Email" node
2. Add your SMTP credentials (Gmail, SendGrid, etc.)
3. Update recipient email address
4. Activate workflow

### Use Case 3: Log to Google Sheets

1. Add a "Google Sheets" node after "Extract Project Data"
2. Configure to append row with project details
3. Track all SRS generations in a spreadsheet

### Use Case 4: Discord Notifications

1. Add "HTTP Request" node
2. Configure with Discord webhook URL
3. Format message with project details

---

## 🔐 Security Best Practices

### 1. Secure Your Webhook Secret

In `.env`, use a strong random key:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env`:
```ini
N8N_WEBHOOK_SECRET=your_generated_secret_here
```

### 2. Use HTTPS in Production

For production, use ngrok or deploy n8n to cloud:

**With ngrok:**
```bash
ngrok http 5678
```

Update `.env`:
```ini
N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app
```

### 3. Validate Webhook Signatures

All incoming webhooks check the `X-Webhook-Secret` header automatically.

---

## 🧪 Testing Webhooks

### Test n8n Connection

```bash
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Manual Trigger (for Testing)

```bash
curl -X POST http://localhost:5000/api/webhooks/manual-trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "srs-generated",
    "projectId": "YOUR_PROJECT_ID"
  }'
```

### Check Webhook Status

```bash
curl -X GET http://localhost:5000/api/webhooks/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "enabled": true,
  "baseUrl": "http://localhost:5678",
  "endpoints": {
    "srsGenerated": "http://localhost:5678/webhook/srs-generated",
    "projectCreated": "http://localhost:5678/webhook/project-created",
    "prototypeGenerated": "http://localhost:5678/webhook/prototype-generated",
    "userActivity": "http://localhost:5678/webhook/user-activity"
  }
}
```

---

## 📊 Monitoring Webhooks

### View n8n Execution History

1. Go to http://localhost:5678
2. Click "Executions" in the left sidebar
3. See all webhook triggers and their results

### Check Backend Logs

```bash
# In your backend terminal, you'll see:
[n8n] SRS generation notification sent successfully
[n8n] Project created notification sent
```

### Debug Failed Webhooks

If webhooks fail, they're logged but don't break the main flow:
```bash
[n8n] Failed to send SRS notification: Error message
```

---

## 🌐 Making Webhooks Public (Production)

### Option 1: ngrok (Quick & Free)

```bash
# Start ngrok
ngrok http 5678

# Update .env
N8N_WEBHOOK_URL=https://abc123.ngrok-free.app
```

### Option 2: Deploy n8n to Cloud

**Railway.app:**
1. Sign up at railway.app
2. Deploy n8n from template
3. Get public URL
4. Update `N8N_WEBHOOK_URL` in `.env`

**DigitalOcean:**
1. Create a droplet
2. Install Docker
3. Run n8n container with domain
4. Update `.env`

**n8n Cloud:**
1. Sign up at n8n.io/cloud
2. Get workspace URL
3. Update `.env`

---

## 🎓 Advanced Workflows

### Multi-Step Automation

Create workflows that:
1. Receive SRS generated event
2. Upload document to Google Drive
3. Send notification to Slack
4. Create task in Trello
5. Log to database

### Conditional Logic

Add "IF" nodes to:
- Send different notifications based on project domain
- Route to different channels based on user
- Apply different processing for different event types

### Error Handling

Add "Error Trigger" nodes to:
- Retry failed requests
- Send alerts on errors
- Log failures to monitoring service

---

## 🐛 Troubleshooting

### Webhook Not Receiving Data

**Check:**
1. n8n is running: `docker ps`
2. Workflow is active in n8n
3. `N8N_ENABLED=true` in `.env`
4. Backend is running: `npm run dev`

**Test:**
```bash
# Test n8n directly
curl -X POST http://localhost:5678/webhook/health-check \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'
```

### Connection Refused

**Issue:** Can't reach n8n

**Fix:**
```bash
# Restart n8n
docker-compose restart

# Check if running
docker ps | grep n8n
```

### Webhook Secret Mismatch

**Issue:** `401 Invalid webhook secret`

**Fix:** Ensure secret matches in:
- `.env` file: `N8N_WEBHOOK_SECRET=xxx`
- n8n workflow: Add header `X-Webhook-Secret: xxx`

### Timeout Errors

**Issue:** Webhook requests timing out

**Fix:** Increase timeout in `backend/services/n8n-webhook.service.js`:
```javascript
timeout: 10000  // Increase from 5000 to 10000ms
```

---

## 📚 Additional Resources

- **n8n Documentation:** https://docs.n8n.io/
- **Workflow Templates:** https://n8n.io/workflows/
- **Community Forum:** https://community.n8n.io/
- **Integrations:** https://n8n.io/integrations/

---

## 🔄 Updating Workflows

To update an existing workflow:
1. Make changes in n8n UI
2. Click workflow settings (⋮)
3. Export workflow as JSON
4. Save to `n8n_workflows/` directory
5. Commit to version control

---

## ✨ Next Steps

1. **Enable webhooks:** Set `N8N_ENABLED=true` in `.env`
2. **Start n8n:** Run `docker-compose up -d`
3. **Import workflows:** Use the provided JSON files
4. **Test:** Generate an SRS and watch the magic happen!
5. **Customize:** Add your own notification channels

For support, check the troubleshooting section or raise an issue in the repository.

Happy automating! 🚀
