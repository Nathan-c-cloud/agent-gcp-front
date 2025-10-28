"""
Module Alert Engine - Déclencheur de l'alert-engine Cloud Function
Gère l'authentification et les appels à l'alert-engine
"""

import os
import json
import logging
import subprocess
import requests
from google.auth.transport.requests import Request
from google.oauth2 import id_token, service_account

logger = logging.getLogger(__name__)

# Configuration
ALERT_ENGINE_URL = os.getenv('ALERT_ENGINE_URL', 'https://us-west1-agent-gcp-f6005.cloudfunctions.net/alert-engine')
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')  # JSON du service account

def get_google_id_token(target_audience: str) -> str:
    """
    Obtient un token d'identité Google pour authentifier l'appel à la Cloud Function
    
    Essaie plusieurs méthodes (dans l'ordre):
    1. Variable d'environnement GOOGLE_SERVICE_ACCOUNT_JSON (fonctionne partout)
    2. google.oauth2.id_token (fonctionne dans GCP)
    3. gcloud auth print-identity-token (fonctionne en local si gcloud configuré)
    
    Args:
        target_audience: L'URL de la Cloud Function cible
        
    Returns:
        Le token JWT signé par Google
    """
    # Méthode 1: Service Account JSON depuis variable d'environnement (RECOMMANDÉ)
    if GOOGLE_SERVICE_ACCOUNT_JSON:
        try:
            # Parser le JSON
            service_account_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            
            # Créer les credentials depuis le service account
            credentials = service_account.IDTokenCredentials.from_service_account_info(
                service_account_info,
                target_audience=target_audience
            )
            
            # Obtenir le token
            auth_req = Request()
            credentials.refresh(auth_req)
            token = credentials.token
            
            logger.info("✅ Token obtenu via GOOGLE_SERVICE_ACCOUNT_JSON")
            return token
        except json.JSONDecodeError as e:
            logger.error(f"❌ Erreur parsing GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
        except Exception as e:
            logger.error(f"❌ Erreur service account: {e}")
    
    # Méthode 2: Utiliser google.oauth2.id_token (pour GCP avec Application Default Credentials)
    try:
        auth_req = Request()
        token = id_token.fetch_id_token(auth_req, target_audience)
        logger.info("✅ Token obtenu via google.oauth2.id_token (ADC)")
        return token
    except Exception as e:
        logger.debug(f"Méthode id_token/ADC échouée: {e}")
    
    # Méthode 3: Utiliser gcloud CLI (pour développement local)
    try:
        result = subprocess.run(
            ['gcloud', 'auth', 'print-identity-token'],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            token = result.stdout.strip()
            logger.info("✅ Token obtenu via gcloud CLI")
            return token
        else:
            logger.error(f"gcloud CLI erreur: {result.stderr}")
    except FileNotFoundError:
        logger.debug("gcloud CLI non trouvé")
    except Exception as e:
        logger.debug(f"Erreur gcloud CLI: {e}")
    
    raise Exception(
        "Impossible d'obtenir un token Google ID. "
        "Configurez GOOGLE_SERVICE_ACCOUNT_JSON ou authentifiez-vous avec gcloud."
    )


def trigger_alert_engine_scan(limit: int = 0, dry_run: bool = False) -> dict:
    """
    Déclenche l'alert-engine en mode scan (scanne toutes les tasks)
    
    Args:
        limit: Nombre maximum de tasks à traiter (0 = pas de limite)
        dry_run: Si True, simule sans créer d'alertes
        
    Returns:
        La réponse JSON de l'alert-engine
    """
    try:
        # Obtenir le token d'authentification
        token = get_google_id_token(ALERT_ENGINE_URL)
        
        # Construire l'URL avec paramètres
        params = {}
        if limit > 0:
            params['limit'] = limit
        if dry_run:
            params['dry_run'] = 'true'
        
        # Appeler l'alert-engine
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        logger.info(f"🚀 Déclenchement alert-engine (scan mode) - limit={limit}, dry_run={dry_run}")
        response = requests.get(ALERT_ENGINE_URL, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"✅ Alert-engine scan terminé: {result.get('created_alerts', 0)} créées, "
                   f"{result.get('skipped_existing', 0)} skipped, "
                   f"{result.get('processed_tasks', 0)} tasks traitées")
        
        return result
        
    except requests.exceptions.Timeout:
        logger.error("❌ Timeout lors de l'appel à l'alert-engine")
        return {
            "status": "error",
            "error": "timeout",
            "message": "L'alert-engine n'a pas répondu dans les temps"
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erreur HTTP lors de l'appel à l'alert-engine: {e}")
        return {
            "status": "error",
            "error": "http_error",
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"❌ Erreur inattendue lors du déclenchement de l'alert-engine: {e}")
        return {
            "status": "error",
            "error": "unexpected_error",
            "message": str(e)
        }


def trigger_alert_engine_single_task(task_id: str, task: dict, dry_run: bool = False) -> dict:
    """
    Déclenche l'alert-engine pour une task spécifique
    
    Args:
        task_id: L'ID de la task
        task: Les données de la task (dict)
        dry_run: Si True, simule sans créer d'alerte
        
    Returns:
        La réponse JSON de l'alert-engine
    """
    try:
        # Obtenir le token d'authentification
        token = get_google_id_token(ALERT_ENGINE_URL)
        
        # Construire le payload
        payload = {
            'task_id': task_id,
            'task': task
        }
        
        # Paramètres
        params = {}
        if dry_run:
            params['dry_run'] = 'true'
        
        # Appeler l'alert-engine
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        logger.info(f"🚀 Déclenchement alert-engine (single task) - task_id={task_id}, dry_run={dry_run}")
        response = requests.post(ALERT_ENGINE_URL, headers=headers, json=payload, params=params, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        summary = result.get('summary', {})
        logger.info(f"✅ Alert-engine single task terminé: {len(summary.get('created', []))} créées, "
                   f"{len(summary.get('skipped', []))} skipped")
        
        return result
        
    except requests.exceptions.Timeout:
        logger.error("❌ Timeout lors de l'appel à l'alert-engine")
        return {
            "status": "error",
            "error": "timeout",
            "message": "L'alert-engine n'a pas répondu dans les temps"
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erreur HTTP lors de l'appel à l'alert-engine: {e}")
        return {
            "status": "error",
            "error": "http_error",
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"❌ Erreur inattendue lors du déclenchement de l'alert-engine: {e}")
        return {
            "status": "error",
            "error": "unexpected_error",
            "message": str(e)
        }
