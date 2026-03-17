# PolitiScale — Analyse comparative de faisabilité des programmes politiques

## Vision

Outil d'analyse automatisée qui prend en entrée N programmes politiques et produit une comparaison approfondie des promesses, leur faisabilité, leur cohérence et leur coût, en s'appuyant sur des données factuelles et des méthodologies éprouvées.

---

## Architecture globale

```
INPUT                           PROCESSING                        OUTPUT
─────                           ──────────                        ──────
                          ┌──────────────────────┐
Programme A (PDF/URL) ──▶ │  1. INGESTION        │
Programme B (PDF/URL) ──▶ │     Parsing, OCR     │
Programme C (PDF/URL) ──▶ │     Nettoyage texte  │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  2. EXTRACTION NLP    │         ┌─────────────────┐
                          │     Promesses         │    ┌──▶ │ Fiches promesse │
                          │     Classification    │    │    │ (JSON structuré)│
                          │     Catégorisation    │────┘    └─────────────────┘
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  3. ENRICHISSEMENT    │         ┌─────────────────┐
                          │     RAG + données     │    ┌──▶ │ Base de         │
                          │     factuelles        │    │    │ connaissances   │
                          │     (INSEE, Légifr.)  │────┘    └─────────────────┘
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  4. ANALYSE MULTI-    │         ┌─────────────────┐
                          │     AGENTS            │    ┌──▶ │ Rapports de     │
                          │     Économiste        │    │    │ faisabilité     │
                          │     Juriste           │    │    │ par promesse    │
                          │     Sociologue        │────┘    └─────────────────┘
                          │     Fact-checker      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  5. SCORING MCDA      │         ┌─────────────────┐
                          │     Pondération       │    ┌──▶ │ Scores de       │
                          │     Monte Carlo       │    │    │ faisabilité     │
                          │     Agrégation        │────┘    │ (0-100 + IC)    │
                          └──────────┬───────────┘         └─────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  6. COMPARAISON       │         ┌─────────────────┐
                          │     Cross-programme   │    ┌──▶ │ Rapport final   │
                          │     Contradictions    │    │    │ comparatif      │
                          │     Visualisation     │────┘    │ (PDF/Web/JSON)  │
                          └──────────────────────┘         └─────────────────┘
```

---

## Phase 1 — Ingestion et parsing des programmes

### Input acceptés
- PDF (programmes officiels, professions de foi)
- URLs de sites de campagne
- Texte brut (copié-collé)
- Documents structurés (JSON/YAML si pré-formatés)

### Pipeline d'ingestion

| Étape | Outil | Rôle |
|-------|-------|------|
| PDF → texte | PyMuPDF (`fitz`) | Extraction texte préservant la structure |
| OCR (scans) | Tesseract + pytesseract | PDFs non-textuels |
| Web scraping | BeautifulSoup / Playwright | Sites de campagne |
| Nettoyage | regex + ftfy | Encodage, caractères spéciaux, normalisation |
| Segmentation | spaCy sentence segmenter | Découpage en phrases/quasi-phrases |

### Structure de sortie (par programme)
```json
{
  "program_id": "uuid",
  "candidate": "Nom",
  "party": "Parti",
  "election": "Présidentielle 2027",
  "date_published": "2027-01-15",
  "source_url": "https://...",
  "sections": [
    {
      "title": "Économie et pouvoir d'achat",
      "raw_text": "...",
      "sentences": ["phrase1", "phrase2"]
    }
  ]
}
```

---

## Phase 2 — Extraction NLP des promesses

### Pipeline de classification

```
Phrase brute
    │
    ▼
[Classification binaire] → Est-ce une promesse ?
    │                       - PROMESSE_CONCRETE : engagement mesurable
    │                       - PROMESSE_VAGUE : aspiration sans mesure
    │                       - CONSTAT : description de la situation
    │                       - CRITIQUE : attaque de l'adversaire
    │                       - VALEUR : principe ou idéologie
    │                       - AUTRE
    ▼
[Extraction d'entités] → Pour chaque PROMESSE_CONCRETE :
    │                     - Action (verbe + objet)
    │                     - Quantification (montant, nombre)
    │                     - Échéance (date, délai)
    │                     - Population cible
    │                     - Source de financement
    │                     - Coût estimé par le candidat
    ▼
[Catégorisation thématique] → BERTopic ou LLM
    │                          14 thèmes standardisés :
    │                          economie, emploi, retraites, sante,
    │                          education, securite, immigration,
    │                          environnement, logement, institutions,
    │                          international, culture, agriculture, numerique
    ▼
Promesse structurée (JSON)
```

