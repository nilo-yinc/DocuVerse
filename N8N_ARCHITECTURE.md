# 🏗️ DocuVerse Studio - n8n Integration Architecture

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DocuVerse Studio                            │
│                                                                   │
│  ┌──────────────┐         ┌─────────────┐       ┌─────────────┐│
│  │   Frontend   │◄───────►│   Backend   │◄─────►│  Python SRS ││
│  │  (React/Vue) │         │  (Node.js)  │       │   Engine    ││
│  └──────────────┘         └─────────────┘       └─────────────┘│
│                                  │                                │
│                                  │ HTTP POST                     │
│                                  │ (Webhooks)                    │
│                                  ▼                                │
└──────────────────────────────────┼────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                              │
                    ▼                              ▼
          ┌─────────────────┐          ┌──────────────────┐
          │   n8n Docker    │          │  External APIs   │
          │   Container     │          │  (Optional)      │
          │                 │          └──────────────────┘
          │  ┌───────────┐  │
          │  │ Workflow  │  │
          │  │  Engine   │  │
          │  └───────────┘  │
          │                 │
          │  ┌───────────┐  │
          │  │ Webhook   │  │
          │  │ Handler   │  │
          │  └───────────┘  │
          └────────┬─────────┘
                   │
        ┌──────────┼──────────┬────────────┬──────────────┐
        │          │           │            │              │
        ▼          ▼           ▼            ▼              ▼
   ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐
   │ Slack  │ │ Email  │ │ Discord │ │  Google  │ │   300+    │
   │        │ │  SMTP  │ │         │ │  Sheets  │ │   Apps    │
   └────────┘ └────────┘ └─────────┘ └──────────┘ └───────────┘
```

## 🔄 Webhook Flow Diagram

### Outgoing Webhooks (DocuVerse → n8n → Services)

```
User Action
    │
    ├─► Generate SRS
    │       │
    │       ├─► Python Engine generates document
    │       │
    │       ├─► Backend saves project
    │       │
    │       └─► n8nWebhookService.notifySRSGenerated()
    │                   │
    │                   ├─► HTTP POST to n8n
    │                   │   URL: http://localhost:5678/webhook/srs-generated
    │                   │   Payload: { event, project, links }
    │                   │
    │                   └─► n8n Workflow Triggered
    │                           │
    │                           ├─► Extract Data
    │                           │
    │                           ├─► Send Slack Notification
    │                           │
    │                           ├─► Send Email Alert
    │                           │
    │                           ├─► Log to Google Sheets
    │                           │
    │                           └─► Return Success
    │
    ├─► Create Project
    │       │
    │       └─► n8nWebhookService.notifyProjectCreated()
    │               └─► n8n workflow processes event
    │
    └─► Generate Prototype
            │
            └─► n8nWebhookService.notifyPrototypeGenerated()
                    └─► n8n workflow processes event
```

### Incoming Webhooks (n8n → DocuVerse)

```
n8n Workflow
    │
    ├─► Regenerate SRS Action
    │       │
    │       └─► HTTP POST to DocuVerse
    │           URL: /api/webhooks/n8n/regenerate-srs
    │           Header: X-Webhook-Secret
    │           │
    │           ├─► Validate Secret
    │           │
    │           ├─► Find Project
    │           │
    │           └─► Trigger SRS Regeneration
    │
    ├─► Update Project Action
    │       │
    │       └─► HTTP POST to DocuVerse
    │           URL: /api/webhooks/n8n/update-project
    │           │
    │           └─► Update Database
    │
    └─► Send Email Action
            │
            └─► HTTP POST to DocuVerse
                URL: /api/webhooks/n8n/send-email-notification
                │
                └─► Queue Email
```

## 📦 Component Breakdown

### Backend Service Layer

```
n8n-webhook.service.js
│
├─► notifySRSGenerated(projectData)
│   ├─► Build payload
│   ├─► POST to /webhook/srs-generated
│   └─► Return result
│
├─► notifyProjectCreated(projectData)
│   └─► POST to /webhook/project-created
│
├─► notifyPrototypeGenerated(projectId, url)
│   └─► POST to /webhook/prototype-generated
│
├─► trackUserActivity(userId, action, metadata)
│   └─► POST to /webhook/user-activity
│
├─► handleIncomingWebhook(type, payload)
│   ├─► regenerate-srs
│   ├─► update-project
│   └─► send-email-notification
│
└─► testConnection()
    └─► POST to /webhook/health-check
```

### API Routes Layer

```
webhooks.js
│
├─► POST /api/webhooks/n8n/:webhookType
│   ├─► Verify webhook secret
│   ├─► Call service.handleIncomingWebhook()
│   └─► Return response
│
├─► POST /api/webhooks/test
│   └─► Test n8n connectivity
│
├─► GET /api/webhooks/status
│   └─► Return configuration
│
└─► POST /api/webhooks/manual-trigger
    ├─► Validate user & project
    └─► Manually trigger webhook
```

## 🔐 Security Flow

```
Incoming Webhook Request
    │
    ├─► Check X-Webhook-Secret header
    │       │
    │       ├─► Match? Continue
    │       └─► No match? Return 401
    │
    ├─► Parse payload
    │
    ├─► Validate webhook type
    │
    ├─► Process request
    │
    └─► Return response
