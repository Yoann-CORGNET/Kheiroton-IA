# PolitiScale POC — Spec Document

## Objectif

POC en 2 jours : agrégation de 6 sources de données ouvertes pour produire des profils riches de 10 partis politiques français, avec comparaison multi-partis. Backend Python hexagonal + API FastAPI + Frontend Next.js.

## Scope

### Inclus
- 10 partis principaux : PS, LR, RN, Renaissance, LFI, EELV, PCF, MoDem, Horizons, Reconquête
- Profil niveau 3 : identité + positionnement CHES + résultats électoraux + financement CNCCFP + promesses structurées (4 candidats existants) + activité parlementaire
- 6 sources : JSON existants, CHES CSV, data.gouv.fr, ParlGov SQLite, CNCCFP CSV, NosDeputes API
- Table de mapping inter-sources pour les 10 partis
- API REST en lecture seule
- Frontend 3 pages : accueil (grille), profil parti (tabs), comparaison

### Hors scope
- Extraction PDF de programmes (source G)
- Analyse promesses → actions
- Auth, users, persistence
- Mobile responsive
- Déploiement production
- Tests (sauf domain/models)

### Relation avec le code existant

Le répertoire `data_agreg/` est le pipeline existant d'analyse de promesses. Le POC crée un nouveau répertoire `backend/` indépendant. L'adapter `local_json` lit les fichiers depuis `../data_agreg/data/programs/*.json`.

### Matrice de disponibilité des données

| Parti | Slug | CHES | ParlGov | data.gouv | CNCCFP | NosDeputes | Local JSON |
|-------|------|------|---------|-----------|--------|------------|------------|
| Parti Socialiste | `ps` | Y | Y | Y | Y | Y (SOC) | N |
| Les Républicains | `lr` | Y | Y | Y | Y | Y (LR) | N |
| Rassemblement National | `rn` | Y | Y | Y | Y | Y (RN) | Y (`le_pen.json`) |
| Renaissance | `renaissance` | Y | Y | Y | Y | Y (RE) | Y (`macron.json`) |
| La France Insoumise | `lfi` | Y | Y | Y | Y | Y (LFI-NFP) | Y (`melenchon.json`) |
| Les Écologistes | `eelv` | Y | Y | Y | Y | Y (ECO) | N |
| Parti Communiste | `pcf` | Y | Y | Y | Y | Y (GDR) | N |
| MoDem | `modem` | Y | Y | Y | Y | Y (DEM) | N |
| Horizons | `horizons` | Y (631) | Y (2857) | Y | Y | Y (HOR) | N |
| Reconquête | `reconquete` | Y (630) | Y (2860) | Y | Y | N (pas de groupe AN) | Y (`zemmour.json`) |

**Note** : Reconquête n'a pas de groupe parlementaire à l'AN — l'adapter NosDeputes retourne `None` pour ce parti.

## Architecture

### Backend Python — Hexagonal

```
backend/
├── domain/                    # Coeur métier (aucune dépendance externe)
│   ├── models/
│   │   ├── party.py           # PartyIdentity, PartyProfile, PartySummary
│   │   ├── positioning.py     # IdeologicalPosition, Axis, AxisScore
│   │   ├── election.py        # ElectionResult
│   │   ├── finance.py         # PartyFinance
│   │   ├── promise.py         # Promise, FeasibilityScore (adapté de l'existant)
│   │   └── parliamentary.py   # ParliamentaryActivity, VotingRecord
│   ├── services/
│   │   ├── aggregator.py      # Agrège les données des 6 sources → PartyProfile
│   │   └── comparator.py      # Compare N partis sur N dimensions
│   └── ports/                 # Interfaces (ABC)
│       ├── party_repository.py
│       ├── positioning_source.py
│       ├── election_source.py
│       ├── finance_source.py
│       ├── promise_source.py
│       └── parliamentary_source.py
│
├── adapters/                  # Implémentations concrètes des ports
│   ├── ches/
│   │   └── ches_adapter.py    # CSV → IdeologicalPosition
│   ├── datagouv/
│   │   └── datagouv_adapter.py # CSV → ElectionResult + nuances
│   ├── parlgov/
│   │   └── parlgov_adapter.py  # SQLite → PartyIdentity + résultats historiques
│   ├── cnccfp/
│   │   └── cnccfp_adapter.py   # CSV → PartyFinance
│   ├── nosdeputes/
│   │   └── nosdeputes_adapter.py # API JSON → ParliamentaryActivity
│   ├── local_json/
│   │   └── promises_adapter.py  # JSON existants → Promise
│   └── party_mapping/
│       └── mapping.py          # Table de correspondance inter-sources
│
├── infrastructure/
│   ├── api/
│   │   ├── main.py            # FastAPI app
│   │   └── routes/
│   │       ├── parties.py     # GET /parties, GET /parties/{slug}
│   │       ├── compare.py     # GET /compare?parties=rn,lfi,ren
│   │       └── health.py
│   └── cache/
│       └── aggregated/        # JSON pré-agrégés
│
├── scripts/
│   ├── download_sources.py    # Télécharge CHES, ParlGov, CNCCFP, data.gouv
│   ├── build_profiles.py      # Exécute l'agrégation → JSON cache
│   └── party_mapping.json     # Table de mapping manuelle
│
└── tests/
    └── domain/
```

