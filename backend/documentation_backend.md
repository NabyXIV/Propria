# Propria — Backend API

Backend de l'application **Propria**, une solution de gestion locative développée avec FastAPI et MongoDB.

---

## Stack technique

| Outil | Rôle |
|---|---|
| **FastAPI** | Framework Python pour l'API REST |
| **Uvicorn** | Serveur ASGI pour lancer FastAPI |
| **Motor** | Driver async Python pour MongoDB |
| **MongoDB Atlas** | Base de données cloud (NoSQL) |
| **Supabase Storage** | Stockage des fichiers (contrats, documents) |
| **PyJWT + Bcrypt** | Authentification JWT + hashage des mots de passe |
| **PayDunya** | Paiements mobiles Wave + Orange Money |
| **Railway** | Hébergement du backend en production |

---

## Structure du projet

```
backend/
├── main.py                  # Point d'entrée — config FastAPI, CORS, routes
├── Procfile                 # Commande de démarrage pour Railway
├── runtime.txt              # Version Python pour Railway
├── requirements.txt         # Dépendances Python
├── .env                     # Variables d'environnement (ne jamais commiter !)
├── .gitignore
└── app/
    ├── core/
    │   ├── config.py        # Centralise toute la configuration (.env)
    │   └── database.py      # Connexion MongoDB Atlas
    ├── routes/
    │   ├── auth.py          # Login, register, logout, me
    │   ├── buildings.py     # CRUD immeubles
    │   ├── units.py         # CRUD appartements
    │   ├── tenants.py       # CRUD locataires
    │   ├── leases.py        # CRUD baux + upload contrat
    │   ├── payments.py      # CRUD paiements + statuts
    │   ├── dashboard.py     # Stats, paiements récents, graphique
    │   ├── reminders.py     # Relances locataires
    │   └── documents.py     # Upload documents vers Supabase
    ├── schemas/
    │   ├── auth.py          # Modèles Pydantic pour l'auth
    │   ├── building.py      # Modèles immeubles
    │   ├── unit.py          # Modèles appartements
    │   ├── tenant.py        # Modèles locataires
    │   ├── lease.py         # Modèles baux
    │   ├── payment.py       # Modèles paiements
    │   ├── reminder.py      # Modèles relances
    │   └── document.py      # Modèles documents
    └── services/
        ├── auth_service.py      # Logique auth (hash, JWT, DB)
        ├── building_service.py  # Logique métier immeubles
        ├── unit_service.py      # Logique métier appartements
        ├── tenant_service.py    # Logique métier locataires
        ├── lease_service.py     # Logique métier baux
        ├── payment_service.py   # Logique métier paiements
        ├── reminder_service.py  # Logique métier relances
        ├── document_service.py  # Logique métier documents
        └── storage_service.py   # Upload/suppression Supabase Storage
```

## Variables d'environnement

Crée un fichier `.env` dans le dossier `backend/` :

```env
# MongoDB Atlas
MONGO_URL=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?appName=propria
DB_NAME=propria

# JWT
JWT_SECRET=propria-secret-key-super-secure-2026

# Frontend URL
REACT_APP_BACKEND_URL=http://localhost:8000

# Supabase Storage
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=ta_service_role_key

# PayDunya
PAYDUNYA_MASTER_KEY=ta_cle_principale
PAYDUNYA_PUBLIC_KEY=ta_cle_publique_test
PAYDUNYA_PRIVATE_KEY=ta_cle_privee_test
PAYDUNYA_TOKEN=ton_token_test
PAYDUNYA_MODE=test  # changer en "live" pour la prod
```

---

## Lancer le projet en local

### 1. Prérequis

- Python 3.11+
- Un compte MongoDB Atlas avec un cluster créé
- Un compte Supabase avec les buckets `contracts` et `documents` créés
- Un compte PayDunya avec une application configurée

### 2. Créer et activer l'environnement virtuel

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer le fichier .env

Copie le template ci-dessus et remplis avec tes vraies clés.

### 5. Lancer le serveur

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur tourne sur `http://localhost:8000`
La documentation Swagger est sur `http://localhost:8000/docs`

---

## Endpoints disponibles

### Auth
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/api/auth/register` | Créer un compte | Non |
| POST | `/api/auth/login` | Se connecter | Non |
| GET | `/api/auth/me` | Profil connecté | Oui |
| POST | `/api/auth/logout` | Se déconnecter | Oui |

### Immeubles
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/buildings` | Liste tous les immeubles | Oui |
| GET | `/api/buildings/{id}` | Détail d'un immeuble | Oui |
| POST | `/api/buildings` | Créer un immeuble | Oui |
| PUT | `/api/buildings/{id}` | Modifier un immeuble | Oui |
| DELETE | `/api/buildings/{id}` | Supprimer un immeuble | Oui |

