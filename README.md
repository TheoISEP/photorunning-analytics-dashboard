# PhotoRunning Analytics Dashboard

Dashboard analytics front-end pour visualiser les statistiques de ventes des événements PhotoRunning.

## Fonctionnalités

### Authentification
- Protection par mot de passe hardcodé
- Session persistante (24h)
- Identifiants :
  - Email : `theocl@photorunning.com`
  - Mot de passe : `theo123photorunning`

### Onglets du Dashboard

#### 1. Vue d'ensemble
- Métriques globales (CA total, nombre d'événements, acheteurs, panier moyen)
- Évolution du CA par année
- Top 10 événements par CA
- Événements récents

#### 2. Événements
- Liste complète de tous les événements
- Recherche par nom
- Tri par CA, acheteurs, nom, année
- Export CSV
- Affichage détaillé des métriques par événement

#### 3. Évolution
- Évolution globale du CA, acheteurs et événements par année
- Statistiques annuelles détaillées
- Évolution par événement avec graphiques
- Comparaison inter-années pour chaque événement

#### 4. Triathlons
- Vue spécifique pour les événements Triathlon et SwimRun
- Métriques globales des triathlons
- Évolution annuelle
- Top 15 triathlons par CA
- Tableau détaillé et évolution des triathlons récurrents

## Architecture

### Stack Technique
- **Framework** : Next.js 16 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS 3
- **Graphiques** : Recharts
- **UI Components** : Lucide React (icônes)

### Structure des Dossiers

```
/app
  ├── globals.css          # Styles globaux
  ├── layout.tsx           # Layout principal
  └── page.tsx             # Page d'accueil (gestion auth)

/components
  ├── Dashboard.tsx        # Composant principal du dashboard
  ├── LoginForm.tsx        # Formulaire de connexion
  └── tabs/
      ├── OverviewTab.tsx  # Onglet Vue d'ensemble
      ├── EventsTab.tsx    # Onglet Événements
      ├── EvolutionTab.tsx # Onglet Évolution
      └── TriathlonTab.tsx # Onglet Triathlons

/lib
  ├── auth.ts              # Logique d'authentification
  ├── googleSheets.ts      # Récupération des données Google Sheets
  └── dataProcessing.ts    # Traitement et agrégation des données

/types
  └── index.ts             # Définitions TypeScript
```

## Source de Données

### Google Sheets
URL : https://docs.google.com/spreadsheets/d/1GOQpTXj6HG-_hoQb-TXG5rF6sZTHm8KLF5j1t2vGq7k

#### Feuille "Past"
Données historiques consolidées avec colonnes :
- Id, Date, Event, Revenue, Part., Buyers, Rev./Part., Buy./Part. %, Avg. Order, Im./Part., Images

#### Feuille "Current"
Commandes individuelles avec colonnes :
- Numéro de l'article, Date, Heure, Email, Nom de l'event, Nom de l'article, Quantité, Montant de paiement, etc.

#### Feuille "Aliase"
Mapping de normalisation des noms d'événements :
- Colonne 1 : Nom variant
- Colonne 2 : Nom canonique

### Pipeline de Traitement

1. **Récupération** : Fetch des données via export CSV public
2. **Normalisation** : Application du mapping des alias
3. **Agrégation** : Somme des commandes par événement
4. **Fusion** : Combinaison des données Past et Current
5. **Calculs** : Métriques dérivées (moyennes, pourcentages, etc.)

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Démarrer en production
npm start
```

## Accès au Dashboard

1. Ouvrir http://localhost:3000
2. Se connecter avec les identifiants :
   - Email : `theocl@photorunning.com`
   - Mot de passe : `theo123photorunning`
3. Naviguer entre les onglets pour consulter les statistiques

## Métriques Calculées

### Par Événement
- **CA (Revenue)** : Somme des montants de paiement - remboursements
- **Acheteurs (Buyers)** : Nombre d'emails uniques
- **Panier moyen (Avg. Order)** : CA / Nombre d'acheteurs
- **Taux d'achat (%)** : (Acheteurs / Participants) × 100
- **CA/Participant** : Revenue / Participants

### Globales
- **CA Total** : Somme de tous les revenus
- **Total Acheteurs** : Somme de tous les acheteurs
- **Panier moyen global** : CA Total / Total Acheteurs
- **CA moyen par événement** : CA Total / Nombre d'événements

## Notes de Configuration

### GID des Feuilles
Les GID actuellement configurés dans `lib/googleSheets.ts` :
- Past : `790186548`
- Current : `0` (première feuille par défaut)
- Aliase : `1234567890` (à ajuster si nécessaire)

Si les feuilles ne se chargent pas correctement, vérifier et ajuster les GID dans le fichier.

### Détection des Triathlons
Les événements sont automatiquement identifiés comme triathlons si leur nom contient :
- "triathlon"
- "swimrun"
- "ironman"
- "half ironman"

## Améliorations Futures Possibles

- [ ] Filtres par année
- [ ] Graphiques comparatifs personnalisables
- [ ] Export PDF des rapports
- [ ] Mode sombre
- [ ] Filtres par type d'événement personnalisés
- [ ] Dashboard en temps réel avec WebSockets
- [ ] Historique des sessions utilisateur
- [ ] Notifications de nouvelles données

## Licence

Projet privé - PhotoRunning