### Flux de données

```
download_sources.py          build_profiles.py              API FastAPI
      │                            │                            │
      ▼                            ▼                            ▼
 CHES.csv ──┐               ┌─ Adapter CHES ──┐          GET /parties/rn
 ParlGov.db ┤  fichiers     │  Adapter ParlGov ├─→ Aggregator ──→ PartyProfile JSON
 CNCCFP.csv ┤  locaux       │  Adapter CNCCFP  │     │              │
 data.gouv  ┤               │  Adapter dataGouv│     ▼              ▼
 NosDeputes ┘ (API live)    │  Adapter NosDeputs├─→ cache/       Response JSON
                            │  Adapter JSON     │
                            └──────────────────┘
```

### Principe hexagonal

- Le domaine (`domain/`) ne connaît aucune source concrète
- Les ports (`ports/`) définissent les interfaces (ABC) que chaque source doit implémenter
- Les adapters (`adapters/`) implémentent les ports pour chaque source concrète
- L'aggregator combine les données via les interfaces, jamais directement via les adapters
- L'API FastAPI instancie les adapters et injecte les dépendances dans les services

## Modèles de données du domaine

### PartyProfile (entité racine)

```python
@dataclass
class PartyProfile:
    identity: PartyIdentity
    positioning: IdeologicalPosition | None
    elections: list[ElectionResult]
    finance: PartyFinance | None
    promises: list[Promise]
    parliamentary: ParliamentaryActivity | None
```

### PartyIdentity

```python
@dataclass
class PartyIdentity:
    slug: str              # "renaissance", "rn", "lfi" — clé primaire interne
    name: str              # "Renaissance"
    short_name: str        # "REN"
    leader: str            # "Emmanuel Macron"
    founded: int           # 2016
    family: str            # "Liberal" (famille ParlGov)
    nuance_mi: str         # "REN" (code Ministère Intérieur)
    color: str             # "#FFD600"
    ids: dict[str, str]    # {"ches": "42101", "parlgov": "1234", "cnccfp": "..."}
```

### IdeologicalPosition (CHES)

```python
@dataclass
class PositionSnapshot:
    year: int
    lrgen: float           # Gauche-droite général (0-10)
    lrecon: float          # Gauche-droite économique (0-10)
    galtan: float          # GAL-TAN (0-10)

@dataclass
class IdeologicalPosition:
    year: int              # Année de la dernière mesure
    lrgen: float           # Gauche-droite général (0-10)
    lrecon: float          # Gauche-droite économique (0-10)
    galtan: float          # GAL-TAN (0-10)
    eu_position: float     # Position UE (1-7)
    immigration: float     # Politique immigration (0-10)
    environment: float     # Environnement (0-10)
    redistribution: float  # Redistribution (0-10)
    antielite: float       # Rhétorique anti-élites (0-10)
    history: list[PositionSnapshot]  # Évolution 1999→2024
```

### ElectionResult

```python
@dataclass
class ElectionResult:
    election_type: str     # "presidentielle", "legislatives", "europeennes"
    year: int
    round: int
    votes: int
    percentage: float
    seats: int | None      # Pour les législatives
    candidate: str | None  # Pour la présidentielle
```

### PartyFinance (CNCCFP)

```python
@dataclass
class PartyFinance:
    year: int
    total_revenue: float
    public_funding: float
    private_donations: float
    membership_fees: float
    total_expenses: float
    assets: float | None
```

### ParliamentaryActivity (NosDeputes)

**Stratégie d'agrégation** : NosDeputes fournit les données par député individuel. L'adapter agrège au niveau du groupe parlementaire :
1. Récupérer la liste des députés du groupe via `https://www.nosdeputes.fr/groupe/{sigle}/json`
2. Pour chaque député, récupérer la synthèse via `https://www.nosdeputes.fr/{slug}/json`
3. Agréger : somme pour interventions/amendements/questions, moyenne pour présence
4. Les députés ayant changé de groupe en cours de législature sont comptés dans leur groupe actuel

