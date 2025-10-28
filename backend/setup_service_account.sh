#!/bin/bash
# Script pour configurer le service account pour l'alert-engine

set -e

PROJECT_ID="agent-gcp-f6005"
SERVICE_ACCOUNT_NAME="alert-engine-invoker"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="service-account-key.json"

echo "🔧 Configuration du Service Account pour Alert-Engine"
echo "=================================================="

# 1. Créer le service account (si pas déjà existant)
echo ""
echo "1️⃣ Création du service account..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "   ✅ Service account existe déjà: $SERVICE_ACCOUNT_EMAIL"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Alert Engine Invoker" \
        --project=$PROJECT_ID
    echo "   ✅ Service account créé: $SERVICE_ACCOUNT_EMAIL"
fi

# 2. Donner les permissions pour invoquer la Cloud Function
echo ""
echo "2️⃣ Attribution des permissions..."
gcloud functions add-iam-policy-binding alert-engine \
    --region=us-west1 \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudfunctions.invoker" \
    --project=$PROJECT_ID
echo "   ✅ Permission 'Cloud Functions Invoker' attribuée"

# 3. Créer une clé JSON
echo ""
echo "3️⃣ Création de la clé JSON..."
if [ -f "$KEY_FILE" ]; then
    echo "   ⚠️  Le fichier $KEY_FILE existe déjà"
    read -p "   Voulez-vous le remplacer? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   ℹ️  Conservation de la clé existante"
    else
        rm $KEY_FILE
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account=$SERVICE_ACCOUNT_EMAIL \
            --project=$PROJECT_ID
        echo "   ✅ Nouvelle clé créée: $KEY_FILE"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SERVICE_ACCOUNT_EMAIL \
        --project=$PROJECT_ID
    echo "   ✅ Clé créée: $KEY_FILE"
fi

# 4. Générer la variable d'environnement
echo ""
echo "4️⃣ Configuration de la variable d'environnement..."
echo ""
echo "📋 Ajoutez cette ligne à votre .env ou .bashrc:"
echo "=================================================="
echo ""
echo "export GOOGLE_SERVICE_ACCOUNT_JSON='$(cat $KEY_FILE | tr -d '\n')'"
echo ""
echo "=================================================="
echo ""
echo "Ou pour Windows (PowerShell):"
echo "\$env:GOOGLE_SERVICE_ACCOUNT_JSON='$(cat $KEY_FILE | tr -d '\n')'"
echo ""
echo "=================================================="

# 5. Créer un fichier .env.local
echo ""
echo "5️⃣ Création du fichier .env.local..."
cat > .env.local << EOF
# Configuration Alert-Engine
ALERT_ENGINE_URL=https://us-west1-agent-gcp-f6005.cloudfunctions.net/alert-engine
GOOGLE_SERVICE_ACCOUNT_JSON='$(cat $KEY_FILE | tr -d '\n')'
EOF
echo "   ✅ Fichier .env.local créé"
echo ""
echo "💡 Vous pouvez maintenant charger les variables avec:"
echo "   source .env.local"
echo ""
echo "✅ Configuration terminée!"
echo ""
echo "⚠️  IMPORTANT: N'oubliez pas d'ajouter .env.local et service-account-key.json à .gitignore"
