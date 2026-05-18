# 📱 Guide de démarrage - Propria

## Vue d'ensemble du projet

**Nom:** Propria  
**Type:** Application web full-stack de gestion immobilière  
**Architecture:** Frontend (React 19) + Backend (FastAPI)

---

## 🛠️ Technologies utilisées

### Frontend
- **React 19** - Framework UI
- **React Router v7.5.1** - Navigation
- **Tailwind CSS** - Styling
- **Radix UI** - Composants accessibles (30+ composants)
- **React Hook Form** + Zod - Gestion des formulaires
- **Axios** - Requêtes HTTP
- **Date-fns** - Manipulation des dates
- **Lucide React** - Icons

### Backend
- **FastAPI 0.110.1** - Framework API moderne
- **MongoDB** (Motor async driver) - Base de données NoSQL
- **Uvicorn** - Serveur ASGI
- **JWT** - Authentification
- **Bcrypt** - Hachage des mots de passe
- **Boto3** - AWS S3 (uploads fichiers)
- **OAuth2** - Google Sign-In

### Qualité du code
- Black, isort - Formatage/organisation imports
- Flake8, mypy - Linting et types
- Pytest - Tests

---

## 📋 Fonctionnalités principales

L'application est un **système de gestion de propriétés locatives** avec :

1. **Authentification** - Connexion classique + Google OAuth
2. **Tableau de bord** - Vue d'ensemble des activités
3. **Gestion des biens** - Créer, modifier, lister les propriétés
4. **Gestion des locataires** - Suivi des locataires par bien
5. **Paiements** - Gestion des loyers et paiements
6. **Documents** - Upload et stockage de fichiers (contrats, justificatifs)
7. **Relances** - Suivi des paiements en retard
8. **Paramètres** - Configuration de l'application

---

## 🎨 Design & Guidelines

- **Thème:** Natural Chic (sage verte + blanc)
- **Philosophie:** Douceur, calme, clarté, professionnalisme
- **Palette:** 
  - Primaire: `#5F8D7E` (sage verte)
  - Fond: `#F5F7F6` (très clair)
  - Support: `#A7D8C8` (sidebar)

---

## 🚀 Guide de démarrage

### Prérequis
- Node.js 18+ et npm
- Python 3.8+
- MongoDB (local ou Atlas)
- Compte AWS (optionnel, pour S3)

### 1️⃣ Configuration - Backend

```bash
cd backend
```

**Créer le fichier `.env` :**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=propria
JWT_SECRET=your-secret-key-here
REACT_APP_BACKEND_URL=http://localhost:8000

# Optionnel - Google OAuth
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Optionnel - AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=propria-uploads
```

**Installer les dépendances :**
```bash
pip install -r requirements.txt
```

**Démarrer le serveur :**
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend disponible sur `http://localhost:8000`
📖 Documentation API : `http://localhost:8000/docs`

---

### 2️⃣ Configuration - Frontend

```bash
cd frontend
```

**Créer le fichier `.env.local` :**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-id
```

**Installer les dépendances :**
```bash
npm install
```

**Démarrer l'app en développement :**
```bash
npm start
```

✅ App disponible sur `http://localhost:3000`

---

## 📁 Structure du projet

```
Appart/
├── backend/
│   ├── server.py          # Application principale
│   ├── requirements.txt   # Dépendances Python
│   ├── .env              # Variables d'environnement
│   └── __pycache__/
│
├── frontend/
│   ├── src/
│   │   ├── pages/        # Pages principales
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── BienDetails.jsx
│   │   │   ├── Biens.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── LocataireDetails.jsx
│   │   │   ├── Locataires.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Paiements.jsx
│   │   │   ├── Parametres.jsx
│   │   │   └── Relances.jsx
│   │   ├── components/   # Composants réutilisables
│   │   │   ├── Layout.jsx
│   │   │   └── ui/       # Composants Radix UI
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── lib/          # Utilitaires
│   │   ├── App.js        # Router principal
│   │   ├── index.js      # Point d'entrée
│   │   ├── App.css
│   │   └── index.css
│   ├── public/           # Assets statiques
│   ├── plugins/          # Plugins webpack
│   ├── package.json      # Dépendances npm
│   └── .env.local        # Variables d'environnement
│
├── tests/                # Tests
│
├── design_guidelines.json # Directives de design
├── README.md             # Documentation générale
└── GUIDE_DEMARRAGE.md   # Ce fichier
```

---

## 🔑 Points clés à retenir

| Aspect | Détail |
|--------|--------|
| **Authentification** | JWT en localStorage + Google OAuth optionnel |
| **CORS** | Configuré pour frontend local |
| **Uploads** | S3 ou répertoire local `/uploads` |
| **Base de données** | MongoDB (asynchrone avec Motor) |
| **Styling** | Tailwind CSS + variables CSS personnalisées |
| **Composants UI** | Radix UI (30+ composants préconfigurés) |
| **Formulaires** | React Hook Form avec validation |
| **Tests** | Pytest côté backend, npm test côté frontend |

---

## ✅ Checklist de démarrage

- [ ] MongoDB en cours d'exécution
- [ ] Fichiers `.env` créés (backend)
- [ ] Fichiers `.env.local` créés (frontend)
- [ ] `pip install -r requirements.txt` complété
- [ ] `npm install` complété (depuis le dossier frontend)
- [ ] Backend démarré (`uvicorn server:app --reload`)
- [ ] Frontend démarré (`npm start`)
- [ ] Accès à http://localhost:3000
- [ ] Test de connexion/création de compte

---

## 📝 Commandes utiles

### Backend
```bash
# Développement avec rechargement automatique
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Formatage du code
black backend/
isort backend/

# Linting
flake8 backend/

# Type checking
mypy backend/

# Tests
pytest
```

### Frontend
```bash
# Développement
npm start

# Build production
npm run build

# Tests
npm test

# Eject (attention: irréversible)
npm run eject
```

---

## 🐛 Troubleshooting

### Backend ne démarre pas
- ✅ Vérifiez que MongoDB est en cours d'exécution
- ✅ Vérifiez les variables d'environnement dans `.env`
- ✅ Installez les dépendances: `pip install -r requirements.txt`

### Frontend affiche erreur CORS
- ✅ Vérifiez que le backend est en cours d'exécution sur le port 8000
- ✅ Vérifiez que `REACT_APP_BACKEND_URL` pointe vers `http://localhost:8000`

### MongoDB ne se connecte pas
- ✅ Si local: `mongod` doit être en cours d'exécution
- ✅ Si Atlas: URL formatée correctement dans `MONGO_URL`

---

## 📚 Ressources additionnelles

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Motor Documentation](https://motor.readthedocs.io/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Dernière mise à jour:** Mars 2026  
**Auteur:** Équipe Propria