**Rate limiting** : NosDeputes n'a pas de rate limit documenté. L'adapter attend 200ms entre chaque requête par précaution. Les résultats sont mis en cache dans `cache/nosdeputes/`.

```python
@dataclass
class ParliamentaryActivity:
    legislature: int
    group_name: str
    group_size: int
    total_interventions: int
    total_amendments: int
    amendments_adopted_pct: float
    avg_presence_pct: float
    total_questions: int
    top_themes: list[str]
    key_votes: list[dict]    # [{"date": "2024-01-15", "subject": "...", "position": "pour/contre"}]
```

### Promise (adapté de l'existant)

L'adapter `local_json` mappe les fichiers existants vers les slugs de partis :
- `macron.json` → `party_slug: "renaissance"`
- `le_pen.json` → `party_slug: "rn"`
- `melenchon.json` → `party_slug: "lfi"`
- `zemmour.json` → `party_slug: "reconquete"`

Ce mapping remplace les champs `program_id` et `party` (nom complet) de l'ancien modèle.

```python
@dataclass
class Promise:
    id: str
    party_slug: str        # Slug interne, dérivé du mapping fichier→parti
    candidate: str
    raw_text: str
    theme: str
    action_verb: str
    action_object: str
    quantification: dict | None
    cost_announced: dict | None
    funding_source: str | None
    timeline: str | None
    target_population: str | None
    classification: str
    precision_level: str
    feasibility: dict | None
```

### ComparisonResult

```python
@dataclass
class ComparisonResult:
    parties: list[str]
    positioning_radar: dict[str, dict]
    finance_comparison: dict
    promise_themes: dict[str, list]
    parliamentary_activity: dict
```

## API Endpoints

```
GET  /api/parties                         → Liste des 10 partis (identité + résumé)
GET  /api/parties/{slug}                  → Profil complet
GET  /api/parties/{slug}/positioning      → CHES + historique
GET  /api/parties/{slug}/elections        → Résultats électoraux
GET  /api/parties/{slug}/finance          → Données CNCCFP
GET  /api/parties/{slug}/promises         → Promesses (si dispo)
GET  /api/parties/{slug}/parliamentary    → Activité parlementaire (si dispo)

GET  /api/compare?parties=rn,lfi,ren      → Comparaison multi-partis (toutes dimensions)

GET  /api/health                          → Status + fraîcheur données
```

Lecture seule. Pas d'auth. CORS ouvert pour le front.

Toutes les routes sont montées sous le préfixe `/api` via `APIRouter(prefix="/api")`.

L'endpoint `/compare` retourne toujours toutes les dimensions disponibles. Pas de filtrage par dimension dans le POC (simplification).

Le endpoint `GET /api/parties` retourne une liste de `PartySummary` (projection légère de `PartyProfile`) :

```python
@dataclass
class PartySummary:
    slug: str
    name: str
    short_name: str
    family: str
    color: str
    lrgen: float | None       # Score G/D pour tri rapide
    data_completeness: dict    # {"positioning": true, "elections": true, "finance": true, ...}
```

## Frontend Next.js

### Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Accueil : grille des 10 partis
│   ├── parties/
│   │   └── [slug]/
│   │       └── page.tsx            # Profil complet (tabs)
│   ├── compare/
│   │   └── page.tsx                # Sélection + comparaison
│   └── layout.tsx
├── components/
│   ├── PartyCard.tsx               # Card avec nom, famille, score G/D
│   ├── PositioningRadar.tsx        # Radar chart (6 axes CHES)
│   ├── PositioningTimeline.tsx     # Évolution G/D dans le temps
│   ├── ElectionResults.tsx         # Barres horizontales
│   ├── FinanceSummary.tsx          # Camembert recettes/dépenses
│   ├── PromiseList.tsx             # Promesses + score faisabilité
│   ├── ParliamentaryStats.tsx      # Métriques activité AN
│   └── CompareTable.tsx            # Tableau comparatif
└── lib/
    └── api.ts                      # Fetch vers backend Python
