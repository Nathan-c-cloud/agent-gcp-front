
# Agent GCP Frontend - Système d'Alertes

Application React/TypeScript pour la gestion des alertes avec backend Flask et intégration Firestore.

## 🚀 Fonctionnalités

- **Interface d'alertes** : Liste et détail des alertes avec données temps réel
- **Backend Flask** : API REST avec intégration Firestore et alert-engine
- **Données réelles** : Connexion à Google Cloud Firestore et services Cloud Functions
- **Proxy intelligent** : Redirection automatique des appels API frontend → backend
- **Types TypeScript** : Interfaces complètes pour un développement robuste

## Table des matières

- [Installation](#installation)
- [Backend - Configuration](#backend---configuration)
- [Développement local](#développement-local) 
- [Frontend seul](#frontend-seul)
- [Déploiement sur Firebase](#déploiement-sur-firebase)
- [Architecture](#architecture)

## Installation

### Frontend
```bash
npm install
```

### Backend 
```bash
cd backend
pip install -r requirements.txt
```

## Backend - Configuration

Le backend utilise Google Cloud Firestore et l'alert-engine pour les données réelles.

### Variables d'environnement requises

Créez le fichier `backend/.env` avec les valeurs suivantes :

```bash
# ====== VARIABLES REQUISES ======
# Project ID Google Cloud Platform  
GCP_PROJECT=votre-project-id

# URL du service alert-engine déployé sur Cloud Functions
ALERT_ENGINE_URL=https://us-west1-votre-project.cloudfunctions.net/alert-engine

# ====== VARIABLES OPTIONNELLES ======
# TTL pour le throttling des appels (en secondes) - défaut: 300
ALERT_REFRESH_TTL=180

# Nombre maximum d'alertes retournées - défaut: 50
MAX_ALERTS=50

# Timeout pour les appels HTTP vers alert-engine - défaut: 30
CALL_TIMEOUT_SECONDS=30

# Port du serveur Flask - défaut: 8080
PORT=8080
```

### Authentification Google Cloud

Le backend nécessite une authentification Google Cloud configurée :

```bash
# Connexion avec gcloud CLI (recommandé)
gcloud auth application-default login

# Ou définir le chemin vers le service account JSON
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### Démarrage du backend

```bash
# Option 1: Script automatisé
cd backend
bash start_real_backend.sh

# Option 2: Manuel avec variables d'environnement
cd backend
export GCP_PROJECT=votre-project-id
export ALERT_ENGINE_URL=https://us-west1-votre-project.cloudfunctions.net/alert-engine
python app.py
```

Le backend sera accessible sur : **http://localhost:8080**

### Endpoints disponibles

- `GET /health` - Health check
- `GET /alerts` - Récupération des alertes depuis Firestore
- `GET /alerts?sync=true` - Mode synchrone avec appel alert-engine
- `GET /alerts?ttl_override=0` - Force le refresh des données

## Développement local

### Démarrage complet (Backend + Frontend)

1. **Terminal 1 - Backend :**
```bash
cd backend
bash start_real_backend.sh
# ✅ Backend sur http://localhost:8080
```

2. **Terminal 2 - Frontend :**
```bash
npm run dev  
# ✅ Frontend sur http://localhost:3000 (ou 3001 si 3000 occupé)
```

3. **Ouvrir l'application :**
   - Aller sur http://localhost:3000 (ou le port affiché)
   - Cliquer sur l'onglet **"Alertes"** 
   - Les données Firestore s'affichent automatiquement !

### Configuration automatique

Le frontend est configuré avec un **proxy Vite** qui redirige automatiquement :
```
/api/* → http://localhost:8080/*
```

Aucune configuration supplémentaire nécessaire !

### Test de l'API backend

```bash
# Health check
curl http://localhost:8080/health

# Alertes depuis Firestore
curl http://localhost:8080/alerts

# Alertes avec données formatées 
curl -s http://localhost:8080/alerts | python -m json.tool
```

## Frontend seul

Pour développer uniquement l'interface (sans backend) :

```bash
npm run dev
```

L'application utilisera des données mockées si le backend n'est pas disponible.

## Déploiement sur Firebase

### Prérequis

1. Un compte Google/Firebase
2. Firebase CLI installé globalement

Si vous n'avez pas encore installé Firebase CLI, exécutez :

```bash
npm install -g firebase-tools
```

### Première configuration

1. **Connectez-vous à Firebase :**

```bash
firebase login
```

2. **Initialisez Firebase dans votre projet (si ce n'est pas déjà fait) :**

```bash
firebase init
```

Sélectionnez :
- **Hosting** : Configure files for Firebase Hosting
- Choisissez un projet Firebase existant 
- **Public directory** : `build` (déjà configuré dans firebase.json)
- **Configure as a single-page app** : `Yes`
- **Set up automatic builds and deploys with GitHub** : `No` (ou `Yes` si vous le souhaitez)

### Build et déploiement

1. **Créez le build de production :**

```bash
npm run build
```

Cela générera les fichiers optimisés dans le dossier `build/`.

2. **Déployez sur Firebase Hosting :**

```bash
firebase deploy
```

Ou pour déployer uniquement l'hosting :

```bash
firebase deploy --only hosting
```

3. **Votre application sera accessible à l'URL fournie par Firebase :**

```
https://votre-projet.web.app
https://votre-projet.firebaseapp.com
```

### Commandes utiles

- **Tester le build localement avant déploiement :**

```bash
firebase serve
```

- **Voir les déploiements précédents :**

```bash
firebase hosting:channel:list
```

- **Déployer sur un canal de prévisualisation :**

```bash
firebase hosting:channel:deploy preview
```

- **Annuler le dernier déploiement :**

```bash
firebase hosting:rollback
```

### Configuration Firebase (firebase.json)

Le fichier `firebase.json` est déjà configuré :

```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Cette configuration :
- Sert les fichiers depuis le dossier `build/`
- Redirige toutes les routes vers `index.html` (pour le routing côté client React)
- Ignore les fichiers inutiles lors du déploiement

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │ Proxy Vite   │    │ Backend Flask   │    │ Google Cloud     │
│   React/TS      │◄──►│ /api/* →     │◄──►│ Port 8080       │◄──►│ Firestore +      │
│   Port 3000     │    │ :8080        │    │ app.py          │    │ Alert-Engine     │
└─────────────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘
```

### Composants principaux

- **AlertsList** : Interface de liste des alertes
- **AlertDetail** : Vue détaillée d'une alerte (existant, préservé)
- **AlertService** : Service API avec hooks React
- **AlertAdapter** : Transformation des données Firestore → UI

### Flux de données

1. Frontend appelle `/api/alerts`
2. Proxy Vite redirige vers `localhost:8080/alerts` 
3. Backend Flask interroge Firestore
4. Backend déclenche alert-engine si TTL expiré
5. Données formatées retournées au frontend
6. AlertAdapter convertit pour AlertDetail

## Technologies utilisées

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Langage avec types stricts
- **Vite** - Build tool avec proxy intégré
- **Radix UI** - Composants UI accessibles  
- **Tailwind CSS** - Framework CSS utilitaire

### Backend  
- **Flask** - Framework web Python
- **Google Cloud Firestore** - Base de données NoSQL
- **Google Cloud Functions** - Alert-engine serverless
- **Requests** - Client HTTP Python

### Déploiement
- **Firebase Hosting** - Hébergement frontend
- **Google Cloud Run** - Hébergement backend (production)

## Scripts disponibles

### Frontend
- `npm run dev` - Lance le serveur de développement React
- `npm run build` - Crée le build de production
- `npm run preview` - Prévisualise le build localement

### Backend  
- `bash backend/start_real_backend.sh` - Démarre le backend avec Firestore
- `python backend/app.py` - Démarre manuellement (nécessite variables env)

### Tests API (développement)
```bash
# Health check backend
curl http://localhost:8080/health

# Alertes Firestore (format JSON lisible)  
curl -s http://localhost:8080/alerts | python -m json.tool

# Force refresh des alertes (ignore TTL)
curl http://localhost:8080/alerts?ttl_override=0
```

## Support

Pour toute question concernant le déploiement Firebase, consultez la [documentation officielle](https://firebase.google.com/docs/hosting).
  
