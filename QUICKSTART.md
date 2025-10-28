# ⚡ Démarrage Rapide - 5 Minutes

Guide pour installer et lancer l'application en local en 5 minutes.

---

## 🚀 Installation Complète (Frontend + Backend)

### 1️⃣ Cloner et installer

```bash
# Cloner le repo
git clone <repo-url>
cd agent-gcp-front

# Installer le frontend
npm install

# Installer le backend
cd backend
pip install -r requirements.txt
```

### 2️⃣ Configurer l'authentification backend

```bash
# Toujours depuis le dossier backend/

# Étape 1 : Créer le fichier .env depuis le template
cp .env.example .env

# Étape 2 : Générer le service account et les credentials
bash setup_service_account.sh
```

✅ Ce que fait `setup_service_account.sh` :
- Crée le service account Google Cloud
- Génère la clé JSON `service-account-key.json`
- Crée un fichier `.env.local` avec `GOOGLE_SERVICE_ACCOUNT_JSON`
- Configure les permissions

⚠️ **Action manuelle requise** : Copiez la ligne `GOOGLE_SERVICE_ACCOUNT_JSON` depuis `.env.local` vers votre `.env`

```bash
# La ligne à copier ressemble à :
# GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"agent-gcp-f6005",...}'
```

### 3️⃣ Lancer le backend

```bash
# Toujours dans backend/
python app.py
```

Vous devriez voir :
```
INFO:__main__:🚀 Démarrage du Backend Agent GCP
INFO:__main__:  ✅ /alerts - Système d'alertes
INFO:__main__:  ✅ /procedures - Système de démarches
 * Running on http://127.0.0.1:8080
```

### 4️⃣ Lancer le frontend (nouveau terminal)

```bash
# Depuis la racine du projet
npm run dev
```

Accédez à : **http://localhost:5173** 🎉

---

## 🧪 Vérifier que tout fonctionne

### Backend

```bash
# Health check
curl http://localhost:8080/health

# Récupérer les démarches
curl http://localhost:8080/procedures/

# Récupérer les alertes
curl http://localhost:8080/alerts/

# Tester l'alert-engine
curl -X POST "http://localhost:8080/alerts/trigger?limit=5&dry_run=true"
```

### Frontend

1. Ouvrir **http://localhost:5173**
2. Vérifier la console navigateur (F12) - pas d'erreur
3. Naviguer vers **"Démarches"** - devrait afficher 10 démarches
4. Naviguer vers **"Alertes"** - devrait afficher les alertes

---

## 📁 Structure des Commandes

```bash
agent-gcp-front/
├── 📦 Frontend (React + Vite)
│   ├── npm install          # Installer les dépendances
│   ├── npm run dev          # Lancer le dev server (port 5173)
│   └── npm run build        # Build pour production
│
└── 🐍 Backend (Flask + Python)
    ├── cd backend/
    ├── pip install -r requirements.txt   # Installer les dépendances
    ├── bash setup_service_account.sh     # Config initiale (1 fois)
    ├── python app.py                     # Lancer le serveur (port 8080)
    └── bash deploy.sh                    # Déployer sur Cloud Run
```

---

## 🔥 TL;DR - Commandes Essentielles

### Premier lancement (installation)

```bash
# Frontend
npm install

# Backend
cd backend

# 1. Créer le fichier .env
cp .env.example .env

# 2. Générer les credentials
bash setup_service_account.sh

# 3. Copier GOOGLE_SERVICE_ACCOUNT_JSON depuis .env.local vers .env
# Ouvrir .env.local, copier la ligne GOOGLE_SERVICE_ACCOUNT_JSON='...'
# et la coller à la fin de votre fichier .env

cd ..
```

### Lancement quotidien

**Terminal 1 (Backend)** :
```bash
cd backend
python app.py
```

**Terminal 2 (Frontend)** :
```bash
npm run dev
```

---

## ❌ Problèmes Courants

### "Impossible d'obtenir un token Google ID"

**Solution** :
```bash
cd backend

# 1. Vérifier que .env existe
ls -la .env

# 2. Régénérer les credentials
bash setup_service_account.sh

# 3. Copier GOOGLE_SERVICE_ACCOUNT_JSON depuis .env.local vers .env
# Ouvrir .env.local, copier la ligne complète et la coller dans .env

# 4. Redémarrer le serveur
python app.py
```

### "ModuleNotFoundError"

```bash
cd backend
pip install -r requirements.txt
```

### Le frontend ne charge pas les données

1. Vérifier que le backend tourne : `curl http://localhost:8080/health`
2. Vérifier la console navigateur (F12) pour les erreurs
3. Redémarrer les deux serveurs

### Port 8080 déjà utilisé

```bash
# Trouver le processus
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Tuer le processus ou changer de port dans .env
export PORT=8081
```

---

## 📚 Documentation Complète

- **[README.md](./backend/README.md)** - Documentation backend détaillée
- **[DEPLOYMENT.md](./backend/DEPLOYMENT.md)** - Guide de déploiement production
- **[ALERT_ENGINE_INTEGRATION.md](./backend/modules/ALERT_ENGINE_INTEGRATION.md)** - Intégration alert-engine

---

## ✅ Checklist de Démarrage

Installation initiale (1 fois) :
- [ ] `npm install` (frontend)
- [ ] `pip install -r requirements.txt` (backend)
- [ ] `cp .env.example .env` (backend)
- [ ] `bash setup_service_account.sh` (backend)
- [ ] Copier `GOOGLE_SERVICE_ACCOUNT_JSON` depuis `.env.local` vers `.env`

Lancement quotidien :
- [ ] Terminal 1 : `cd backend && python app.py`
- [ ] Terminal 2 : `npm run dev`
- [ ] Navigateur : http://localhost:5173

Vérifications :
- [ ] `curl http://localhost:8080/health` retourne `{"status":"healthy"}`
- [ ] Frontend charge sans erreur console
- [ ] Page Démarches affiche 10 items
- [ ] Page Alertes affiche les alertes

C'est parti ! 🚀
