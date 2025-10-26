#!/usr/bin/env python3
"""
Script pour créer des tâches de test dans Firestore
Usage: python seed_test_tasks.py
"""

from google.cloud import firestore
import os
from datetime import datetime, timedelta
import json
import sys

def seed_test_tasks():
    """Crée des tâches de test avec différentes échéances"""
    
    project_id = os.getenv('GCP_PROJECT')
    if not project_id:
        print("❌ Erreur: GCP_PROJECT doit être défini")
        print("Exportez votre project ID: export GCP_PROJECT=votre-project-id")
        return False
    
    try:
        db = firestore.Client(project=project_id)
        print(f"📡 Connexion à Firestore (project: {project_id})")
    except Exception as e:
        print(f"❌ Erreur de connexion à Firestore: {e}")
        return False
    
    # Tâches de test avec différentes échéances
    current_time = datetime.now()
    test_tasks = [
        {
            "task_id": "task_test_7_days",
            "title": "Tâche test - 7 jours",
            "description": "Tâche de test avec échéance dans 7 jours",
            "due_date": (current_time + timedelta(days=7)).isoformat(),
            "priority": "high",
            "status": "pending",
            "created_at": current_time.isoformat(),
            "category": "test",
            "assigned_to": "test-user"
        },
        {
            "task_id": "task_test_15_days",
            "title": "Tâche test - 15 jours", 
            "description": "Tâche de test avec échéance dans 15 jours",
            "due_date": (current_time + timedelta(days=15)).isoformat(),
            "priority": "medium",
            "status": "pending",
            "created_at": current_time.isoformat(),
            "category": "test",
            "assigned_to": "test-user"
        },
        {
            "task_id": "task_test_30_days",
            "title": "Tâche test - 30 jours",
            "description": "Tâche de test avec échéance dans 30 jours", 
            "due_date": (current_time + timedelta(days=30)).isoformat(),
            "priority": "low",
            "status": "pending",
            "created_at": current_time.isoformat(),
            "category": "test",
            "assigned_to": "test-user"
        },
        {
            "task_id": "task_test_urgent_3_days",
            "title": "Tâche URGENTE - 3 jours",
            "description": "Tâche de test urgente avec échéance dans 3 jours",
            "due_date": (current_time + timedelta(days=3)).isoformat(),
            "priority": "critical",
            "status": "pending",
            "created_at": current_time.isoformat(),
            "category": "urgent",
            "assigned_to": "test-user"
        }
    ]
    
    print(f"🌱 Création de {len(test_tasks)} tâches de test...")
    print("")
    
    # Insérer les tâches
    success_count = 0
    for task in test_tasks:
        try:
            doc_ref = db.collection('tasks').document(task['task_id'])
            doc_ref.set(task)
            print(f"✅ Tâche créée: {task['task_id']}")
            print(f"   📅 Échéance: {task['due_date']}")
            print(f"   🎯 Priorité: {task['priority']}")
            print("")
            success_count += 1
        except Exception as e:
            print(f"❌ Erreur lors de la création de {task['task_id']}: {e}")
    
    if success_count == len(test_tasks):
        print(f"🎉 {success_count}/{len(test_tasks)} tâches créées avec succès!")
        print("")
        print("🔍 Vous pouvez maintenant :")
        print("1. Tester l'endpoint /alerts pour déclencher alert-engine")
        print("2. Vérifier la création d'alertes dans la collection 'alerts'")
        print("3. Utiliser les scripts de test pour valider le comportement")
        return True
    else:
        print(f"⚠️  Seulement {success_count}/{len(test_tasks)} tâches créées")
        return False

def clean_test_data():
    """Supprime les données de test (optionnel)"""
    project_id = os.getenv('GCP_PROJECT')
    if not project_id:
        print("❌ Erreur: GCP_PROJECT doit être défini")
        return False
    
    try:
        db = firestore.Client(project=project_id)
        
        # Supprimer les tâches de test
        tasks_to_delete = ["task_test_7_days", "task_test_15_days", "task_test_30_days", "task_test_urgent_3_days"]
        
        print("🧹 Suppression des données de test...")
        for task_id in tasks_to_delete:
            try:
                db.collection('tasks').document(task_id).delete()
                print(f"🗑️  Tâche supprimée: {task_id}")
            except Exception as e:
                print(f"⚠️  Erreur suppression {task_id}: {e}")
        
        # Optionnel: nettoyer les alertes de test
        print("🧹 Nettoyage des alertes de test...")
        alerts_ref = db.collection('alerts')
        for doc in alerts_ref.where('task_id', 'in', tasks_to_delete).stream():
            try:
                doc.reference.delete()
                print(f"🗑️  Alerte supprimée: {doc.id}")
            except Exception as e:
                print(f"⚠️  Erreur suppression alerte: {e}")
        
        print("✅ Nettoyage terminé!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du nettoyage: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--clean':
        clean_test_data()
    else:
        seed_test_tasks()