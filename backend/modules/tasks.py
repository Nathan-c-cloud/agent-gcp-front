"""
Module de gestion des tâches
Les tâches sont créées à partir des règles d'alertes
"""

from flask import Blueprint, jsonify, request
from google.cloud import firestore
import logging
import os

# Initialisation du logger
logger = logging.getLogger(__name__)

# Blueprint pour les tâches
tasks_bp = Blueprint('tasks', __name__)

# Initialisation Firestore
try:
    db = firestore.Client()
    logger.info('✅ Firestore client initialisé pour le module tâches')
except Exception as e:
    db = None
    logger.error(f'❌ Erreur Firestore pour tâches: {e}')

@tasks_bp.route('/health', methods=['GET'])
def health_check():
    """Health check du module tâches"""
    return jsonify({
        "status": "healthy",
        "module": "tasks",
        "firestore": "connected" if db else "disconnected"
    }), 200

@tasks_bp.route('/', methods=['GET'])
def get_all_tasks():
    """Récupère toutes les tâches (pour debug)"""
    try:
        if not db:
            return jsonify({"error": "Firestore non disponible"}), 503
        
        tasks_ref = db.collection('tasks')
        tasks = []
        
        for doc in tasks_ref.stream():
            task_data = doc.to_dict()
            task_data['id'] = doc.id
            tasks.append(task_data)
        
        logger.info(f'📋 Récupéré {len(tasks)} tâches')
        return jsonify({
            "tasks": tasks,
            "count": len(tasks)
        }), 200
        
    except Exception as e:
        logger.error(f'❌ Erreur lors de la récupération des tâches: {e}')
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/org/<org_id>', methods=['GET'])
def get_tasks_by_org(org_id):
    """Récupère toutes les tâches d'une organisation"""
    try:
        if not db:
            return jsonify({"error": "Firestore non disponible"}), 503
        
        # Récupérer les tâches de l'organisation
        tasks_ref = db.collection('tasks').where('org_id', '==', org_id)
        tasks = []
        
        for doc in tasks_ref.stream():
            task_data = doc.to_dict()
            task_data['id'] = doc.id
            tasks.append(task_data)
        
        # Trier par date de création (plus récentes en premier)
        tasks.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        
        logger.info(f'📋 Récupéré {len(tasks)} tâches pour l\'organisation {org_id}')
        return jsonify({
            "tasks": tasks,
            "org_id": org_id,
            "count": len(tasks)
        }), 200
        
    except Exception as e:
        logger.error(f'❌ Erreur lors de la récupération des tâches pour {org_id}: {e}')
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/<task_id>', methods=['GET'])
def get_task_by_id(task_id):
    """Récupère une tâche spécifique par son ID"""
    try:
        if not db:
            return jsonify({"error": "Firestore non disponible"}), 503
        
        doc_ref = db.collection('tasks').document(task_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"error": "Tâche non trouvée"}), 404
        
        task_data = doc.to_dict()
        task_data['id'] = doc.id
        
        logger.info(f'📋 Tâche récupérée: {task_id}')
        return jsonify({"task": task_data}), 200
        
    except Exception as e:
        logger.error(f'❌ Erreur lors de la récupération de la tâche {task_id}: {e}')
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/<task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    """Met à jour le statut d'une tâche"""
    try:
        if not db:
            return jsonify({"error": "Firestore non disponible"}), 503
        
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({"error": "Le champ 'status' est requis"}), 400
        
        new_status = data['status']
        valid_statuses = ['open', 'in_progress', 'completed', 'cancelled']
        
        if new_status not in valid_statuses:
            return jsonify({
                "error": f"Statut invalide. Valeurs acceptées: {', '.join(valid_statuses)}"
            }), 400
        
        # Récupérer la tâche
        doc_ref = db.collection('tasks').document(task_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"error": "Tâche non trouvée"}), 404
        
        # Mettre à jour le statut
        import time
        update_data = {
            'status': new_status,
            'updated_at': int(time.time() * 1000)  # timestamp en millisecondes
        }
        
        doc_ref.update(update_data)
        
        # Récupérer la tâche mise à jour
        updated_doc = doc_ref.get()
        task_data = updated_doc.to_dict()
        task_data['id'] = updated_doc.id
        
        logger.info(f'✅ Statut de la tâche {task_id} mis à jour: {new_status}')
        return jsonify({
            "task": task_data,
            "message": f"Statut mis à jour: {new_status}"
        }), 200
        
    except Exception as e:
        logger.error(f'❌ Erreur lors de la mise à jour du statut de la tâche {task_id}: {e}')
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/stats/<org_id>', methods=['GET'])
def get_task_stats(org_id):
    """Récupère les statistiques des tâches pour une organisation"""
    try:
        if not db:
            return jsonify({"error": "Firestore non disponible"}), 503
        
        tasks_ref = db.collection('tasks').where('org_id', '==', org_id)
        
        stats = {
            'total': 0,
            'open': 0,
            'in_progress': 0,
            'completed': 0,
            'cancelled': 0,
            'needs_review': 0
        }
        
        for doc in tasks_ref.stream():
            task_data = doc.to_dict()
            stats['total'] += 1
            
            status = task_data.get('status', 'open')
            if status in stats:
                stats[status] += 1
            
            if task_data.get('needs_review', False):
                stats['needs_review'] += 1
        
        logger.info(f'📊 Statistiques des tâches pour {org_id}: {stats}')
        return jsonify({
            "org_id": org_id,
            "stats": stats
        }), 200
        
    except Exception as e:
        logger.error(f'❌ Erreur lors de la récupération des statistiques pour {org_id}: {e}')
        return jsonify({"error": str(e)}), 500
