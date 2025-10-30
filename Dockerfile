# Dockerfile unifié pour déploiement Cloud Run
# Frontend (nginx) + Backend (Flask) dans une seule image

# Stage 1: Build du frontend React/Vite
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copier les dépendances
COPY package*.json ./
RUN npm ci

# Copier .env.docker pour le build
COPY .env.docker .env.local

# Copier le code source
COPY . .

# Build de l'application frontend
RUN npm run build

# Stage 2: Image finale avec nginx + Python backend
FROM python:3.13-slim

# Installer nginx et supervisor (pour gérer les 2 processus)
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# === Configuration Backend ===
WORKDIR /app/backend

# Copier les dépendances Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code backend
COPY backend/ .

# Définir la variable d'environnement pour les credentials Firestore
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/backend/service-account-key.json

# === Configuration Frontend ===
# Copier le build frontend vers nginx
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Copier la configuration nginx unifiée (localhost au lieu de backend)
COPY nginx.unified.conf /etc/nginx/conf.d/default.conf

# Supprimer la config nginx par défaut
RUN rm /etc/nginx/sites-enabled/default

# === Configuration Supervisor ===
# Créer le fichier de configuration supervisor pour gérer les 2 processus
RUN echo '[supervisord]\n\
nodaemon=true\n\
logfile=/var/log/supervisor/supervisord.log\n\
pidfile=/var/run/supervisord.pid\n\
\n\
[program:backend]\n\
command=python /app/backend/app.py\n\
directory=/app/backend\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/var/log/backend.err.log\n\
stdout_logfile=/var/log/backend.out.log\n\
environment=PORT="5000"\n\
\n\
[program:nginx]\n\
command=/usr/sbin/nginx -g "daemon off;"\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/var/log/nginx.err.log\n\
stdout_logfile=/var/log/nginx.out.log' > /etc/supervisor/conf.d/supervisord.conf

# Créer les répertoires de logs
RUN mkdir -p /var/log/supervisor

# Exposer le port 8080 (requis par Cloud Run)
EXPOSE 8080

# Démarrer supervisor qui gère nginx + backend
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
