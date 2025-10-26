"""
Module Alertes - Gestion des alertes avec Firestore et Alert-engine
Auteur: Système d'alertes
"""

from flask import Blueprint, request, jsonify
from google.cloud import firestore
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import google.auth.transport.requests
import google.auth
import time
import requests
import threading
import logging
import os
from datetime import datetime
import json

# Créer le blueprint pour les alertes
alerts_bp = Blueprint('alerts', __name__)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION MODULE ALERTES
# ============================================================================

# Variables d'environnement spécifiques aux alertes
ALERT_ENGINE_URL = os.getenv('ALERT_ENGINE_URL')
ALERT_REFRESH_TTL = int(os.getenv('ALERT_REFRESH_TTL', '300'))  # 5 minutes par défaut
MAX_ALERTS = int(os.getenv('MAX_ALERTS', '50'))
CALL_TIMEOUT_SECONDS = int(os.getenv('CALL_TIMEOUT_SECONDS', '30'))
GCP_PROJECT = os.getenv('GCP_PROJECT')

# Initialize Firestore pour les alertes
db = None
if GCP_PROJECT:
    try:
        db = firestore.Client(project=GCP_PROJECT)
        logger.info(f"✅ Firestore initialisé pour le projet: {GCP_PROJECT}")
    except Exception as e:
        logger.error(f"❌ Erreur Firestore: {e}")

# ============================================================================
# FONCTIONS UTILITAIRES ALERTES
# ============================================================================

def get_id_token():
    """Obtient un ID token pour authentifier les appels vers alert-engine"""
    try:
        credentials, project = google.auth.default()
        
        # Créer une requête d'authentification
        auth_req = google.auth.transport.requests.Request()
        
        # Obtenir l'ID token
        credentials.refresh(auth_req)
        
        # Pour les services accounts, nous devons utiliser l'audience
        if hasattr(credentials, 'service_account_email'):
            from google.auth import jwt
            from google.auth import _helpers
            
            now = _helpers.utcnow()
            lifetime = datetime.timedelta(seconds=3600)  # 1 heure
            expiry = now + lifetime
            
            payload = {
                'iss': credentials.service_account_email,
                'sub': credentials.service_account_email,
                'aud': ALERT_ENGINE_URL,
                'iat': _helpers.datetime_to_secs(now),
                'exp': _helpers.datetime_to_secs(expiry),
            }
            
            return jwt.encode(credentials.signer, payload)
        
        # Pour d'autres types de credentials, utiliser la méthode standard
        from google.auth.transport import requests as google_requests
        request = google_requests.Request()
        
        # Utiliser l'URL de alert-engine comme audience
        credentials.refresh(request)
        return credentials.token
        
    except Exception as e:
        logger.error(f"Erreur lors de l'obtention de l'ID token: {e}")
        return None

def get_last_refresh():
    """Récupère le timestamp du dernier refresh depuis Firestore"""
    if not db:
        return 0
        
    try:
        doc_ref = db.collection('_meta').document('alerts_refresh')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return data.get('last_refresh_ts', 0)
        return 0
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du last_refresh: {e}")
        return 0

def update_last_refresh():
    """Met à jour le timestamp du dernier refresh dans Firestore"""
    if not db:
        return False
        
    try:
        doc_ref = db.collection('_meta').document('alerts_refresh')
        doc_ref.set({
            'last_refresh_ts': int(time.time())
        }, merge=True)
        logger.info("last_refresh_ts mis à jour")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du last_refresh: {e}")
        return False

