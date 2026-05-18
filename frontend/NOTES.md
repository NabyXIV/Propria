# Notes & corrections à faire — Propria frontend

## Nommage
- [x] Nom définitif de l'app : Propria
- [x] Clés localStorage conservées en propria_* (cohérent avec le nom)
- [x] "DORA" supprimé partout
- [x] "Intendance" supprimé partout
- [x] Credentials de démo supprimés de Login.jsx

## PayDunya
- [ ] Dans src/services/payments.js : passer MOCK = false
      quand les endpoints /payments/public/{token} et
      /payments/public/{token}/initiate sont prêts côté backend
- [ ] Corriger "orange_money" → "orange-money" si pas encore fait

## Services
- [x] src/services/api.js créé — instance Axios centralisée avec intercepteurs JWT
- [x] src/services/payments.js créé — getPaymentByToken, initiatePayment (mock)
- [x] handlePay protégé par try/catch — retour à "ready" si initiatePayment échoue
- [x] Dashboard.jsx — migré vers api.js
- [x] Biens.jsx — migré vers api.js
- [x] BienDetails.jsx — migré vers api.js
- [x] Locataires.jsx — migré vers api.js
- [x] LocataireDetails.jsx — migré vers api.js
- [x] Paiements.jsx — migré vers api.js
- [x] Documents.jsx — migré vers api.js
- [x] Relances.jsx — migré vers api.js
- [ ] Passer MOCK = false dans payments.js quand backend prêt
- [x] Login.jsx — migré vers api.js (fetch /api/auth/login)
- [x] App.js — migré vers api.js (fetch /api/auth/me)
- [x] AuthCallback.jsx — migré vers api.js (fetch /api/auth/session)
- [x] Layout.jsx — migré vers api.js (fetch /api/auth/logout)
- [x] Dashboard.jsx — bug HTML <tr>/<span> corrigé dans tbody
- [ ] Backend : vérifier que l'endpoint de mise à jour des paiements
      est PUT et non PATCH (Paiements.jsx — api.put("/api/payments/{id}"))

## En attente du backend
- [ ] payments.js — passer MOCK = false quand endpoints prêts
- [ ] Layout.jsx — brancher notifications sur /api/reminders?unread=true
- [ ] Layout.jsx — implémenter recherche via /api/search?q=
      ou masquer la barre en attendant

## À vérifier avec le binôme
- [ ] Backend : vérifier PUT vs PATCH sur /api/payments/{id}
- [ ] Backend : confirmer le nom exact de tous les endpoints /api/...
      (les pages supposent /api/buildings, /api/units, /api/tenants, /api/leases,
      /api/payments, /api/reminders, /api/documents, /api/dashboard/*)

## Nettoyage (quand projet stabilisé)
- [ ] Supprimer use-toast.js + toaster.jsx (dead code — projet utilise sonner)
- [ ] Supprimer les icônes lucide inutilisées dans LocataireDetails.jsx et Paiements.jsx
- [ ] Ajouter un Error Boundary autour de AppRouter
- [ ] Supprimer ou conditionner AuthCallback.jsx si projet hors Emergent Agent
- [ ] Supprimer les 34 composants shadcn/ui non utilisés dans src/components/ui/

## Rappels
- [ ] "use client" dans use-toast.js — directive Next.js sans effet dans CRA,
      supprimer si le fichier est conservé

## Design
- [x] CSS refonte complète — stat-card, ombres, animations, dark mode
- [x] Login — dégradé gauche, cercles décoratifs, feature list cards
- [x] Payer — dégradé fond, montant sur fond vert, icône sécurité
- [x] Dashboard — formatCurrency en FCFA, salutation dynamique
- [ ] Dashboard — graphique vide à masquer ou remplacer par
      un état vide illustré quand chartData.length === 0

## Remarque importante
La barre de recherche dans Layout.jsx retourne des résultats hardcodés
(Lamine THIAM, APT-7515, etc.). À brancher sur /api/search?q= ou à masquer
avant livraison client.
