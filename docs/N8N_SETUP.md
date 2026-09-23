# n8n Integration Guide for LEAD INTELLIGENCE OS

Your existing n8n container is running at `http://localhost:5678`.

## 1. How n8n Integrates with LEAD INTELLIGENCE OS

```
Browser / Frontend
    ↓
Next.js REST API (:3000)
    ↓ triggers research
n8n Webhook Endpoint (:5678/webhook/lead-research)
    ↓ executes nodes (sanitize -> fetch website -> audit signals -> call AI)
Post Results Webhook (http://host.docker.internal:3000/api/webhooks/n8n/research-result)
    ↓ validates X-N8N-Webhook-Secret
PostgreSQL Database (:5432)
```

## 2. Importing the Workflow into n8n

1. Open your n8n web interface at: [http://localhost:5678](http://localhost:5678).
2. Click **Workflows** → **Add Workflow** (or **Import from File**).
3. Select `workflows/n8n/Lead_Research_Workflow.json` from this project directory.
4. Click **Activate Workflow** (top right toggle).

## 3. Webhook Authentication & Security

- **Inbound Webhook Secret**: Configured via `N8N_WEBHOOK_SECRET` in `.env`
- Header: `X-N8N-Webhook-Secret: <YOUR_CONFIGURED_N8N_WEBHOOK_SECRET>`
- Any webhook request lacking or mismatching this header will be rejected with `401 Unauthorized`.