```

### Pages

1. **Accueil** — Grille de 10 cartes, triables par axe gauche/droite
2. **Profil parti** — Tabs : Positionnement | Élections | Finance | Promesses | Parlement
3. **Comparaison** — Sélection de 2-4 partis, radar overlay + tableau

### Bibliothèque de charts

`recharts` — choix verrouillé pour le POC. React-natif, pas de gestion Canvas/ref, API déclarative. Composants utilisés : `RadarChart`, `BarChart`, `PieChart`, `LineChart`.

## Table de mapping des 10 partis (COMPLÈTE)

Le champ `local_json` est le nom du fichier JSON sans extension dans `data_agreg/data/programs/`, ou `null` si pas de programme structuré disponible.

CHES : `country=6` (France). ParlGov : `country_name_short=FRA`.

```json
{
  "ps": {
    "name": "Parti Socialiste",
    "short_name": "PS",
    "leader": "Olivier Faure",
    "founded": 1969,
    "color": "#FF8080",
    "ches_party_id": 602,
    "ches_party_abbr": "PS",
    "parlgov_id": 1539,
    "parlgov_abbr": "PS",
    "cnccfp_name": "PARTI SOCIALISTE",
    "nosdeputes_group": "SOC",
    "nuance_mi": "SOC",
    "local_json": null
  },
  "lr": {
    "name": "Les Républicains",
    "short_name": "LR",
    "leader": "Laurent Wauquiez",
    "founded": 2015,
    "color": "#0066CC",
    "ches_party_id": 609,
    "ches_party_abbr": "LR",
    "parlgov_id": 658,
    "parlgov_abbr": "UMP|LR",
    "cnccfp_name": "LES REPUBLICAINS",
    "nosdeputes_group": "DR",
    "nuance_mi": "LR",
    "local_json": null
  },
  "rn": {
    "name": "Rassemblement National",
    "short_name": "RN",
    "leader": "Jordan Bardella",
    "founded": 1972,
    "color": "#0D378A",
    "ches_party_id": 610,
    "ches_party_abbr": "RN",
    "parlgov_id": 270,
    "parlgov_abbr": "FN",
    "cnccfp_name": "RASSEMBLEMENT NATIONAL",
    "nosdeputes_group": "RN",
    "nuance_mi": "RN",
    "local_json": "le_pen"
  },
  "renaissance": {
    "name": "Renaissance",
    "short_name": "REN",
    "leader": "Emmanuel Macron",
    "founded": 2016,
    "color": "#FFD600",
    "ches_party_id": 626,
    "ches_party_abbr": "RE",
    "parlgov_id": 2643,
    "parlgov_abbr": "REM|R",
    "cnccfp_name": "RENAISSANCE",
    "nosdeputes_group": "RE",
    "nuance_mi": "REN",
    "local_json": "macron"
  },
  "lfi": {
    "name": "La France Insoumise",
    "short_name": "LFI",
    "leader": "Jean-Luc Mélenchon",
    "founded": 2016,
    "color": "#CC2443",
    "ches_party_id": 627,
    "ches_party_abbr": "FI",
    "parlgov_id": 2644,
    "parlgov_abbr": "FI",
    "cnccfp_name": "LA FRANCE INSOUMISE",
    "nosdeputes_group": "LFI-NFP",
    "nuance_mi": "FI",
    "local_json": "melenchon"
  },
  "eelv": {
    "name": "Les Écologistes",
    "short_name": "EELV",
    "leader": "Marine Tondelier",
    "founded": 2010,
    "color": "#00A86B",
    "ches_party_id": 605,
    "ches_party_abbr": "LE/EELV",
    "parlgov_id": 873,
    "parlgov_abbr": "V",
    "cnccfp_name": "EUROPE ECOLOGIE LES VERTS",
    "nosdeputes_group": "ECO",
    "nuance_mi": "VEC",
    "local_json": null
  },
  "pcf": {
    "name": "Parti Communiste Français",
    "short_name": "PCF",
    "leader": "Fabien Roussel",
    "founded": 1920,
    "color": "#DD0000",
    "ches_party_id": 601,
    "ches_party_abbr": "PCF",
    "parlgov_id": 686,
    "parlgov_abbr": "PCF",
    "cnccfp_name": "PARTI COMMUNISTE FRANCAIS",
    "nosdeputes_group": "GDR",
    "nuance_mi": "COM",
    "local_json": null
  },
  "modem": {
    "name": "Mouvement Démocrate",
    "short_name": "MoDem",
    "leader": "François Bayrou",
    "founded": 2007,
    "color": "#FF9900",
    "ches_party_id": 613,
    "ches_party_abbr": "MoDem",
    "parlgov_id": 509,
    "parlgov_abbr": "UDF|MD",
    "cnccfp_name": "MOUVEMENT DEMOCRATE",
    "nosdeputes_group": "DEM",
    "nuance_mi": "MDM",
    "local_json": null
  },
  "horizons": {
    "name": "Horizons",
    "short_name": "HOR",
    "leader": "Edouard Philippe",
    "founded": 2021,
    "color": "#00B7FF",
    "ches_party_id": 631,
    "ches_party_abbr": "Horizons",
    "parlgov_id": 2857,
    "parlgov_abbr": "H",
    "cnccfp_name": "HORIZONS",
    "nosdeputes_group": "HOR",
    "nuance_mi": "HOR",
    "local_json": null
  },
  "reconquete": {
    "name": "Reconquête",
    "short_name": "REC",
    "leader": "Éric Zemmour",
    "founded": 2021,
    "color": "#1A1A2E",
    "ches_party_id": 630,
    "ches_party_abbr": "REC",
    "parlgov_id": 2860,
    "parlgov_abbr": "R!",
    "cnccfp_name": "RECONQUETE",
    "nosdeputes_group": null,
    "nuance_mi": "REC",
    "local_json": "zemmour"
  }
}
```

## Schéma des colonnes des sources CSV

### CHES 2024 (`CHES_2024_final_v2.csv`)

53 colonnes. Filtrer par `country == 6` pour la France.

| Colonne | Type | Description | Utilisée |
|---------|------|-------------|----------|
| `country` | int | Code pays (6 = France) | Filtre |
| `party_id` | int | ID unique du parti | Jointure |
| `party` | str | Abréviation (PS, RN, RE, FI...) | Affichage |
| `family` | int | Code famille politique | Mapping |
| `electionyear` | int | Année d'élection de référence | Info |
| `vote` | float | % de voix | Info |
| `seat` | int | Nombre de sièges | Info |
| `lrgen` | float | Gauche-droite général (0-10) | **Oui** |
| `lrecon` | float | Gauche-droite économique (0-10) | **Oui** |
| `galtan` | float | GAL-TAN (0-10) | **Oui** |
| `eu_position` | float | Position UE (1-7) | **Oui** |
| `immigrate_policy` | float | Immigration (0-10) | **Oui** |
| `redistribution` | float | Redistribution (0-10) | **Oui** |
| `environment` | float | Environnement (0-10) | **Oui** |
| `people_v_elite` | float | Anti-élites (0-10) | **Oui** |
| `anti_elite_salience` | float | Saillance anti-élites (0-10) | Optionnel |

Les colonnes `*_blur`, `*_dissent`, `*_salience` mesurent l'incertitude et sont optionnelles pour le POC.

### ParlGov (`view_party.csv`)

23 colonnes. Filtrer par `country_name_short == "FRA"`.

| Colonne | Type | Description | Utilisée |
|---------|------|-------------|----------|
| `country_name_short` | str | Code pays (FRA) | Filtre |
| `party_name_short` | str | Abréviation | Affichage |
| `party_name` | str | Nom complet | Affichage |
| `family_name` | str | Famille (Social democracy, Conservative...) | **Oui** |
| `left_right` | float | Score gauche-droite | Info |
| `party_id` | int | ID unique | Jointure |

### CNCCFP (`comptes-des-partis.csv`)

Structure à confirmer après téléchargement. Colonnes attendues (basé sur les datasets CNCCFP précédents) :

| Colonne attendue | Type | Description |
|-----------------|------|-------------|
| Dénomination | str | Nom du parti (ex: "PARTI SOCIALISTE") |
| Exercice | int | Année comptable |
| Total produits | float | Total recettes |
| Aide publique directe | float | Financement public |
| Dons des personnes physiques | float | Dons |
| Cotisations | float | Cotisations membres |
| Total charges | float | Total dépenses |

**Important** : les noms de colonnes peuvent varier entre les millésimes. Ouvrir le CSV et adapter le parsing.

### data.gouv.fr (résultats électoraux agrégés)

Plusieurs fichiers CSV, un par type d'élection. Structure type (législatives) :

| Colonne | Type | Description |
|---------|------|-------------|
| Code département | str | |
| Libellé département | str | |
| Code circonscription | str | |
| Nuance | str | Code nuance MI (REN, RN, LFI...) |
| Nom | str | Nom du candidat |
| Prénom | str | |
| Voix | int | Nombre de voix |
| % Voix/Exp | float | Pourcentage |
| Élu | str | "élu" ou vide |

Pour le POC, agréger au niveau national : somme des voix par nuance.

### NosDeputes API (JSON)

Endpoint groupe : `GET https://www.nosdeputes.fr/organismes/groupe/json`
Réponse (extrait) :
```json
{
  "organismes": [
    {
      "organisme": {
        "slug": "renaissance",
        "nom": "Renaissance",
        "acronyme": "RE",
        "groupe_actif": 1,
        "nombre_membres": 95
      }
    }
  ]
}
```

