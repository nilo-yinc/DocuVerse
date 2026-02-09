# 🎯 n8n Webhook Quick Reference

## 🚀 Quick Start (3 Steps)
```bash
# 1. Start n8n
docker-compose up -d

# 2. Update .env
N8N_ENABLED=true
N8N_WEBHOOK_SECRET=your_secret

# 3. Import workflows
Open http://localhost:5678
Import from n8n_workflows/
```

## 📡 Webhook Endpoints

### Outgoing (DocuVerse → n8n)
| Event | Endpoint | When Triggered |
|-------|----------|----------------|
| SRS Generated | `/webhook/srs-generated` | SRS document created |
| Project Created | `/webhook/project-created` | New project saved |
| Prototype Generated | `/webhook/prototype-generated` | Prototype HTML created |
| User Activity | `/webhook/user-activity` | User actions tracked |

### Incoming (n8n → DocuVerse)
| Action | Endpoint | Method |
|--------|----------|--------|
| Receive Webhook | `/api/webhooks/n8n/:type` | POST |
| Test Connection | `/api/webhooks/test` | POST |
| Get Status | `/api/webhooks/status` | GET |
| Manual Trigger | `/api/webhooks/manual-trigger` | POST |

## 🔐 Environment Variables
```ini
# Required
N8N_ENABLED=true                    # Enable webhooks
N8N_WEBHOOK_URL=http://localhost:5678  # n8n URL
N8N_WEBHOOK_SECRET=random_secret    # Security key
```

## 📋 Commands

### Docker
```bash
# Start n8n
docker-compose up -d

# Stop n8n
docker-compose down

# View logs
docker-compose logs -f n8n

# Restart n8n
docker-compose restart

# Check status
docker ps
```

### Backend
```bash
# Start backend
cd backend
npm run dev

# Test webhook
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ngrok (Public Webhooks)
```bash
# Start tunnel
ngrok http 5678

# Use the HTTPS URL in .env
N8N_WEBHOOK_URL=https://abc123.ngrok-free.app
```

## 🎨 Example Payloads

### SRS Generated
```json
{
  "event": "srs.generated",
  "timestamp": "2026-02-09T16:00:00Z",
  "project": {
    "id": "65f...",
    "name": "Project Name",
    "domain": "Domain",
    "shareId": "abc123",
    "documentPath": "/download_srs/..."
  },
  "links": {
    "view": "http://localhost:5173/projects/abc123",
    "download": "http://localhost:8000/download_srs/..."
  }
}
```

### Project Created
```json
{
  "event": "project.created",
  "timestamp": "2026-02-09T16:00:00Z",
  "project": {
    "id": "65f...",
    "name": "Project Name",
    "domain": "Domain",
    "shareId": "abc123",
    "userId": "user_id"
  }
}
```

## 🔧 Workflow Setup

### Import Workflow
1. Open n8n → http://localhost:5678
2. Click "Workflows" → "Add workflow"
3. Click "⋮" → "Import from File"
4. Select JSON file from `n8n_workflows/`
5. Click "Activate" toggle

### Configure Slack
1. Edit workflow
2. Click "Send Slack Notification" node
3. Click "Credentials" → "Create New"
4. Follow Slack OAuth flow
5. Update channel ID
6. Save & activate

### Configure Email
1. Edit workflow
2. Click "Send Email" node
3. Add SMTP credentials
4. Update recipient email
5. Save & activate

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Webhooks not firing | Check `N8N_ENABLED=true` in `.env` |
| Connection refused | Run `docker-compose restart` |
| 401 Unauthorized | Verify webhook secret matches |
| n8n not accessible | Check `docker ps`, restart Docker |
| Workflow not triggering | Ensure workflow is "Active" in n8n |

## 📊 Monitoring

```bash
# Check n8n status
docker ps | grep n8n

# View n8n logs
docker-compose logs -f n8n

# View backend logs
# Check terminal for [n8n] messages

# n8n Dashboard
http://localhost:5678
Click "Executions" to see webhook history
```

## 🎯 Common Use Cases

### Slack Notification
```
SRS Generated → n8n → Slack
✅ Built-in workflow ready to use
```

### Email Alert
```
Project Created → n8n → Email
✅ Configure SMTP in workflow
```

### Google Sheets Log
```
User Activity → n8n → Google Sheets
➕ Add Google Sheets node
```

### Discord Webhook
```
Prototype Generated → n8n → Discord
➕ Add HTTP Request node with Discord URL
```

## 🔗 Useful URLs

| Resource | URL |
|----------|-----|
| n8n Dashboard | http://localhost:5678 |
| Backend API | http://localhost:5000 |
| Webhook Status | http://localhost:5000/api/webhooks/status |
| ngrok Dashboard | http://localhost:4040 |
| n8n Docs | https://docs.n8n.io/ |
| Workflow Gallery | https://n8n.io/workflows/ |

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `N8N_SETUP.md` | Initial setup |
| `N8N_INTEGRATION.md` | **Complete guide** |
| `N8N_SETUP_CHECKLIST.md` | Step checklist |
| `N8N_README.md` | Quick overview |
| `NGROK_SETUP.md` | Public webhooks |
| `N8N_IMPLEMENTATION_SUMMARY.md` | Technical details |

## ⚡ Pro Tips

1. **Test First:** Use health-check workflow to verify connection
2. **Start Simple:** Begin with project-created workflow
3. **Monitor Logs:** Watch n8n executions for debugging
4. **Secure Secrets:** Use strong random webhook secret
5. **Use Templates:** Start with provided workflows
6. **Check Examples:** See n8n.io/workflows for ideas

## 🎓 Next Steps

1. ✅ Start n8n: `docker-compose up -d`
2. ✅ Update `.env`: Enable webhooks
3. ✅ Import workflows: Use provided JSON files
4. ✅ Test: Generate an SRS
5. ✅ Customize: Add your integrations
6. ✅ Monitor: Check n8n dashboard

---

**Need help?** See `N8N_INTEGRATION.md` for detailed guide
**Quick questions?** Check the troubleshooting table above

**Status:** ✅ Ready to use!