### Appartements
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/units` | Liste tous les apparts | Oui |
| GET | `/api/units?building_id=xxx` | Filtrer par immeuble | Oui |
| GET | `/api/units/{id}` | Détail d'un appart | Oui |
| POST | `/api/units` | Créer un appart | Oui |
| PUT | `/api/units/{id}` | Modifier un appart | Oui |
| DELETE | `/api/units/{id}` | Supprimer un appart | Oui |

### Locataires
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/tenants` | Liste tous les locataires | Oui |
| GET | `/api/tenants/{id}` | Détail d'un locataire | Oui |
| POST | `/api/tenants` | Créer un locataire | Oui |
| PUT | `/api/tenants/{id}` | Modifier un locataire | Oui |
| DELETE | `/api/tenants/{id}` | Supprimer un locataire | Oui |

### Baux
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/leases` | Liste tous les baux | Oui |
| GET | `/api/leases?tenant_id=xxx` | Filtrer par locataire | Oui |
| GET | `/api/leases?unit_id=xxx` | Filtrer par appartement | Oui |
| GET | `/api/leases/{id}` | Détail d'un bail | Oui |
| POST | `/api/leases` | Créer un bail | Oui |
| PATCH | `/api/leases/{id}/terminate` | Terminer un bail | Oui |
| DELETE | `/api/leases/{id}` | Supprimer un bail | Oui |
| POST | `/api/leases/{id}/contract` | Uploader un contrat PDF | Oui |

### Paiements
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/payments` | Liste tous les paiements | Oui |
| GET | `/api/payments?status=LATE` | Filtrer par statut | Oui |
| GET | `/api/payments?period=2026-05` | Filtrer par période | Oui |
| GET | `/api/payments/{id}` | Détail d'un paiement | Oui |
| POST | `/api/payments` | Créer un paiement | Oui |
| PUT | `/api/payments/{id}` | Modifier statut paiement | Oui |
| DELETE | `/api/payments/{id}` | Supprimer un paiement | Oui |

### Dashboard
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Stats globales du mois | Oui |
| GET | `/api/dashboard/recent-payments` | Derniers paiements | Oui |
| GET | `/api/dashboard/chart-data` | Données graphique 12 mois | Oui |

### Relances
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/reminders` | Liste toutes les relances | Oui |
| POST | `/api/reminders` | Créer une relance | Oui |

### Documents
| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| GET | `/api/documents` | Liste tous les documents | Oui |
| GET | `/api/documents?tenant_id=xxx` | Filtrer par locataire | Oui |
| POST | `/api/documents/upload` | Uploader un document | Oui |
| DELETE | `/api/documents/{id}` | Supprimer un document | Oui |

---

## Statuts des paiements

| Statut | Signification |
|---|---|
| `UNPAID` | Loyer non encore payé ce mois |
| `VERIFY` | Locataire dit avoir payé, à vérifier |
| `PAID` | Paiement confirmé par la gérante |
| `LATE` | Date d'échéance dépassée, non payé |

---

## Supabase Storage

Deux buckets sont configurés, tous les deux en mode **public** :

| Bucket | Contenu | Chemin |
|---|---|---|
| `contracts` | Contrats de bail PDF | `{lease_id}/contrat.pdf` |
| `documents` | Documents locataires | `{tenant_id}/{doc_id}.pdf` |

---

## Authentification

L'API utilise **JWT (JSON Web Token)**. Après login, tu reçois un `access_token` à envoyer dans le header de chaque requête protégée :

Le token expire après **24 heures**.

---

## Déploiement

### Railway (backend)
- Connecté au repo GitHub (branche `main`)
- Déploiement automatique à chaque push sur `main`
- Variables d'environnement configurées dans Railway → Variables

### MongoDB Atlas
- Cluster : `propria`
- Network Access : `0.0.0.0/0` (accès depuis Railway)
- Deux projets : `propria-dev` et `propria-prod`

### Supabase
- Projet : `propria-dev`
- Buckets : `contracts` et `documents` (publics)

---

## Git Flow
main        ← production (Railway déploie automatiquement)
develop     ← intégration (code testé)
feat/xxx    ← nouvelles fonctionnalités
fix/xxx     ← corrections de bugs

### Workflow
```bash
# 1. Partir de develop
git checkout develop
git pull origin develop
git checkout -b feat/ma-feature

# 2. Coder + commiter
git add .
git commit -m "feat: description de ce que j'ai fait"

# 3. Merger dans develop
git checkout develop
git merge feat/ma-feature
git push origin develop

# 4. Quand c'est validé → merger dans main
git checkout main
git merge develop
git push origin main
```

---

## Convention des commits

| Préfixe | Usage |
|---|---|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `refactor:` | Réorganisation sans changement de comportement |
| `chore:` | Config, dépendances, fichiers techniques |
| `docs:` | Documentation |

---

## Contact & Support

- **Développeur back** : Diago
- **Développeur front** : Naby
- **PayDunya support** : tech@paydunya.com
- **MongoDB Atlas** : cloud.mongodb.com
- **Supabase** : supabase.com
- **Railway** : railway.app