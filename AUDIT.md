# Audit frontend — Intendance
_Généré le 2026-05-17_

---

## 1. État général

Le projet est une SPA React (Create React App + Craco) pour la gestion locative. La couche service centralisée (`api.js`) a été créée et les 8 pages protégées ont été migrées depuis `fetch()` direct vers Axios. La page publique `/payer/:token` existe et est fonctionnelle en mode mock. Le squelette est sain mais plusieurs problèmes bloquants subsistent avant mise en production : credentials hardcodés visibles, nommage incohérent (`propria_*` partout), flux auth non migrés, et la page de paiement n'appelle jamais le backend réel.

---

## 2. Ce qui a été corrigé depuis le dernier audit

- ✅ **Couche service créée** — `src/services/api.js` : instance Axios centralisée avec intercepteur JWT + redirection 401
- ✅ **`getAuthHeaders()` supprimé** — plus aucune occurrence dans les pages
- ✅ **8 pages protégées migrées** vers `api.js` : Dashboard, Biens, BienDetails, Locataires, LocataireDetails, Paiements, Documents, Relances
- ✅ **`src/services/payments.js` créé** — getPaymentByToken, initiatePayment avec mode mock documenté
- ✅ **`/payer/:token` créé** — Payer.jsx avec 5 états (loading, ready, paying, paid, error), Wave + Orange Money
- ✅ **`useRef` supprimé** de App.js (était importé inutilement)
- ✅ **Popover notifications** — fond opaque fixé, clic redirige vers `/notifications/:id`
- ✅ **Switch dark mode** — visible dans les deux thèmes (bg-[var(--primary)] au lieu de bg-primary)
- ✅ **"Propria"/"DORA" renommé en "Intendance"** dans Parametres.jsx et Relances.jsx (message de relance)
- ✅ **`${API_URL}` supprimé** de LocataireDetails.jsx dans les `window.open` (remplacé par `process.env.REACT_APP_BACKEND_URL`)

---

## 3. Problèmes restants

### 🔴 Critique — à corriger avant toute mise en production

#### 3.1 Credentials de démo hardcodés et visibles dans la page de connexion
- **Fichier** : `src/pages/Login.jsx:197`
- **Problème** : `admin@example.com / AdminPassword123` affichés en clair dans le JSX visible par tout utilisateur
- **Impact** : Toute personne ayant accès à l'URL peut se connecter avec ces credentials si le backend les accepte encore
- **Correction** : Supprimer entièrement la ligne 197 avant la mise en prod

#### 3.2 Clés localStorage `propria_*` utilisées dans 13 endroits sur 6 fichiers
- **Fichiers** :
  - `src/App.js:39,40,119` — lit `propria_token`, `propria_user`, `propria_theme`
  - `src/pages/Login.jsx:20,43,44` — lit/écrit `propria_token`, `propria_user`
  - `src/pages/AuthCallback.jsx:45` — écrit `propria_user`
  - `src/components/Layout.jsx:69,70` — supprime `propria_token`, `propria_user`
  - `src/services/api.js:14,29,30` — lit/supprime `propria_token`, `propria_user`
  - `src/pages/Parametres.jsx:16,24,37,40,49` — lit/écrit `propria_user`, `propria_theme`