Endpoint député : `GET https://www.nosdeputes.fr/{slug}/json`
Réponse (extrait) :
```json
{
  "depute": {
    "nom": "...",
    "groupe_sigle": "RE",
    "nb_mandats": 2,
    "semaines_presence": 42,
    "commission_presences": 28,
    "amendements_proposes": 15,
    "amendements_adoptes": 3,
    "questions_ecrites": 8,
    "questions_orales": 2,
    "interventions_courtes": 45
  }
}
```

## Exemple de réponse API

### `GET /api/parties/rn`

```json
{
  "identity": {
    "slug": "rn",
    "name": "Rassemblement National",
    "short_name": "RN",
    "leader": "Jordan Bardella",
    "founded": 1972,
    "family": "Right-wing",
    "nuance_mi": "RN",
    "color": "#0D378A"
  },
  "positioning": {
    "year": 2024,
    "lrgen": 8.82,
    "lrecon": 6.0,
    "galtan": 8.36,
    "eu_position": 2.18,
    "immigration": 9.55,
    "environment": 6.6,
    "redistribution": 4.27,
    "antielite": 7.0,
    "history": [
      {"year": 2006, "lrgen": 9.5, "lrecon": 7.1, "galtan": 9.8},
      {"year": 2010, "lrgen": 9.3, "lrecon": 6.8, "galtan": 9.6},
      {"year": 2014, "lrgen": 9.0, "lrecon": 5.5, "galtan": 9.2},
      {"year": 2019, "lrgen": 8.9, "lrecon": 5.8, "galtan": 8.8},
      {"year": 2024, "lrgen": 8.82, "lrecon": 6.0, "galtan": 8.36}
    ]
  },
  "elections": [
    {
      "election_type": "legislatives",
      "year": 2024,
      "round": 1,
      "votes": 10641324,
      "percentage": 33.15,
      "seats": 143,
      "candidate": null
    },
    {
      "election_type": "presidentielle",
      "year": 2022,
      "round": 1,
      "votes": 8133828,
      "percentage": 23.15,
      "seats": null,
      "candidate": "Marine Le Pen"
    },
    {
      "election_type": "europeennes",
      "year": 2024,
      "round": 1,
      "votes": 7769202,
      "percentage": 31.37,
      "seats": 30,
      "candidate": null
    }
  ],
  "finance": {
    "year": 2023,
    "total_revenue": 28500000,
    "public_funding": 18200000,
    "private_donations": 5100000,
    "membership_fees": 3200000,
    "total_expenses": 26800000,
    "assets": null
  },
  "promises": [
    {
      "id": "le_pen_001",
      "party_slug": "rn",
      "candidate": "Marine Le Pen",
      "raw_text": "Baisser la TVA sur les carburants, le fioul, le gaz et l'électricité de 20% à 5,5%",
      "theme": "economie",
      "action_verb": "baisser",
      "action_object": "TVA sur l'énergie",
      "quantification": {"value": 5.5, "unit": "%"},
      "cost_announced": {"amount_eur": 12000000000, "periodicity": "annuel"},
      "funding_source": null,
      "timeline": "Dès l'élection",
      "target_population": "Tous les ménages",
      "classification": "PROMESSE_CONCRETE",
      "precision_level": "tres_precis",
      "feasibility": {
        "overall": 0.38,
        "label": "Difficilement faisable",
        "uncertainty": 0.25,
        "ci_95": [0.28, 0.48]
      }
    }
  ],
  "parliamentary": {
    "legislature": 17,
    "group_name": "Rassemblement National",
    "group_size": 125,
    "total_interventions": 4520,
    "total_amendments": 3200,
    "amendments_adopted_pct": 8.5,
    "avg_presence_pct": 62.3,
    "total_questions": 1850,
    "top_themes": ["immigration", "securite", "economie"],
    "key_votes": [
      {"date": "2024-10-15", "subject": "Motion de censure", "position": "pour"},
      {"date": "2024-06-20", "subject": "Budget 2025", "position": "contre"}
    ]
  }
}
```