def trigger_alert_engine_background():
    """Déclenche alert-engine en arrière-plan (fire-and-forget)"""
    def make_request():
        try:
            id_token = get_id_token()
            headers = {}
            
            if id_token:
                headers['Authorization'] = f'Bearer {id_token}'
            
            logger.info(f"Déclenchement de alert-engine en background: {ALERT_ENGINE_URL}")
            
            response = requests.post(
                ALERT_ENGINE_URL,
                headers=headers,
                timeout=CALL_TIMEOUT_SECONDS
            )
            
            if response.status_code == 200:
                logger.info("Alert-engine déclenché avec succès en background")
            else:
                logger.error(f"Erreur alert-engine background: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"Erreur lors du déclenchement background de alert-engine: {e}")
    
    # Lancer dans un thread séparé
    thread = threading.Thread(target=make_request)
    thread.daemon = True
    thread.start()

def trigger_alert_engine_sync():
    """Déclenche alert-engine de façon synchrone et retourne le résultat"""
    try:
        id_token = get_id_token()
        headers = {}
        
        if id_token:
            headers['Authorization'] = f'Bearer {id_token}'
        
        logger.info(f"Déclenchement de alert-engine en mode sync: {ALERT_ENGINE_URL}")
        
        response = requests.post(
            ALERT_ENGINE_URL,
            headers=headers,
            timeout=CALL_TIMEOUT_SECONDS
        )
        
        if response.status_code == 200:
            logger.info("Alert-engine déclenché avec succès en mode sync")
            try:
                return response.json()
            except:
                return {"status": "success", "message": "Scan completed"}
        else:
            logger.error(f"Erreur alert-engine sync: {response.status_code} - {response.text}")
            return {"error": f"HTTP {response.status_code}", "message": response.text}
            
    except Exception as e:
        logger.error(f"Erreur lors du déclenchement sync de alert-engine: {e}")
        return {"error": str(e)}

def get_alerts_from_firestore():
    """Récupère les alertes depuis Firestore"""
    if not db:
        logger.warning("Firestore non initialisé, retour de données vides")
        return []
        
    try:
        alerts_ref = db.collection('alerts')
        
        # Trier par received_at desc, limiter le nombre
        query = alerts_ref.order_by('received_at', direction=firestore.Query.DESCENDING).limit(MAX_ALERTS)
        docs = query.stream()
        
        alerts = []
        for doc in docs:
            alert_data = doc.to_dict()
            alert_data['id'] = doc.id  # Ajouter l'ID du document
            alerts.append(alert_data)
        
        logger.info(f"Récupéré {len(alerts)} alertes depuis Firestore")
        return alerts
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des alertes: {e}")
        return []

# ============================================================================
# ENDPOINTS DU MODULE ALERTES
# ============================================================================

@alerts_bp.route('/', methods=['GET'])
def get_alerts():
    """Endpoint principal pour récupérer les alertes"""
    try:
        # Paramètres de la requête
        sync_mode = request.args.get('sync', 'false').lower() == 'true'
        ttl_override = request.args.get('ttl_override', type=int)
        
        # Utiliser le TTL override si fourni, sinon la valeur par défaut
        effective_ttl = ttl_override if ttl_override is not None else ALERT_REFRESH_TTL
        
        # Vérifier si nous devons déclencher un refresh
        current_time = int(time.time())
        last_refresh = get_last_refresh()
        time_since_refresh = current_time - last_refresh
        
        should_trigger = time_since_refresh >= effective_ttl
        
        triggered = False
        trigger_mode = None
        scan_result = None
        
        if should_trigger and ALERT_ENGINE_URL:
            # Mettre à jour last_refresh de façon optimiste
            if update_last_refresh():
                triggered = True
                
                if sync_mode:
                    # Mode synchrone
                    trigger_mode = "sync"
                    scan_result = trigger_alert_engine_sync()
                    logger.info(f"Alert-engine déclenché en mode sync")
                else:
                    # Mode background
                    trigger_mode = "background"
                    trigger_alert_engine_background()
                    logger.info(f"Alert-engine déclenché en background")
            else:
                logger.error("Impossible de mettre à jour last_refresh_ts")
        else:
            if not ALERT_ENGINE_URL:
                logger.warning("ALERT_ENGINE_URL non configuré, pas de déclenchement")
            else:
                logger.info(f"Trigger ignoré - dans le TTL (derniers {time_since_refresh}s < {effective_ttl}s)")
        
        # Récupérer les alertes depuis Firestore
        alerts = get_alerts_from_firestore()
        
        # Préparer la réponse
        response_data = {
            "alerts": alerts,
            "triggered": triggered,
            "trigger_mode": trigger_mode,
            "metadata": {
                "count": len(alerts),
                "last_refresh": last_refresh,
                "time_since_refresh": time_since_refresh,
                "ttl": effective_ttl,
                "timestamp": current_time,
                "mode": "firestore" if db else "offline"
            }
        }
        
        # Ajouter scan_result seulement si présent (mode sync)
        if scan_result is not None:
            response_data["scan_result"] = scan_result
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Erreur dans /alerts: {e}")
        return jsonify({
            "error": str(e),
            "alerts": [],
            "triggered": False,
            "trigger_mode": None,
            "metadata": {"mode": "error"}
        }), 500

@alerts_bp.route('/health', methods=['GET'])
def alerts_health():
    """Health check spécifique au module alertes"""
    config_status = {
        "firestore": db is not None,
        "alert_engine": ALERT_ENGINE_URL is not None,
        "gcp_project": GCP_PROJECT is not None
    }
    
    all_ok = all(config_status.values())
    
    return jsonify({
        "status": "healthy" if all_ok else "degraded",
        "timestamp": int(time.time()),
        "configuration": config_status,
        "settings": {
            "ttl": ALERT_REFRESH_TTL,
            "max_alerts": MAX_ALERTS,
            "timeout": CALL_TIMEOUT_SECONDS
        }
    }), 200 if all_ok else 206

@alerts_bp.route('/config', methods=['GET'])
def alerts_config():
    """Configuration actuelle du module alertes"""
    return jsonify({
        "module": "alerts",
        "version": "1.0.0",
        "gcp_project": GCP_PROJECT,
        "alert_engine_configured": ALERT_ENGINE_URL is not None,
        "firestore_connected": db is not None,
        "settings": {
            "alert_refresh_ttl": ALERT_REFRESH_TTL,
            "max_alerts": MAX_ALERTS,
            "call_timeout_seconds": CALL_TIMEOUT_SECONDS
        }
    })

# ============================================================================
# ENDPOINTS DE TEST/DEBUG (optionnels)
# ============================================================================

@alerts_bp.route('/test/firestore', methods=['GET'])
def test_firestore():
    """Test de connexion Firestore"""
    if not db:
        return jsonify({"error": "Firestore non initialisé"}), 500
    
    try:
        # Test simple de lecture
        collections = list(db.collections())
        return jsonify({
            "status": "success",
            "message": "Connexion Firestore OK",
            "collections_count": len(collections)
        })
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@alerts_bp.route('/test/alert-engine', methods=['POST'])
def test_alert_engine():
    """Test de connexion à alert-engine"""
    if not ALERT_ENGINE_URL:
        return jsonify({"error": "ALERT_ENGINE_URL non configuré"}), 400
    
    result = trigger_alert_engine_sync()
    return jsonify({
        "status": "completed",
        "result": result
    })