### Schéma de données d'une promesse extraite

```json
{
  "promise_id": "uuid",
  "program_id": "ref → programme source",
  "raw_text": "Nous créerons 100 000 places en crèche d'ici 2029",
  "classification": {
    "type": "PROMESSE_CONCRETE",
    "confidence": 0.94
  },
  "extraction": {
    "action": "créer",
    "objet": "places en crèche",
    "quantification": { "valeur": 100000, "unite": "places" },
    "cout_candidat": { "montant_eur": null, "source": "non_precise" },
    "echeance": { "date": "2029", "type": "date_precise" },
    "population_cible": "familles avec enfants < 3 ans",
    "financement": { "description": null, "type": "non_precise" }
  },
  "theme": "education",
  "niveau_competence": "national",
  "niveau_precision": "precis"
}
```

### Outils NLP

| Besoin | Outil primaire | Alternative |
|--------|---------------|-------------|
| Tokenisation FR | spaCy `fr_core_news_lg` | Stanza |
| NER custom | CamemBERT fine-tuné | FlauBERT |
| Classification | Claude API (structured output) | Mistral + instructor |
| Topic modeling | BERTopic + `sentence-camembert-large` | LDA (baseline) |
| Embeddings FR | `dangvantuan/sentence-camembert-large` | `intfloat/multilingual-e5-large` |

---

## Phase 3 — Enrichissement par données factuelles (RAG)

### Sources de données à indexer

| Source | Données | API/Format | Usage |
|--------|---------|-----------|-------|
| **INSEE** | PIB, emploi, démographie, prix | api.insee.fr (REST) | Contexte macro-économique |
| **Légifrance** | Lois, décrets, Constitution | api.piste.gouv.fr (DILA) | Faisabilité juridique |
| **PLF/PLFSS** | Budget État + Sécu | budget.gouv.fr (PDF/CSV) | Coûts, recettes |
| **Cour des Comptes** | 900+ évaluations de politiques | ccomptes.fr (PDF) | Précédents, résultats |
| **France Stratégie** | Prospective, évaluations | strategie.gouv.fr (PDF) | Études d'impact |
| **DREES** | Santé, social, retraites | drees.solidarites-sante.gouv.fr | Données sociales |
| **Eurostat** | Statistiques UE comparées | ec.europa.eu/eurostat (REST) | Comparaisons internationales |
| **FIPECO** | ~100 fiches finances publiques | fipeco.fr (web) | Analyse budgétaire |
| **OpenFisca FR** | Système socio-fiscal codé | openfisca.org (Python API) | Simulation d'impact |
| **Institut Montaigne** | Chiffrages électoraux | institutmontaigne.org (PDF) | Chiffrages de référence |
| **IFRAP** | Comparaisons de programmes | ifrap.org (web) | Benchmark budgétaire |
| **Manifesto Project** | 5285 manifestes, 50+ pays | manifesto-project.wzb.eu (API) | Données historiques |

### Architecture RAG

```
Sources brutes
    │
    ▼
[Chunking sémantique] → Par article de loi, par mesure budgétaire,
    │                     par section de rapport (pas par taille fixe)
    ▼
[Embeddings] → sentence-camembert-large (768 dim)
    │
    ▼
[Vector Store] → ChromaDB (dev) / Qdrant (prod)
    │
    ▼
[Retrieval hybride]
    ├── Dense search (cosine similarity)
    ├── Sparse search (BM25)
    └── Re-ranking (cross-encoder)
    │
    ▼
[Contexte augmenté] → Injecté dans le prompt d'analyse
```

### Contraintes clés à intégrer au RAG

