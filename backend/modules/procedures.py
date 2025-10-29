"""
Module Procédures/Démarches - Gestion des démarches administratives avec Firestore
Auteur: Système de démarches
"""

from flask import Blueprint, request, jsonify
from google.cloud import firestore
import logging
import os
from datetime import datetime

# Créer le blueprint pour les démarches
procedures_bp = Blueprint('procedures', __name__)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION MODULE PROCEDURES
# ============================================================================

# Variables d'environnement spécifiques aux démarches
GCP_PROJECT = os.getenv('GCP_PROJECT')
MAX_PROCEDURES = int(os.getenv('MAX_PROCEDURES', '100'))

# Initialize Firestore pour les démarches
db = None
if GCP_PROJECT:
    try:
        db = firestore.Client(project=GCP_PROJECT)
        logger.info(f"✅ Firestore initialisé pour les démarches: {GCP_PROJECT}")
    except Exception as e:
        logger.error(f"❌ Erreur Firestore pour démarches: {e}")

# ============================================================================
# FONCTIONS UTILITAIRES PROCEDURES
# ============================================================================

def transform_firestore_to_frontend(doc_data, doc_id):
    """Transforme les données Firestore en format attendu par le frontend"""
    try:
        # Calculer la progression basée sur les étapes
        current_step = doc_data.get('current_step', 0)
        total_steps = doc_data.get('total_steps')
        
        # S'assurer que current_step et total_steps sont des entiers
        try:
            current_step = int(current_step) if current_step is not None else 0
        except (ValueError, TypeError):
            logger.warning(f"Valeur non numérique détectée pour current_step: {current_step}")
            current_step = 0
            
        # Si total_steps n'est pas défini, définir une valeur par défaut basée sur le type
        if total_steps is None:
            type_defaults = {
                'tva': 1,  # TVA est généralement une étape unique
                'urssaf': 3,  # URSSAF peut avoir plusieurs étapes
                'aides': 4,   # Aides ont souvent plusieurs étapes
            }
            total_steps = type_defaults.get(doc_data.get('type', ''), 5)
        else:
            try:
                total_steps = int(total_steps)
            except (ValueError, TypeError):
                logger.warning(f"Valeur non numérique détectée pour total_steps: {total_steps}")
                total_steps = 5
        
        progress = int((current_step / total_steps) * 100) if total_steps > 0 else 0
        
        # Mapper le statut Firestore vers le format frontend
        status_mapping = {
            'brouillon': 'todo',
            'en_cours': 'inprogress', 
            'en_verification': 'inprogress',
            'terminé': 'done',
            'soumis': 'done',
            'erreur': 'todo'
        }
        
        firestore_status = doc_data.get('statut', 'en_cours')
        frontend_status = status_mapping.get(firestore_status, 'todo')
        
        # Mapper le type
        type_mapping = {
            'tva': 'Fiscal',
            'urssaf': 'Social',
            'charges_sociales': 'Social',
            'demande_aides': 'Juridique',
            'bilan': 'Comptable'
        }
        
        firestore_type = doc_data.get('type', 'tva')
        frontend_type = type_mapping.get(firestore_type, 'Fiscal')
        
        # Générer un nom descriptif basé sur le type et la période
        perimetre = doc_data.get('perimetre', {})
        if not isinstance(perimetre, dict):
            perimetre = {}
        periode = perimetre.get('periode', 'Période inconnue')
        if not isinstance(periode, str):
            periode = str(periode) if periode is not None else 'Période inconnue'
        
        name_mapping = {
            'tva': f'Déclaration TVA {periode}',
            'urssaf': f'Déclaration URSSAF {periode}',
            'charges_sociales': f'Charges sociales {periode}',
            'demande_aides': f'Demande d\'aides {periode}',
            'bilan': f'Bilan comptable {periode}'
        }
        
        name = name_mapping.get(firestore_type, f'Démarche {firestore_type} {periode}')
        
        # Calculer deadline basée sur la période (approximation)
        # Pour une période comme "2025-10", on peut estimer une deadline
        deadline = calculate_deadline_from_period(periode, firestore_type)
        
        return {
            'id': doc_id,
            'name': name,
            'type': frontend_type,
            'deadline': deadline,
            'status': frontend_status,
            'progress': progress,
            'current_step': current_step,
            'total_steps': total_steps,
            'periode': periode,
            'etablissement': perimetre.get('etablissement', ''),
            'regime_fiscal': perimetre.get('regime_fiscal', ''),
            'updated_at': doc_data.get('updated_at', datetime.now()).isoformat() if hasattr(doc_data.get('updated_at', datetime.now()), 'isoformat') else str(doc_data.get('updated_at', datetime.now())),
            'firestore_status': firestore_status,
            'firestore_type': firestore_type
        }
        
    except Exception as e:
        logger.error(f"Erreur transformation données: {e}")
        logger.error(f"Document ID: {doc_id}")
        logger.error(f"Données document: {doc_data}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def calculate_deadline_from_period(periode, declaration_type):
    """Calcule une deadline approximative basée sur la période et le type"""
    try:
        # Deadlines par type de déclaration (en jours après la fin de période)
        deadline_days = {
            'tva': 20,  # TVA due le 20 du mois suivant
            'urssaf': 15,  # URSSAF due le 15 du mois suivant
            'charges_sociales': 15,
            'demande_aides': 30,
            'bilan': 90
        }
        
        days_after = deadline_days.get(declaration_type, 30)
        
        # Parser la période (ex: "2025-10")
        if '-' in periode:
            year, month = periode.split('-')
            year, month = int(year), int(month)
            
            # Calculer le mois suivant
            if month == 12:
                next_month = 1
                next_year = year + 1
            else:
                next_month = month + 1
                next_year = year
            
            # Créer la deadline
            deadline = datetime(next_year, next_month, days_after)
            return deadline.strftime('%Y-%m-%d')
        
        # Fallback: deadline dans 30 jours
        from datetime import timedelta
        deadline = datetime.now() + timedelta(days=30)
        return deadline.strftime('%Y-%m-%d')
        
    except Exception as e:
        logger.error(f"Erreur calcul deadline: {e}")
        # Fallback
        from datetime import timedelta
        deadline = datetime.now() + timedelta(days=30)
        return deadline.strftime('%Y-%m-%d')

def get_procedures_from_firestore(user_id=None):
    """Récupère les démarches depuis Firestore"""
    if not db:
        logger.warning("Firestore non initialisé pour les démarches")
        return []
        
    try:
        declarations_ref = db.collection('declarations')
        
        # Pour debug : récupérer toutes les démarches d'abord
        logger.info("🔍 Debug: Récupération de toutes les démarches pour analyse...")
        query = declarations_ref.limit(10)  # Limiter pour le debug
        
        docs = query.stream()
        
        procedures = []
        for doc in docs:
            doc_data = doc.to_dict()
            logger.info(f"📄 Document trouvé: {doc.id}")
            logger.info(f"   Champs: {list(doc_data.keys())}")
            logger.info(f"   user_id: {doc_data.get('user_id', 'NON TROUVÉ')}")
            logger.info(f"   type: {doc_data.get('type', 'NON TROUVÉ')}")
            
            # Filtrer par user_id si spécifié
            if user_id and doc_data.get('user_id') != user_id:
                logger.info(f"   ⏭️ Ignoré (user_id ne correspond pas)")
                continue
                
            transformed = transform_firestore_to_frontend(doc_data, doc.id)
            if transformed:
                procedures.append(transformed)
        
        logger.info(f"Récupéré {len(procedures)} démarches depuis Firestore")
        return procedures
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des démarches: {e}")
        return []

# ============================================================================
# ENDPOINTS DU MODULE PROCEDURES
# ============================================================================

@procedures_bp.route('/', methods=['GET'])
def get_procedures():
    """Endpoint principal pour récupérer les démarches"""
    try:
        # Paramètres optionnels
        # Par défaut on ne filtre pas par user_id (None) pour éviter d'ignorer
        # les documents réels qui ont d'autres valeurs comme 'gemini_detection'.
        user_id = request.args.get('user_id', None)

        logger.info(f"Récupération des démarches pour user_id: {user_id if user_id else 'ALL'}")

        # Récupérer depuis Firestore
        procedures = get_procedures_from_firestore(user_id)
        
        return jsonify({
            'success': True,
            'data': procedures,
            'count': len(procedures),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur endpoint /procedures: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

@procedures_bp.route('/health', methods=['GET'])
def procedures_health():
    """Health check spécifique au module démarches"""
    try:
        status = "healthy"
        checks = {
            "firestore": db is not None,
            "gcp_project": GCP_PROJECT is not None
        }
        
        if not all(checks.values()):
            status = "degraded"
            
        return jsonify({
            "module": "procedures",
            "status": status,
            "checks": checks,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "module": "procedures", 
            "status": "error",
            "error": str(e)
        }), 500

@procedures_bp.route('/config', methods=['GET'])
def procedures_config():
    """Configuration actuelle du module démarches"""
    return jsonify({
        "module": "procedures",
        "config": {
            "gcp_project": GCP_PROJECT,
            "max_procedures": MAX_PROCEDURES,
            "firestore_connected": db is not None
        }
    })

# ============================================================================
# ENDPOINTS DE TEST/DEBUG (optionnels)
# ============================================================================

@procedures_bp.route('/test/firestore', methods=['GET'])
def test_procedures_firestore():
    """Test de connexion Firestore pour les démarches"""
    if not db:
        return jsonify({"error": "Firestore non initialisé"}), 500
    
    try:
        # Test de lecture de la collection declarations
        declarations_ref = db.collection('declarations')
        count_query = declarations_ref.limit(1).stream()
        count = len(list(count_query))
        
        return jsonify({
            "status": "success",
            "message": "Connexion Firestore OK pour démarches",
            "collection": "declarations",
            "can_access": count >= 0
        })
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@procedures_bp.route('/test/sample', methods=['GET'])
def test_sample_procedure():
    """Retourne un échantillon de démarche pour test"""
    sample = get_procedures_from_firestore('test_user')
    return jsonify({
        "status": "success",
        "sample_count": len(sample),
        "sample": sample[:1] if sample else []
    })
