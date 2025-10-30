# 🚀 Guide de Déploiement - Agent GCP

Ce guide explique comment lancer l'application localement avec Docker et comment la déployer sur Google Cloud Run.

---

## 📋 Prérequis

### Pour le développement local
- Docker Desktop installé et en cours d'exécution
- Node.js 20+ (pour le développement frontend)
- Python 3.13+ (pour le développement backend)

### Pour le déploiement
- Compte Google Cloud Platform
- [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) installé et configuré
- Projet GCP créé avec facturation activée
- APIs activées :
  - Cloud Run API
  - Container Registry API
  - Firestore API

---

## 🐳 Lancement Local avec Docker

### Option 1 : Image Unifiée (Recommandée pour la production)

L'image unifiée contient le frontend (nginx) et le backend (Flask) dans un seul conteneur.

```bash
# 1. Build de l'image unifiée
docker build -t agent-gcp-unified:latest -f Dockerfile .

# 2. Lancer le conteneur
docker run -d -p 8080:8080 --name agent-gcp agent-gcp-unified:latest

# 3. Accéder à l'application
# Ouvrir dans le navigateur : http://localhost:8080

# 4. Arrêter le conteneur
docker stop agent-gcp

# 5. Supprimer le conteneur
docker rm agent-gcp
```

### Option 2 : Docker Compose (Pour le développement)

Docker Compose lance le frontend et le backend dans des conteneurs séparés.

```bash
# 1. Lancer tous les services
docker-compose up -d

# 2. Voir les logs
docker-compose logs -f

# 3. Accéder à l'application
# Frontend : http://localhost:3000
# Backend : http://localhost:8080

# 4. Arrêter les services
docker-compose down

# 5. Rebuild après modifications
docker-compose up --build -d
```

---

## ☁️ Déploiement sur Google Cloud Run

### Étape 1 : Configuration initiale

```bash
# 1. Se connecter à Google Cloud
gcloud auth login

# 2. Définir le projet
gcloud config set project VOTRE_PROJECT_ID

# 3. Configurer Docker pour GCR
gcloud auth configure-docker
```

### Étape 2 : Build et Push de l'image

```bash
# 1. Build de l'image unifiée
docker build -t agent-gcp-unified:latest -f Dockerfile .

# 2. Tagger l'image pour GCR
docker tag agent-gcp-unified:latest gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:latest

# 3. Pousser l'image vers GCR
docker push gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:latest
```

### Étape 3 : Déploiement sur Cloud Run

```bash
# Déployer le service
gcloud run deploy agent-gcp-unified \
  --image gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:latest \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080
```

**Options importantes :**
- `--allow-unauthenticated` : Autorise l'accès public (retirer pour un accès privé)
- `--region us-west1` : Choisir la région la plus proche de vos utilisateurs
- `--port 8080` : Port exposé par le conteneur

### Étape 4 : Vérification

```bash
# 1. Obtenir l'URL du service
gcloud run services describe agent-gcp-unified --region us-west1 --format='value(status.url)'

# 2. Tester le health check
curl https://VOTRE_URL/health

# 3. Voir les logs
gcloud run services logs read agent-gcp-unified --region us-west1 --limit 50
```

---

## 🔄 Mise à jour de l'application

Pour mettre à jour l'application déployée :

```bash
# 1. Faire les modifications dans le code

# 2. Rebuild l'image
docker build -t agent-gcp-unified:latest -f Dockerfile .

# 3. Tagger avec une nouvelle version (optionnel mais recommandé)
docker tag agent-gcp-unified:latest gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:v1.1

# 4. Pousser la nouvelle image
docker push gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:v1.1

# 5. Redéployer sur Cloud Run
gcloud run deploy agent-gcp-unified \
  --image gcr.io/VOTRE_PROJECT_ID/agent-gcp-unified:v1.1 \
  --platform managed \
  --region us-west1
```

---

## 📁 Structure de l'image unifiée

```
Dockerfile (image unifiée)
├── Stage 1: Build Frontend (node:20-alpine)
│   ├── npm ci (installation des dépendances)
│   ├── Copie .env.docker → .env.local
│   └── npm run build (build Vite)
│
└── Stage 2: Runtime (python:3.13-slim)
    ├── Installation nginx + supervisor
    ├── Backend Python/Flask (port 5000)
    ├── Frontend statique (nginx sur port 8080)
    └── Supervisor gère les 2 processus
```

