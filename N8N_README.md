# 🚀 DocuVerse Studio - n8n Webhook Integration

## What's New

DocuVerse Studio now supports **n8n webhook integration** for powerful automation and notifications!

### ✨ Features Added

1. **Automatic Notifications**
   - Get notified when SRS documents are generated
   - Track project creation in real-time
   - Monitor prototype generation

2. **Multi-Channel Alerts**
   - Slack notifications
   - Email alerts
   - Discord messages
   - And 300+ more integrations via n8n

3. **Custom Workflows**
   - Build automation pipelines
   - Integrate with your existing tools
   - Create custom business logic

4. **Webhook API**
   - Bidirectional communication
   - Trigger actions from n8n
   - Secure webhook endpoints

## 📁 New Files

### Backend
- `backend/services/n8n-webhook.service.js` - Webhook service implementation
- `backend/routes/webhooks.js` - Webhook API endpoints

### Configuration
- `docker-compose.yml` - n8n Docker setup
- `n8n_workflows/` - Pre-built workflow templates
  - `srs-generated-workflow.json`
  - `project-created-workflow.json`
  - `health-check-workflow.json`

### Documentation
- `N8N_SETUP.md` - Initial setup guide
- `N8N_INTEGRATION.md` - Complete integration guide
- `N8N_SETUP_CHECKLIST.md` - Step-by-step checklist
- `NGROK_SETUP.md` - Public webhook setup
- `setup-n8n.bat` - Automated setup script

## 🚀 Quick Start

1. **Install Docker Desktop** (if not already installed)
   - Download: https://www.docker.com/products/docker-desktop/

2. **Run Setup Script**
   ```bash
   setup-n8n.bat
   ```

3. **Configure Webhooks**
   - Open `.env` file
   - Set `N8N_ENABLED=true`
   - Set `N8N_WEBHOOK_SECRET` to a random string

4. **Import Workflows**
   - Open http://localhost:5678
   - Import workflows from `n8n_workflows/` folder

5. **Start Using!**
   - Generate an SRS
   - Watch webhooks trigger automatically

## 📚 Documentation

- **Setup Guide:** See `N8N_SETUP.md`
- **Integration Guide:** See `N8N_INTEGRATION.md`
- **Checklist:** See `N8N_SETUP_CHECKLIST.md`

## 🔧 Environment Variables

Add to your `.env` file:
```ini
# n8n Webhook Configuration
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=your_secret_here
```

## 🎯 Use Cases

- **Team Notifications:** Alert team when SRS is ready
- **Automated Backup:** Save documents to Google Drive
- **Task Management:** Create Trello/Jira tickets automatically
- **Analytics:** Track usage in Google Sheets
- **Custom Integrations:** Connect to any API

## 🛠 API Endpoints

### New Webhook Routes

- `POST /api/webhooks/n8n/:webhookType` - Receive webhooks from n8n
- `POST /api/webhooks/test` - Test n8n connection
- `GET /api/webhooks/status` - Check webhook configuration
- `POST /api/webhooks/manual-trigger` - Manually trigger webhooks

## 🔄 Integration Points

Webhooks are automatically sent on:
- ✅ Project creation (`/api/projects/save`)
- ✅ SRS generation (`/api/projects/enterprise/generate`)
- ✅ Prototype generation (`/api/projects/generate-prototype`)

## 🎨 Workflow Templates

Three ready-to-use workflows included:

1. **SRS Generated** - Full notification workflow with Slack, Email, and webhooks
2. **Project Created** - Simple logging and tracking
3. **Health Check** - Test n8n connectivity

## 🌐 Public Webhooks (Optional)

For external services, use ngrok:
```bash
ngrok http 5678
```

See `NGROK_SETUP.md` for details.

## 📊 Monitoring

- View webhook executions at: http://localhost:5678
- Check backend logs for `[n8n]` messages
- Test connection via API endpoint

## 🐛 Troubleshooting

See `N8N_INTEGRATION.md` for:
- Common issues and fixes
- Connection problems
- Debugging tips

## 🎓 Learn More

- n8n Documentation: https://docs.n8n.io/
- Workflow Templates: https://n8n.io/workflows/
- Community: https://community.n8n.io/

## ⚙️ Technical Details

### Architecture
```
DocuVerse Backend (Node.js)
    ↓ Webhook POST
n8n (Docker)
    ↓ Actions
Slack, Email, APIs, etc.
```

### Service Design
- Non-blocking async calls
- Graceful error handling
- Configurable timeouts
- Secure authentication

### Performance
- 5-second timeout per webhook
- Parallel notifications supported
- Silent failure for analytics

---

**Ready to automate?** Run `setup-n8n.bat` and get started! 🚀
