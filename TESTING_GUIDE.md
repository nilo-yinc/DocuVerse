# 🚀 Complete Integration Testing - Step by Step

## ✅ STEP 1: Backend Code Test - PASSED ✓

```
✅ Configuration loaded correctly
✅ Service code working
✅ Payload generation working
✅ Backend integration ready
```

---

## 📦 STEP 2: Install Docker Desktop

### Option A: Direct Download (Recommended)
1. Open browser and go to: **https://www.docker.com/products/docker-desktop/**
2. Click "Download for Windows"
3. Run the installer (Docker Desktop Installer.exe)
4. Follow installation wizard
5. **Important:** Enable WSL 2 when prompted
6. Restart your computer

### Option B: Using winget (Automated)
```powershell
winget install Docker.DockerDesktop
```

### After Installation:
1. ✅ Start Docker Desktop from Start Menu
2. ✅ Wait for Docker to start (green whale icon in system tray)
3. ✅ Accept terms of service if prompted

**⏱️ This will take 5-10 minutes**

---

## 🐳 STEP 3: Start n8n Container

Once Docker is running:

```powershell
cd D:\Desktop\AutoSRS
docker-compose up -d
```

This will:
- Download n8n Docker image (~200MB, first time only)
- Create n8n container
- Start n8n service
- Create persistent storage

**Expected output:**
```
[+] Running 3/3
 ✔ Network autosrs_n8n_network  Created
 ✔ Volume "autosrs_n8n_data"    Created
 ✔ Container n8n                Started
```

**⏱️ First-time download: 2-5 minutes**

---

## 🌐 STEP 4: Setup n8n Account

1. Open browser to: **http://localhost:5678**

2. You'll see n8n welcome screen:
   ```
   ┌─────────────────────────┐
   │   Welcome to n8n        │
   │                         │
   │   Create your account   │
   │                         │
   │   Email: [_________]    │
   │   Password: [_______]   │
   │                         │
   │   [Create Account]      │
   └─────────────────────────┘
   ```

3. Create account with:
   - Email: your-email@example.com
   - Password: Strong password (min 8 chars)

4. Click "Create Account"

**⏱️ 2 minutes**

---

## 📥 STEP 5: Import Workflows

Once logged into n8n:

### 1. Import "Health Check" Workflow
   - Click **"Workflows"** in left sidebar
   - Click **"+ Add workflow"**
   - Click **"..." (three dots)** → **"Import from File"**
   - Navigate to: `D:\Desktop\AutoSRS\n8n_workflows\`
   - Select: **`health-check-workflow.json`**
   - Click **"Import"**
   - Toggle **"Active"** switch ON (should be green)

### 2. Import "Project Created" Workflow
   - Repeat above steps
   - Select: **`project-created-workflow.json`**
   - Activate workflow

### 3. Import "SRS Generated" Workflow
   - Repeat above steps
   - Select: **`srs-generated-workflow.json`**
   - Activate workflow

**✅ All 3 workflows should show as "Active" (green)**

**⏱️ 5 minutes**

---

## 🧪 STEP 6: Test Connection

### Test 1: Health Check (Direct)
Open browser to:
```
http://localhost:5678/webhook/health-check
```

Expected response:
```json
{
  "status": "ok",
  "service": "n8n",
  "timestamp": "2026-02-09T17:00:00Z",
  "source": null
}
```

### Test 2: Backend to n8n Connection

```powershell
cd D:\Desktop\AutoSRS\backend
node ..\test-n8n-integration.js
```

Expected output:
```
✅ Connected to n8n!
Response: { status: 'ok', service: 'n8n' }
```

**⏱️ 2 minutes**

---

## 🚀 STEP 7: Start Backend Server

Open new terminal:

```powershell
cd D:\Desktop\AutoSRS\backend
npm run dev
```

Expected output:
```
Server running on port 5000
[n8n] Webhook service initialized
```

Keep this terminal open!

**⏱️ 1 minute**

---

## 🎯 STEP 8: Full Integration Test

### Test via API Endpoint

Open another terminal:

```powershell
# Test webhook status (requires authentication)
curl http://localhost:5000/api/webhooks/status
```

Or test in browser:
```
http://localhost:5000/
```

**⏱️ 1 minute**

---

## 🎨 STEP 9: Generate SRS (Real Test!)

1. **Open Frontend:**
   - If frontend is running: `http://localhost:5173`
   - Or start frontend in new terminal:
     ```powershell
     cd D:\Desktop\AutoSRS\frontend
     npm run dev
     ```

2. **Create a Test Project:**
   - Login to DocuVerse
   - Create new project
   - Fill in minimal details
   - Click "Generate SRS"

3. **Watch the Magic! 🎉**
   - Check backend terminal for:
     ```
     [n8n] SRS generation notification sent successfully
     ```
   - Check n8n dashboard:
     - Go to http://localhost:5678
     - Click "Executions" in left sidebar
     - You should see: "srs-generated" workflow executed ✓

**⏱️ 3 minutes**

---

## ✅ SUCCESS CHECKLIST

After completing all steps, verify:

- [x] Docker Desktop installed and running
- [x] n8n container running (`docker ps` shows n8n)
- [x] n8n accessible at http://localhost:5678
- [x] 3 workflows imported and activated
- [x] Backend server running on port 5000
- [x] Backend shows `[n8n]` messages
- [x] Health check responds with JSON
- [x] SRS generation triggers webhook
- [x] Webhook execution visible in n8n dashboard

---

## 🐛 Troubleshooting

### Docker Won't Install
- Ensure Windows 10/11 64-bit
- Enable Virtualization in BIOS
- Install WSL 2: `wsl --install`

### n8n Won't Start
```powershell
# Check logs
docker-compose logs n8n

# Restart container
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose up -d
```

### Port 5678 Already in Use
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:5678"  # Change 5678 to 8080
```
Then access n8n at: http://localhost:8080

### Backend Can't Connect
1. Verify `.env` has:
   ```
   N8N_ENABLED=true
   N8N_WEBHOOK_URL=http://localhost:5678
   ```
2. Restart backend: Stop and run `npm run dev` again

---

## 📊 Expected Timeline

| Step | Description | Time |
|------|-------------|------|
| 1 | Backend test | ✅ Done |
| 2 | Install Docker | 5-10 min |
| 3 | Start n8n | 2-5 min (first time) |
| 4 | Setup account | 2 min |
| 5 | Import workflows | 5 min |
| 6 | Test connection | 2 min |
| 7 | Start backend | 1 min |
| 8 | Test API | 1 min |
| 9 | Generate SRS | 3 min |
| **Total** | | **~25-35 minutes** |

---

## 🎉 After Success

Once everything works, you can:

1. **Customize Workflows:**
   - Add Slack notifications
   - Configure email alerts
   - Add Google Sheets logging

2. **Monitor Activity:**
   - View executions: http://localhost:5678
   - Check backend logs for `[n8n]` messages

3. **Expand Integration:**
   - Add more webhook events
   - Create custom workflows
   - Connect to other services

---

## 📞 Need Help?

Refer to:
- `N8N_INTEGRATION.md` - Complete guide
- `N8N_QUICK_REFERENCE.md` - Quick commands
- `N8N_VISUAL_GUIDE.md` - Visual diagrams

---

**Ready to start? Begin with Step 2: Install Docker Desktop!** 🚀
