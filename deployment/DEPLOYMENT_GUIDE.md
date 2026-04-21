# 🚀 E-Sim By ELECTRON - Guide de Déploiement

Ce guide couvre toutes les options de déploiement pour votre plateforme E-Sim.

---

## 📋Prérequis

- Node.js 18+
- Docker & Docker Compose
- Git
- Compte chez un fournisseur cloud

---

## 🐳 Option 1: Docker (Recommandé)

### Développement Local

```bash
# Clonez le projet
git clone https://github.com/IlarionDossouyovo/E-Sim.git
cd E-Sim

# Lancez avec Docker Compose
docker-compose -f deployment/docker-compose.dev.yml up -d

# L'application est disponible sur http://localhost:3000
```

### Production

```bash
# Configurez les variables d'environnement
cp deployment/.env.production .env

# Éditez .env avec vos clés API

# Lancez les services
docker-compose -f deployment/docker-compose.prod.yml up -d --build

# Vérifiez les logs
docker-compose -f deployment/docker-compose.prod.yml logs -f
```

### Commandes Utiles

```bash
# Redémarrer l'application
docker-compose -f deployment/docker-compose.prod.yml restart app

# Voir les statuts
docker-compose -f deployment/docker-compose.prod.yml ps

# Mettre à jour
git pull origin main
docker-compose -f deployment/docker-compose.prod.yml up -d --build

# Arrêter
docker-compose -f deployment/docker-compose.prod.yml down
```

---

## ☁️ Option 2: Railway.app

```bash
# Installez Railway CLI
npm install -g @railway/cli

# Connectez votre compte
railway login

# Initialisez le projet
cd E-Sim
railway init

# Déployez
railway up

# Configurez les variables
railway variables set JWT_SECRET=votre-secret
railway variables set DATABASE_URL=postgresql://...
railway variables set STRIPE_SECRET_KEY=sk_...
```

**Plus d'info:** https://docs.railway.app

---

## 🔷 Option 3: Render.com

1. Créez un compte sur [render.com](https://render.com)
2. Connectez votre repo GitHub
3. Configurez:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `node backend/server.js`
4. Ajoutez les variables d'environnement

---

## 🟢 Option 4: Vercel

```bash
# Installez Vercel CLI
npm i -g vercel

# Déployez
cd E-Sim
vercel --prod
```

---

## 🐞 Option 5: DigitalOcean App Platform

1. Créez une app sur [DigitalOcean](https://digitalocean.com)
2. Connectez votre repo GitHub
3. Configurez le build et run command
4. Déployez!

---

## 🔧 Configuration Cloud

### Variables d'Environnement Requises

```env
# Auth
JWT_SECRET=your-secure-secret-key-min-32-chars

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base de données (optional)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-user
SMTP_PASS=your-pass
```

### Configuration SSL

Le nginx config inclut SSL. Générez vos certificats:

```bash
# Avec Let's Encrypt
certbot certonly --nginx -d esim-electron.com -d www.esim-electron.com
```

---

## 📊 Monitoring

### Métriques Included

- **Prometheus** - http://localhost:9090
- **Grafana** - http://localhost:3001

### Configurer Alerting

1. Configurez Slack/Discord webhook dans Grafana
2. Créez des alertes pour:
   - CPU > 80%
   - Memory > 85%
   - Response time > 2s

---

## 🔒 Checklist Sécurité

- [ ] Changer JWT_SECRET par défaut
- [ ] Activer HTTPS
- [ ] Configurer CORS
- [ ] Activer rate limiting
- [ ] Configurer firewall
- [ ] Activer monitoring
- [ ] Backup automatique

---

## 📞 Support

**Email:** support@esim-electron.com
**WhatsApp:** +33 1 23 45 67 89

---

*Guide généré pour E-Sim By ELECTRON - 2026*