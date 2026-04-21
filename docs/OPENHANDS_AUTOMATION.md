# 🤖 OpenHands AI Automation Setup

Ce document explique comment configurer les automations avec OpenHands Cloud pour gérer automatiquement votre plateforme E-Sim.

## 🚀 Configuration des Automations

### Prérequis

1. Un compte OpenHands Cloud
2. Une clé API (API Key)
3. Accès au Dashboard

### Installation

```bash
# Cloner le projet
git clone https://github.com/IlarionDossouyovo/E-Sim.git
cd E-Sim

# Installer les dépendances
cd backend && npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

---

## 📋 Types d'Automations

### 1. Daily Report Automation

Génère un rapport quotidien des ventes et l'envoie par email.

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Sales Report",
    "prompt": "Execute the following: 1) Call the E-Sim API at localhost:3000/api/automation/daily-sales-report to generate today'\''s sales report. 2) Format the results as a clean HTML table. 3) Save to workspace/sales-report-[DATE].html",
    "trigger": {
      "type": "cron",
      "schedule": "0 9 * * *",
      "timezone": "Europe/Paris"
    }
  }'
```

### 2. Support Ticket Summarizer

Analyse les tickets de support et génère un résumé.

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Ticket Summary",
    "prompt": "Fetch all support tickets from the E-Sim API, analyze common issues, and generate a summary report with recommendations.",
    "trigger": {
      "type": "cron",
      "schedule": "0 18 * * *",
      "timezone": "Europe/Paris"
    }
  }'
```

### 3. Inventory Alert Monitor

Vérifie les niveaux de stock et alerte si bas.

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Inventory Alert",
    "prompt": "Check the E-Sim product inventory via API. If any product has stock below 50 units, send an alert email to admin@esim-electron.com.",
    "trigger": {
      "type": "cron",
      "schedule": "0 8 * * *",
      "timezone": "Europe/Paris"
    }
  }'
```

### 4. Competitor Price Monitor

Surveille les prix des concurrents.

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Competitor Price Monitor",
    "prompt": "Scrape competitor prices from Airalo and Holafly websites for key destinations. Compare with E-Sim prices and generate a price adjustment recommendation report.",
    "trigger": {
      "type": "cron",
      "schedule": "0 2 * * *",
      "timezone": "Europe/Paris"
    }
  }'
```

### 5. Weekly Content Generator

Génère du contenu pour les réseaux sociaux.

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Social Content",
    "prompt": "Generate 3 social media posts for the week: 1 Instagram, 1 Twitter, 1 Facebook. Topics: E-Sim travel tips, new destinations, customer testimonials. Save to workspace/social-posts-[WEEK].md",
    "trigger": {
      "type": "cron",
      "schedule": "0 10 * * 1",
      "timezone": "Europe/Paris"
    }
  }'
```

---

## 🔧 Configuration Avancée

### Avec Plugins

Pour des automations plus complexes, utilisez des plugins:

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/plugin" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Analytics Report",
    "plugins": [
      {"source": "github:OpenHands/extensions", "repo_path": "skills/datadog"},
      {"source": "github:OpenHands/extensions", "repo_path": "skills/github"}
    ],
    "prompt": "Generate a comprehensive weekly report including: 1) Sales data from E-Sim API, 2) GitHub activity, 3) Customer metrics. Compile into a single PDF report.",
    "trigger": {
      "type": "cron",
      "schedule": "0 9 * * 1",
      "timezone": "Europe/Paris"
    },
    "timeout": 600
  }'
```

---

## 📊 Monitoring des Runs

### Lister les automations

```bash
curl "${OPENHANDS_HOST}/api/automation/v1?limit=20" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}"
```

### Voir les détails d'une automation

```bash
curl "${OPENHANDS_HOST}/api/automation/v1/{automation_id}" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}"
```

### Déclencher manuellement

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/{automation_id}/dispatch" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}"
```

### Voir les runs

```bash
curl "${OPENHANDS_HOST}/api/automation/v1/{automation_id}/runs?limit=20" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}"
```

---

## ⏰ Planification (Cron)

| Fréquence | Expression Cron |
|-----------|----------------|
| Chaque jour à 9h | `0 9 * * *` |
| Chaque semaine (Lundi) | `0 9 * * 1` |
| Chaque mois (1er) | `0 9 1 * *` |
| Toutes les heures | `0 * * * *` |
| Toutes les 15 minutes | `*/15 * * * *` |
| Tous les jours ouvrables | `0 9 * * 1-5` |

---

## 🔐 Variables d'Environnement

Ajoutez ces variables à votre `.env`:

```env
# OpenHands
OPENHANDS_API_KEY=your_api_key_here
OPENHANDS_HOST=https://app.all-hands.dev

# E-Sim API
ESIM_API_URL=http://localhost:3000/api

# Email (pour les notifications)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🚨 Alerts & Notifications

Configurez des webhooks pour être alerté:

```javascript
// Exemple de configuration webhook
const webhookConfig = {
  events: [
    'order.created',
    'order.paid',
    'payment.failed',
    'support.ticket.created',
    'inventory.low'
  ],
  url: 'https://your-app.com/webhook',
  secret: 'your_webhook_secret'
};
```

---

## 📈 Métriques de Succès

| Métrique | Objectif |
|----------|----------|
| Automation success rate | > 95% |
| Average execution time | < 60s |
| Alerts responded | < 5 min |
| Reports generated | 100% on time |

---

## 🔗 Ressources

- [OpenHands Documentation](https://docs.openhands.dev/)
- [API Reference](https://docs.openhands.dev/api-reference)
- [Skills Repository](https://github.com/OpenHands/extensions)

---

*Document généré pour E-Sim By ELECTRON - 2026*