# AI, NLP & Data Science pour l'analyse de programmes politiques — Rapport technique

---

## 1. Techniques NLP pour l'analyse de textes politiques

### 1.1 Named Entity Recognition (NER) pour les propositions politiques

**Principe :** La NER identifie et catégorise les entités nommées (personnes, organisations, lieux, montants, dates) dans le texte politique, permettant l'extraction structurée d'informations.

**Outils et modèles :**

| Outil | Description | Langues | Licence |
|-------|-------------|---------|---------|
| **spaCy** | Pipeline NLP industriel avec modèles pré-entraînés (fr_core_news_lg) | FR, EN, DE, 20+ | MIT |
| **CamemBERT** | Modèle BERT français entraîné sur 138 Go de texte français | FR | MIT |
| **FlauBERT** | Modèle de langue français de l'équipe CNRS/Sorbonne | FR | MIT |
| **Hugging Face Transformers** | Écosystème de modèles pré-entraînés avec fine-tuning facile | Multi | Apache 2.0 |
| **Flair** | Framework NLP avec state-of-the-art NER (stacked embeddings) | Multi | MIT |

**Entités personnalisées pour le domaine politique :**

Pour analyser les programmes politiques, il faut définir des entités spécifiques au domaine au-delà des entités standard (PER, ORG, LOC, DATE, MONEY). Entités recommandées :

- `POLICY_PROPOSAL` : une proposition de politique publique
- `BUDGET_AMOUNT` : montant budgétaire ou coût estimé
- `TIMELINE` : échéance ou calendrier de mise en oeuvre
- `AFFECTED_GROUP` : population ou groupe concerné par la mesure
- `FUNDING_SOURCE` : source de financement mentionnée
- `LEGISLATION_REF` : référence à un texte de loi existant
- `INSTITUTION` : institution publique concernée
- `METRIC` : indicateur chiffré (taux, pourcentage, objectif quantifié)

**Implémentation avec spaCy (fine-tuning) :**

```python
# Format des données d'entraînement pour spaCy v3
TRAIN_DATA = [
    ("Nous créerons 50 000 places en crèche d'ici 2028 pour un coût de 2 milliards d'euros",
     {"entities": [
         (16, 35, "POLICY_PROPOSAL"),
         (36, 46, "TIMELINE"),
         (60, 80, "BUDGET_AMOUNT")
     ]}),
    ("Le RSA sera revalorisé de 10% financé par la taxe sur les transactions financières",
     {"entities": [
         (3, 30, "POLICY_PROPOSAL"),
         (44, 84, "FUNDING_SOURCE")
     ]})
]

# Configuration spaCy v3 (config.cfg)
# [components.ner]
# factory = "ner"
# [training]
# patience = 1600
# max_epochs = 0
# max_steps = 20000
```