**Note** : les chiffres d'élections et finance sont illustratifs. Les valeurs CHES sont réelles (extraites du CSV). Les données NosDeputes et promesses sont structurellement exactes mais les valeurs numériques seront remplies par les adapters.

### `GET /api/parties` (liste)

```json
[
  {
    "slug": "rn",
    "name": "Rassemblement National",
    "short_name": "RN",
    "family": "Right-wing",
    "color": "#0D378A",
    "lrgen": 8.82,
    "data_completeness": {
      "positioning": true,
      "elections": true,
      "finance": true,
      "promises": true,
      "parliamentary": true
    }
  },
  {
    "slug": "ps",
    "name": "Parti Socialiste",
    "short_name": "PS",
    "family": "Social democracy",
    "color": "#FF8080",
    "lrgen": 3.45,
    "data_completeness": {
      "positioning": true,
      "elections": true,
      "finance": true,
      "promises": false,
      "parliamentary": true
    }
  }
]
```

## Wireframes ASCII des 3 pages

### Page 1 — Accueil (`/`)

```
┌──────────────────────────────────────────────────────────┐
│  POLITISCALE — Profils des partis politiques français     │
│  [Trier par: Gauche→Droite ▼]                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ ● LFI   │  │ ● PCF   │  │ ● EELV  │  │ ● PS    │    │
│  │ 0.8 ←── │  │ 1.7 ←── │  │ 2.3 ←── │  │ 3.5 ──  │    │
│  │ Gauche  │  │ Gauche  │  │ Gauche  │  │ C-Gauche│    │
│  │ ██░░░░░ │  │ ███░░░░ │  │ ████░░░ │  │ █████░░ │    │
│  │ 4 prom. │  │ —       │  │ —       │  │ —       │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ ● MoDem │  │ ● REN   │  │ ● HOR   │  │ ● LR    │    │
│  │ 5.4 ──  │  │ 6.3 ──▶ │  │ 6.6 ──▶ │  │ 7.7 ──▶ │    │
│  │ Centre  │  │ C-Droit │  │ C-Droit │  │ Droite  │    │
│  │ ██████░ │  │ ███████ │  │ ███████ │  │ ████████│    │
│  │ —       │  │ 12 prom.│  │ —       │  │ —       │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│  ┌─────────┐  ┌─────────┐                               │
│  │ ● RN    │  │ ● REC   │   [Comparer les partis →]     │
│  │ 8.8 ──▶ │  │ 9.7 ──▶ │                               │
│  │ Ext-Dr. │  │ Ext-Dr. │                               │
│  │ █████████│  │ ██████████│                               │
│  │ 15 prom.│  │ 8 prom. │                               │
│  └─────────┘  └─────────┘                               │
└──────────────────────────────────────────────────────────┘
```

