# Dashboard Analytics PhotoRunning - Spécifications

## Vue d'ensemble
Dashboard front-end en lecture seule pour consulter les statistiques de ventes des événements PhotoRunning. Aucune interaction utilisateur nécessaire à part la navigation dans le dashboard.

## Source de données

### Google Sheets
URL: `https://docs.google.com/spreadsheets/d/1GOQpTXj6HG-_hoQb-TXG5rF6sZTHm8KLF5j1t2vGq7k/edit?gid=790186548#gid=790186548`
Accès: Public (ouvert à tous)

### Structure des feuilles

#### 1. Feuille "Past" - Données historiques consolidées
Contient le CA réel par événement.

**Colonnes:**
- `Id` - Identifiant
- `Date` - Date de l'événement
- `Event` - Nom de l'événement
- `Revenue` - Chiffre d'affaires
- `Part.` - Nombre de participants
- `Buyers` - Nombre d'acheteurs
- `Rev./Part.` - Revenu par participant
- `Buy./Part. %` - Pourcentage acheteurs/participants
- `Avg. Order` - Panier moyen
- `Im./Part.` - Images par participant
- `Images` - Nombre total d'images

#### 2. Feuille "Current" - Données détaillées des commandes
Contient toutes les commandes individuelles (nécessite agrégation).

**Colonnes:**
- `Numéro de l'article`
- `Date`
- `Heure`
- `Email`
- `Nom de l'event`
- `Nom de l'article`
- `Quantité`
- `Montant de paiement`
- `Devise de paiement`
- `Montant de versement`
- `Devise de versement`
- `Remboursement`
- `Dossard`
- `Taux de TVA`

**Note:** Les données doivent être agrégées par événement pour obtenir les statistiques.

#### 3. Feuille "Aliase" - Normalisation des noms d'événements
Mapping pour regrouper les variantes de noms sous un nom canonique.

**Structure:** Deux colonnes
- Colonne 1: Nom variant
- Colonne 2: Nom canonique

**Exemples:**
```
"10km de Montpellier" → "10km de Montpellier"
"10 km de Montpellier" → "10km de Montpellier"
"SAINTÉGONES" → "SAINTÉLYON"
"SAINTÉLYON" → "SAINTÉLYON"
"PhotoCall Asics SainteLyon by ASICS et i-Run" → "SAINTÉLYON"
```

## Inspiration design

### Fichier de référence
`/Users/theochauland-lottet/Desktop/PhotoRunning/AnalyticsDashboard/Analytics new site.xlsx`
Feuille: **"Evolution Courses"**
Voici des exemples de tableaux types qui sont super interessants : `/Users/theochauland-lottet/Desktop/PhotoRunning/AnalyticsDashboard/tableau.png`

### Exemple visuel
Voir image fournie `/Users/theochauland-lottet/Desktop/PhotoRunning/AnalyticsDashboard/visuel.png` pour le style et la présentation attendue.

## Fonctionnalités requises

### 1. Recherche et filtrage
- Recherche par nom de course
- Navigation course par course
- Affichage des statistiques détaillées par course
- Affichage du chiffre course par course au fil des années donc via des graphiques en comparant avec n-1,n-2...

### 2. Métriques à afficher par course
- **CA** (Chiffre d'affaires / Revenue)
- **Pourcentage d'acheteurs** (Buy./Part. %)
- **Nombre de participants** (Part.)
- **Nombre d'acheteurs** (Buyers)
- **Panier moyen** (Avg. Order)
- **Revenu par participant** (Rev./Part.)
- **Nombre d'images** (Images)
- **Images par participant** (Im./Part.)

### 3. Tableaux d'évolution

#### A. Évolution du CA par course au fil des années
- Vue chronologique course par course
- Comparaison année par année
- Visualisation de la croissance/décroissance

#### B. Évolution des Triathlons
- Tableau spécifique pour tous les événements de type Triathlon
- Agrégation et évolution temporelle
- Métriques comparatives

#### C. Évolution totale
- Vue globale tous événements confondus
- Tendances générales
- KPIs globaux

### 4. Tableaux de bord supplémentaires
- Top événements par CA
- Top événements par nombre d'acheteurs
- Taux de conversion moyen par type d'événement
- Évolution mensuelle/annuelle globale
- Comparaisons inter-événements
- Métriques de performance (panier moyen, taux d'achat, etc.)

## Authentification

### Protection par mot de passe
**Type:** Authentification hardcodée (pas de backend)

**Identifiants:**
- **Email:** `theocl@photorunning.com`
- **Mot de passe:** `theo123photorunning`

**Comportement:**
- Page de login au chargement
- Accès au dashboard uniquement après authentification réussie
- Session persistante (localStorage/sessionStorage)

## Exigences techniques

### Stack
- **Front-end uniquement** (pas de backend)
- Next.js / React recommandé
- Bibliothèque de graphiques (Chart.js, Recharts, ou similaire)
- Tailwind CSS pour le design
- Google Sheets API pour récupérer les données

### Design
- Interface moderne et épurée
- Responsive (desktop prioritaire)
- Visualisations claires et lisibles
- Code couleur cohérent
- Navigation intuitive

### Performance
- Chargement rapide des données
- Mise en cache des données Google Sheets
- Optimisation des graphiques pour grandes quantités de données

## Traitement des données

### Pipeline de données
1. **Récupération** depuis Google Sheets API
2. **Normalisation** des noms d'événements via la feuille "Aliase"
3. **Agrégation** des données "Current" par événement
4. **Fusion** avec les données "Past"
5. **Calcul** des métriques dérivées
6. **Présentation** dans le dashboard

### Logique de normalisation
- Appliquer le mapping "Aliase" sur tous les noms d'événements
- Gérer les cas non mappés (afficher avec un warning ou nom original)
- Grouper les données après normalisation

### Agrégation "Current"
Pour chaque événement:
- Sommer les `Montant de paiement`
- Compter les emails uniques (acheteurs)
- Calculer le panier moyen
- Extraire la date de l'événement

## Livrables

- [ ] Application Next.js configurée
- [ ] Intégration Google Sheets API
- [ ] Page d'authentification
- [ ] Dashboard principal avec recherche
- [ ] Vue détaillée par course
- [ ] Tableau d'évolution CA par course/année
- [ ] Tableau d'évolution Triathlons
- [ ] Tableau d'évolution global
- [ ] Graphiques et visualisations
- [ ] Design responsive et moderne
- [ ] Documentation technique

## Notes importantes

- Les données sont publiques mais l'accès au dashboard doit être protégé
- Prioriser la lisibilité et l'UX
- Permettre l'export des données (CSV/Excel) si possible
- Ajouter des tooltips pour expliquer les métriques
- Gérer les cas limites (données manquantes, événements sans CA, etc.)