**Contexte budgétaire français (2025-2026) :**
- Dette publique : ~3 465 Md EUR (116% du PIB)
- Déficit : ~5,4% du PIB
- Intérêts de la dette : 65-67 Md EUR/an → 100 Md EUR projeté d'ici 2029
- Emprunt 2026 : 310 Md EUR (record)
- Procédure de déficit excessif UE en cours

**Contraintes institutionnelles :**
- Critères de Maastricht : 3% déficit, 60% dette
- Article 40 Constitution : Parlement ne peut augmenter dépenses ni baisser recettes
- Majorité relative (pas de majorité absolue à l'Assemblée)
- 49.3 risqué (motion de censure possible)

---

## Phase 4 — Analyse multi-agents

### Architecture des agents spécialisés

```
                    ┌───────────────────────┐
                    │     ORCHESTRATEUR      │
                    │  Distribue la promesse │
                    │  à chaque agent        │
                    └───────────┬────────────┘
                                │
        ┌───────────┬───────────┼───────────┬──────────┐
        │           │           │           │          │
   ┌────▼────┐ ┌────▼────┐ ┌───▼────┐ ┌────▼────┐ ┌──▼───────┐
   │ÉCONOM.  │ │JURISTE  │ │SOCIO.  │ │FACT-    │ │HISTORIEN │
   │         │ │         │ │        │ │CHECK    │ │          │
   │Budget   │ │Constit. │ │Impact  │ │Chiffres │ │Précé-    │
   │Fiscal   │ │Droit UE │ │social  │ │Sources  │ │dents     │
   │Macro    │ │Compét.  │ │Accept. │ │Données  │ │Résultats │
   │Emploi   │ │Lois     │ │Inégal. │ │Cohér.   │ │FR + Intl │
   └────┬────┘ └────┬────┘ └───┬────┘ └────┬────┘ └──┬───────┘
        │           │           │           │          │
        └───────────┴───────────┼───────────┴──────────┘
                                │
                    ┌───────────▼────────────┐
                    │     SYNTHÉTISEUR       │
                    │  Agrège les analyses   │
                    │  Produit score MCDA    │
                    │  Identifie risques     │
                    └────────────────────────┘
```

### Prompts des agents

**Agent Économiste — Évalue la faisabilité budgétaire :**
```
Tu es un économiste spécialiste des finances publiques françaises,
ancien rapporteur à la Cour des Comptes.

PROMESSE : "{promise_text}"
DONNÉES CONTEXTUELLES : {rag_context}

Analyse :
1. COÛT ESTIMÉ : Si non chiffré par le candidat, estime un ordre de grandeur
   en t'appuyant sur des mesures comparables (cite les sources).
2. FINANCEMENT : La source de financement proposée est-elle crédible ?
   Quel rendement réaliste peut-on en attendre ?
3. IMPACT BUDGÉTAIRE : Impact sur le déficit et la dette.
   Compatibilité avec la trajectoire de finances publiques.
4. EFFETS MACRO : Impact sur PIB, emploi, inflation, compétitivité.
5. SCORE : Note de 0 à 1 avec intervalle de confiance.

Retourne un JSON structuré avec {score, confidence, justification, sources}.
```

**Agent Juriste — Évalue la faisabilité juridique :**
```
Tu es un constitutionnaliste, ancien membre du Conseil d'État.

PROMESSE : "{promise_text}"
CADRE JURIDIQUE : {legal_rag_context}

Analyse :
1. CONSTITUTIONNALITÉ : Compatible avec la Constitution de la Ve République ?
   Risque de censure par le Conseil constitutionnel ?
2. DROIT UE : Compatible avec les traités européens et le droit dérivé ?
3. COMPÉTENCE : L'échelon est-il le bon (commune/département/région/État/UE) ?
4. VÉHICULE LÉGISLATIF : Loi ordinaire ? Loi organique ? Révision constitutionnelle ?
   Décret ? Ordonnance ?
5. OBSTACLES : Textes existants à modifier ou abroger.
6. SCORE : Note de 0 à 1 avec intervalle de confiance.

Retourne un JSON structuré.
```

**Agent Sociologue — Évalue l'impact social et l'acceptabilité :**
```
Tu es directeur de recherche en sociologie des politiques publiques.

PROMESSE : "{promise_text}"
DONNÉES SOCIALES : {social_rag_context}

Analyse :
1. BÉNÉFICIAIRES : Combien de personnes concernées ? Quels profils ?
2. PERDANTS : Qui serait négativement impacté ?
3. INÉGALITÉS : Effet sur les inégalités (revenus, territoriales, genrées) ?
4. ACCEPTABILITÉ : Quel niveau de résistance sociale anticiper ?
   Quels groupes d'intérêt s'y opposeront ?
5. EFFETS SECONDAIRES : Effets non intentionnels probables.
6. SCORE : Note de 0 à 1 avec intervalle de confiance.

Retourne un JSON structuré.
```

**Agent Fact-checker — Vérifie les chiffres et la cohérence :**
```
Tu es journaliste d'investigation spécialisé en fact-checking politique.

PROMESSE : "{promise_text}"
DONNÉES DE RÉFÉRENCE : {factcheck_rag_context}

Vérifie :
1. CHIFFRES : Les montants avancés sont-ils réalistes ?
   Compare avec les données officielles (INSEE, PLF, DREES).
2. CONSTATS : Les constats sur lesquels s'appuie la promesse sont-ils exacts ?
3. COHÉRENCE INTERNE : Cette promesse contredit-elle d'autres promesses
   du même programme ?
4. FINANCEMENT : Le rendement attendu du financement proposé
   est-il réaliste ?
5. VERDICT : Chiffres confirmés / Partiellement exacts / Trompeurs / Faux

Retourne un JSON structuré avec sources précises.
```

**Agent Historien — Analyse les précédents :**
```
Tu es historien des politiques publiques comparées.

PROMESSE : "{promise_text}"

Recherche :
1. PRÉCÉDENTS FRANÇAIS : Mesures similaires déjà tentées en France.
   Résultat ? Raisons du succès ou de l'échec ?
2. PRÉCÉDENTS INTERNATIONAUX : Mesures comparables dans d'autres pays.
   Résultat ? Conditions de transférabilité ?
3. TENDANCE : Cette promesse s'inscrit-elle dans une tendance historique
   ou est-elle en rupture ?
4. SCORE DE PRÉDICTION : Basé sur les précédents, quelle probabilité
   de succès ? (0 à 1)

Retourne un JSON structuré.
```

---

## Phase 5 — Scoring MCDA (Multi-Criteria Decision Analysis)

### Grille de scoring

| Critère | Poids | Source d'évaluation |
|---------|-------|-------------------|
| Faisabilité juridique | 15% | Agent Juriste |
| Faisabilité budgétaire | 25% | Agent Économiste |
| Faisabilité technique/admin. | 15% | Agent Économiste + Historien |
| Faisabilité politique | 10% | Arithmétique parlementaire |
| Faisabilité temporelle | 10% | Agent Historien |
| Acceptabilité sociale | 10% | Agent Sociologue |
| Impact socio-économique | 15% | Agent Sociologue + Économiste |

### Calcul du score global

```
score_global = Σ (poids_i × score_i)

Avec :
- score_i ∈ [0, 1] : score de chaque agent
- confidence_i ∈ [0, 1] : confiance de chaque agent

Incertitude = Σ (poids_i × (1 - confidence_i))
IC_95 = [score_global - 1.96 × incertitude, score_global + 1.96 × incertitude]
```

### Analyse de sensibilité Monte Carlo

Pour chaque promesse, 1000 simulations avec perturbation des scores selon leur intervalle de confiance. Produit :
- Score moyen ± écart-type
- Percentiles P5 et P95
- Identification des critères les plus impactants (tornado diagram)

### Échelle de notation finale

| Score | Label | Couleur | Signification |
|-------|-------|---------|---------------|
| 0.80 - 1.00 | Très faisable | Vert foncé | Réaliste, bien financé, juridiquement solide |
| 0.60 - 0.79 | Faisable | Vert | Faisable avec ajustements mineurs |
| 0.40 - 0.59 | Partiellement faisable | Orange | Obstacles significatifs identifiés |
| 0.20 - 0.39 | Difficilement faisable | Rouge | Obstacles majeurs, financement non crédible |
| 0.00 - 0.19 | Irréaliste | Rouge foncé | Juridiquement impossible ou budgétairement absurde |

---

## Phase 6 — Comparaison cross-programmes

### Analyses comparatives produites

1. **Comparaison par thème** : Pour chaque thème (économie, santé, etc.), les promesses de chaque programme côte à côte avec scores de faisabilité.

2. **Radar thématique** : Profil de chaque candidat sur les 14 thèmes (nombre de promesses, ambition, faisabilité moyenne).

3. **Bilan budgétaire comparé** : Pour chaque programme :
   - Total des dépenses nouvelles annoncées
   - Total des recettes nouvelles / économies
   - Solde net (impact sur le déficit)
   - Comparaison avec les chiffrages Institut Montaigne / IFRAP

4. **Matrice de contradictions** :
   - Contradictions intra-programme (promesses incompatibles)
   - Positionnement relatif entre programmes (convergences/divergences)

5. **Positionnement politique** : Placement sur 6 axes :
   - Interventionnisme ↔ Libéralisme
   - Progressisme ↔ Conservatisme
   - Internationalisme ↔ Souverainisme
   - Écologisme ↔ Productivisme
   - Libertaire ↔ Autoritaire
   - Égalitarisme ↔ Méritocratie

6. **Classement global** : Moyenne pondérée des scores de faisabilité par programme, avec intervalle de confiance.

### Visualisations

| Visualisation | Librairie | Usage |
|---------------|-----------|-------|
| Radar chart multi-candidats | Nivo `ResponsiveRadar` | Profil thématique |
| Scatter plot coût vs faisabilité | Recharts | Par promesse |
| Treemap budgétaire | D3.js | Répartition des coûts |
| Sankey diagram | D3.js | Flux financement → mesures |
| Waterfall chart | Recharts | Impact cumulatif sur le budget |
| Heatmap de faisabilité | Nivo `ResponsiveHeatMap` | Matrice thèmes × candidats |
| Political compass | D3.js custom | Positionnement multi-axes |
| Timeline | D3.js | Calendrier de mise en oeuvre |

---

## Stack technique

### Backend (Python)

| Composant | Outil | Justification |
|-----------|-------|---------------|
| API | FastAPI | Async, OpenAPI auto-docs |
| ORM | SQLModel | Type-safe, intégré FastAPI |
| DB | PostgreSQL | Relationnelle, robuste |
| Vector store | ChromaDB (dev) → Qdrant (prod) | Embeddings, similarité |
| Cache | Redis | RAG cache, sessions |
| Jobs async | Celery + Redis | Analyse LLM longue |
| LLM | Claude API (Anthropic) | Structured output, raisonnement FR |
| LLM backup | Mistral Large | Modèle français, fallback |
| NLP | spaCy + CamemBERT | Écosystème NLP FR mature |
| Topics | BERTopic | Topic modeling état de l'art |
| Embeddings | sentence-camembert-large | Spécialisé français |
| Multi-agents | CrewAI ou LangGraph | Orchestration agents |
| Microsimulation | OpenFisca France | Simulation socio-fiscale |

### Frontend (TypeScript)

| Composant | Outil | Justification |
|-----------|-------|---------------|
| Framework | Next.js 16 | SSR, App Router |
| UI | shadcn/ui + Tailwind | Design system cohérent |
| Charts | Nivo + D3.js | Radar, heatmap, custom |
| Charts simples | Recharts | Bar, line, scatter |
| Animations | Framer Motion | Transitions fluides |
| Fonts | Geist Sans + Mono | Typographie Vercel |

### Infrastructure

| Composant | Outil | Justification |
|-----------|-------|---------------|
| Hébergement API | Vercel Functions ou Railway | Serverless Python |
| Hébergement front | Vercel | Next.js optimisé |
| DB | Neon Postgres (Vercel Marketplace) | Serverless, branching |
| File storage | Vercel Blob | PDFs uploadés |
| Monitoring | Vercel Analytics + Sentry | Performance + erreurs |

---

## Schéma de données complet

### Tables principales

```
┌──────────────────┐     ┌──────────────────┐
│    programs       │     │    candidates     │
├──────────────────┤     ├──────────────────┤
│ id (uuid)        │     │ id (uuid)        │
│ candidate_id ────┼────▶│ name             │
│ election         │     │ party            │
│ date_published   │     │ coalition        │
│ source_url       │     │ photo_url        │
│ raw_text         │     └──────────────────┘
│ status           │
└────────┬─────────┘
         │ 1:N
┌────────▼─────────┐     ┌──────────────────┐
│    promises       │     │    themes         │
├──────────────────┤     ├──────────────────┤
│ id (uuid)        │     │ id               │
│ program_id ──────┤     │ name             │
│ theme_id ────────┼────▶│ icon             │
│ raw_text         │     │ color            │
│ action           │     └──────────────────┘
│ object           │
│ quantification   │     ┌──────────────────┐
│ cost_candidate   │     │  feasibility     │
│ timeline         │     │  _assessments    │
│ target_pop       │     ├──────────────────┤
│ funding_source   │     │ id (uuid)        │
│ precision_level  │     │ promise_id ◀─────┤
│ classification   │     │ legal_score      │
└────────┬─────────┘     │ budget_score     │
         │ 1:1           │ technical_score  │
         └──────────────▶│ political_score  │
                         │ timeline_score   │
                         │ social_score     │
                         │ overall_score    │
                         │ confidence       │
                         │ risks (jsonb)    │
                         │ sources (jsonb)  │
                         │ agent_reports    │
                         │   (jsonb)        │
                         │ analysis_date    │
                         └──────────────────┘

┌──────────────────┐
│  comparisons      │
├──────────────────┤
│ id (uuid)        │
│ election         │
│ programs (jsonb) │
│ budget_summary   │
│   (jsonb)        │
│ political_axes   │
│   (jsonb)        │
│ contradictions   │
│   (jsonb)        │
│ rankings (jsonb) │
│ created_at       │
└──────────────────┘
```

---

## Workflow utilisateur

```
1. UPLOAD
   L'utilisateur uploade N programmes (PDF, URL, texte)
   │
   ▼
2. EXTRACTION (automatique, ~2-5 min par programme)
   Le système extrait les promesses et les classe
   L'utilisateur peut réviser / corriger les extractions
   │
   ▼
3. ANALYSE (automatique, ~10-30 min pour N programmes)
   Les agents spécialisés analysent chaque promesse
   Scoring MCDA + Monte Carlo
   │
   ▼
4. RÉSULTATS
   Dashboard interactif avec :
   ├── Vue d'ensemble (classement global, radar)
   ├── Vue par thème (comparaison côte à côte)
   ├── Vue par promesse (fiche détaillée avec score)
   ├── Vue budgétaire (treemap, waterfall, Sankey)
   ├── Vue politique (compass, axes)
   └── Export (PDF rapport, JSON data, CSV)
```

---

## Méthodologies de référence

### Institutions de chiffrage (modèles à suivre)

| Institution | Pays | Méthodologie clé | À reproduire |
|-------------|------|-------------------|--------------|
| **CPB** | Pays-Bas | "Charted Choices" — gold standard mondial | Scénario de base uniforme, toutes les parties évaluées avec la même méthode |
| **Institut Montaigne** | France | Micro-chiffrage expert + revue contradictoire | Chaque mesure évaluée par un expert indépendant, soumise à l'équipe du candidat |
| **CBO** | USA | Scoring statique + optionnel dynamique | Baseline de loi existante, estimation comportementale explicite |
| **OBR** | UK | Rating d'incertitude par mesure | Classification de la fiabilité de chaque estimation |
| **IFRAP** | France | Tableau comparatif synthétique | Présentation standardisée (dépenses/recettes/économies) |

### Sources de données académiques

| Source | Usage | Accès |
|--------|-------|-------|
| **Manifesto Project** (MARPOR) | 5285 manifestes codés, indice RILE | API + R package (manifestoR) |
| **Chapel Hill Expert Survey** | Positionnement de 279 partis sur 6 axes | Téléchargement libre |
| **Comparative Agendas Project** | Codage thématique de l'agenda politique | Téléchargement libre |
| **OpenFisca France** | Simulation socio-fiscale | Python API, AGPL |
| **PolicyEngine** | Microsimulation taxes/prestations | Python, open-source |

---

## Limites et biais à documenter

### Biais inhérents

1. **Biais de disponibilité** : Les promesses les mieux chiffrées obtiennent de meilleurs scores — ce n'est pas nécessairement corrélé à leur qualité.
2. **Biais de statu quo** : Le système tend à favoriser les mesures incrémentales par rapport aux réformes structurelles.
3. **Biais du LLM** : Les modèles de langage ont leurs propres biais politiques (études Cambridge, Nature 2025).
4. **Biais temporel** : Les données de contexte vieillissent — les prévisions macro changent.
5. **Biais d'agrégation** : Un programme avec 100 petites promesses faisables n'est pas forcément meilleur qu'un programme avec 10 grandes réformes ambitieuses.

### Garde-fous

- **Transparence totale** : Chaque score est accompagné de sa justification, ses sources et son intervalle de confiance.
- **Disclaimer systématique** : "Cette analyse est produite par un système automatisé. Elle ne remplace pas l'expertise humaine."
- **Révisable** : L'utilisateur peut contester et ajuster les scores manuellement.
- **Multi-modèles** : Utiliser Claude ET Mistral et comparer pour détecter les divergences de biais.
- **Calibration** : Comparer les résultats avec les chiffrages Institut Montaigne/IFRAP comme benchmark.

---

## Phases de développement

### MVP (4-6 semaines)
- [ ] Ingestion PDF/texte basique
- [ ] Extraction de promesses par LLM (Claude structured output)
- [ ] Catégorisation thématique
- [ ] Analyse de faisabilité mono-agent (prompt CoT complet)
- [ ] Scoring MCDA simple
- [ ] Interface web basique (liste de promesses + scores)
- [ ] Comparaison côte à côte de 2 programmes

### V1 (8-12 semaines)
- [ ] Pipeline multi-agents complet (5 agents spécialisés)
- [ ] RAG avec sources françaises (INSEE, Légifrance, PLF)
- [ ] Monte Carlo pour intervalles de confiance
- [ ] Visualisations (radar, scatter, heatmap)
- [ ] Vue budgétaire (treemap, waterfall)
- [ ] Export PDF
- [ ] Support N programmes

### V2 (16-24 semaines)
- [ ] Knowledge Graph (Neo4j) avec détection de contradictions
- [ ] Intégration OpenFisca pour simulation socio-fiscale
- [ ] Intégration Manifesto Project pour données historiques
- [ ] Political compass automatique
- [ ] Promise tracker (suivi post-élection)
- [ ] API publique
- [ ] Internationalisation (autres pays)

---

## Références clés

### Méthodologies d'évaluation
- Institut Montaigne — Méthodologie Présidentielle 2022 : institutmontaigne.org
- IFRAP — Chiffrage des programmes : ifrap.org
- CPB Netherlands — Charted Choices : cpb.nl
- OECD — Costing Policy Proposals Guidelines : oecd-ilibrary.org
- UK Government — MCDA Guide : analysisfunction.civilservice.gov.uk

### NLP et IA
- Manifesto Project — manifestoberta models : manifesto-project.wzb.eu
- ClaimBuster — Fact-checking automatisé : idir.uta.edu/claimbuster
- Cambridge — Positioning Political Texts with LLMs (corrélation > 0.90)
- Chain-of-Thought Prompting : arxiv.org/abs/2201.11903

### Données françaises
- INSEE API : api.insee.fr
- Légifrance API : api.piste.gouv.fr
- OpenFisca France : openfisca.org
- FIPECO : fipeco.fr
- Cour des Comptes : ccomptes.fr
- Data.gouv.fr : data.gouv.fr
