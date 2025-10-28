#!/bin/bash

# 🚀 Script de déploiement Cloud Run - Backend Agent GCP

set -e

# Configuration
PROJECT_ID="agent-gcp-f6005"
SERVICE_NAME="agent-gcp-backend"
REGION="us-west1"
ALERT_ENGINE_URL="https://us-west1-agent-gcp-f6005.cloudfunctions.net/alert-engine"

echo "🚀 Déploiement du Backend Agent GCP sur Cloud Run"
echo "=================================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Vérifier que gcloud est installé
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI n'est pas installé. Installez-le depuis: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Se connecter au projet
echo "1️⃣ Configuration du projet..."
gcloud config set project $PROJECT_ID

# Demander quelle méthode d'authentification utiliser
echo ""
echo "Choisissez la méthode d'authentification:"
echo "  1) Identité Cloud Run (recommandé, plus sécurisé)"
echo "  2) Service Account via Secret Manager"
echo ""
read -p "Votre choix (1 ou 2): " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "1" ]; then
    echo ""
    echo "2️⃣ Configuration des permissions Cloud Run..."
    
    # Récupérer le numéro de projet
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    
    echo "   Service Account Cloud Run: $CLOUD_RUN_SA"
    
    # Donner la permission d'invoquer alert-engine
    echo "   Attribution de la permission Cloud Functions Invoker..."
    gcloud functions add-invoker-policy-binding alert-engine \
        --region=$REGION \
        --member="serviceAccount:$CLOUD_RUN_SA" \
        --project=$PROJECT_ID || echo "   ⚠️ Permission déjà attribuée ou fonction non trouvée"
    
    echo "   ✅ Permissions configurées"
    
    # Déployer sans secret
    echo ""
    echo "3️⃣ Déploiement sur Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --set-env-vars="ALERT_ENGINE_URL=$ALERT_ENGINE_URL,GCP_PROJECT=$PROJECT_ID" \
        --project=$PROJECT_ID

elif [ "$AUTH_CHOICE" = "2" ]; then
    echo ""
    echo "2️⃣ Vérification du secret dans Secret Manager..."
    
    SECRET_NAME="alert-engine-sa-key"
    
    # Vérifier si le secret existe
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &> /dev/null; then
        echo "   ✅ Secret '$SECRET_NAME' trouvé"
    else
        echo "   ⚠️ Secret '$SECRET_NAME' non trouvé"
        echo ""
        read -p "   Voulez-vous le créer maintenant? (y/n): " CREATE_SECRET
        
        if [ "$CREATE_SECRET" = "y" ]; then
            if [ -f "service-account-key.json" ]; then
                echo "   Création du secret..."
                gcloud secrets create $SECRET_NAME \
                    --data-file=service-account-key.json \
                    --project=$PROJECT_ID
                echo "   ✅ Secret créé"
            else
                echo "   ❌ Fichier service-account-key.json non trouvé"
                echo "   Exécutez d'abord: bash setup_service_account.sh"
                exit 1
            fi
        else
            echo "   ❌ Le secret est requis pour cette méthode"
            exit 1
        fi
    fi
    
    # Donner l'accès au secret
    echo "   Configuration des permissions Secret Manager..."
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    
    gcloud secrets add-iam-policy-binding $SECRET_NAME \
        --member="serviceAccount:$CLOUD_RUN_SA" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID || echo "   ⚠️ Permission déjà attribuée"
    
    echo "   ✅ Permissions configurées"
    
    # Déployer avec secret
    echo ""
    echo "3️⃣ Déploiement sur Cloud Run avec Secret Manager..."
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --set-secrets="GOOGLE_SERVICE_ACCOUNT_JSON=$SECRET_NAME:latest" \
        --set-env-vars="ALERT_ENGINE_URL=$ALERT_ENGINE_URL,GCP_PROJECT=$PROJECT_ID" \
        --project=$PROJECT_ID

else
    echo "❌ Choix invalide"
    exit 1
fi

# Récupérer l'URL du service
echo ""
echo "4️⃣ Récupération de l'URL du service..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format="value(status.url)" \
    --project=$PROJECT_ID)

echo ""
echo "✅ Déploiement terminé!"
echo "=================================================="
echo ""
echo "🌐 URL du service: $SERVICE_URL"
echo ""
echo "🧪 Testez le déploiement:"
echo "   curl $SERVICE_URL/health"
echo "   curl -X POST \"$SERVICE_URL/alerts/trigger?dry_run=true\""
echo ""
echo "📊 Voir les logs:"
echo "   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50"
echo ""
echo "💡 Configurez le frontend avec cette URL:"
echo "   VITE_API_URL=$SERVICE_URL"
echo ""