- **Problème** : Nommage incohérent avec le nom du produit "Intendance". Si un utilisateur avait une session sous l'ancien nom, il devra se reconnecter.
- **Impact** : Confusion de marque, dette technique, à faire avant tout déploiement public
- **Correction** : Renommer partout → `intendance_token`, `intendance_user`, `intendance_theme` (confirmer d'abord avec le binôme backend)

#### 3.3 Page de paiement entièrement mockée — jamais connectée au backend
- **Fichier** : `src/services/payments.js:7`
- **Problème** : `const MOCK = true` — `getPaymentByToken()` et `initiatePayment()` retournent des données fictives, aucun appel réseau réel
- **Impact** : La feature principale côté locataire (Wave / Orange Money) est non fonctionnelle en production
- **Correction** : Passer `MOCK = false` et déployer les endpoints backend `/payments/public/{token}` et `/payments/public/{token}/initiate`

---

### 🟠 Important — à corriger avant livraison client

#### 3.4 Flux auth (Login, App.js, AuthCallback, Layout logout) toujours en `fetch()` brut
- **Fichiers** :
  - `src/App.js:51` — `fetch(.../api/auth/me)` avec headers manuels
  - `src/pages/Login.jsx:31` — `fetch(.../api/auth/login)`
  - `src/pages/AuthCallback.jsx:31` — `fetch(.../api/auth/session)`
  - `src/components/Layout.jsx:62` — `fetch(.../api/auth/logout)`
- **Problème** : Ces 4 fichiers gardent `const API_URL` local et font des appels `fetch()` directs, contrairement aux 8 pages protégées qui utilisent `api.js`
- **Impact** : Incohérence — si le token expire pendant un appel auth, il n'est pas géré par l'intercepteur 401. Comportement imprévisible.
- **Correction** : Migrer ces appels vers `api.js` (en notant que Login/Payer sont des pages publiques — l'intercepteur 401 n'a pas d'effet négatif sur elles)

#### 3.5 "DORA" encore visible dans l'UI côté utilisateur
- **Fichiers** :
  - `src/components/Layout.jsx:151` — `<p>DORA</p>` dans la sidebar (visible sur toutes les pages)
  - `src/pages/Login.jsx:68` — `<h1>DORA</h1>` (desktop branding)
  - `src/pages/Login.jsx:103` — `<h1>DORA</h1>` (mobile branding)
- **Problème** : Le nom "DORA" s'affiche à tout utilisateur qui se connecte ou navigue dans l'app
- **Correction** : Remplacer par "Intendance" dans ces 3 endroits

#### 3.6 Notifications entièrement mockées — jamais récupérées depuis l'API
- **Fichier** : `src/components/Layout.jsx:46-50`
- **Problème** : `const mockNotifications = [...]` avec 3 entrées hardcodées (Lamine THIAM, APT-691, Babacar NGOM). Ces notifications sont les mêmes pour tous les utilisateurs.
- **Impact** : En production, les utilisateurs voient des alertes fictives sur des locataires qu'ils ne gèrent pas
- **Correction** : Remplacer par un appel `api.get("/api/reminders?unread=true")` au montage du composant

#### 3.7 Recherche entièrement mockée — retourne des résultats hardcodés
- **Fichier** : `src/components/Layout.jsx:74-115`
- **Problème** : La fonction `handleSearch()` retourne des résultats basés sur des chaînes hardcodées ("lamine", "thiam", "cheikh", "btp", "APT-7515"…) — aucun appel API
- **Impact** : Inutilisable en production (toujours les mêmes résultats peu importe la base de données)
- **Correction** : Remplacer par `api.get("/api/search?q=${query}")` ou supprimer la barre de recherche en attendant le backend

#### 3.8 URL OAuth Google hardcodée
- **Fichier** : `src/pages/Login.jsx:57`
- **Problème** : `https://auth.emergentagent.com/` en dur — spécifique à la plateforme Emergent Agent
- **Impact** : Cassé si le projet tourne en dehors de cette plateforme
- **Correction** : Passer en variable d'environnement `REACT_APP_OAUTH_URL`

---

### 🟡 Mineur — à corriger quand possible

#### 3.9 Icônes lucide-react importées mais inutilisées
- **Fichier** : `src/pages/LocataireDetails.jsx:3`
  - Importées non utilisées : `Phone`, `Mail`, `Calendar`, `DollarSign`, `Download`, `Eye` — aucune occurrence dans le JSX
- **Fichier** : `src/pages/Paiements.jsx:2`
  - Importées non utilisées : `CreditCard`, `Filter`, `Eye` — aucune occurrence dans le JSX
- **Impact** : Allège le bundle tree-shaking si supprimées (mineur avec Webpack/CRA)
- **Correction** : Supprimer les icônes non utilisées des imports

#### 3.10 `TOAST_REMOVE_DELAY = 1 000 000` ms dans use-toast.js
- **Fichier** : `src/hooks/use-toast.js:6`
- **Problème** : Délai de ~16 minutes — les toasts de ce système ne disparaissent jamais automatiquement
- **Impact** : Nul en pratique car `use-toast.js` n'est importé que par `toaster.jsx`, lui-même jamais utilisé dans l'app (le projet utilise `sonner` à la place)
- **Correction** : Supprimer `use-toast.js` et `src/components/ui/toaster.jsx` (dead code complet) ou fixer le délai à 5000

#### 3.11 `AuthCallback.jsx` lié à la plateforme Emergent Agent
- **Fichier** : `src/pages/AuthCallback.jsx`
- **Problème** : Intercepte les fragments URL `#session_id=...` spécifiques à Emergent Agent. En dehors de cette plateforme, ce code est inutile et peut interférer avec d'autres redirections OAuth
- **Impact** : Faible si le projet reste sur Emergent Agent
- **Correction** : Documenter la dépendance ou conditionner via une variable d'environnement

#### 3.12 `console.error` / `console.log` laissés dans le code
- `src/components/Layout.jsx:67` — `console.error("Logout error:", e)`
- `src/pages/AuthCallback.jsx:52` — `console.error("Auth callback error:", error)`
- `src/pages/Dashboard.jsx:49` — `console.error("Dashboard fetch error:", error)`
- `src/services/payments.js:43` — `console.log("[MOCK] Initier paiement...")` (uniquement en mode mock, acceptable)
- **Impact** : Traces debug visibles en production dans la console du navigateur

#### 3.13 Pas d'Error Boundary
- **Fichier** : aucun dans `src/`
- **Problème** : Une erreur JavaScript non gérée dans n'importe quel composant fait planter toute l'application (écran blanc)
- **Correction** : Entourer `<AppRouter />` d'un `<ErrorBoundary>` minimal

---

### 🟢 Nettoyage — cosmétique ou dette technique légère

#### 3.14 34 composants shadcn/ui installés mais jamais importés
Les composants suivants sont présents dans `src/components/ui/` mais aucune page ni composant ne les importe :

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `calendar`, `card`, `carousel`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `progress`, `radio-group`, `resizable`, `scroll-area`, `separator`, `sheet`, `skeleton`, `slider`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

Composants **utilisés** : `button` (15 fichiers), `input` (9), `label` (9), `dialog` (5), `select` (2), `switch` (1), `popover` (1), `dropdown-menu` (1), `sonner` (1)

- **Impact** : Bruit visuel dans le projet, aucun impact runtime (tree-shaking élimine le code non importé)
- **Correction** : Supprimer les fichiers non utilisés ou laisser en place (shadcn/ui encourage à copier les composants à la demande)

#### 3.15 Commentaires CSS encore nommés "Propria"
- **Fichier** : `src/index.css:8` — `/* Propria Light Theme */`
- **Fichier** : `src/index.css:43` — `/* Propria Dark Theme */`
- **Correction** : Renommer en `/* Intendance Light Theme */` / `/* Intendance Dark Theme */`

#### 3.16 `"use client"` dans use-toast.js
- **Fichier** : `src/hooks/use-toast.js:1`
- **Problème** : Directive Next.js sans effet dans Create React App
- **Impact** : Nul en pratique
- **Correction** : Supprimer la ligne ou supprimer tout le fichier (cf. 3.10)

---

## 4. Fichiers à inspecter obligatoirement

| Fichier | Problème(s) |
|---|---|
| `src/pages/Login.jsx:57,197` | Credentials démo hardcodés (ligne 197), URL OAuth hardcodée (ligne 57), "DORA" (lignes 68, 103) |
| `src/hooks/use-toast.js:6` | `TOAST_REMOVE_DELAY = 1000000` — fichier dead code complet (cf. 3.10) |
| `src/components/Layout.jsx:46,62,74,151` | Notifications mockées, logout en fetch(), recherche mockée, "DORA" |
| `src/App.js:21,39,40,51,119` | `const API_URL` + `fetch()` non migré, `propria_*` keys |
| `src/pages/AuthCallback.jsx` | Dépendance plateforme Emergent Agent (cf. 3.11) |
| `src/pages/Parametres.jsx:16,24,37,40,49` | Toutes les clés localStorage encore `propria_*` |

---

## 5. Vérifications transversales

- [x] **Occurrences de "propria" (token, theme, user)** — OUI, 13 occurrences dans 6 fichiers (cf. 3.2)
- [x] **`fetch()` directs dans les pages protégées** — NON ✓ (toutes migrées vers api.js)
- [x] **`const API_URL = ...` locaux dans les pages** — RESTE dans App.js, Login.jsx, AuthCallback.jsx, Layout.jsx, payments.js (cf. 3.4)
- [x] **`getAuthHeaders()`** — AUCUNE occurrence ✓
- [x] **"DORA" ou "Propria" dans le JSX visible** — OUI : Layout.jsx:151, Login.jsx:68, Login.jsx:103, index.css:8,43 (cf. 3.5)
- [x] **Composants shadcn/ui inutilisés** — 34 composants non importés (cf. 3.14)
- [x] **Error Boundary** — ABSENT (cf. 3.13)
- [x] **next-themes utilisé** — OUI, uniquement dans `sonner.jsx:1` (installé dans package.json, usage légitime)
- [x] **`useRef` dans App.js** — ABSENT ✓ (supprimé)

---

## 6. Score de dette technique

**6.5 / 10** — La migration structurelle (api.js, service layer, pages protégées) est faite et représentait l'essentiel de la dette. Ce qui reste est du nommage hérité (propria_*), des mocks non remplacés (notifications, recherche, paiements), et trois lignes de branding à renommer. Le projet est fonctionnel mais pas prêt pour des vrais utilisateurs sans corriger au minimum les points 3.1, 3.2 et 3.5.

---

## 7. Prochaines étapes recommandées

1. **[🔴 Immédiat]** Supprimer les credentials démo de Login.jsx:197
2. **[🔴 Avant démo]** Renommer les 3 occurrences "DORA" → "Intendance" (Layout.jsx:151, Login.jsx:68, Login.jsx:103)
3. **[🔴 Avant prod]** Renommer les clés localStorage `propria_*` → `intendance_*` (13 occurrences, 6 fichiers) — en coordination avec le backend
4. **[🔴 Avant prod]** Passer `MOCK = false` dans payments.js et brancher les endpoints PayDunya réels
5. **[🟠 Avant livraison]** Migrer les appels fetch() restants dans App.js, Login.jsx, AuthCallback.jsx, Layout.jsx vers api.js
6. **[🟠 Avant livraison]** Brancher les notifications sur l'API réelle (Layout.jsx:46-57)
7. **[🟠 Avant livraison]** Implémenter la recherche via API ou masquer la barre jusqu'à implémentation
8. **[🟡 Quand possible]** Supprimer les icônes inutilisées (LocataireDetails, Paiements)
9. **[🟡 Quand possible]** Ajouter un Error Boundary autour de AppRouter
10. **[🟢 Nettoyage]** Supprimer use-toast.js + toaster.jsx (dead code — le projet utilise sonner)
11. **[🟢 Nettoyage]** Renommer les commentaires CSS index.css:8,43 (Propria → Intendance)