**Architecture de communication :**
- **Client** → Nginx (port 8080)
- **Nginx** → Flask backend (localhost:5000) pour `/api/`, `/auth/`, `/alerts/`, `/veille/`
- **Nginx** → Frontend statique pour le reste

---

## 🔧 Configuration des variables d'environnement

### Fichiers d'environnement

- **`.env.docker`** : Variables pour le build Docker (utilisé par Vite)
- **`.env.local`** : Variables pour le développement local
- **`.env.production`** : Variables pour la production (Cloud Run URLs)

### Variables importantes

```bash
# Frontend (Vite)
VITE_API_URL=                    # Vide en Docker (utilise relative URLs)
VITE_NODE_ENV=production
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_AUTH_DOMAIN=...

# Backend (Flask)
PORT=5000                        # Port du backend Flask
GOOGLE_APPLICATION_CREDENTIALS=  # Chemin vers service-account-key.json
JWT_SECRET=...                   # Secret pour les tokens JWT
```

---

## 🐛 Dépannage

### L'application ne démarre pas localement

```bash
# Vérifier les logs du conteneur
docker logs agent-gcp

# Vérifier que le port 8080 n'est pas utilisé
netstat -an | grep 8080

# Rebuild sans cache
docker build --no-cache -t agent-gcp-unified:latest -f Dockerfile .
```

### Erreur 502 sur Cloud Run

```bash
# Vérifier les logs Cloud Run
gcloud run services logs read agent-gcp-unified --region us-west1 --limit 100

# Vérifier que le service démarre (peut prendre 30-60 secondes)
# Attendre quelques instants et réessayer
```

### Le backend ne répond pas

```bash
# Dans docker-compose, vérifier le backend
docker-compose logs backend

# Dans l'image unifiée, vérifier les logs supervisor
docker exec agent-gcp sh -c "cat /var/log/backend.err.log"
docker exec agent-gcp sh -c "cat /var/log/backend.out.log"
```

### Problèmes de credentials Firestore

Le fichier `backend/service-account-key.json` doit être présent et valide.

```bash
# Vérifier que le fichier existe
ls -la backend/service-account-key.json

# Télécharger une nouvelle clé depuis GCP Console si nécessaire
# IAM & Admin → Service Accounts → Create Key (JSON)
```

---

## 📊 Monitoring et Logs

### Logs en temps réel (Cloud Run)

```bash
# Logs en continu
gcloud run services logs tail agent-gcp-unified --region us-west1

# Filtrer les erreurs
gcloud run services logs read agent-gcp-unified --region us-west1 | grep -i error
```

### Métriques Cloud Run

Accéder à [Google Cloud Console](https://console.cloud.google.com) :
1. Cloud Run → agent-gcp-unified
2. Onglet "Metrics" pour voir :
   - Requêtes par seconde
   - Latence
   - Utilisation CPU/Mémoire
   - Taux d'erreur

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commit** les fichiers suivants :
   - `service-account-key.json`
   - `.env.local`
   - `.env.production`

2. **Utiliser des secrets** pour les variables sensibles :
   ```bash
   # Créer un secret
   echo -n "mon-secret" | gcloud secrets create jwt-secret --data-file=-
   
   # Utiliser dans Cloud Run
   gcloud run deploy agent-gcp-unified \
     --set-secrets JWT_SECRET=jwt-secret:latest
   ```

3. **Limiter l'accès public** si nécessaire :
   ```bash
   # Déployer sans accès public
   gcloud run deploy agent-gcp-unified \
     --no-allow-unauthenticated
   ```

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs : `docker logs` ou `gcloud run services logs`
2. Consulter la documentation Google Cloud Run
3. Vérifier que toutes les APIs sont activées dans GCP

---

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] `service-account-key.json` est présent dans `backend/`
- [ ] Toutes les variables d'environnement sont configurées
- [ ] L'image build localement sans erreur
- [ ] L'application fonctionne en local (http://localhost:8080)
- [ ] Le projet GCP est configuré correctement
- [ ] Les APIs Cloud Run et Container Registry sont activées
- [ ] L'image est poussée sur GCR
- [ ] Le service Cloud Run est déployé
- [ ] L'URL Cloud Run est accessible et fonctionne

---

**🎉 Votre application est maintenant déployée et accessible au monde entier !**
