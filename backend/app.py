"""
Backend généraliste pour Agent GCP Frontend
Chaque module gère sa partie spécifique
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# Import des modules spécialisés
from modules.alerts import alerts_bp
from modules.veille import veille_bp
from modules.procedures import procedures_bp  # Module des démarches maintenant disponible
from modules.auth import auth_service
# from modules.settings import settings_bp  # À ajouter par l'ami qui fait settings
# from modules.watch import watch_bp  # À ajouter par l'ami qui fait watch

app = Flask(__name__)
CORS(app)
# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === Firestore client initialisation (utilise la clé de service présente dans le repo)
try:
    from google.oauth2 import service_account
    from google.cloud import firestore
    sa_path = os.path.join(os.path.dirname(__file__), 'service-account-key.json')
    if os.path.exists(sa_path):
        credentials = service_account.Credentials.from_service_account_file(sa_path)
        db_client = firestore.Client(credentials=credentials, project=credentials.project_id)
        logger.info('✅ Firestore client initialisé avec la clé de service')
    else:
        db_client = firestore.Client()
        logger.warning('⚠️ service-account-key.json introuvable, Firestore client initialisé sans fichier (utilise les variables d\'environnement si présentes)')
except Exception as e:
    db_client = None
    logger.error(f"Impossible d'initialiser Firestore client: {e}")

# Configuration générale
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# ============================================================================
# ROUTES GÉNÉRALES (communes à tous les modules)
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check global de l'API"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(__import__('time').time()),
        "modules": {
            "alerts": "active",
            "veille": "active",
            "procedures": "active",  # Maintenant actif
            "settings": "pending",  # À changer quand le module sera ajouté
            "watch": "pending"
        }
    })

@app.route('/', methods=['GET'])
def api_info():
    """Information sur l'API disponible"""
    return jsonify({
        "name": "Agent GCP Backend API",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check global",
            "/alerts/*": "Module des alertes (actif)",
            "/veille/*": "Module de veille réglementaire (actif)",
            "/settings/*": "Module des paramètres (à venir)",
            "/procedures/*": "Module des démarches (actif)", 
            "/watch/*": "Module de veille (à venir)"
        },
        "documentation": "Voir README.md pour les détails"
    })

# ============================================================================
# ENREGISTREMENT DES MODULES (blueprints)
# ============================================================================

# Module Alertes (déjà implémenté)
app.register_blueprint(alerts_bp, url_prefix='/alerts')

# Module Veille
app.register_blueprint(veille_bp, url_prefix='/veille')

# Modules à ajouter par les autres développeurs :
# app.register_blueprint(settings_bp, url_prefix='/settings')
# app.register_blueprint(procedures_bp, url_prefix='/procedures')
# Module Procédures/Démarches (maintenant implémenté)
app.register_blueprint(procedures_bp, url_prefix='/procedures')

# Modules à ajouter par les autres développeurs :
# app.register_blueprint(settings_bp, url_prefix='/settings')
# app.register_blueprint(watch_bp, url_prefix='/watch')

# ============================================================================
# ROUTES D'AUTHENTIFICATION
# ============================================================================

@app.route('/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation des données
        if not data or not data.get('email') or not data.get('password') or not data.get('companyName'):
            return jsonify({'error': 'Email, mot de passe et nom de l\'entreprise requis'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        company_name = data['companyName'].strip()
        
        # Validation basique
        if len(password) < 6:
            return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400
        
        if '@' not in email:
            return jsonify({'error': 'Adresse e-mail invalide'}), 400
        
        # Générer un nouvel utilisateur et le sauvegarder dans Firestore
        import jwt
        import uuid
        from datetime import datetime, timedelta, timezone

        uid = uuid.uuid4().hex
        # Simple companyId slug (pour la démo)
        company_id = company_name.lower().replace(' ', '_')

        user_doc = {
            'uid': uid,
            'email': email,
            'companyId': company_id,
            'companyName': company_name,
            'createdAt': datetime.now(timezone.utc)
        }

        # Essayer d'écrire dans Firestore si le client est disponible
        if db_client:
            try:
                db_client.collection('users').document(uid).set(user_doc)
                logger.info(f"✅ Nouvel utilisateur créé en Firestore: {uid} ({email})")
            except Exception as e:
                logger.error(f"❌ Erreur écriture Firestore pour user {uid}: {e}")
                logger.error(f"   Type d'erreur: {type(e).__name__}")
                logger.error(f"   Vérifiez les permissions IAM du service account")
                # Pour la démo, on continue quand même et on retourne le token
                # (l'utilisateur pourra se connecter mais ne sera pas persisté)
                logger.warning(f"⚠️  Inscription continuée sans persistence (mode démo)")
        else:
            logger.warning('⚠️  db_client non initialisé : l\'utilisateur ne sera pas persisté en base')

        token = jwt.encode({
            'user_id': uid,
            'email': email,
            'companyId': company_id,
            'exp': (datetime.now(timezone.utc) + timedelta(days=7)).timestamp()
        }, os.getenv('JWT_SECRET', 'votre-secret-jwt'), algorithm='HS256')

        result = {
            'success': True,
            'token': token,
            'user': {
                'uid': uid,
                'email': email,
                'companyId': company_id
            }
        }

        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur lors de l'inscription: {e}")
        return jsonify({'error': 'Erreur lors de l\'inscription. Veuillez réessayer'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json()
        
        # Validation des données
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Pour la démo, on génère directement un token sans vérification
        import jwt
        from datetime import datetime, timedelta, timezone

        token = jwt.encode({
            'user_id': 'test_user',
            'email': 'demo@example.com',
            'companyId': 'demo_company',
            'exp': (datetime.now(timezone.utc) + timedelta(days=7)).timestamp()
        }, os.getenv('JWT_SECRET', 'votre-secret-jwt'), algorithm='HS256')

        result = {
            'success': True,
            'token': token,
            'user': {
                'uid': 'test_user',
                'email': 'demo@example.com',
                'companyId': 'demo_company'
            }
        }

        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur lors de la connexion: {e}")
        return jsonify({'error': 'Erreur lors de la connexion. Veuillez réessayer'}), 500

# ============================================================================
# GESTION D'ERREURS GLOBALE
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint non trouvé",
        "message": "Vérifiez l'URL et le module demandé",
        "available_endpoints": ["/health", "/alerts", "/veille", "/procedures"]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur interne: {error}")
    return jsonify({
        "error": "Erreur interne du serveur",
        "message": "Consultez les logs pour plus de détails"
    }), 500

# ============================================================================
# DÉMARRAGE DE L'APPLICATION
# ============================================================================

if __name__ == '__main__':
    # Variables d'environnement communes
    port = int(os.getenv('PORT', 8080))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    logger.info("🚀 Démarrage du Backend Agent GCP")
    logger.info("=" * 50)
    logger.info(f"Mode: {'Debug' if debug else 'Production'}")
    logger.info(f"Port: {port}")
    logger.info("Modules actifs:")
    logger.info("  ✅ /alerts - Système d'alertes")
    logger.info("  ✅ /veille - Veille réglementaire")
    logger.info("  ⏳ /settings - Paramètres (à implémenter)")
    logger.info("  ✅ /procedures - Système de démarches")
    logger.info("  ⏳ /watch - À implémenter")
    logger.info("=" * 50)

    app.run(host='0.0.0.0', port=port, debug=debug)

