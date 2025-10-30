# 🚀 Guide de déploiement sur Google Cloud Run

## 1. Préparation du projet Google Cloud

```bash
# 1. Créer un nouveau projet (ou utiliser existant)
gcloud projects create agent-gcp-prod-12345
gcloud config set project agent-gcp-prod-12345

# 2. Activer les APIs nécessaires
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 3. Créer un repository Artifact Registry
gcloud artifacts repositories create agent-gcp-repo \
  --repository-format=docker \
  --location=europe-west1
```

## 2. Build et Push des images

```bash
# Backend
gcloud builds submit \
  --tag europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/backend:latest \
  --file=Dockerfile.backend \
  .

# Frontend  
gcloud builds submit \
  --tag europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/frontend:latest \
  --file=Dockerfile.frontend \
  .
```

## 3. Déploiement avec les VRAIES variables d'environnement

### Backend :
```bash
gcloud run deploy agent-gcp-backend \
  --image europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/backend:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="JWT_SECRET=ton-vrai-secret-super-fort" \
  --set-env-vars="FLASK_ENV=production" \
  --service-account=agent-gcp-backend@agent-gcp-prod-12345.iam.gserviceaccount.com
```

### Frontend :
```bash
# D'abord, récupérer l'URL du backend déployé
BACKEND_URL=$(gcloud run services describe agent-gcp-backend --region=europe-west1 --format='value(status.url)')

gcloud run deploy agent-gcp-frontend \
  --image europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/frontend:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars="VITE_API_BASE_URL=$BACKEND_URL" \
  --set-env-vars="VITE_FIREBASE_API_KEY=ta-vraie-clé-firebase" \
  --set-env-vars="VITE_FIREBASE_AUTH_DOMAIN=ton-projet.firebaseapp.com" \
  --set-env-vars="VITE_FIREBASE_PROJECT_ID=ton-projet-firebase"
```

## 4. Alternative : Utiliser un fichier YAML de déploiement

Créer `cloud-run-backend.yaml` :
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: agent-gcp-backend
  labels:
    cloud.googleapis.com/location: europe-west1
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      serviceAccountName: agent-gcp-backend@agent-gcp-prod-12345.iam.gserviceaccount.com
      containers:
      - image: europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: JWT_SECRET
          value: "ton-vrai-secret-super-fort"
        - name: FLASK_ENV  
          value: "production"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
```

Puis déployer :
```bash
gcloud run services replace cloud-run-backend.yaml --region=europe-west1
```

## 5. Configuration des secrets (Recommandé pour la production)

```bash
# Créer des secrets dans Google Secret Manager
gcloud secrets create jwt-secret --data-file=jwt-secret.txt
gcloud secrets create firebase-config --data-file=firebase-config.json

# Déployer en utilisant les secrets
gcloud run deploy agent-gcp-backend \
  --image europe-west1-docker.pkg.dev/agent-gcp-prod-12345/agent-gcp-repo/backend:latest \
  --update-secrets="JWT_SECRET=jwt-secret:latest" \
  --region europe-west1
```