```

## 📊 Data Flow

### SRS Generation Example

```
1. User submits SRS form
        ↓
2. Frontend → Backend API
   POST /api/projects/enterprise/generate
        ↓
3. Backend → Python Engine
   POST http://127.0.0.1:8000/generate_srs
        ↓
4. Python generates document
        ↓
5. Backend saves project to MongoDB
        ↓
6. Backend → n8n Webhook Service
   notifySRSGenerated(projectData)
        ↓
7. Service → n8n
   POST http://localhost:5678/webhook/srs-generated
   {
     "event": "srs.generated",
     "project": {...},
     "links": {...}
   }
        ↓
8. n8n Workflow Executes
   ├─► Validates event
   ├─► Extracts data
   ├─► Sends Slack message
   ├─► Sends email
   └─► Logs to sheets
        ↓
9. n8n → Backend (Response)
   { "success": true }
        ↓
10. Backend → Frontend
    { "srs_document_path": "..." }
```

## 🌐 Network Topology

### Local Development

```
┌─────────────────────────────────────────┐
│           Your Computer                  │
│                                          │
│  Frontend          Backend      Python  │
│  :5173        →    :5000    →   :8000   │
│                      ↓                   │
│                    n8n                   │
│                   :5678                  │
│                      ↓                   │
│              (localhost only)            │
└─────────────────────────────────────────┘
```

### With ngrok (Public Access)

```
┌─────────────────────────────────────────┐
│           Your Computer                  │
│                                          │
│  Frontend     Backend     Python    n8n │
│  :5173  →     :5000  →   :8000    :5678 │
│                                     ↓    │
└─────────────────────────────────────┼───┘
                                      │
                                 ┌────▼────┐
                                 │  ngrok  │
                                 │ tunnel  │
                                 └────┬────┘
                                      │
                        ┌─────────────▼─────────────┐
                        │        Internet           │
                        │  External Services Can    │
                        │  Send Webhooks to n8n     │
                        └───────────────────────────┘
```

### Production Deployment

```
┌──────────────────────────────────────────────────┐
│              Cloud Provider                       │
│                                                   │
│  ┌────────────┐    ┌────────────┐   ┌─────────┐ │
│  │  Frontend  │    │  Backend   │   │  Python │ │
│  │   Server   │◄──►│   Server   │◄─►│  Engine │ │
│  │ (Vercel)   │    │ (Railway)  │   │  (VPS)  │ │
│  └────────────┘    └─────┬──────┘   └─────────┘ │
│                          │                        │
│                     ┌────▼─────┐                  │
│                     │   n8n    │                  │
│                     │  Cloud   │                  │
│                     └────┬─────┘                  │
└──────────────────────────┼────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼─────┐            ┌─────▼──────┐
         │  Slack   │            │  Gmail     │
         │  Teams   │            │  Services  │
         └──────────┘            └────────────┘
```

## 🎯 Integration Points

```
DocuVerse Backend
│
├─► server.js
│   └─► app.use('/api/webhooks', webhooksRouter)
│
├─► routes/projects.js
│   ├─► POST /save → notifyProjectCreated()
│   ├─► POST /generate-prototype → notifyPrototypeGenerated()
│   └─► POST /enterprise/generate → notifySRSGenerated()
│
├─► routes/webhooks.js
│   ├─► POST /n8n/:webhookType
│   ├─► POST /test
│   ├─► GET /status
│   └─► POST /manual-trigger
│
└─► services/n8n-webhook.service.js
    ├─► Outgoing webhooks (4 methods)
    ├─► Incoming handlers (3 methods)
    └─► Utility methods (2 methods)
```

## 🔄 Async Processing

```
Request Flow (Non-Blocking)
│
├─► User Request
│       │
│       ├─► Main Operation (Save/Generate)
│       │       │
│       │       ├─► Database Write
│       │       │
│       │       └─► Continue ───┐
│       │                       │
│       └─► Webhook Call        │
│               │               │
│               ├─► Async      │
│               │   (5s timeout)│
│               │               │
│               └─► Fire & Forget
│                               │
└───────────────────────────────┘
                                │
                                ▼
                        Response to User
                        (Doesn't wait for webhook)
```

## 📈 Scalability

```
Single Instance
DocuVerse → n8n → Services

Load Balanced
┌──────────────┐
│ DocuVerse 1  │──┐
├──────────────┤  │
│ DocuVerse 2  │──┼──► n8n Cluster ──► Services
├──────────────┤  │
│ DocuVerse 3  │──┘
└──────────────┘

With Queue (Advanced)
DocuVerse → Redis Queue → n8n Workers → Services
```

## 🎓 Legend

```
─►   Data Flow
◄─►  Bidirectional
│    Connection
┌─┐  Component
└─┘  Container
```

---

**For detailed implementation, see:**
- `N8N_INTEGRATION.md` - Complete guide
- `N8N_IMPLEMENTATION_SUMMARY.md` - Technical details
- `N8N_QUICK_REFERENCE.md` - Quick commands