Chaque carte est cliquable → page profil. Le score sous le nom = `lrgen` CHES. La barre = positionnement visuel gauche→droite. "N prom." = nombre de promesses si dispo, "—" sinon.

### Page 2 — Profil parti (`/parties/[slug]`)

```
┌──────────────────────────────────────────────────────────┐
│  ← Retour                                               │
│  ● Rassemblement National (RN)                           │
│  Leader: Jordan Bardella | Fondé: 1972 | Famille: Droite │
├──────────────────────────────────────────────────────────┤
│  [Positionnement] [Élections] [Finance] [Promesses] [AN] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TAB: Positionnement                                     │
│  ┌──────────────────────┐  ┌───────────────────────────┐ │
│  │    Radar CHES 2024    │  │  Évolution 1999→2024      │ │
│  │                       │  │                           │ │
│  │      Économie         │  │  10 ─ ·····*····*····*──  │ │
│  │        8.4            │  │      lrgen                │ │
│  │   Env. /   \ Immig.   │  │   5 ─                     │ │
│  │   6.6 /     \ 9.5     │  │                           │ │
│  │      / RADAR  \       │  │   0 ─────────────────────  │ │
│  │  UE /    ▓▓    \ Anti │  │      99  06  10  14  19  24│ │
│  │ 2.2 \        / 7.0   │  │                           │ │
│  │       \      /        │  │  10 ─ ····*····*····*──── │ │
│  │    GAL-TAN: 8.4       │  │      galtan               │ │
│  └──────────────────────┘  └───────────────────────────┘ │
│                                                          │
│  TAB: Promesses (15 promesses)                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Theme    │ Promesse                    │ Faisab. │ € ││
│  │──────────│─────────────────────────────│─────────│───││
│  │ Économie │ Baisser TVA énergie à 5.5%  │ ██░░ 38%│12G││
│  │ Sécurité │ 25 000 places de prison     │ ███░ 52%│ 3G││
│  │ Immigr.  │ Quotas annuels immigration  │ █░░░ 22%│  —││
│  │ ...      │ ...                         │ ...     │...││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Page 3 — Comparaison (`/compare`)

```
┌──────────────────────────────────────────────────────────┐
│  COMPARER LES PARTIS                                     │
│                                                          │
│  Sélection: [✓ RN] [✓ LFI] [✓ REN] [□ PS] [□ LR] ...   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────┐                            │
│  │    Radar comparatif       │                            │
│  │                           │                            │
│  │       Économie            │    ── RN                   │
│  │      /    \               │    ── LFI                  │
│  │ Env /  ▓▒░ \ Immig       │    ── REN                  │
│  │    /  ▓▓▒░░  \            │                            │
│  │   / ▓▓▓▒▒░░░  \          │                            │
│  │  UE ─────────── Anti     │                            │
│  │       GAL-TAN             │                            │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Dimension       │    RN    │   LFI    │    REN   │   ││
│  │─────────────────│─────────│──────────│──────────│   ││
│  │ Gauche-Droite   │ 8.8 ──▶ │ ◀── 0.8  │  6.3 ─▶  │   ││
│  │ Économique      │ 6.0 ─▶  │ ◀── 0.9  │  6.2 ─▶  │   ││
│  │ GAL-TAN         │ 8.4 ──▶ │ ◀── 1.8  │  4.1 ─   │   ││
│  │ Pro-UE          │ 2.2 ◀── │  3.0 ◀── │  6.3 ─▶  │   ││
│  │ Immigration     │ 9.5 ──▶ │ ◀── 1.5  │  5.7 ─▶  │   ││
│  │ Environnement   │ 6.6 ─▶  │ ◀── 1.8  │  4.8 ─   │   ││
│  │─────────────────│─────────│──────────│──────────│   ││
│  │ Nb promesses    │ 15      │ 12       │ 12       │   ││
│  │ Faisab. moy.    │ 38%     │ 42%      │ 55%      │   ││
│  │ Budget total    │ +45 Md€ │ +120 Md€ │ +15 Md€  │   ││
│  │ Groupe AN       │ 125 dép │ 72 dép   │ 95 dép   │   ││
│  │ Présence moy.   │ 62%     │ 58%      │ 71%      │   ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## Plan d'exécution — 2 jours

