# n8n Setup Guide for AutoSRS

## Step 1: Install Docker Desktop

1. Download Docker Desktop for Windows:
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download the installer for Windows
   - Run the installer and follow the installation wizard
   - **Important**: Enable WSL 2 during installation (recommended)

2. After installation:
   - Restart your computer
   - Start Docker Desktop from the Start menu
   - Wait for Docker to fully start (you'll see a green indicator in the system tray)

## Step 2: Start n8n

Once Docker is running, open PowerShell/Command Prompt and run:

```bash
cd D:\Desktop\AutoSRS
docker-compose up -d
```

This will:
- Download the n8n Docker image (first time only)
- Start n8n container in detached mode
- Create persistent storage for your workflows

## Step 3: Access n8n

1. Open your browser and go to: http://localhost:5678
2. Create your n8n account (email + password)
3. You'll be taken to the n8n dashboard

## Step 4: Get Your Webhook URL

Your webhook URLs will follow this pattern:
```
http://localhost:5678/webhook/YOUR_WEBHOOK_PATH
```

Or for test webhooks:
```
http://localhost:5678/webhook-test/YOUR_WEBHOOK_PATH
```

### For Production Webhooks:
1. In n8n, create a new workflow
2. Add a "Webhook" node
3. Set the HTTP Method (GET/POST)
4. Set the path (e.g., "autosrs-webhook")
5. Your production webhook URL will be: `http://localhost:5678/webhook/autosrs-webhook`

## Step 5: Using with AutoSRS

To integrate with your AutoSRS backend:

1. Update your `.env` file with:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/autosrs-webhook
```

2. In your backend code, send POST requests to the webhook:
```python
import requests

webhook_url = "http://localhost:5678/webhook/autosrs-webhook"
data = {
    "srs_content": "...",
    "project_name": "..."
}
response = requests.post(webhook_url, json=data)
```

## Useful Docker Commands

```bash
# Start n8n
docker-compose up -d

# Stop n8n
docker-compose down

# View logs
docker-compose logs -f n8n

# Restart n8n
docker-compose restart

# Check if n8n is running
docker ps
```

## Exposing Webhooks Publicly (Optional)

For external services to access your webhooks, use one of these tools:

### Option 1: ngrok (Recommended for testing)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5678
```
This gives you a public URL like: `https://abc123.ngrok.io`
Your webhook becomes: `https://abc123.ngrok.io/webhook/autosrs-webhook`

### Option 2: Update docker-compose.yml for production
Replace `localhost` with your domain/IP in the environment variables.

## Troubleshooting

1. **Port 5678 already in use**:
   - Change `"5678:5678"` to `"8080:5678"` in docker-compose.yml
   - Access n8n at http://localhost:8080

2. **Docker not starting**:
   - Make sure Virtualization is enabled in BIOS
   - Check Windows Features: Hyper-V and WSL 2 should be enabled

3. **Can't access n8n**:
   - Check if container is running: `docker ps`
   - Check logs: `docker-compose logs n8n`

## Data Persistence

Your n8n data is stored in:
- Docker volume: `n8n_data` (credentials, settings)
- Local folder: `./n8n_workflows` (workflow files)

This ensures your workflows persist even if you restart the container.
