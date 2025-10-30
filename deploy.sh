#!/bin/bash

# ========================================
# Script de déploiement automatisé sur Cloud Run
# ========================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="agent-gcp-f6005"
SERVICE_NAME="agent-gcp-unified"
REGION="us-west1"
IMAGE_NAME="agent-gcp-unified"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Déploiement sur Google Cloud Run${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Étape 1: Vérifier la connexion GCP
echo -e "${YELLOW}📡 Vérification de la connexion GCP...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Erreur: Vous n'êtes pas connecté à Google Cloud${NC}"
    echo -e "${YELLOW}Exécutez: gcloud auth login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connecté à GCP${NC}"
echo ""

# Étape 2: Configurer le projet
echo -e "${YELLOW}🔧 Configuration du projet: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✅ Projet configuré${NC}"
echo ""

# Étape 3: Build de l'image Docker
echo -e "${YELLOW}🏗️  Build de l'image Docker...${NC}"
docker build -t ${IMAGE_NAME}:latest -f Dockerfile .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image buildée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du build de l'image${NC}"
    exit 1
fi
echo ""

# Étape 4: Tagger l'image pour GCR
echo -e "${YELLOW}🏷️  Tag de l'image pour Google Container Registry...${NC}"
docker tag ${IMAGE_NAME}:latest gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest
docker tag ${IMAGE_NAME}:latest gcr.io/${PROJECT_ID}/${IMAGE_NAME}:$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✅ Image taguée${NC}"
echo ""

# Étape 5: Push de l'image vers GCR
echo -e "${YELLOW}☁️  Push de l'image vers Google Container Registry...${NC}"
docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image poussée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du push de l'image${NC}"
    exit 1
fi
echo ""

# Étape 6: Déploiement sur Cloud Run
echo -e "${YELLOW}🚢 Déploiement sur Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Déploiement réussi${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    exit 1
fi
echo ""

# Étape 7: Forcer le redémarrage du service
echo -e "${YELLOW}🔄 Redémarrage forcé du service pour appliquer les changements...${NC}"
gcloud run services update ${SERVICE_NAME} \
  --region ${REGION} \
  --update-env-vars DEPLOY_TIME=$(date +%s)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service redémarré${NC}"
else
    echo -e "${YELLOW}⚠️  Avertissement: Le redémarrage a échoué mais le service est déployé${NC}"
fi
echo ""

# Étape 8: Récupérer l'URL du service
echo -e "${YELLOW}🌐 Récupération de l'URL du service...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)')
echo -e "${GREEN}✅ Service accessible à:${NC}"
echo -e "${BLUE}${SERVICE_URL}${NC}"
echo ""

# Étape 9: Afficher les logs récents
echo -e "${YELLOW}📋 Logs récents (30 dernières lignes):${NC}"
gcloud run services logs read ${SERVICE_NAME} --region ${REGION} --limit 30
echo ""

# Résumé final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📊 Informations du déploiement:${NC}"
echo -e "  • Projet: ${PROJECT_ID}"
echo -e "  • Service: ${SERVICE_NAME}"
echo -e "  • Région: ${REGION}"
echo -e "  • URL: ${SERVICE_URL}"
echo ""
echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo -e "  • Console Cloud Run: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}"
echo -e "  • Application: ${SERVICE_URL}"
echo ""
echo -e "${YELLOW}💡 Commandes utiles:${NC}"
echo -e "  • Voir les logs: gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"
echo -e "  • Health check: curl ${SERVICE_URL}/health"
echo ""