### Jour 1 — Backend

| Bloc | Durée | Contenu |
|------|-------|---------|
| 1.1 | 1h | Setup : structure hexagonale, pyproject.toml, dépendances |
| 1.2 | 1h | Table de mapping + modèles du domaine |
| 1.3 | 1h | Script download_sources.py (URLs ci-dessous) |
| 1.4 | 4h | 6 adapters (CHES ~30min, ParlGov ~30min, data.gouv ~45min, CNCCFP ~30min, NosDeputes ~60min, local JSON ~15min) |
| 1.5 | 1h | Aggregator service + comparator |
| 1.6 | 1h | API FastAPI + endpoints |

**URLs de téléchargement pour `download_sources.py`** :
- CHES 2024 : `https://www.chesdata.eu/s/CHES_2024_final_v2.csv`
- CHES Trend 1999-2024 : disponible sur `https://www.chesdata.eu/ches-europe`
- ParlGov : `https://parlgov.org/data/parlgov-development_csv-utf-8/` (CSV) ou SQLite sur `https://parlgov.org/data/`
- CNCCFP comptes des partis : `https://www.data.gouv.fr/datasets/comptes-des-partis-et-groupements-politiques` — utiliser les comptes annuels les plus récents disponibles (2023 ou 2024)
- data.gouv résultats : `https://www.data.gouv.fr/datasets/donnees-des-elections-agregees` — fichiers CSV par type d'élection
- NosDeputes : API live, pas de téléchargement préalable

### Jour 2 — Frontend + comparateur

| Bloc | Durée | Contenu |
|------|-------|---------|
| 2.1 | 1h | Setup Next.js, layout, API client |
| 2.2 | 2h | Page accueil + page profil (tabs, radar, barres) |
| 2.3 | 2h | Page comparaison (radar overlay + tableau) |
| 2.4 | 1h | Polish : données manquantes, états vides, README |
| 2.5 | 2h | Buffer / debug / imprévus |

**Note** : Le comparator service et l'endpoint `/compare` sont intégrés dans le bloc 1.5 (jour 1). Le jour 2 est entièrement frontend + polish. Le buffer de 2h absorbe les dépassements du jour 1 si nécessaire.

## Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| NosDeputes API lente ou down | Pas de données parlementaires | Adapter retourne None, front affiche "données à venir" |
| Mapping CNCCFP difficile | Noms incohérents | Mapping manuel fuzzy, on accepte les trous |
| CHES ne couvre pas les 10 | Profils incomplets | Affiche ce qu'on a, "non disponible" pour le reste |
| Charts prennent du temps | Front pas fini | Fallback tableaux HTML |

## Critères de succès du POC

1. `GET /api/parties` retourne les 10 partis avec données agrégées de 4+ sources
2. Le profil d'au moins 4 partis contient les 5 dimensions (positionnement, élections, finance, promesses, parlement)
3. La page comparaison affiche un radar overlay de 2+ partis
4. L'architecture hexagonale est respectée : ajouter une 7e source = écrire un adapter sans toucher au domaine