Le processus de fine-tuning spaCy v3 utilise un fichier `config.cfg` générable via le quickstart (https://spacy.io/usage/training). On prépare les données au format `.spacy` binaire via `DocBin`, puis on lance l'entraînement avec `python -m spacy train config.cfg`.

**Référence :** [Training Pipelines & Models - spaCy](https://spacy.io/usage/training/)

---

### 1.2 Analyse de sentiment des promesses politiques

**Approches principales :**

| Méthode | Type | Forces | Limites |
|---------|------|--------|---------|
| **VADER** | Lexicon-based | Rapide, pas d'entraînement nécessaire | Peu adapté au français, insensible au contexte |
| **TextBlob / Pattern** | Lexicon-based | Simple d'utilisation | Superficiel |
| **CamemBERT fine-tuné** | Transformer | Compréhension contextuelle du français | Nécessite données annotées |
| **BERT multilingual** | Transformer | Multi-langue, contextuel | Moins bon que les modèles monolingues |
| **LLM (Claude, GPT)** | Generative | Nuancé, zero-shot possible | Coût API, latence |

**Spécificités du sentiment politique :**

Le sentiment dans les textes politiques est plus complexe que le sentiment classique (positif/négatif). Il faut distinguer :

1. **Sentiment envers le statu quo** : critique de la situation actuelle (souvent négatif)
2. **Sentiment de la proposition** : tonalité optimiste/pessimiste de la promesse
3. **Attitude envers l'adversaire** : attaque vs proposition constructive
4. **Niveau de certitude** : engagement ferme vs vague aspiration

Une étude (Frontiers in Political Science, 2025) compare VADER et BERT pour le sentiment politique et conclut que BERT capture mieux les nuances du discours politique grâce à sa compréhension bidirectionnelle du contexte.

**Implémentation recommandée :**

```python
from transformers import pipeline

# Sentiment analysis avec CamemBERT fine-tuné
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="tblard/tf-allocine",  # ou un modèle fine-tuné sur du politique
    tokenizer="tblard/tf-allocine"
)

# Pour une analyse plus fine, utiliser un LLM avec prompt structuré
prompt = """Analyse le sentiment de cette promesse politique :
"{promise}"

Retourne un JSON avec :
- sentiment_global: positif/négatif/neutre
- critique_statu_quo: 0-100
- optimisme_proposition: 0-100
- certitude_engagement: 0-100
- agressivite_adversaire: 0-100
"""
```

**Références :**
- [Sentiment Analysis of UN Speeches - Frontiers](https://www.frontiersin.org/journals/political-science/articles/10.3389/fpos.2025.1546822/full)
- [NLP and Politics: How Sentiment Models Shape Elections](https://veritasnlp.com/nlp-and-politics-how-sentiment-models-shape-elections/)

---

### 1.3 Topic Modeling pour la catégorisation des promesses

**Comparaison des approches :**

| Méthode | Approche | Forces | Cas d'usage politique |
|---------|----------|--------|----------------------|
| **LDA** (Latent Dirichlet Allocation) | Probabiliste, bag-of-words | Textes longs, interprétable | Manifestes complets, programmes détaillés |
| **NMF** (Non-negative Matrix Factorization) | Algébrique | Rapide, topics cohérents | Pré-traitement rapide |
| **BERTopic** | Embeddings transformers + HDBSCAN + c-TF-IDF | Sémantique, contexte, court texte | Promesses individuelles, tweets, résumés |
| **Top2Vec** | Doc2Vec + UMAP + HDBSCAN | Automatique, pas de prétraitement | Exploration initiale |

**BERTopic est recommandé** pour l'analyse de promesses politiques individuelles car il capture le sens sémantique et fonctionne bien sur les textes courts. LDA reste pertinent pour l'analyse de manifestes complets (textes longs).

**Implémentation BERTopic pour textes politiques français :**

```python
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer

# Utiliser un modèle d'embedding français
embedding_model = SentenceTransformer("dangvantuan/sentence-camembert-large")

# Configurer BERTopic
from sklearn.feature_extraction.text import CountVectorizer
vectorizer = CountVectorizer(
    stop_words=None,  # NE PAS retirer les stop words avant embedding
    ngram_range=(1, 3),
    min_df=5
)

topic_model = BERTopic(
    embedding_model=embedding_model,
    vectorizer_model=vectorizer,
    language="french",
    calculate_probabilities=True,
    nr_topics="auto"  # ou un nombre fixe correspondant aux thèmes politiques
)

# Entraînement
topics, probs = topic_model.fit_transform(promesses_politiques)

# Visualisation
topic_model.visualize_topics()
topic_model.visualize_barchart(top_n_topics=15)
topic_model.visualize_heatmap()

# Dynamic topic modeling (évolution dans le temps)
topics_over_time = topic_model.topics_over_time(
    promesses, timestamps, nr_bins=20
)
topic_model.visualize_topics_over_time(topics_over_time)
```

**Topics politiques typiques attendus** (alignés avec le schéma MARPOR) :

1. Politique étrangère et défense
2. Liberté et droits fondamentaux
3. Système politique et gouvernance
4. Économie et fiscalité
5. Protection sociale et santé
6. Éducation et recherche
7. Environnement et transition écologique
8. Sécurité et justice
9. Immigration et intégration
10. Culture et identité
11. Logement et urbanisme
12. Emploi et travail
13. Agriculture et ruralité
14. Numérique et innovation

**Guided Topic Modeling :** BERTopic supporte le guided topic modeling qui permet de pré-définir des "seed topics" avec des mots-clés pour guider la découverte thématique vers des catégories politiques connues.

**Références :**
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/index.html)
- [Using NLP to Analyze Political Party Manifestos - MDPI](https://www.mdpi.com/2078-2489/14/3/152)
- [Manifesto Analysis using NLP - Medium](https://medium.com/@sushrut.j.mair/manifesto-analysis-using-natural-language-processing-nlp-5590b0a39629)

---

### 1.4 Résumé automatique de programmes politiques

**Approches :**

| Type | Méthode | Modèles | Usage |
|------|---------|---------|-------|
| **Extractif** | Sélection des phrases les plus importantes | TextRank, LexRank, BERT-Extractive | Résumés factuels fidèles au texte |
| **Abstractif** | Génération de nouveau texte résumant | BART, PEGASUS, T5, mBART | Résumés fluides et concis |
| **Hybride** | Extraction puis reformulation | BERT extractif + BART abstractif | Meilleur compromis fidélité/fluidité |
| **LLM-based** | Prompting de LLMs | Claude, GPT-4, Mistral | Résumés contextuels et structurés |

**Recommandation pour les programmes politiques :**

L'approche hybride est la plus adaptée : d'abord extraire les passages clés (propositions, chiffres, engagements), puis les reformuler de manière concise. Des recherches montrent que cette méthode produit des résumés plus abstractifs tout en maintenant des scores ROUGE élevés.

Pour le français, **mBART** (multilingual BART) ou un LLM avec prompt structuré sont les meilleures options.

**Implémentation avec LLM :**

```python
summarization_prompt = """Tu es un analyste politique objectif. Résume ce programme politique
en extrayant les informations structurées suivantes :

PROGRAMME :
{programme_text}

Retourne un JSON avec :
{
  "resume_general": "2-3 phrases résumant la vision globale",
  "propositions_cles": [
    {
      "theme": "catégorie thématique",
      "proposition": "description concise",
      "cout_estime": "montant si mentionné",
      "echeance": "date si mentionnée",
      "population_cible": "groupe concerné"
    }
  ],
  "orientation_politique": {
    "axe_economique": "gauche/centre-gauche/centre/centre-droite/droite",
    "axe_societal": "progressiste/modéré/conservateur",
    "axe_ecologique": "écologiste/modéré/productiviste"
  },
  "mots_cles_dominants": ["mot1", "mot2", "mot3"]
}
"""
```

**Références :**
- [Extractive and Abstractive Summarization with Transformer LMs](https://arxiv.org/abs/1909.03186)
- [Unified Extractive-Abstractive Summarization - PeerJ](https://peerj.com/articles/cs-2424/)

---

### 1.5 Extraction de claims (promesses spécifiques)

**Pipeline d'extraction de promesses :**

```
Texte brut du programme
    │
    ▼
[1. Segmentation] → Découpage en phrases/quasi-phrases
    │
    ▼
[2. Classification binaire] → Est-ce une promesse ? (oui/non)
    │
    ▼
[3. Extraction d'entités] → Qui, quoi, combien, quand, comment
    │
    ▼
[4. Normalisation] → Standardisation du format
    │
    ▼
[5. Catégorisation] → Thème, axe politique
    │
    ▼
Promesse structurée (JSON)
```

**Étape 2 — Classification des promesses :**

La distinction entre une promesse/engagement concret et un énoncé vague ou une position générale est fondamentale. On s'inspire de l'approche ClaimBuster qui identifie les "check-worthy claims" :

- ClaimBuster utilise TF-IDF + POS tags + NER features sur un classifieur SVM
- Précision de 0.96 pour le top 100 des phrases
- API publique disponible : https://idir.uta.edu/claimbuster/
- Adapté aux discours politiques en anglais ; nécessite adaptation pour le français

**Classification avec un LLM :**

```python
claim_classification_prompt = """Classifie cette phrase extraite d'un programme politique :

Phrase : "{sentence}"

Catégories :
1. PROMESSE_CONCRETE : engagement mesurable avec action spécifique
2. PROMESSE_VAGUE : aspiration ou objectif sans mesure concrète
3. CONSTAT : description de la situation actuelle
4. CRITIQUE : attaque de l'adversaire ou du bilan sortant
5. VALEUR : énoncé de principe ou de valeur
6. AUTRE : hors catégorie

Retourne un JSON : {"categorie": "...", "confiance": 0.0-1.0, "justification": "..."}
"""
```

**Références :**
- [ClaimBuster - Automated Fact-Checking](https://idir.uta.edu/claimbuster/)
- [Toward Automated Fact-Checking - Semantic Scholar](https://www.semanticscholar.org/paper/6e99d06b4f2a53f8f6d1f5a51c4fbbee45322ab0)
- [Towards Automated Fact-Checking with LLMs](https://arxiv.org/html/2502.08909v1)

---

### 1.6 Approches d'automatisation du fact-checking

**Pipeline de fact-checking automatisé :**

```
[1. Claim Extraction] → Identifier les assertions factuelles vérifiables
         │
         ▼
[2. Evidence Retrieval] → Rechercher des preuves dans des sources vérifiées
         │                  (Wikipédia, données INSEE, Légifrance, rapports officiels)
         ▼
[3. Claim-Evidence Matching] → Analyser la relation claim ↔ evidence
         │
         ▼
[4. Verdict] → Vrai / Partiellement vrai / Trompeur / Faux / Invérifiable
```

**Outils et approches :**

| Outil | Approche | Disponibilité |
|-------|----------|---------------|
| **ClaimBuster** | SVM + NLP features | API publique (anglais) |
| **LLMs (GPT, Claude, Llama)** | RAG + raisonnement | API, évaluation sur 17 856 claims PolitiFact |
| **Google Fact Check Tools API** | Recherche dans les fact-checks publiés | API gratuite |
| **Full Fact AI** | Pipeline de bout en bout | Partiellement open-source |

**Approche RAG pour le fact-checking de promesses :**

```python
# Architecture RAG pour vérification de promesses
class PromiseFactChecker:
    def __init__(self):
        self.vector_store = ChromaDB()  # ou Pinecone, Weaviate
        self.llm = Claude()  # ou GPT-4

        # Sources de données indexées
        self.index_sources([
            "données INSEE (statistiques économiques)",
            "Légifrance (textes de loi en vigueur)",
            "rapports Cour des Comptes",
            "données budget de l'État (PLF)",
            "rapports France Stratégie",
            "données Eurostat",
            "rapports parlementaires",
        ])

    def check_promise(self, promise: str) -> dict:
        # 1. Extraire les claims vérifiables
        claims = self.extract_verifiable_claims(promise)

        # 2. Pour chaque claim, retriever les données pertinentes
        for claim in claims:
            evidence = self.vector_store.similarity_search(claim, k=10)
            # 3. Évaluer avec le LLM
            verdict = self.llm.evaluate(claim, evidence)

        return {
            "promise": promise,
            "claims": claims,
            "verdicts": verdicts,
            "confidence": confidence_score,
            "sources": cited_sources
        }
```

---

## 2. Extraction de données structurées à partir de textes politiques

### 2.1 Schéma d'extraction de promesses

**Champs à extraire pour chaque promesse :**

```json
{
  "promise_id": "uuid",
  "raw_text": "Texte original de la promesse",
  "source": {
    "document": "Programme présidentiel 2027",
    "parti": "Nom du parti",
    "candidat": "Nom du candidat",
    "date_publication": "2027-01-15",
    "page": 42,
    "url": "https://..."
  },
  "extraction": {
    "action": "Créer 50 000 places en crèche",
    "verbe_action": "créer",
    "objet": "places en crèche",
    "quantification": {
      "valeur": 50000,
      "unite": "places",
      "type": "creation_nette"
    },
    "cout_estime": {
      "montant": 2000000000,
      "devise": "EUR",
      "periodicite": "annuel",
      "source_chiffrage": "candidat|institut_montaigne|ifrap|calcul_propre"
    },
    "echeance": {
      "date_cible": "2030",
      "type": "fin_mandat|1_an|mi_mandat|date_precise"
    },
    "population_ciblee": {
      "description": "Familles avec enfants de moins de 3 ans",
      "estimation_taille": 2400000,
      "criteres": ["age_enfant < 3"]
    },
    "source_financement": {
      "description": "Réforme de la fiscalité des successions",
      "type": "impot_nouveau|redeploy|economie|dette|non_precise"
    },
    "domaine_competence": {
      "niveau": "national|regional|departemental|communal|europeen",
      "ministere_concerne": "Famille et Petite enfance"
    }
  },
  "classification": {
    "theme_marpor": "504 - Welfare State Expansion",
    "theme_simplifie": "protection_sociale",
    "axe_politique": {
      "economique": -0.3,
      "societal": 0.2,
      "ecologique": 0.0
    },
    "type_promesse": "creation|modification|suppression|maintien",
    "niveau_precision": "tres_precis|precis|vague|aspirationnel"
  },
  "feasibility": {
    "score_global": 0.72,
    "scores_detailles": {
      "faisabilite_juridique": 0.85,
      "faisabilite_budgetaire": 0.60,
      "faisabilite_technique": 0.70,
      "faisabilite_politique": 0.65,
      "faisabilite_temporelle": 0.80
    },
    "confidence": 0.75,
    "justification": "..."
  }
}
```

### 2.2 Datasets existants de promesses politiques

**Datasets majeurs :**

| Dataset | Couverture | Contenu | Accès |
|---------|-----------|---------|-------|
| **Manifesto Project (MARPOR)** | 50+ pays, 1945-2025 | 5 285 manifestes codés, 877 élections, 1 412 partis | API + R package (manifestoR) |
| **Chapel Hill Expert Survey (CHES)** | 31 pays européens | Positionnement de 279 partis sur 6 axes | Téléchargement libre |
| **Archelec 4** | France, 1958-1993 | 33 000 professions de foi numérisées | Archives en ligne |
| **PolitiFact** | USA | 17 856+ claims vérifiés (2007-2024) | Web scraping |
| **EveryPolitician** | Mondial | Données sur les élus | API Wikidata |
| **Comparative Agendas Project** | 20+ pays | Codage thématique de l'agenda politique | Téléchargement libre |

**API du Manifesto Project — Détails techniques :**

- **Root URL :** `https://manifesto-project.wzb.eu/api/v1/`
- **Authentification :** API key (via query param `api_key`, header `API_KEY`, ou `Authorization: Bearer <key>`)
- **Fonctions principales :**
  - `list_core_versions` : lister les versions du dataset
  - `get_core` : télécharger le dataset principal (formats : dta, xlsx, sav)
  - `get_core_codebook` : codes, labels et définitions des catégories
  - `metadata` : métadonnées du corpus pour un couple parti-élection
  - `texts_and_annotations` : textes des manifestes avec annotations (paramètre `translation=en` pour traduction anglaise)
- **Format des clés :** `<party>_<date>` (ex: `41320_200909`)
- **R package :** `manifestoR` — accès direct depuis R
- **Quotas :** limites quotidiennes de requêtes
- **Schéma de codage :** 56 catégories thématiques organisées en 7 domaines

**Calcul de l'indice RILE (Right-Left) du Manifesto Project :**

L'indice RILE est calculé en prenant la somme des pourcentages de quasi-phrases dans les 13 catégories "droite" et en soustrayant la somme des 13 catégories "gauche". Borné entre -100 (tout à gauche) et +100 (tout à droite).

**Références :**
- [Manifesto Project Datasets](https://manifesto-project.wzb.eu/datasets)
- [Manifesto Project API Documentation](https://manifesto-project.wzb.eu/information/documents/api)
- [manifestoR R Package - GitHub](https://github.com/ManifestoProject/manifestoR)

---

### 2.3 Ontologie / Knowledge Graph pour les promesses politiques

**Policy Knowledge Graph (PKG) :**

Un PKG est une représentation formelle, ontology-driven et graph-based, conçue pour capturer les informations normatives, réglementaires ou politiques sous forme d'entités structurées et de relations sémantiques.

**Modélisation proposée (classes OWL) :**

```turtle
@prefix pol: <http://politiscale.org/ontology#> .
@prefix schema: <http://schema.org/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

pol:PoliticalPromise a owl:Class ;
    rdfs:subClassOf pol:PoliticalStatement ;
    rdfs:comment "Une promesse politique concrète extraite d'un programme" .

pol:PoliticalProgram a owl:Class ;
    rdfs:comment "Un programme politique complet d'un candidat ou parti" .

pol:PolicyDomain a owl:Class ;
    rdfs:comment "Domaine de politique publique (santé, éducation, etc.)" .

pol:FeasibilityAssessment a owl:Class ;
    rdfs:comment "Évaluation de la faisabilité d'une promesse" .

pol:CostEstimate a owl:Class ;
    rdfs:comment "Estimation du coût budgétaire d'une mesure" .

pol:FundingSource a owl:Class ;
    rdfs:comment "Source de financement proposée" .

pol:AffectedPopulation a owl:Class ;
    rdfs:comment "Population impactée par la mesure" .

# Relations
pol:belongsToProgram a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:PoliticalProgram .

pol:hasDomain a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:PolicyDomain .

pol:hasCostEstimate a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:CostEstimate .

pol:hasFundingSource a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:FundingSource .

pol:affects a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:AffectedPopulation .

pol:hasFeasibility a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:FeasibilityAssessment .

pol:contradictsPromise a owl:ObjectProperty ;
    rdfs:domain pol:PoliticalPromise ;
    rdfs:range pol:PoliticalPromise ;
    rdfs:comment "Relation de contradiction entre deux promesses" .
```

**Avantages d'un Knowledge Graph :**
- Détection de contradictions entre promesses (intra-programme ou inter-candidats)
- Requêtes SPARQL complexes ("toutes les promesses du domaine santé coûtant plus de 1Md EUR")
- Intégration avec des bases de données factuelles (INSEE, Eurostat)
- Raisonnement automatique (inférences OWL)
- Alimentation d'un système RAG avec des données structurées

**Références :**
- [Policy Knowledge Graph for Regulatory Analysis](https://www.emergentmind.com/topics/policy-knowledge-graph-pkg)
- [Knowledge Graph for Public Policy - Meegle](https://www.meegle.com/en_us/topics/knowledge-graphs/knowledge-graph-for-public-policy)
- [RAG with Knowledge Graphs for Legal - arXiv](https://arxiv.org/html/2502.20364v1)

---

## 3. Scoring de faisabilité avec l'IA

### 3.1 Évaluation par LLM avec structured output

**Architecture :**

```
Promesse politique
       │
       ▼
[Extraction structurée] → JSON normalisé de la promesse
       │
       ▼
[RAG : Retrieval] → Données économiques, juridiques, précédents
       │
       ▼
[LLM : Évaluation multi-critères] → Score de faisabilité structuré
       │
       ▼
[Post-traitement] → Agrégation, calibration, ranking
```

**Structured output avec Claude (Anthropic) :**

Claude supporte désormais les structured outputs, garantissant que les réponses API correspondent exactement au JSON schema spécifié. Avec Pydantic et la bibliothèque `instructor`, on peut forcer le format de sortie :

```python
from pydantic import BaseModel, Field
from typing import List, Optional
import instructor
import anthropic

class FeasibilityScore(BaseModel):
    dimension: str = Field(description="Dimension évaluée")
    score: float = Field(ge=0, le=1, description="Score 0-1")
    confidence: float = Field(ge=0, le=1, description="Niveau de confiance")
    justification: str = Field(description="Explication du score")
    sources_utilisees: List[str] = Field(description="Sources factuelles utilisées")

class FeasibilityReport(BaseModel):
    promise_text: str
    summary: str = Field(description="Résumé en une phrase")

    # Scores multi-critères
    juridique: FeasibilityScore = Field(
        description="Compatibilité avec le droit en vigueur (Constitution, traités UE, lois)"
    )
    budgetaire: FeasibilityScore = Field(
        description="Réalisme du coût et du financement"
    )
    technique: FeasibilityScore = Field(
        description="Faisabilité technique et administrative"
    )
    politique: FeasibilityScore = Field(
        description="Probabilité d'obtenir une majorité politique"
    )
    temporelle: FeasibilityScore = Field(
        description="Respect de l'échéance annoncée"
    )
    sociale: FeasibilityScore = Field(
        description="Acceptabilité sociale et impact sur la population"
    )

    score_global: float = Field(ge=0, le=1)
    risques_principaux: List[str]
    conditions_succes: List[str]
    precedents_historiques: List[str] = Field(
        description="Mesures similaires déjà tentées et leur résultat"
    )

# Utilisation avec instructor + Claude
client = instructor.from_anthropic(anthropic.Anthropic())

report = client.chat.completions.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": f"""Évalue la faisabilité de cette promesse politique française :

        Promesse : "{promise_text}"

        Contexte économique : {economic_context}
        Cadre juridique pertinent : {legal_context}

        Évalue chaque dimension sur 0-1 avec justification détaillée."""
    }],
    response_model=FeasibilityReport
)
```

**Références :**
- [Structured Outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Hands-On with Anthropic's Structured Output - TDS](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/)
- [Instructor Library](https://python.useinstructor.com/)

---

### 3.2 RAG pour ancrer l'analyse dans des données factuelles

**Architecture RAG détaillée pour l'analyse politique :**

```
                    ┌──────────────────────────┐
                    │   Sources de données      │
                    ├──────────────────────────┤
                    │ • INSEE (stats économiques)│
                    │ • Légifrance (droit)       │
                    │ • PLF/PLFSS (budget)       │
                    │ • Cour des Comptes         │
                    │ • France Stratégie         │
                    │ • Eurostat                 │
                    │ • Rapports parlementaires   │
                    │ • Institut Montaigne        │
                    │ • IFRAP (chiffrages)       │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Indexation               │
                    │ • Chunking sémantique     │
                    │ • Embeddings (voyage/e5)   │
                    │ • Vector store (ChromaDB,  │
                    │   Pinecone, Weaviate)      │
                    │ • Métadonnées structurées  │
                    └────────────┬─────────────┘
                                 │
          ┌──────────────────────┤
          │                      │
┌─────────▼──────────┐  ┌──────▼──────────────┐
│ Retrieval hybride  │  │ Knowledge Graph     │
│ • Dense (vecteurs) │  │ • Entités politiques │
│ • Sparse (BM25)    │  │ • Relations         │
│ • Re-ranking       │  │ • Faits structurés   │
└─────────┬──────────┘  └──────┬──────────────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌──────────▼────────────┐
          │  Augmented Generation  │
          │ • Prompt avec contexte │
          │ • Chain-of-thought     │
          │ • Structured output    │
          │ • Citation des sources │
          └───────────────────────┘
```

**Sources de données clés pour le RAG (France) :**

| Source | Données | Format | Accès |
|--------|---------|--------|-------|
| **INSEE** | PIB, emploi, démographie, prix | API REST, CSV | api.insee.fr |
| **Légifrance** | Lois, décrets, jurisprudence | API DILA, XML | api.piste.gouv.fr |
| **PLF/PLFSS** | Budget de l'État, Sécu | PDF, données ouvertes | budget.gouv.fr |
| **Cour des Comptes** | Rapports d'évaluation | PDF | ccomptes.fr |
| **France Stratégie** | Prospective, évaluation | PDF, données | strategie.gouv.fr |
| **Eurostat** | Statistiques UE | API REST | ec.europa.eu/eurostat |
| **DREES** | Données sociales et santé | CSV | drees.solidarites-sante.gouv.fr |
| **data.gouv.fr** | Données publiques ouvertes | Multi-format | data.gouv.fr |

**Considérations techniques pour le RAG :**

- **Chunking** : les documents budgétaires et juridiques nécessitent un chunking sémantique (par article de loi, par mesure budgétaire) plutôt qu'un chunking par taille fixe
- **Embeddings** : utiliser des modèles d'embedding multilingues ou spécifiquement français (ex: `dangvantuan/sentence-camembert-large`)
- **Re-ranking** : un modèle de re-ranking (ex: Cohere Rerank, cross-encoder) améliore significativement la pertinence des résultats
- **Évaluation RAG** : utiliser le "RAG Triad" — context relevance, answer faithfulness, answer relevance

**Référence :**
- [RAG for Voting Advice Applications - TechRxiv](https://www.techrxiv.org/users/802685/articles/1187651)
- [Empowering Voters with RAG-enabled LLMs - ACM](https://dl.acm.org/doi/10.1145/3688671.3688784)
- [RAG for Legal Document Building - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2212473X25001014)

---

### 3.3 Multi-Criteria Decision Analysis (MCDA) combinée avec l'IA

**Approche MCDA pour le scoring de promesses :**

Le MCDA est une branche des sciences de la décision permettant d'évaluer des options sur de multiples critères potentiellement contradictoires. Combiné avec l'IA, il permet un scoring rigoureux et transparent.

**Critères proposés et pondérations :**

| Critère | Poids (%) | Description | Source de données |
|---------|-----------|-------------|-------------------|
| Faisabilité juridique | 15 | Compatibilité Constitution, droit UE, lois | Légifrance, jurisprudence |
| Faisabilité budgétaire | 25 | Coût vs recettes, soutenabilité | PLF, INSEE, chiffrages |
| Faisabilité technique | 15 | Capacité administrative, délais | Rapports administratifs |
| Cohérence interne | 10 | Non-contradiction avec autres promesses | Analyse croisée du programme |
| Impact socio-économique | 20 | Bénéfices pour la population cible | Études d'impact, INSEE |
| Précédents historiques | 15 | Résultat de mesures similaires passées | Cour des Comptes, évaluations |

**Gestion de l'incertitude :**

Trois approches principales pour gérer l'incertitude dans le MCDA :

1. **Fuzzy set theory** (45% des études) : permet de gérer le flou des informations avec des transitions souples entre niveaux qualitatifs
2. **Analyse de sensibilité probabiliste** (15%) : fait varier les paramètres dans des intervalles raisonnables
3. **Analyse de sensibilité déterministe** : évalue la robustesse des classements

**Implémentation :**

```python
import numpy as np

class PromiseMCDA:
    def __init__(self):
        self.criteria = {
            'juridique':     {'weight': 0.15, 'type': 'benefit'},
            'budgetaire':    {'weight': 0.25, 'type': 'benefit'},
            'technique':     {'weight': 0.15, 'type': 'benefit'},
            'coherence':     {'weight': 0.10, 'type': 'benefit'},
            'impact_socio':  {'weight': 0.20, 'type': 'benefit'},
            'precedents':    {'weight': 0.15, 'type': 'benefit'},
        }

    def score(self, scores: dict) -> dict:
        """
        scores: {critère: (score, confidence)} où score et confidence ∈ [0, 1]
        """
        weighted_sum = 0
        uncertainty = 0

        for criterion, params in self.criteria.items():
            s, c = scores[criterion]
            weighted_sum += params['weight'] * s
            uncertainty += params['weight'] * (1 - c)

        return {
            'score_global': round(weighted_sum, 3),
            'incertitude': round(uncertainty, 3),
            'intervalle_confiance': (
                round(max(0, weighted_sum - uncertainty), 3),
                round(min(1, weighted_sum + uncertainty), 3)
            ),
            'scores_detail': scores
        }

    def sensitivity_analysis(self, scores: dict, n_simulations=1000):
        """Monte Carlo sensitivity analysis"""
        results = []
        for _ in range(n_simulations):
            perturbed = {}
            for k, (s, c) in scores.items():
                noise = np.random.normal(0, (1-c) * 0.2)
                perturbed[k] = (np.clip(s + noise, 0, 1), c)
            results.append(self.score(perturbed)['score_global'])

        return {
            'mean': np.mean(results),
            'std': np.std(results),
            'p5': np.percentile(results, 5),
            'p95': np.percentile(results, 95)
        }
```

**Référence :**
- [MCDA Introductory Guide - UK Government](https://analysisfunction.civilservice.gov.uk/policy-store/an-introductory-guide-to-mcda/)
- [Uncertainty in MCDA for Healthcare - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4544539/)

---

## 4. Comparaison et visualisation

### 4.1 Radar charts / Spider diagrams pour comparaison multi-axes

**Cas d'usage :** Comparer les profils thématiques de candidats sur N axes (économie, social, environnement, sécurité, etc.)

**Implémentation D3.js :**

La bibliothèque `radar-chart-d3` (GitHub: alangrafu/radar-chart-d3) offre un composant réutilisable. Nadieh Bremer (Visual Cinnamon) a publié une version améliorée avec tooltips, animations et design adaptatif.

**Implémentation React + D3.js :**

```javascript
// Utilisation de Nivo (wrapper React pour D3.js)
import { ResponsiveRadar } from '@nivo/radar'

const PoliticalRadar = ({ candidates }) => (
  <ResponsiveRadar
    data={[
      { theme: "Économie", ...candidates },
      { theme: "Social", ...candidates },
      { theme: "Environnement", ...candidates },
      { theme: "Sécurité", ...candidates },
      { theme: "Éducation", ...candidates },
      { theme: "Santé", ...candidates },
      { theme: "International", ...candidates },
      { theme: "Numérique", ...candidates },
    ]}
    keys={Object.keys(candidates)}
    indexBy="theme"
    maxValue={100}
    margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
    curve="linearClosed"
    borderWidth={2}
    dotSize={8}
    dotBorderWidth={2}
    colors={{ scheme: 'set2' }}
    fillOpacity={0.15}
    blendMode="multiply"
    animate={true}
    legends={[
      { anchor: 'top-left', direction: 'column', translateX: -50 }
    ]}
  />
)
```

**Bibliothèques recommandées :**

| Bibliothèque | Framework | Radar chart | Licence | Notes |
|--------------|-----------|-------------|---------|-------|
| **Nivo** | React | Oui (natif) | MIT | Le plus complet pour React |
| **Recharts** | React | Oui (RadarChart) | MIT | Composants déclaratifs |
| **D3.js** (direct) | Vanilla JS | Custom | ISC | Flexibilité maximale |
| **Chart.js** | Multi | Oui (natif) | MIT | Simple, léger |
| **ECharts** | Multi | Oui (natif) | Apache 2.0 | Riche en interactions |

**Référence :**
- [Spider Chart - D3 Graph Gallery](https://d3-graph-gallery.com/spider)
- [How To Draw Radar Charts In Web - Smashing Magazine](https://www.smashingmagazine.com/2024/02/draw-radar-charts-web/)

---

### 4.2 Political compass / Spectrum mapping

**Modèles de positionnement existants :**

| Modèle | Axes | Source |
|--------|------|--------|
| **Political Compass** (classique) | 2 axes : économique (G-D) + social (autoritaire-libertaire) | politicalcompass.org |
| **PolitiScales** | 8 axes (16 pôles) | politiscales.party |
| **8values** | 4 axes : économique, diplomatique, civil, sociétal | 8values.github.io |
| **9axes** | 9 axes indépendants | 9axes.github.io |
| **CHES** | 6 axes avec positionnement expert | chesdata.eu |
| **3D Political Compass** | 3 axes (extension du modèle classique) | GitHub: eden-ski/3d-political-compass |
| **Polimap** | Multi-axes, figures historiques | polimap.cc.cd |

**Méthodologie de scoring de type PolitiScales / 8values :**

Chaque question correspond à un ou plusieurs axes. Les réponses (Strongly Agree - Agree - Neutral - Disagree - Strongly Disagree) modifient le score de chaque valeur. En fin de quiz, les scores sont comparés au maximum possible pour chaque valeur, donnant un pourcentage.

**Positionnement automatique par LLM :**

Des recherches récentes (Cambridge, Political Analysis) montrent qu'on peut positionner des textes politiques avec des LLMs en leur demandant d'évaluer chaque texte sur différents axes, avec des corrélations > 0.90 avec les benchmarks établis.

```python
positioning_prompt = """Positionne ce texte politique sur les axes suivants
(score de 0 à 100 pour chaque pôle) :

Texte : "{text}"

Axes :
1. Économique : Interventionnisme (0) ↔ Libéralisme (100)
2. Sociétal : Progressisme (0) ↔ Conservatisme (100)
3. Souveraineté : Internationalisme (0) ↔ Nationalisme (100)
4. Écologie : Écologisme (0) ↔ Productivisme (100)
5. Sécurité : Libertaire (0) ↔ Autoritaire (100)
6. Redistribution : Égalitarisme (0) ↔ Méritocratie (100)

Retourne un JSON avec le score de chaque axe et une justification courte.
"""
```

**Référence :**
- [Positioning Political Texts with LLMs - Cambridge](https://www.cambridge.org/core/journals/political-analysis/article/positioning-political-texts-with-large-language-models-by-asking-and-averaging/BB17F58E7329B53BC4B5F4065C7E00FF)
- [PolitiScales](https://politiscales.party/)
- [8values](https://8values.github.io/)

---

### 4.3 Visualisation coût-bénéfice

**Types de visualisations recommandées :**

1. **Treemap budgétaire** : montrer la répartition des coûts par domaine
2. **Sankey diagram** : flux de financement (source → mesure → bénéficiaires)
3. **Scatter plot** : coût (axe X) vs impact estimé (axe Y) pour chaque mesure
4. **Bar chart empilé** : comparaison des budgets par thème entre candidats
5. **Waterfall chart** : impact cumulatif sur le budget de l'État

**Outils :**
- **D3.js** : pour les visualisations personnalisées complexes (Sankey, treemap interactifs)
- **Recharts** : pour les bar charts, scatter plots en React
- **Observable Plot** : prototypage rapide de visualisations
- **Plotly** : interactivité native, bon support Python + JS

---

### 4.4 Outils de comparaison interactive — Architecture technique

**Stack technique recommandé :**

```
Frontend:
├── Next.js (React) — Framework web
├── D3.js / Nivo — Visualisations (radar, scatter, sankey)
├── Recharts — Charts standard (bar, line)
├── Tailwind CSS — Styling
└── Framer Motion — Animations

Backend:
├── FastAPI (Python) — API REST
├── LangChain / LlamaIndex — Pipeline RAG
├── ChromaDB / Weaviate — Vector store
├── PostgreSQL — Base de données relationnelle
├── Redis — Cache
└── Celery — Jobs asynchrones (analyse LLM)

AI/ML Pipeline:
├── spaCy + CamemBERT — NER et NLP français
├── BERTopic — Topic modeling
├── Claude / GPT-4 API — Analyse de faisabilité
├── sentence-transformers — Embeddings
└── scikit-learn — Classification, clustering

Data:
├── Manifesto Project API — Données historiques
├── INSEE API — Statistiques économiques
├── Légifrance API — Textes juridiques
├── data.gouv.fr — Données publiques
└── Web scraping — Programmes actuels
```

**Référence :**
- [Political Compass App (Next.js + Redux) - GitHub](https://github.com/wsakolski/political-compass)
- [Nivo React Charts](https://nivo.rocks/)

---

## 5. Projets open-source et APIs existants

### 5.1 Promise trackers

| Projet | URL | Description | Tech | Stars |
|--------|-----|-------------|------|-------|
| **PromiseTracker** (Code for Africa) | github.com/CodeForAfrica/PromiseTracker | Suivi des promesses pour journalistes | TypeScript, GraphQL | ~1 |
| **democracy-watcher** | github.com/Betree/democracy-watcher | Monitoring des promesses (pays, villes, organisations) | React, Gatsby | 14 |
| **promisetw** | github.com/MrOrz/promisetw | Promise Tracker taïwanais | JS | - |
| **electionpromisestracker** | github.com/ungineering/electionpromisestracker | Tracker open-source générique | - | - |
| **Promise Tracker Builder** (MIT Media Lab) | github.com/mitmedialab/Promise-Tracker-Builder | Création de campagnes de monitoring civique | Rails | - |

### 5.2 Analyse NLP de textes politiques

| Projet | URL | Description | Tech |
|--------|-----|-------------|------|
| **FIPI** | github.com/felixbiessmann/fipi | Classification politique avec ML sur données Manifesto Project | Python, Flask, Docker |
| **Bundestags-Mine** | github.com/TheItCrOw/Bundestags-Mine | NLP pipeline pour le Bundestag (NER, sentiment, résumé, topics) | JS, C#, PHP |
| **pfootprint-nlp** | github.com/bruchansky/pfootprint-nlp | Analyse du discours politique par word vectors | Python |
| **nlp-pakistan-election-manifestos** | github.com/amirkazi/nlp-pakistan-election-manifestos | Analyse NLP de manifestes électoraux pakistanais | Python |
| **bundestag.io** | github.com/demokratie-live/bundestag.io | API pour le parlement allemand | JS |
| **manifestoR** | github.com/ManifestoProject/manifestoR | Package R pour accéder aux données Manifesto Project | R |

**FIPI — Détails techniques :**
- Entraîné sur les données du Manifesto Project (annotations experts)
- Utilise des features bag-of-words pour prédire les tendances politiques
- Backend Flask, déployable via Docker ou AWS Elastic Beanstalk
- Peut extrapoler les annotations à des corpus plus larges (articles de presse)

**Bundestags-Mine — Pipeline NLP :**
- Tokenisation, lemmatisation, POS-tagging
- Named Entity Recognition
- Analyse de sentiment
- Résumé automatique
- Topic modeling
- Traduction
- Pipelines NLP fournis par TextImager (Text Technology Lab, open-source)
- Application web publique accessible à bundestag-mine.de

### 5.3 Simulation budgétaire et analyse de politique publique

| Outil | URL | Description | Tech |
|-------|-----|-------------|------|
| **PolicyEngine** | policyengine.org / github.com/policyengine | Microsimulation taxes/prestations (US, UK) | Python (OpenFisca), AGPL |
| **Policy Simulation Library (PSL)** | pslmodels.org / github.com/PSLmodels | Collection de 14+ modèles open-source | Python, R, Julia |
| **Tax-Calculator** (PSL) | github.com/PSLmodels/Tax-Calculator | Modèle de microsimulation fiscale US | Python |
| **OG-Core / OG-USA** (PSL) | github.com/PSLmodels/OG-Core | Modèle d'équilibre général dynamique | Python |
| **OpenFisca** | openfisca.org | Moteur de règles pour systèmes socio-fiscaux (FR, UK, etc.) | Python, AGPL |
| **CBO Interactive Tools** | cbo.gov/models/tools | Outils de simulation budgétaire du Congressional Budget Office | Web |
| **Polco Budget Simulation** | info.polco.us/platform/simulation-tools | Simulation budgétaire participative | Web (SaaS) |
| **VIRTUAL Cost-Benefit Tool** | openvt.eu | Outil open-source d'analyse coût-bénéfice | GitLab |

**PolicyEngine — Détails :**
- Modélise le système socio-fiscal complet (impôts, prestations, cotisations)
- Web app : design de réformes personnalisées, impact sur la population
- API Python : `pip install policyengine-us` ou `policyengine-uk`
- Basé sur OpenFisca (moteur de règles open-source)
- Permet de simuler l'impact budgétaire de toute réforme fiscale ou sociale

**OpenFisca pour la France :**
- **openfisca-france** : modèle complet du système socio-fiscal français
- Utilisé par beta.gouv.fr pour des simulateurs publics (mes-aides.gouv.fr)
- API REST, modèle en Python, licence AGPL
- Peut simuler l'impact de modifications législatives proposées dans un programme

### 5.4 compar:IA — Plateforme française de benchmark LLM

- Lancée par le gouvernement français en octobre 2024
- 600 000+ prompts et 250 000+ votes de préférence collectés (en février 2026)
- Données publiées sous licence Etalab 2.0 sur Hugging Face et data.gouv.fr
- Leaderboard mis à jour chaque semaine (en collaboration avec PEReN, depuis novembre 2025)
- Pertinent comme source de données d'évaluation de LLMs sur du contenu en français

**Référence :** [compar:IA - arXiv](https://arxiv.org/html/2602.06669v1)

---

## 6. Prompt engineering pour l'analyse politique avec LLM

### 6.1 Chain-of-thought prompting pour l'évaluation de politiques publiques

Le chain-of-thought (CoT) prompting améliore significativement le raisonnement des LLMs sur des tâches complexes en décomposant le problème en étapes intermédiaires.

**Prompt CoT pour évaluer une promesse :**

```
Tu es un analyste de politique publique. Évalue la faisabilité de cette promesse
politique en suivant un raisonnement étape par étape.

PROMESSE : "{promise}"

Suis ce processus de raisonnement :

ÉTAPE 1 — COMPRÉHENSION
Reformule la promesse en termes précis. Identifie :
- L'action proposée
- L'objectif quantifié (si présent)
- L'échéance (si présente)
- Le coût mentionné (si présent)
- La source de financement (si présente)

ÉTAPE 2 — CADRE JURIDIQUE
Analyse la compatibilité avec :
- La Constitution française
- Le droit de l'Union européenne
- Les compétences de l'échelon concerné (commune/département/région/État/UE)
- Les lois existantes qui seraient impactées

ÉTAPE 3 — ANALYSE BUDGÉTAIRE
Évalue :
- Le coût estimé (si non mentionné, estime un ordre de grandeur)
- La crédibilité de la source de financement proposée
- L'impact sur le déficit public
- La comparaison avec des dépenses similaires existantes

ÉTAPE 4 — FAISABILITÉ TECHNIQUE ET ADMINISTRATIVE
Évalue :
- Les ressources humaines et matérielles nécessaires
- Les délais réalistes de mise en oeuvre
- Les précédents (mesures similaires déjà tentées, en France ou ailleurs)
- Les obstacles administratifs prévisibles

ÉTAPE 5 — IMPACT SOCIO-ÉCONOMIQUE
Évalue :
- Les bénéficiaires directs et indirects
- Les effets secondaires potentiels (positifs et négatifs)
- L'impact sur les inégalités
- L'impact environnemental

ÉTAPE 6 — SYNTHÈSE
Fournis un score de faisabilité global (0-100) avec un intervalle de confiance,
et les 3 principaux risques et les 3 principales conditions de succès.

IMPORTANT : Distingue clairement les faits vérifiés des estimations et opinions.
Cite tes sources quand c'est possible.
```

**Référence :**
- [Chain-of-Thought Prompting Elicits Reasoning in LLMs - arXiv](https://arxiv.org/abs/2201.11903)
- [Chain-of-Thought Prompting Guide](https://www.promptingguide.ai/techniques/cot)

---

### 6.2 Approche multi-agents pour l'analyse de politiques

**Architecture multi-agents spécialisés :**

```
                    ┌───────────────────┐
                    │   ORCHESTRATEUR   │
                    │   (Coordinator)    │
                    └───────┬───────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                   │
    ┌─────▼─────┐    ┌─────▼─────┐     ┌──────▼──────┐
    │ ÉCONOMISTE │    │  JURISTE   │     │ SOCIOLOGUE  │
    │            │    │            │     │             │
    │ • Budget   │    │ • Constitu-│     │ • Impact    │
    │ • Fiscalité│    │   tionalité│     │   social    │
    │ • Macro-   │    │ • Droit UE │     │ • Inégalités│
    │   économie │    │ • Compéten-│     │ • Accepta-  │
    │ • Emploi   │    │   ces      │     │   bilité    │
    └─────┬──────┘    └─────┬──────┘     └──────┬──────┘
          │                 │                    │
    ┌─────▼─────┐    ┌─────▼─────┐     ┌───────▼──────┐
    │ HISTORIEN  │    │ EXPERT    │     │ FACT-CHECKER │
    │            │    │ SECTORIEL │     │              │
    │ • Précé-   │    │ • Santé,  │     │ • Vérifica-  │
    │   dents    │    │   Éduc.,  │     │   tion des   │
    │ • Résultats│    │   Énergie,│     │   chiffres   │
    │   passés   │    │   etc.    │     │ • Sources    │
    └─────┬──────┘    └─────┬──────┘     └──────┬──────┘
          │                 │                    │
          └─────────────────┼────────────────────┘
                            │
                    ┌───────▼───────────┐
                    │   SYNTHÉTISEUR    │
                    │   (Aggregator)     │
                    │                   │
                    │ Score final +     │
                    │ rapport structuré │
                    └───────────────────┘
```

**Implémentation avec un framework multi-agents :**

Les frameworks principaux pour implémenter cette architecture :

| Framework | Description | Licence |
|-----------|-------------|---------|
| **CrewAI** | Orchestration de crews d'agents IA pour production | MIT |
| **AutoGen** (Microsoft) | Agents conversationnels multi-tours avec human-in-the-loop | MIT |
| **LangGraph** (LangChain) | Workflows IA avec cycles et branchements | MIT |
| **Semantic Kernel** (Microsoft) | Framework d'orchestration IA enterprise | MIT |

```python
# Exemple conceptuel avec CrewAI
from crewai import Agent, Task, Crew

economist = Agent(
    role="Économiste spécialiste des finances publiques",
    goal="Évaluer la faisabilité budgétaire et l'impact économique",
    backstory="Expert en finances publiques françaises avec 20 ans d'expérience à la Cour des Comptes",
    llm="claude-sonnet-4-20250514",
    tools=[insee_api_tool, budget_data_tool, eurostat_tool]
)

jurist = Agent(
    role="Juriste constitutionnaliste",
    goal="Évaluer la compatibilité juridique avec le droit français et européen",
    backstory="Professeur de droit constitutionnel, ancien membre du Conseil d'État",
    llm="claude-sonnet-4-20250514",
    tools=[legifrance_tool, eur_lex_tool]
)

sociologist = Agent(
    role="Sociologue spécialiste des politiques publiques",
    goal="Évaluer l'impact social et l'acceptabilité de la mesure",
    backstory="Directeur de recherche au CNRS, spécialiste de l'évaluation des politiques publiques",
    llm="claude-sonnet-4-20250514",
    tools=[drees_tool, insee_demo_tool]
)

fact_checker = Agent(
    role="Fact-checker et vérificateur de données",
    goal="Vérifier les chiffres avancés et la cohérence des données",
    backstory="Journaliste d'investigation spécialisé dans le fact-checking politique",
    llm="claude-sonnet-4-20250514",
    tools=[web_search_tool, insee_api_tool, claimbuster_tool]
)

synthesizer = Agent(
    role="Synthétiseur et rapporteur",
    goal="Agréger les analyses des experts en un rapport structuré avec scoring",
    backstory="Analyste senior à France Stratégie",
    llm="claude-sonnet-4-20250514"
)

# Définir les tâches
analyze_budget = Task(
    description=f"Analyse budgétaire de la promesse : {promise}",
    agent=economist,
    expected_output="Rapport budgétaire structuré avec score de faisabilité"
)

analyze_legal = Task(
    description=f"Analyse juridique de la promesse : {promise}",
    agent=jurist,
    expected_output="Rapport juridique avec compatibilité constitutionnelle"
)

# ... etc.

synthesize = Task(
    description="Synthétiser tous les rapports d'experts en un score final",
    agent=synthesizer,
    context=[analyze_budget, analyze_legal, analyze_social, verify_facts],
    expected_output="Rapport de faisabilité structuré au format JSON"
)

crew = Crew(
    agents=[economist, jurist, sociologist, fact_checker, synthesizer],
    tasks=[analyze_budget, analyze_legal, analyze_social, verify_facts, synthesize],
    verbose=True
)

result = crew.kickoff()
```

**Référence :**
- [Multi-Agent LLM Legal Systems Review](https://www.oaepublish.com/articles/aiagent.2025.06)
- [Layered Chain-of-Thought for Multi-Agent LLM Systems](https://arxiv.org/pdf/2501.18645)
- [Multi-Agent LLMs in 2025 - SuperAnnotate](https://www.superannotate.com/blog/multi-agent-llms)

---

### 6.3 Schéma de structured output pour rapports de faisabilité

**Schéma JSON complet pour un rapport de faisabilité :**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PoliticalPromiseFeasibilityReport",
  "type": "object",
  "required": ["promise", "analysis", "scores", "metadata"],
  "properties": {
    "promise": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "raw_text": { "type": "string" },
        "normalized_text": { "type": "string" },
        "source_program": { "type": "string" },
        "candidate": { "type": "string" },
        "party": { "type": "string" },
        "election": { "type": "string" },
        "theme": {
          "type": "string",
          "enum": ["economie", "social", "education", "sante", "securite",
                   "environnement", "international", "institutions",
                   "culture", "numerique", "logement", "emploi",
                   "agriculture", "transport"]
        }
      }
    },
    "analysis": {
      "type": "object",
      "properties": {
        "legal": {
          "type": "object",
          "properties": {
            "constitutional_compatibility": { "type": "string" },
            "eu_law_compatibility": { "type": "string" },
            "required_legislation": { "type": "array", "items": { "type": "string" } },
            "competence_level": {
              "type": "string",
              "enum": ["communal", "departemental", "regional", "national", "europeen"]
            }
          }
        },
        "budgetary": {
          "type": "object",
          "properties": {
            "estimated_cost": {
              "type": "object",
              "properties": {
                "amount_eur": { "type": "number" },
                "periodicity": { "type": "string", "enum": ["unique", "annuel", "pluriannuel"] },
                "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
              }
            },
            "proposed_funding": { "type": "string" },
            "funding_credibility": { "type": "string" },
            "deficit_impact": { "type": "string" }
          }
        },
        "technical": {
          "type": "object",
          "properties": {
            "implementation_timeline": { "type": "string" },
            "administrative_feasibility": { "type": "string" },
            "required_resources": { "type": "array", "items": { "type": "string" } }
          }
        },
        "socioeconomic": {
          "type": "object",
          "properties": {
            "direct_beneficiaries": { "type": "string" },
            "estimated_beneficiaries_count": { "type": "integer" },
            "side_effects": { "type": "array", "items": { "type": "string" } },
            "inequality_impact": { "type": "string" }
          }
        },
        "historical_precedents": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "description": { "type": "string" },
              "country": { "type": "string" },
              "year": { "type": "integer" },
              "outcome": { "type": "string" }
            }
          }
        }
      }
    },
    "scores": {
      "type": "object",
      "properties": {
        "legal_feasibility":     { "type": "number", "minimum": 0, "maximum": 1 },
        "budgetary_feasibility": { "type": "number", "minimum": 0, "maximum": 1 },
        "technical_feasibility": { "type": "number", "minimum": 0, "maximum": 1 },
        "political_feasibility": { "type": "number", "minimum": 0, "maximum": 1 },
        "timeline_feasibility":  { "type": "number", "minimum": 0, "maximum": 1 },
        "social_acceptability":  { "type": "number", "minimum": 0, "maximum": 1 },
        "overall_score":         { "type": "number", "minimum": 0, "maximum": 1 },
        "confidence":            { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
          "probability": { "type": "string", "enum": ["unlikely", "possible", "likely", "certain"] }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "analysis_date": { "type": "string", "format": "date-time" },
        "model_used": { "type": "string" },
        "sources_consulted": { "type": "array", "items": { "type": "string" } },
        "disclaimer": { "type": "string" }
      }
    }
  }
}
```

---

## 7. Synthèse et recommandations d'architecture

### Pipeline complète recommandée

```
[1. INGESTION]
    │
    ├─ PDF parsing (programme-candidats.interieur.gouv.fr)
    ├─ Web scraping (sites de campagne)
    ├─ API Manifesto Project (données historiques)
    └─ Saisie manuelle / OCR
         │
         ▼
[2. EXTRACTION NLP]
    │
    ├─ spaCy + CamemBERT : NER (entités politiques personnalisées)
    ├─ Classification : promesse concrète vs vague vs constat vs critique
    ├─ BERTopic : catégorisation thématique
    ├─ Extraction structurée : action, coût, échéance, cible, financement
    └─ Résumé extractif/abstractif
         │
         ▼
[3. ENRICHISSEMENT RAG]
    │
    ├─ Indexation des sources factuelles (INSEE, Légifrance, PLF, etc.)
    ├─ Retrieval hybride (dense + sparse + re-ranking)
    ├─ Knowledge Graph (ontologie PKG)
    └─ Cross-referencing avec promesses historiques (MARPOR)
         │
         ▼
[4. ANALYSE IA]
    │
    ├─ Multi-agents spécialisés (économiste, juriste, sociologue, fact-checker)
    ├─ Chain-of-thought reasoning
    ├─ MCDA scoring avec gestion d'incertitude
    ├─ Structured output (Pydantic + instructor)
    └─ Détection de contradictions
         │
         ▼
[5. VISUALISATION & COMPARAISON]
    │
    ├─ Radar charts (profils thématiques par candidat)
    ├─ Political compass (positionnement multi-axes)
    ├─ Budget visualization (treemap, Sankey, waterfall)
    ├─ Scatter plot faisabilité vs coût
    ├─ Timeline de mise en oeuvre
    └─ Comparateur interactif (Next.js + D3.js)
         │
         ▼
[6. API & INTERFACE]
    │
    ├─ REST API (FastAPI)
    ├─ Interface web responsive (Next.js)
    ├─ Export (JSON, CSV, PDF)
    └─ Embeddings pour recherche sémantique
```

### Technologies recommandées par couche

| Couche | Technologies | Justification |
|--------|-------------|---------------|
| **Ingestion** | PyMuPDF, BeautifulSoup, Tesseract OCR | Parsing de PDFs gouvernementaux |
| **NLP** | spaCy (fr_core_news_lg), CamemBERT, BERTopic, sentence-transformers | Écosystème NLP français mature |
| **Vector Store** | ChromaDB (dev), Weaviate ou Qdrant (prod) | Open-source, scalable |
| **LLM** | Claude API (principal), Mistral (français, backup) | Structured output, raisonnement |
| **Multi-agents** | CrewAI ou LangGraph | Orchestration d'agents spécialisés |
| **Backend** | FastAPI, Celery, PostgreSQL, Redis | Production Python, async |
| **Frontend** | Next.js, Nivo/D3.js, Tailwind | React ecosystem, SSR |
| **Data** | Manifesto Project API, INSEE API, OpenFisca | Données de référence |

---

## Sources

### NLP et analyse textuelle
- [Breaking the Code: NLP to Decode Political Text](https://politicalmarketer.com/nlp-to-decode-political-textual-data/)
- [NLP for Policymaking (Chapter 7) - arXiv](https://arxiv.org/pdf/2302.03490)
- [Using NLP to Analyze Political Party Manifestos - MDPI](https://www.mdpi.com/2078-2489/14/3/152)
- [Analyzing Political Party Manifestos with NLP - SBP-BRiMS](https://sbp-brims.org/2022/papers/working-papers/2022_SBP-BRiMS_Final_Paper_PDF_3597.pdf)
- [Manifesto Analysis using NLP - Medium](https://medium.com/@sushrut.j.mair/manifesto-analysis-using-natural-language-processing-nlp-5590b0a39629)
- [Sentiment Analysis of UN Speeches - Frontiers](https://www.frontiersin.org/journals/political-science/articles/10.3389/fpos.2025.1546822/full)
- [NLP and Politics: Sentiment Models - Veritas NLP](https://veritasnlp.com/nlp-and-politics-how-sentiment-models-shape-elections/)
- [NLP Adoption in Governments - MDPI](https://www.mdpi.com/2076-3417/13/22/12346)

### Topic Modeling
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/index.html)
- [BERTopic vs LDA](https://bertopic.com/how-is-bertopic-different-from-lda/)
- [Topic Modelling with BERTopic - TDS](https://towardsdatascience.com/topic-modelling-with-berttopic-in-python-8a80d529de34/)

### Summarization
- [Extractive and Abstractive Summarization with Transformers - arXiv](https://arxiv.org/abs/1909.03186)
- [Unified Extractive-Abstractive Summarization - PeerJ](https://peerj.com/articles/cs-2424/)
- [Hugging Face Summarization](https://huggingface.co/docs/transformers/en/tasks/summarization)

### Fact-Checking et Claim Extraction
- [ClaimBuster](https://idir.uta.edu/claimbuster/)
- [Toward Automated Fact-Checking - Semantic Scholar](https://www.semanticscholar.org/paper/6e99d06b4f2a53f8f6d1f5a51c4fbbee45322ab0)
- [Automated Fact-Checking with LLMs - arXiv](https://arxiv.org/html/2502.08909v1)
- [Automated Fact Checking - Nordic APIs](https://nordicapis.com/automated-fact-checking-the-holy-grail-of-political-communication/)

### Datasets et APIs
- [Manifesto Project Database](https://manifesto-project.wzb.eu/)
- [Manifesto Project API](https://manifesto-project.wzb.eu/information/documents/api)
- [manifestoR R Package - GitHub](https://github.com/ManifestoProject/manifestoR)
- [Manifesto Project Dataset v2025a](https://manifesto-project.wzb.eu/datasets/MPDS2025a)

### RAG et Knowledge Graphs
- [RAG for Voting Advice Applications - TechRxiv](https://www.techrxiv.org/users/802685/articles/1187651)
- [Empowering Voters with RAG-enabled LLMs - ACM](https://dl.acm.org/doi/10.1145/3688671.3688784)
- [RAG for Legal Documents - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2212473X25001014)
- [RAG with Knowledge Graphs for Legal - arXiv](https://arxiv.org/html/2502.20364v1)
- [Policy Knowledge Graph - Emergent Mind](https://www.emergentmind.com/topics/policy-knowledge-graph-pkg)
- [Knowledge Graph for Public Policy - Meegle](https://www.meegle.com/en_us/topics/knowledge-graphs/knowledge-graph-for-public-policy)

### Structured Output et LLM
- [Structured Outputs - Claude API](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic Structured Output - TDS](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/)
- [Instructor Library](https://python.useinstructor.com/)
- [Pydantic for LLMs](https://pydantic.dev/articles/llm-intro)

### Multi-Agents
- [Multi-Agent Legal Agents Review](https://www.oaepublish.com/articles/aiagent.2025.06)
- [Layered CoT for Multi-Agent Systems - arXiv](https://arxiv.org/pdf/2501.18645)
- [Multi-Agent LLMs in 2025 - SuperAnnotate](https://www.superannotate.com/blog/multi-agent-llms)
- [Chain-of-Thought Prompting - arXiv](https://arxiv.org/abs/2201.11903)

### MCDA et Scoring
- [MCDA Introductory Guide - UK Gov](https://analysisfunction.civilservice.gov.uk/policy-store/an-introductory-guide-to-mcda/)
- [Uncertainty in MCDA - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4544539/)

### Visualisation
- [Spider Chart - D3 Graph Gallery](https://d3-graph-gallery.com/spider)
- [Radar Charts in Web - Smashing Magazine](https://www.smashingmagazine.com/2024/02/draw-radar-charts-web/)
- [Nivo React Charts](https://nivo.rocks/)
- [radar-chart-d3 - GitHub](https://github.com/alangrafu/radar-chart-d3)

### Political Compass et Positionnement
- [Positioning Political Texts with LLMs - Cambridge](https://www.cambridge.org/core/journals/political-analysis/article/positioning-political-texts-with-large-language-models-by-asking-and-averaging/BB17F58E7329B53BC4B5F4065C7E00FF)
- [PolitiScales](https://politiscales.party/)
- [8values](https://8values.github.io/)
- [The Political Compass](https://www.politicalcompass.org/)
- [AI Political Compass Benchmark](https://www.aipoliticalbias.com/)

### Projets Open-Source
- [PromiseTracker - Code for Africa](https://github.com/CodeForAfrica/PromiseTracker)
- [democracy-watcher - GitHub](https://github.com/Betree/democracy-watcher)
- [FIPI - GitHub](https://github.com/felixbiessmann/fipi)
- [Bundestags-Mine - GitHub](https://github.com/TheItCrOw/Bundestags-Mine)
- [PolicyEngine US - GitHub](https://github.com/PolicyEngine/policyengine-us)
- [Policy Simulation Library](https://pslmodels.org/)
- [Promise Tracker Builder - MIT Media Lab](https://github.com/mitmedialab/Promise-Tracker-Builder)
- [Political Compass Next.js App - GitHub](https://github.com/wsakolski/political-compass)

### Simulation Budgétaire
- [PolicyEngine](https://policyengine.org/)
- [OpenFisca](https://openfisca.org/)
- [CBO Interactive Tools](https://www.cbo.gov/models/tools)
- [VIRTUAL Cost-Benefit Tool - GitLab](https://openvt.eu/cost-benefit-analysis/cost-benefit-tool)

### Données Françaises
- [compar:IA - French Government LLM Arena](https://arxiv.org/html/2602.06669v1)
- [NLP for Political Opinion at Harvard](https://dash.harvard.edu/bitstreams/b281ca9a-f727-4e30-a9b1-4467b0e74bb1/download)
- [LLM Persuasion on Political Issues - Nature](https://www.nature.com/articles/s41467-025-61345-5)
