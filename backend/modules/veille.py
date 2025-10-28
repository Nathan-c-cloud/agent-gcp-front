"""
Module Veille - Gestion de la veille réglementaire
"""

from flask import Blueprint, request, jsonify
from google.cloud import firestore
import requests
import logging
import os
from datetime import datetime

veille_bp = Blueprint('veille', __name__)
logger = logging.getLogger(__name__)

# Configuration
AGENT_FISCAL_URL = os.getenv('AGENT_FISCAL_URL', 'https://us-west1-agent-gcp-f6005.cloudfunctions.net/agent-fiscal-v2')
GCP_PROJECT = os.getenv('GCP_PROJECT')

# Initialize Firestore
db = None
if GCP_PROJECT:
    try:
        db = firestore.Client(project=GCP_PROJECT)
        logger.info(f"✅ Firestore initialisé pour veille: {GCP_PROJECT}")
    except Exception as e:
        logger.error(f"❌ Erreur Firestore veille: {e}")

@veille_bp.route('/company/<company_id>', methods=['GET'])
def get_alertes_veille(company_id):
    """Récupère les alertes de veille pour une entreprise"""
    try:
        if not db:
            return jsonify({"error": "Firestore non configuré"}), 500

        logger.info(f"🔍 Recherche alertes pour companyId: {company_id}")
        logger.info(f"📚 Collection utilisée: info_alerts")

        # Récupérer les alertes de veille depuis la collection info_alerts
        # Requête simplifiée sans index composite
        alertes_ref = db.collection('info_alerts')\
            .where('companyId', '==', company_id)\
            .limit(100)

        logger.info(f"🚀 Exécution de la requête Firestore...")

        alertes = []
        for doc in alertes_ref.stream():
            data = doc.to_dict()
            data['id'] = doc.id
            alertes.append(data)

        # Trier par date de détection (les plus récentes en premier)
        alertes.sort(key=lambda x: x.get('detectedDate', ''), reverse=True)

        # Limiter à 50 résultats
        alertes = alertes[:50]

        logger.info(f"✅ {len(alertes)} alertes récupérées pour {company_id}")

        return jsonify({
            "success": True,
            "alertes": alertes,
            "total": len(alertes)
        }), 200

    except Exception as e:
        logger.error(f"❌ Erreur get_alertes_veille: {e}")
        logger.error(f"❌ Type d'erreur: {type(e)}")
        return jsonify({"error": str(e)}), 500

@veille_bp.route('/analyser/<company_id>', methods=['POST'])
def analyser_veille(company_id):
    """Lance une analyse de veille réglementaire"""
    try:
        if not db:
            return jsonify({"error": "Firestore non configuré"}), 500

        # Récupérer les paramètres de l'entreprise
        settings_ref = db.collection('settings').document(company_id)
        settings_doc = settings_ref.get()

        if not settings_doc.exists:
            return jsonify({"error": "Paramètres entreprise non trouvés"}), 404

        settings = settings_doc.to_dict()

        # Construire les questions pour l'agent fiscal
        questions = [
            f"Nouvelles réglementations TVA pour {settings.get('secteurActivite')}",
            f"Changements impôt sociétés {settings.get('regimeFiscal')}",
            f"Obligations fiscales entreprise {settings.get('formeJuridique')}"
        ]

        nouvelles_alertes = []

        for question in questions:
            try:
                response = requests.post(
                    AGENT_FISCAL_URL,
                    json={"question": question},
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    if result.get('documents_trouves', 0) > 0:
                        for source in result.get('sources', []):
                            # Créer une alerte de veille
                            alerte = {
                                "companyId": company_id,
                                "userId": settings.get('userId', ''),
                                "type": "veille",
                                "titre": source.get('titre', question),
                                "message": result.get('reponse', '')[:300],
                                "source": source.get('url', ''),
                                "priorite": "haute" if source.get('score', 0) > 0.7 else "moyenne",
                                "statut": "non_lu",
                                "dateCreation": datetime.now(),
                                "dateEcheance": None,
                                "metadata": {
                                    "categorie": question.split()[1] if len(question.split()) > 1 else "fiscal",
                                    "score_pertinence": source.get('score', 0),
                                    "question_origine": question
                                }
                            }

                            # Sauvegarder dans Firestore
                            doc_ref = db.collection('alertes').add(alerte)
                            alerte['id'] = doc_ref[1].id
                            nouvelles_alertes.append(alerte)

            except requests.exceptions.Timeout:
                logger.warning(f"Timeout pour la question: {question}")
            except Exception as e:
                logger.error(f"Erreur lors de l'appel agent fiscal: {e}")

        return jsonify({
            "success": True,
            "nb_nouvelles_alertes": len(nouvelles_alertes),
            "alertes": nouvelles_alertes
        }), 200

    except Exception as e:
        logger.error(f"Erreur analyser_veille: {e}")
        return jsonify({"error": str(e)}), 500

@veille_bp.route('/marquer-lu/<alerte_id>', methods=['PUT'])
def marquer_alerte_lue(alerte_id):
    """Marque une alerte de veille comme lue"""
    try:
        if not db:
            return jsonify({"error": "Firestore non configuré"}), 500

        db.collection('alertes').document(alerte_id).update({
            "statut": "lu",
            "dateLecture": datetime.now()
        })

        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Erreur marquer_alerte_lue: {e}")
        return jsonify({"error": str(e)}), 500

