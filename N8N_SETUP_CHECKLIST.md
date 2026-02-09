# 🔧 DocuVerse Studio - n8n Webhook Setup Checklist

## ✅ Pre-Setup

- [ ] Docker Desktop installed and running
- [ ] Node.js and npm installed
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] `.env` file created with API keys

## ✅ n8n Setup

- [ ] Run `docker-compose up -d` or `setup-n8n.bat`
- [ ] Access n8n at http://localhost:5678
- [ ] Create n8n account (email + password)
- [ ] Import workflows from `n8n_workflows/`:
  - [ ] `health-check-workflow.json`
  - [ ] `project-created-workflow.json`
  - [ ] `srs-generated-workflow.json`
- [ ] Activate all imported workflows

## ✅ Environment Configuration

- [ ] Open `.env` file
- [ ] Set `N8N_ENABLED=true`
- [ ] Set `N8N_WEBHOOK_URL=http://localhost:5678` (or ngrok URL for public access)
- [ ] Generate and set `N8N_WEBHOOK_SECRET` (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Save `.env` file

## ✅ Backend Integration

- [ ] Restart backend: `npm run dev` (or restart if already running)
- [ ] Check logs for `[n8n]` messages
- [ ] Test connection: Visit http://localhost:5000/api/webhooks/status (requires auth)

## ✅ Testing

- [ ] Create a new project in DocuVerse
- [ ] Check n8n executions: http://localhost:5678 → "Executions"
- [ ] Verify webhook received data
- [ ] Generate an SRS document
- [ ] Check if notification workflow triggered
- [ ] View execution details in n8n

## ✅ Customization (Optional)

- [ ] Add Slack integration:
  - [ ] Create Slack webhook URL
  - [ ] Update workflow with Slack credentials
  - [ ] Test Slack notifications
- [ ] Add Email notifications:
  - [ ] Configure SMTP settings in workflow
  - [ ] Add recipient email
  - [ ] Test email delivery
- [ ] Add Discord/Telegram/other integrations
- [ ] Create custom workflows for your needs

## ✅ Production Setup (Optional)

- [ ] Set up ngrok for public webhooks:
  - [ ] Install ngrok
  - [ ] Run `ngrok http 5678`
  - [ ] Update `N8N_WEBHOOK_URL` with ngrok URL
  - [ ] Update docker-compose.yml WEBHOOK_URL
  - [ ] Restart n8n: `docker-compose restart`
- [ ] OR deploy n8n to cloud (Railway, DigitalOcean, n8n Cloud)
- [ ] Update production URLs in `.env`
- [ ] Test webhooks from external services

## ✅ Verification

- [ ] All workflows active in n8n
- [ ] Backend shows `[n8n]` logs
- [ ] Webhook test endpoint returns success
- [ ] SRS generation triggers notification
- [ ] Project creation triggers notification
- [ ] No errors in backend or n8n logs

## 🎉 Success Criteria

You've successfully set up n8n webhooks when:
1. ✅ n8n is running (docker ps shows n8n container)
2. ✅ Workflows are imported and active
3. ✅ Backend connects to n8n successfully
4. ✅ Creating a project/generating SRS triggers webhooks
5. ✅ You can see executions in n8n dashboard

## 📚 Documentation Reference

- **Setup Guide:** `N8N_SETUP.md`
- **Integration Guide:** `N8N_INTEGRATION.md`
- **Troubleshooting:** `N8N_INTEGRATION.md` (Troubleshooting section)

## 🆘 Getting Help

If something doesn't work:
1. Check the troubleshooting section in `N8N_INTEGRATION.md`
2. View n8n logs: `docker-compose logs -f n8n`
3. View backend logs in your terminal
4. Check n8n execution details for errors
5. Verify all environment variables are set correctly

## 🚀 Next Steps

After setup:
- Customize notification templates
- Add more integrations (Google Sheets, Trello, etc.)
- Create conditional workflows
- Set up error handling
- Monitor webhook performance

---

**Need help?** Check the documentation or raise an issue in the repository.
