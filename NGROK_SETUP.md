# Setting Up Public Webhook URL with ngrok

## Why You Need This
Localhost URLs (`http://localhost:5678`) only work on your local machine. External services can't reach them. ngrok creates a public tunnel to your local n8n instance.

## Step-by-Step Setup

### 1. Install ngrok

**Option A: Direct Download (Recommended)**
1. Go to: https://ngrok.com/download
2. Download ngrok for Windows
3. Extract `ngrok.exe` to `D:\Desktop\AutoSRS\` (same folder as this file)

**Option B: Using Chocolatey**
```powershell
choco install ngrok
```

**Option C: Using Scoop**
```powershell
scoop install ngrok
```

### 2. Create ngrok Account (Free)
1. Sign up at: https://dashboard.ngrok.com/signup
2. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run this command (one-time setup):
```bash
ngrok authtoken YOUR_AUTH_TOKEN_HERE
```

### 3. Start Docker n8n First
```bash
cd D:\Desktop\AutoSRS
docker-compose up -d
```

Wait for n8n to start (check: http://localhost:5678)

### 4. Start ngrok Tunnel

**Option A: Run the batch file**
```bash
.\setup_ngrok.bat
```

**Option B: Manual command**
```bash
ngrok http 5678
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:5678
```

**Copy the HTTPS URL!** (e.g., `https://abc123xyz.ngrok-free.app`)

### 5. Update docker-compose.yml

Open `docker-compose.yml` and replace:
```yaml
- WEBHOOK_URL=https://YOUR_NGROK_URL/
```

With your actual ngrok URL:
```yaml
- WEBHOOK_URL=https://abc123xyz.ngrok-free.app/
```

### 6. Restart n8n
```bash
docker-compose restart
```

### 7. Your Public Webhook URLs

Production webhooks:
```
https://abc123xyz.ngrok-free.app/webhook/YOUR_PATH
```

Test webhooks:
```
https://abc123xyz.ngrok-free.app/webhook-test/YOUR_PATH
```

## Example Workflow in n8n

1. Open n8n: https://abc123xyz.ngrok-free.app (your ngrok URL)
2. Create new workflow
3. Add "Webhook" node:
   - Method: POST
   - Path: `autosrs-webhook`
4. Your public webhook URL is:
   ```
   https://abc123xyz.ngrok-free.app/webhook/autosrs-webhook
   ```

## Important Notes

⚠️ **ngrok Free Tier Limitations:**
- URL changes every time you restart ngrok
- 40 requests/minute limit
- Session timeout after 8 hours
- One tunnel at a time

**For Production:**
- Upgrade to ngrok Pro for static URLs
- Or deploy n8n to cloud (Railway, DigitalOcean, AWS)

## Alternative: n8n Cloud

If you want a permanent solution without ngrok:
1. Use n8n Cloud: https://n8n.io/cloud/
2. $20/month, includes public webhooks
3. No Docker/ngrok setup needed

## Troubleshooting

**Problem: "command not found: ngrok"**
- Make sure ngrok.exe is in your PATH or current directory
- Try running from the folder where ngrok.exe is located

**Problem: "ERR_NGROK_108"**
- You haven't added your auth token
- Run: `ngrok authtoken YOUR_TOKEN`

**Problem: "tunnel session failed"**
- Your auth token is invalid
- Get a new token from: https://dashboard.ngrok.com/get-started/your-authtoken

**Problem: Webhook not receiving data**
- Make sure n8n is running: `docker ps`
- Check the webhook path matches your n8n workflow
- Check ngrok dashboard: http://localhost:4040 (shows incoming requests)

**Problem: ngrok URL changes**
- This is normal for free tier
- Upgrade to ngrok Pro for static domains
- Or use ngrok config with reserved domain

## Keep ngrok Running

ngrok must stay running for webhooks to work!

**Windows: Run in background**
```bash
start /B ngrok http 5678
```

**Keep terminal open:**
- Don't close the PowerShell/CMD window where ngrok is running
- To run in background, use ngrok as Windows service (Pro feature)

## Security Best Practices

1. **Use Authentication**: Add basic auth to your n8n webhooks
2. **Validate Payloads**: Check webhook signatures/tokens
3. **Rate Limiting**: Monitor ngrok dashboard for abuse
4. **HTTPS Only**: Always use the HTTPS URL from ngrok

## Monitoring

View all webhook requests in real-time:
```
http://localhost:4040
```

This opens ngrok's web interface showing:
- All incoming requests
- Request/response data
- Replay requests for debugging
