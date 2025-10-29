"""
Module d'authentification pour la démo RegleWatch
Gère l'inscription et la connexion sans Firebase Auth
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from google.cloud import firestore

# Configuration JWT
JWT_SECRET = "demo-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

class AuthService:
    def __init__(self):
        self.db = firestore.Client()
        
    def hash_password(self, password: str) -> str:
        """Hash un mot de passe avec un salt"""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{pwd_hash.hex()}"
    
    def verify_password(self, password: str, hash_str: str) -> bool:
        """Vérifie un mot de passe contre son hash"""
        try:
            salt, pwd_hash = hash_str.split(':')
            return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex() == pwd_hash
        except:
            return False
    
    def generate_token(self, user_id: str) -> str:
        """Génère un JWT token pour l'utilisateur"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    def verify_token(self, token: str) -> Optional[str]:
        """Vérifie un JWT token et retourne l'user_id"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload.get('user_id')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    async def register_user(self, email: str, password: str, company_name: str) -> Dict[str, Any]:
        """Inscrit un nouvel utilisateur"""
        try:
            # Vérifier si l'utilisateur existe déjà
            users_ref = self.db.collection('users')
            existing_user = users_ref.where('email', '==', email).limit(1).get()
            
            if len(list(existing_user)) > 0:
                raise ValueError("Un compte existe déjà avec cette adresse e-mail")
            
            # Créer l'utilisateur (toujours avec les mêmes IDs pour la démo)
            user_id = "test_user"  # Toujours le même pour la démo
            company_id = "demo_company"  # Toujours le même pour la démo
            
            # Hash du mot de passe
            password_hash = self.hash_password(password)
            
            # Créer le document utilisateur
            user_data = {
                'email': email,
                'password_hash': password_hash,
                'companyId': company_id,
                'companyName': company_name,
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            # Sauvegarder dans Firestore
            self.db.collection('users').document(user_id).set(user_data)
            
            # Générer un token
            token = self.generate_token(user_id)
            
            return {
                'success': True,
                'user': {
                    'uid': user_id,
                    'email': email,
                    'companyId': company_id
                },
                'token': token
            }
            
        except Exception as e:
            print(f"Erreur lors de l'inscription: {e}")
            raise e
    
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Connecte un utilisateur"""
        try:
            # Chercher l'utilisateur par email
            users_ref = self.db.collection('users')
            user_query = users_ref.where('email', '==', email).limit(1).get()
            
            user_docs = list(user_query)
            if len(user_docs) == 0:
                raise ValueError("Aucun compte trouvé avec cette adresse e-mail")
            
            user_doc = user_docs[0]
            user_data = user_doc.to_dict()
            
            # Vérifier le mot de passe
            if not self.verify_password(password, user_data.get('password_hash', '')):
                raise ValueError("Mot de passe incorrect")
            
            # Pour la démo, toujours retourner les mêmes IDs
            user_id = "test_user"
            company_id = "demo_company"
            
            # Générer un token
            token = self.generate_token(user_id)
            
            return {
                'success': True,
                'user': {
                    'uid': user_id,
                    'email': user_data['email'],
                    'companyId': company_id
                },
                'token': token
            }
            
        except Exception as e:
            print(f"Erreur lors de la connexion: {e}")
            raise e

# Instance globale
auth_service = AuthService()