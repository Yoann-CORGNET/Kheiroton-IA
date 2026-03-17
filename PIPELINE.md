# Pipeline PolitiScale — Spécification détaillée

## Vue d'ensemble du flux de données

```
                    ┌─────────────────────────────────────────────┐
                    │            ENTRÉE UTILISATEUR                │
                    │  programme_A.pdf, programme_B.pdf, ...      │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 1 — INGESTION                    ~1 min/doc
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  1a. Détection format                       │
                    │      PDF textuel ? PDF scan ? URL ? Texte ? │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  1b. Extraction texte brut                  │
                    │      PyMuPDF / Tesseract / BeautifulSoup    │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  1c. Nettoyage + normalisation              │
                    │      Encodage, espaces, tirets, ligatures   │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  1d. Détection de structure                  │
                    │      Titres, chapitres, sections             │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  1e. Segmentation en phrases                 │
                    │      spaCy sentencizer + règles custom       │
                    │                                             │
                    │  OUT: ProgramDocument (JSON)                │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 2 — EXTRACTION NLP              ~3 min/doc
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  2a. Classification des phrases              │
                    │      → PROMESSE_CONCRETE                    │
                    │      → PROMESSE_VAGUE                       │
                    │      → CONSTAT / CRITIQUE / VALEUR / AUTRE  │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  2b. Extraction d'entités (PROMESSES only)  │
                    │      action, quantification, échéance,      │
                    │      population, financement, coût           │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  2c. Catégorisation thématique               │
                    │      14 thèmes standardisés                  │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  2d. Dédoublonnage + fusion                  │
                    │      Promesses similaires regroupées         │
                    │                                             │
                    │  OUT: List[StructuredPromise] (JSON)        │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 3 — ENRICHISSEMENT RAG          ~2 min/promesse
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  3a. Génération de requêtes de recherche     │
                    │      Par promesse: 3-5 queries spécialisées │
                    │      (budgétaire, juridique, historique)     │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  3b. Retrieval multi-source                  │
                    │      Vector search + BM25 + re-ranking       │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  3c. Assemblage du dossier contextuel        │
                    │      Données factuelles + précédents         │
                    │                                             │
                    │  OUT: EnrichedPromise (JSON)                │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 4 — ANALYSE MULTI-AGENTS        ~1 min/promesse
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  4a. Dispatch parallèle aux 5 agents        │
                    │      Économiste | Juriste | Sociologue      │
                    │      Fact-checker | Historien                │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  4b. Synthèse + arbitrage                    │
                    │      Agent Synthétiseur agrège les rapports  │
                    │                                             │
                    │  OUT: AgentReport (JSON) par promesse       │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 5 — SCORING MCDA                ~10 sec/promesse
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  5a. Scoring pondéré multi-critères          │
                    │  5b. Monte Carlo (1000 simulations)          │
                    │  5c. Analyse de sensibilité                  │
                    │                                             │
                    │  OUT: FeasibilityScore (JSON) par promesse  │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ══════════════════╪══════════════════════════
                    ÉTAPE 6 — COMPARAISON                 ~5 min total
                    ══════════════════╪══════════════════════════
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │  6a. Comparaison par thème                   │
                    │  6b. Bilan budgétaire comparé               │
                    │  6c. Positionnement politique                │
                    │  6d. Détection de contradictions             │
                    │  6e. Classement global                       │
                    │                                             │
                    │  OUT: ComparisonReport (JSON + Markdown)    │
                    └─────────────────────────────────────────────┘
```

---

## ÉTAPE 1 — INGESTION

### Objectif
Transformer des documents hétérogènes (PDF, URL, texte brut) en un format structuré uniforme : le `ProgramDocument`.

### Sous-étape 1a — Détection du format

```python
def detect_format(source: str) -> SourceType:
    """
    Entrée : chemin fichier, URL ou texte brut
    Sortie : enum SourceType
    """
    if source.endswith('.pdf'):
        # Tester si le PDF contient du texte extractible
        text = extract_with_pymupdf(source)
        if len(text.strip()) < 100:
            return SourceType.PDF_SCAN  # → OCR nécessaire
        return SourceType.PDF_TEXT
    elif source.startswith('http'):
        return SourceType.URL
    else:
        return SourceType.RAW_TEXT
```

**Cas particulier** : certains PDF de programmes politiques sont semi-structurés (texte + images + encadrés). PyMuPDF préserve mieux la structure que pdfplumber pour ce cas.

### Sous-étape 1b — Extraction du texte brut

| Format | Outil | Méthode | Précautions |
|--------|-------|---------|-------------|
| PDF textuel | PyMuPDF (`fitz`) | `page.get_text("text")` | Gérer les colonnes (trier par position y puis x) |
| PDF scan | Tesseract + pytesseract | `image_to_string(lang='fra')` | Pré-traitement : deskew, binarisation, débruitage |
| URL | Playwright + BeautifulSoup | Render JS → parse HTML | Certains sites de campagne sont des SPA |
| Texte brut | Passthrough | Normalisation encodage | Détecter l'encodage (chardet) |

**Extraction PDF détaillée :**

```python
import fitz  # PyMuPDF

def extract_pdf_text(pdf_path: str) -> list[dict]:
    """
    Retourne une liste de sections avec leur texte.
    Détecte les titres par taille de police.
    """
    doc = fitz.open(pdf_path)
    sections = []
    current_section = {"title": "Introduction", "text": "", "page_start": 1}

    for page_num, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if "lines" not in block:
                continue  # ignorer les images

            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    font_size = span["size"]
                    is_bold = "Bold" in span["font"] or "bold" in span["font"]

                    # Heuristique : titre si taille > 14pt ou gras > 12pt
                    if (font_size > 14 or (is_bold and font_size > 12)) and len(text) > 3:
                        # Nouvelle section détectée
                        if current_section["text"]:
                            sections.append(current_section)
                        current_section = {
                            "title": text,
                            "text": "",
                            "page_start": page_num + 1
                        }
                    else:
                        current_section["text"] += text + " "

    if current_section["text"]:
        sections.append(current_section)

    return sections
```

### Sous-étape 1c — Nettoyage et normalisation

Opérations séquentielles :

```
Texte brut
    │
    ├── 1. Normalisation Unicode (NFC)
    │      ftfy.fix_text() → corrige encodages cassés
    │
    ├── 2. Suppression artefacts PDF
    │      - Numéros de page isolés
    │      - En-têtes/pieds de page répétitifs
    │      - Tirets de césure en fin de ligne (recoller les mots)
    │      - Ligatures (ﬁ→fi, ﬂ→fl, œ→oe pour la recherche)
    │
    ├── 3. Normalisation typographique
    │      - Guillemets français « » uniformisés
    │      - Espaces insécables avant :;!?
    │      - Tirets longs — vs courts -
    │      - Points de suspension … vs ...
    │
    ├── 4. Normalisation des nombres
    │      - "1 000 000" → "1000000" (stockage)
    │      - "1,5 milliard" → "1500000000"
    │      - "200 €/mois" → parsé en {montant: 200, devise: EUR, periodicite: mensuel}
    │
    └── 5. Suppression du bruit
           - Mentions légales, CGU
           - Formulaires d'adhésion
           - Biographies de candidats (sauf si pertinentes)
```

```python
import re
import ftfy
import unicodedata

def clean_text(raw: str) -> str:
    # 1. Fix encoding
    text = ftfy.fix_text(raw)

    # 2. Normaliser Unicode
    text = unicodedata.normalize("NFC", text)

    # 3. Recoller les mots coupés en fin de ligne
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)

    # 4. Normaliser les sauts de ligne
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)  # saut simple → espace

    # 5. Supprimer numéros de page isolés
    text = re.sub(r'^\s*\d{1,3}\s*$', '', text, flags=re.MULTILINE)

    # 6. Normaliser les espaces
    text = re.sub(r'[ \t]+', ' ', text)

    return text.strip()
```

### Sous-étape 1d — Détection de structure

Les programmes politiques français ont des structures récurrentes. Détection hiérarchique :

```
Niveau 1 — PARTIE / AXE
  Ex: "AXE 1 : UNE FRANCE QUI PROTÈGE"
  Pattern: numéro + titre en majuscules, ou "Partie N"

Niveau 2 — CHAPITRE / THÈME
  Ex: "Économie et pouvoir d'achat"
  Pattern: titre en gras, souvent numéroté (I., II., A., B.)

Niveau 3 — MESURE / PROPOSITION
  Ex: "Proposition 42 : Augmenter le SMIC de 10%"
  Pattern: "Proposition N", "Mesure N", puce + verbe d'action

Niveau 4 — DÉTAIL / EXPLICATION
  Ex: paragraphe explicatif sous une mesure
```

```python
import re

# Patterns de détection hiérarchique (programmes FR)
STRUCTURE_PATTERNS = {
    "axe": [
        r'^(?:AXE|PARTIE|PILIER)\s*\d+',                      # AXE 1, PARTIE 2
        r'^[IVX]+\.\s+[A-ZÉÈÊÀÂÎÔÛÇ\s]{10,}$',               # I. TITRE EN MAJUSCULES
    ],
    "chapitre": [
        r'^\d+\.\s+[A-ZÉÈÊÀÂ]',                                # 1. Titre
        r'^[A-Z]\)\s+',                                         # A) Titre
        r'^(?:Chapitre|Thème)\s+\d+',                           # Chapitre 3
    ],
    "mesure": [
        r'^(?:Proposition|Mesure|Engagement)\s+\d+',            # Proposition 42
        r'^[-•●]\s+(?:Nous|Il faut|Créer|Supprimer|Augmenter)', # Puce + verbe
        r'^\d+\)\s+',                                           # 1) mesure
    ],
}

def detect_structure(sections: list[dict]) -> list[dict]:
    """Enrichit chaque section avec son niveau hiérarchique."""
    for section in sections:
        title = section["title"]
        section["level"] = "detail"  # défaut

        for level, patterns in STRUCTURE_PATTERNS.items():
            for pattern in patterns:
                if re.match(pattern, title, re.MULTILINE):
                    section["level"] = level
                    break
    return sections
```

### Sous-étape 1e — Segmentation en phrases

```python
import spacy

nlp = spacy.load("fr_core_news_lg")

def segment_sentences(text: str) -> list[str]:
    """
    Segmente le texte en phrases individuelles.
    Gère les cas particuliers des programmes politiques :
    - Listes à puces (chaque puce = une phrase)
    - Chiffres avec points (1.5 milliard != fin de phrase)
    - Abréviations (M., Mme, etc.)
    """
    # Pré-traitement : transformer les puces en phrases
    text = re.sub(r'^[-•●]\s*', '', text, flags=re.MULTILINE)

    doc = nlp(text)
    sentences = []

    for sent in doc.sents:
        s = sent.text.strip()
        if len(s) > 10:  # ignorer les fragments trop courts
            sentences.append(s)

    return sentences
```

### Schéma de sortie : `ProgramDocument`

```json
{
  "program_id": "uuid-v4",
  "metadata": {
    "candidate": "Jean Dupont",
    "party": "Parti Exemple",
    "coalition": "Alliance Exemple",
    "election": "Présidentielle 2027",
    "date_published": "2027-01-15",
    "source_url": "https://...",
    "source_type": "PDF_TEXT",
    "num_pages": 142,
    "word_count": 45230
  },
  "structure": [
    {
      "level": "axe",
      "title": "AXE 1 : UNE FRANCE QUI PROTÈGE",
      "page_start": 5,
      "children": [
        {
          "level": "chapitre",
          "title": "Économie et pouvoir d'achat",
          "page_start": 6,
          "children": [
            {
              "level": "mesure",
              "title": "Proposition 1 : Augmenter le SMIC de 200€ net",
              "page_start": 6,
              "text": "Nous augmenterons le SMIC de 200 euros net par mois...",
              "sentences": [
                "Nous augmenterons le SMIC de 200 euros net par mois dès le premier trimestre du mandat.",
                "Cette mesure sera financée par une contribution exceptionnelle sur les dividendes supérieurs à 10 millions d'euros.",
                "Elle bénéficiera à 2,5 millions de salariés."
              ]
            }
          ]
        }
      ]
    }
  ],
  "raw_text": "... texte complet nettoyé ...",
  "processing": {
    "extraction_method": "pymupdf",
    "cleaning_applied": ["ftfy", "dehyphenation", "page_numbers_removed"],
    "extraction_date": "2027-02-01T14:30:00Z",
    "pipeline_version": "1.0.0"
  }
}
```

---

## ÉTAPE 2 — EXTRACTION NLP DES PROMESSES

### Objectif
Transformer les phrases brutes en promesses structurées, classées et catégorisées.

### Sous-étape 2a — Classification des phrases

**Méthode principale** : LLM avec structured output (Claude API + instructor)

Le LLM est plus adapté qu'un classifieur ML classique ici car :
- Le corpus d'entraînement français de promesses politiques est trop petit pour un fine-tuning robuste
- Le contexte (phrases précédentes/suivantes) est crucial pour la classification
- La distinction PROMESSE_CONCRETE vs PROMESSE_VAGUE nécessite du raisonnement

**Traitement par batch** : On envoie les phrases par groupes de 20-30 (fenêtre contextuelle) pour que le LLM comprenne le contexte.

```python
CLASSIFICATION_PROMPT = """Tu es un analyste politique. Classe chaque phrase
de ce programme politique dans l'une des catégories suivantes :

CATÉGORIES :
- PROMESSE_CONCRETE : engagement mesurable avec une action spécifique
  (contient un verbe d'action + un objectif quantifié ou vérifiable)
  Ex: "Nous créerons 100 000 places en crèche d'ici 2029"

- PROMESSE_VAGUE : aspiration ou objectif sans mesure concrète ni vérifiable
  Ex: "Nous améliorerons le système de santé"

- CONSTAT : description factuelle de la situation actuelle
  Ex: "La France compte 3 millions de chômeurs"

- CRITIQUE : attaque du bilan sortant ou d'un adversaire
  Ex: "Le gouvernement a échoué sur la sécurité"

- VALEUR : énoncé de principe ou position idéologique
  Ex: "La solidarité est au cœur de notre projet"

- AUTRE : hors catégorie (biographie, remerciements, etc.)

PHRASES À CLASSER :
{sentences_json}

Pour chaque phrase, retourne :
- index : numéro de la phrase
- category : la catégorie
- confidence : 0.0 à 1.0
- reasoning : justification en 1 phrase
"""
```

**Schéma de sortie par phrase :**

```json
{
  "sentence_index": 0,
  "sentence_text": "Nous augmenterons le SMIC de 200 euros net par mois.",
  "classification": {
    "category": "PROMESSE_CONCRETE",
    "confidence": 0.95,
    "reasoning": "Verbe d'action 'augmenter' + quantification '200 euros' + objet 'SMIC'"
  }
}
```

**Critères de distinction CONCRETE vs VAGUE :**

```
CONCRETE si au moins 2 des critères suivants sont remplis :
  □ Verbe d'action spécifique (créer, supprimer, augmenter, réduire, interdire, etc.)
  □ Quantification (montant, nombre, pourcentage, durée)
  □ Objet précis (SMIC, places en crèche, postes de police, etc.)
  □ Échéance (d'ici 2029, dès la première année, etc.)
  □ Population cible identifiable (salariés au SMIC, familles monoparentales, etc.)

VAGUE si :
  □ Intention sans moyen concret ("améliorer", "renforcer", "favoriser")
  □ Pas de quantification
  □ Objet trop large ("le système", "la société", "l'économie")
```

### Sous-étape 2b — Extraction d'entités (PROMESSES_CONCRETES uniquement)

**Méthode** : LLM structured output avec schema Pydantic strict.

```python
EXTRACTION_PROMPT = """Tu es un analyste de politique publique. Extrais
les informations structurées de cette promesse politique.

PROMESSE : "{promise_text}"
CONTEXTE (phrases environnantes) : "{context}"

Extrais avec précision :

1. ACTION : le verbe et l'objet de la promesse
2. QUANTIFICATION : tout chiffre, montant, pourcentage ou objectif mesurable
3. ÉCHÉANCE : toute date, délai ou référence temporelle
4. POPULATION CIBLE : qui bénéficie de la mesure
5. COÛT ANNONCÉ : tout montant de coût mentionné par le candidat
6. FINANCEMENT : la source de financement proposée
7. NIVEAU DE COMPÉTENCE : qui a le pouvoir de mettre en oeuvre
   (communal / départemental / régional / national / européen)

RÈGLES :
- Si une information n'est pas mentionnée, mettre null
- Ne pas inventer de données
- Distinguer les chiffres du candidat des chiffres que tu estimes
- Pour la quantification, normaliser en unités SI (EUR, personnes, etc.)
"""
```

**Schéma Pydantic de sortie :**

```python
class Quantification(BaseModel):
    value: float | None = None
    unit: str | None = None         # EUR, personnes, postes, %, points
    type: str | None = None         # creation, augmentation, reduction, suppression

class CostEstimate(BaseModel):
    amount_eur: float | None = None
    periodicity: str | None = None  # unique, annuel, sur_le_mandat
    source: str = "non_precise"     # candidat, institut_montaigne, ifrap, estimation

class Timeline(BaseModel):
    target_date: str | None = None
    type: str | None = None         # date_precise, 1_an, mi_mandat, fin_mandat, non_precise

class Funding(BaseModel):
    description: str | None = None
    type: str | None = None         # impot_nouveau, redeploy, economie, dette, non_precise
    estimated_yield_eur: float | None = None

class StructuredPromise(BaseModel):
    promise_id: str                 # uuid
    program_id: str                 # ref au programme source
    raw_text: str                   # texte original
    section_title: str              # titre de la section parente
    page_number: int | None = None

    # Classification
    classification: str             # PROMESSE_CONCRETE
    classification_confidence: float

    # Extraction
    action_verb: str                # créer, augmenter, supprimer...
    action_object: str              # SMIC, places en crèche...
    quantification: Quantification | None = None
    cost_candidate: CostEstimate | None = None
    timeline: Timeline | None = None
    target_population: str | None = None
    funding: Funding | None = None

    # Catégorisation
    theme: str                      # 1 des 14 thèmes
    competence_level: str           # national, regional, etc.
    precision_level: str            # tres_precis, precis, vague
```

### Sous-étape 2c — Catégorisation thématique

**14 thèmes standardisés** alignés sur la structure type des programmes français et le codage MARPOR :

```python
THEMES = {
    "economie": {
        "label": "Économie et pouvoir d'achat",
        "marpor_codes": ["401", "402", "403", "404", "414"],
        "keywords": ["PIB", "croissance", "inflation", "pouvoir d'achat", "prix",
                     "impôt", "taxe", "TVA", "fiscal", "dette", "déficit"],
    },
    "emploi": {
        "label": "Emploi et travail",
        "marpor_codes": ["701", "702", "703", "704"],
        "keywords": ["chômage", "emploi", "salaire", "SMIC", "temps de travail",
                     "droit du travail", "licenciement", "formation professionnelle"],
    },
    "retraites": {
        "label": "Retraites",
        "marpor_codes": ["504"],
        "keywords": ["retraite", "pension", "âge légal", "trimestre",
                     "régime spécial", "point", "répartition"],
    },
    "sante": {
        "label": "Santé et protection sociale",
        "marpor_codes": ["504", "506"],
        "keywords": ["hôpital", "médecin", "sécurité sociale", "médicament",
                     "EHPAD", "dépendance", "handicap", "désert médical"],
    },
    "education": {
        "label": "Éducation et recherche",
        "marpor_codes": ["506", "507"],
        "keywords": ["école", "enseignant", "université", "baccalauréat",
                     "recherche", "étudiant", "crèche", "petite enfance"],
    },
    "securite": {
        "label": "Sécurité et justice",
        "marpor_codes": ["605", "605.2"],
        "keywords": ["police", "gendarmerie", "justice", "prison",
                     "tribunal", "délinquance", "criminalité", "terrorisme"],
    },
    "immigration": {
        "label": "Immigration",
        "marpor_codes": ["601", "602"],
        "keywords": ["immigration", "frontière", "asile", "réfugié",
                     "intégration", "nationalité", "régularisation", "expulsion"],
    },
    "environnement": {
        "label": "Environnement et énergie",
        "marpor_codes": ["501", "416"],
        "keywords": ["climat", "carbone", "énergie", "nucléaire", "renouvelable",
                     "biodiversité", "pollution", "transition écologique"],
    },
    "logement": {
        "label": "Logement",
        "marpor_codes": ["504"],
        "keywords": ["logement", "loyer", "HLM", "propriété", "construction",
                     "rénovation", "SDF", "mal-logé", "APL"],
    },
    "institutions": {
        "label": "Institutions et démocratie",
        "marpor_codes": ["301", "302", "303", "304"],
        "keywords": ["Constitution", "référendum", "proportionnelle",
                     "décentralisation", "collectivité", "sénat", "assemblée"],
    },
    "international": {
        "label": "International et défense",
        "marpor_codes": ["101", "102", "103", "104", "105", "106", "107", "108", "109"],
        "keywords": ["Europe", "OTAN", "armée", "défense", "diplomatie",
                     "souveraineté", "commerce international", "aide au développement"],
    },
    "culture": {
        "label": "Culture et sport",
        "marpor_codes": ["502"],
        "keywords": ["culture", "musée", "spectacle", "audiovisuel",
                     "sport", "JO", "patrimoine", "langue française"],
    },
    "agriculture": {
        "label": "Agriculture et alimentation",
        "marpor_codes": ["703"],
        "keywords": ["agriculture", "PAC", "agriculteur", "pesticide",
                     "alimentation", "bio", "élevage", "pêche"],
    },
    "numerique": {
        "label": "Numérique et technologie",
        "marpor_codes": ["411"],
        "keywords": ["numérique", "IA", "intelligence artificielle", "données",
                     "cybersécurité", "fibre", "5G", "startup", "tech"],
    },
}
```

**Méthode de catégorisation** : LLM (plus fiable que keyword matching seul car gère l'ambiguïté) + validation par keywords comme second signal.

```python
CATEGORIZATION_PROMPT = """Catégorise cette promesse politique dans UN des 14 thèmes :

PROMESSE : "{promise_text}"

THÈMES DISPONIBLES :
1.  economie — Économie, fiscalité, pouvoir d'achat, dette, budget
2.  emploi — Travail, salaires, chômage, formation
3.  retraites — Système de retraite, âge, pensions
4.  sante — Santé, hôpitaux, Sécu, dépendance, handicap
5.  education — École, université, recherche, petite enfance
6.  securite — Police, justice, prisons, terrorisme
7.  immigration — Immigration, asile, frontières, intégration
8.  environnement — Climat, énergie, biodiversité, transport propre
9.  logement — Logement, loyers, construction, rénovation
10. institutions — Démocratie, Constitution, décentralisation
11. international — Europe, défense, diplomatie, aide au développement
12. culture — Culture, sport, patrimoine, audiovisuel
13. agriculture — Agriculture, alimentation, pêche, PAC
14. numerique — Numérique, IA, cybersécurité, tech

Retourne :
- theme : le thème principal (un seul)
- theme_secondary : thème secondaire si applicable (ou null)
- confidence : 0.0-1.0
"""
```

### Sous-étape 2d — Dédoublonnage et fusion

Un même programme peut énoncer la même promesse à plusieurs endroits (résumé + détail, répétition dans différentes sections).

**Algorithme :**

```
1. Calculer les embeddings de toutes les promesses extraites
   (sentence-camembert-large)

2. Matrice de similarité cosine entre toutes les paires

3. Si similarité > 0.85 ET même programme :
   → Fusionner (garder la version la plus détaillée)
   → Conserver les références aux deux emplacements

4. Si similarité > 0.85 ET programmes différents :
   → Marquer comme "promesse convergente"
   → Utile pour la comparaison (étape 6)

5. Si 0.70 < similarité < 0.85 ET même thème :
   → Signaler pour révision humaine (possible variante)
```

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('dangvantuan/sentence-camembert-large')

def deduplicate_promises(promises: list[StructuredPromise],
                          threshold: float = 0.85) -> list[StructuredPromise]:
    texts = [p.raw_text for p in promises]
    embeddings = model.encode(texts)

    # Matrice de similarité
    similarity = np.inner(embeddings, embeddings)

    merged = set()
    result = []

    for i in range(len(promises)):
        if i in merged:
            continue
        group = [i]
        for j in range(i + 1, len(promises)):
            if j in merged:
                continue
            if (similarity[i][j] > threshold
                    and promises[i].program_id == promises[j].program_id):
                group.append(j)
                merged.add(j)

        # Garder la promesse la plus longue/détaillée du groupe
        best = max(group, key=lambda idx: len(promises[idx].raw_text))
        promise = promises[best]
        promise.duplicate_refs = [promises[idx].raw_text for idx in group if idx != best]
        result.append(promise)

    return result
```

### Métriques de qualité de l'étape 2

| Métrique | Cible | Méthode de mesure |
|----------|-------|-------------------|
| Précision classification | > 90% | Validation manuelle sur échantillon 50 phrases |
| Rappel PROMESSE_CONCRETE | > 85% | Aucune promesse concrète manquée |
| Précision extraction entités | > 80% | Entités correctes vs gold standard |
| Taux de dédoublonnage erroné | < 5% | Faux positifs de fusion |

---

## ÉTAPE 3 — ENRICHISSEMENT RAG

### Objectif
Pour chaque promesse, constituer un dossier de données factuelles contextuelles permettant une analyse informée.

### Sous-étape 3a — Génération de requêtes spécialisées

Pour chaque promesse, le système génère 3 à 5 requêtes ciblant des angles différents :

```python
QUERY_GENERATION_PROMPT = """Pour cette promesse politique, génère des requêtes
de recherche pour trouver les données factuelles nécessaires à son évaluation.

PROMESSE : "{promise_text}"
THÈME : "{theme}"

Génère exactement 5 requêtes, une par angle :

1. BUDGÉTAIRE : requête pour trouver le coût de mesures similaires,
   données budgétaires pertinentes
2. JURIDIQUE : requête pour trouver le cadre légal applicable,
   contraintes constitutionnelles ou européennes
3. HISTORIQUE : requête pour trouver des précédents en France
   ou à l'étranger
4. STATISTIQUE : requête pour trouver les données chiffrées
   sur la situation actuelle (INSEE, DREES, etc.)
5. ÉVALUATION : requête pour trouver des évaluations d'experts
   ou d'institutions sur ce type de mesure

Retourne un JSON : [{"angle": "...", "query": "...", "sources_cibles": ["..."]}]
"""
```

**Exemple** pour la promesse "Augmenter le SMIC de 200€ net" :

```json
[
  {
    "angle": "budgetaire",
    "query": "coût augmentation SMIC pour les finances publiques allègements cotisations",
    "sources_cibles": ["PLF", "DARES", "Cour des Comptes"]
  },
  {
    "angle": "juridique",
    "query": "fixation SMIC procédure légale commission expertise salaire minimum",
    "sources_cibles": ["Code du travail", "Légifrance"]
  },
  {
    "angle": "historique",
    "query": "historique revalorisations SMIC France résultats emploi",
    "sources_cibles": ["INSEE", "DARES", "OFCE"]
  },
  {
    "angle": "statistique",
    "query": "nombre salariés SMIC France 2025 répartition secteurs",
    "sources_cibles": ["INSEE", "DARES"]
  },
  {
    "angle": "evaluation",
    "query": "effet hausse salaire minimum emploi études économiques France",
    "sources_cibles": ["OFCE", "IPP", "Conseil d'analyse économique"]
  }
]
```

### Sous-étape 3b — Retrieval multi-source

**Architecture du vector store :**

```
┌──────────────────────────────────────────────────┐
│                 VECTOR STORE                      │
│                 (ChromaDB / Qdrant)               │
├──────────────────────────────────────────────────┤
│                                                  │
│  Collection: "budget"                            │
│  ├── PLF 2025-2026 (chunks par article)         │
│  ├── PLFSS 2025-2026 (chunks par mesure)        │
│  ├── Rapports Cour des Comptes (par section)    │
│  └── FIPECO fiches thématiques                  │
│                                                  │
│  Collection: "legal"                             │
│  ├── Constitution (par article)                  │
│  ├── Codes (travail, santé, éducation...)       │
│  ├── Traités UE (articles clés)                 │
│  └── Jurisprudence CC (décisions clés)          │
│                                                  │
│  Collection: "statistics"                        │
│  ├── INSEE comptes nationaux                     │
│  ├── DREES données sociales                     │
│  ├── DARES données emploi                       │
│  └── Eurostat comparaisons internationales      │
│                                                  │
│  Collection: "evaluations"                       │
│  ├── France Stratégie rapports                   │
│  ├── CAE notes                                  │
│  ├── IPP études                                 │
│  ├── OFCE policy briefs                         │
│  └── Institut Montaigne chiffrages              │
│                                                  │
│  Collection: "precedents"                        │
│  ├── Réformes françaises passées (fiches)       │
│  ├── Politiques comparées OCDE                  │
│  └── Manifesto Project (données historiques)    │
│                                                  │
│  Metadata sur chaque chunk :                     │
│  - source, date, thème, fiabilité               │
│  - type (loi, statistique, évaluation, opinion) │
│  - périmètre géographique                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Stratégie de retrieval hybride :**

```python
def retrieve_context(query: str, collection: str, k: int = 10) -> list[dict]:
    """
    Retrieval hybride : dense + sparse + re-ranking

    1. Dense search : cosine similarity sur embeddings
    2. Sparse search : BM25 sur tokens
    3. Fusion : Reciprocal Rank Fusion (RRF)
    4. Re-ranking : cross-encoder pour réordonner
    """

    # 1. Dense retrieval (embeddings)
    dense_results = vector_store.query(
        collection=collection,
        query_embedding=embed(query),
        n_results=k * 2,  # over-fetch pour le re-ranking
    )

    # 2. Sparse retrieval (BM25)
    sparse_results = bm25_index.search(
        collection=collection,
        query=query,
        k=k * 2,
    )

    # 3. Reciprocal Rank Fusion
    fused = reciprocal_rank_fusion(dense_results, sparse_results, k=60)

    # 4. Re-ranking avec cross-encoder
    reranked = cross_encoder.rerank(
        query=query,
        documents=[r["text"] for r in fused[:k * 2]],
        top_k=k,
    )

    return reranked
```

**Chunking sémantique par type de document :**

| Type de document | Stratégie de chunking | Taille cible |
|-----------------|----------------------|--------------|
| Loi / Code | Par article | 1 article = 1 chunk |
| Budget (PLF) | Par mesure / programme | 1 mesure = 1 chunk |
| Rapport (CdC) | Par recommandation / section | 500-1000 tokens |
| Statistiques | Par indicateur + série temporelle | 1 indicateur = 1 chunk |
| Études | Par conclusion / finding | 500-1000 tokens |

### Sous-étape 3c — Assemblage du dossier contextuel

Pour chaque promesse, le système produit un `ContextDossier` structuré :

```json
{
  "promise_id": "uuid",
  "context": {
    "budget": {
      "chunks": [
        {
          "text": "Le coût des allègements de cotisations sur les bas salaires...",
          "source": "PLF 2026, annexe budgétaire Travail",
          "relevance_score": 0.92,
          "date": "2025-10"
        }
      ],
      "summary": "Les allègements Fillon coûtent ~73 Md EUR/an. Une hausse du SMIC..."
    },
    "legal": {
      "chunks": [...],
      "summary": "Le SMIC est fixé par décret après avis de la Commission nationale..."
    },
    "statistics": {
      "chunks": [...],
      "summary": "2,5 millions de salariés au SMIC (17% des salariés). Répartition..."
    },
    "evaluations": {
      "chunks": [...],
      "summary": "L'IPP estime qu'une hausse de 10% du SMIC détruirait entre..."
    },
    "precedents": {
      "chunks": [...],
      "summary": "La dernière hausse discrétionnaire du SMIC date de 2012 (+0,6%)..."
    }
  },
  "macro_context": {
    "pib": "2800 Md EUR",
    "dette": "3465 Md EUR (116% PIB)",
    "deficit": "5.4% PIB",
    "chomage": "7.3%",
    "croissance": "0.9%"
  }
}
```

### Indexation initiale (one-time setup)

**Budget de données estimé :**

| Source | Volume estimé | Chunks estimés | Priorité |
|--------|-------------|----------------|----------|
| Constitution + Codes principaux | ~5M tokens | ~5 000 | P0 (MVP) |
| PLF + PLFSS 2025-2026 | ~2M tokens | ~2 000 | P0 |
| FIPECO (100 fiches) | ~500K tokens | ~500 | P0 |
| Cour des Comptes (50 rapports clés) | ~10M tokens | ~10 000 | P1 |
| INSEE séries clés | ~200K tokens | ~500 | P0 |
| France Stratégie (20 rapports) | ~4M tokens | ~4 000 | P1 |
| Institut Montaigne chiffrages | ~1M tokens | ~1 000 | P0 |
| IFRAP chiffrages | ~500K tokens | ~500 | P0 |
| **Total P0** | **~8.2M tokens** | **~9 500** | |
| **Total P0+P1** | **~23M tokens** | **~23 500** | |

---

## ÉTAPE 4 — ANALYSE MULTI-AGENTS

### Objectif
Évaluer chaque promesse sous 5 angles spécialisés via des agents LLM indépendants, puis synthétiser.

### Protocole d'exécution

```
Pour chaque promesse :
│
├── [PARALLÈLE] Lancer 5 agents simultanément
│   ├── Agent Économiste  → BudgetReport
│   ├── Agent Juriste     → LegalReport
│   ├── Agent Sociologue  → SocialReport
│   ├── Agent Fact-checker → FactCheckReport
│   └── Agent Historien   → PrecedentReport
│
├── [SÉQUENTIEL] Attendre tous les résultats
│
├── [SÉQUENTIEL] Agent Synthétiseur
│   ├── Input : les 5 rapports
│   ├── Détecte les contradictions entre agents
│   ├── Arbitre les divergences
│   └── Produit le rapport unifié
│
└── Output : AgentReport (JSON)
```

### Schéma de sortie de chaque agent

```python
class DimensionReport(BaseModel):
    """Rapport d'un agent spécialisé sur une dimension."""
    dimension: str                    # "budgetaire", "juridique", etc.
    score: float                      # 0.0 - 1.0
    confidence: float                 # 0.0 - 1.0
    assessment: str                   # Évaluation textuelle (2-5 phrases)
    key_findings: list[str]           # 3-5 points clés
    risks: list[str]                  # Risques identifiés
    conditions_success: list[str]     # Conditions nécessaires au succès
    sources_used: list[str]           # Sources factuelles citées

    # Spécifique par agent
    data_points: dict                 # Données chiffrées utilisées
```

### Schéma de sortie du synthétiseur

```python
class AgentReport(BaseModel):
    """Rapport synthétique pour une promesse."""
    promise_id: str

    # Rapports des 5 agents
    economic: DimensionReport
    legal: DimensionReport
    social: DimensionReport
    factcheck: DimensionReport
    historical: DimensionReport

    # Synthèse
    synthesis: str                      # Paragraphe de synthèse
    contradictions_between_agents: list[str]  # Divergences détectées
    overall_assessment: str             # "faisable" / "partiellement" / "irréaliste"
    top_3_risks: list[str]
    top_3_conditions: list[str]

    # Méta
    total_tokens_used: int
    processing_time_seconds: float
```

### Gestion des divergences entre agents

Quand deux agents donnent des évaluations contradictoires :

```
SI score_agent_A - score_agent_B > 0.3 :
    → Le Synthétiseur demande à chaque agent de réagir
      à l'évaluation de l'autre (1 tour de débat)
    → Score final = moyenne pondérée par la confiance
    → La divergence est documentée dans le rapport

Exemple :
  Économiste : score 0.3 (coût énorme, financement irréaliste)
  Sociologue : score 0.8 (impact social très positif)
  → Divergence documentée, score pondéré reflète les deux angles
```

---

## ÉTAPE 5 — SCORING MCDA

### Objectif
Transformer les évaluations qualitatives des agents en scores quantitatifs comparables, avec intervalles de confiance.

### Matrice de pondération

```python
WEIGHTS = {
    "legal":      0.15,   # Faisabilité juridique
    "budget":     0.25,   # Faisabilité budgétaire (poids le plus fort)
    "technical":  0.15,   # Faisabilité technique/admin
    "political":  0.10,   # Faisabilité politique
    "timeline":   0.10,   # Faisabilité temporelle
    "social":     0.10,   # Acceptabilité sociale
    "impact":     0.15,   # Impact socio-économique
}
# Somme = 1.00
```

**Justification des poids :**
- **Budget (25%)** : premier facteur de blocage en France (dette 116% PIB, déficit 5.4%)
- **Juridique (15%)** : le Conseil constitutionnel peut annuler toute mesure
- **Technique (15%)** : beaucoup de réformes échouent à l'implémentation
- **Impact (15%)** : raison d'être de la mesure
- **Politique (10%)** : dépend de la conjoncture, plus volatile
- **Timeline (10%)** : souvent sous-estimé mais important
- **Social (10%)** : détermine le risque de blocage sociétal

### Algorithme de scoring

```python
import numpy as np

def compute_mcda_score(agent_report: AgentReport) -> FeasibilityScore:
    """
    Calcule le score MCDA pondéré avec intervalle de confiance.
    """
    dimensions = {
        "legal":     (agent_report.legal.score, agent_report.legal.confidence),
        "budget":    (agent_report.economic.score, agent_report.economic.confidence),
        "technical": (agent_report.economic.score * 0.5 + agent_report.historical.score * 0.5,
                      min(agent_report.economic.confidence, agent_report.historical.confidence)),
        "political": (estimate_political_feasibility(agent_report), 0.5),  # toujours incertain
        "timeline":  (agent_report.historical.score, agent_report.historical.confidence),
        "social":    (agent_report.social.score, agent_report.social.confidence),
        "impact":    (agent_report.social.score * 0.6 + agent_report.economic.score * 0.4,
                      min(agent_report.social.confidence, agent_report.economic.confidence)),
    }

    # Score pondéré
    weighted_score = sum(
        WEIGHTS[dim] * score
        for dim, (score, _) in dimensions.items()
    )

    # Incertitude pondérée
    weighted_uncertainty = sum(
        WEIGHTS[dim] * (1 - confidence)
        for dim, (_, confidence) in dimensions.items()
    )

    # Monte Carlo pour IC robuste
    mc_results = monte_carlo_simulation(dimensions, n=1000)

    return FeasibilityScore(
        overall=round(weighted_score, 3),
        uncertainty=round(weighted_uncertainty, 3),
        ci_95=(round(np.percentile(mc_results, 2.5), 3),
               round(np.percentile(mc_results, 97.5), 3)),
        dimensions={dim: {"score": s, "confidence": c}
                    for dim, (s, c) in dimensions.items()},
        monte_carlo={
            "mean": round(np.mean(mc_results), 3),
            "std": round(np.std(mc_results), 3),
            "p5": round(np.percentile(mc_results, 5), 3),
            "p95": round(np.percentile(mc_results, 95), 3),
        }
    )


def monte_carlo_simulation(dimensions: dict, n: int = 1000) -> list[float]:
    """
    Simule n scénarios en perturbant chaque score
    selon son niveau d'incertitude.
    """
    results = []
    for _ in range(n):
        score = 0
        for dim, (s, c) in dimensions.items():
            # Plus la confiance est basse, plus la perturbation est grande
            noise_std = (1 - c) * 0.15
            perturbed = np.clip(s + np.random.normal(0, noise_std), 0, 1)
            score += WEIGHTS[dim] * perturbed
        results.append(score)
    return results
```

### Analyse de sensibilité (Tornado diagram)

Pour identifier quels critères influencent le plus le score final :

```python
def sensitivity_analysis(dimensions: dict) -> list[dict]:
    """
    Pour chaque dimension, calcule l'amplitude du score global
    quand cette dimension varie de son min à son max plausible.
    """
    base_score = compute_weighted_score(dimensions)
    sensitivities = []

    for dim, (score, confidence) in dimensions.items():
        # Cas optimiste : score → min(score + uncertainty, 1.0)
        optimistic = {**dimensions}
        optimistic[dim] = (min(score + (1 - confidence) * 0.3, 1.0), confidence)
        score_high = compute_weighted_score(optimistic)

        # Cas pessimiste : score → max(score - uncertainty, 0.0)
        pessimistic = {**dimensions}
        pessimistic[dim] = (max(score - (1 - confidence) * 0.3, 0.0), confidence)
        score_low = compute_weighted_score(pessimistic)

        sensitivities.append({
            "dimension": dim,
            "weight": WEIGHTS[dim],
            "base_score": score,
            "score_range": (score_low, score_high),
            "amplitude": score_high - score_low,
        })

    # Trier par amplitude décroissante
    return sorted(sensitivities, key=lambda x: -x["amplitude"])
```

---

## ÉTAPE 6 — COMPARAISON CROSS-PROGRAMMES

### Objectif
Croiser les analyses de N programmes pour produire des comparaisons, détecter les contradictions et établir un classement.

### Sous-étape 6a — Comparaison par thème

Pour chaque thème, aligner les promesses de chaque programme :

```python
def compare_by_theme(programs: list[AnalyzedProgram]) -> dict:
    """
    Produit une matrice thème × candidat.
    """
    themes = set()
    for prog in programs:
        for promise in prog.promises:
            themes.add(promise.theme)

    comparison = {}
    for theme in sorted(themes):
        comparison[theme] = {}
        for prog in programs:
            theme_promises = [p for p in prog.promises if p.theme == theme]
            comparison[theme][prog.candidate] = {
                "num_promises": len(theme_promises),
                "concrete_promises": len([p for p in theme_promises
                                         if p.classification == "PROMESSE_CONCRETE"]),
                "avg_feasibility": np.mean([p.feasibility.overall
                                           for p in theme_promises]) if theme_promises else None,
                "total_cost_eur": sum(p.cost_candidate.amount_eur or 0
                                     for p in theme_promises),
                "key_promises": [
                    {"text": p.raw_text, "score": p.feasibility.overall}
                    for p in sorted(theme_promises,
                                   key=lambda x: x.feasibility.overall,
                                   reverse=True)[:3]
                ],
            }
    return comparison
```

### Sous-étape 6b — Bilan budgétaire comparé

```python
class BudgetSummary(BaseModel):
    candidate: str
    party: str

    # Dépenses
    new_spending_annual_eur: float     # Total dépenses nouvelles
    spending_by_theme: dict[str, float]

    # Recettes
    new_revenue_annual_eur: float      # Total recettes nouvelles
    revenue_by_source: dict[str, float]

    # Économies
    savings_annual_eur: float          # Total économies annoncées

    # Solde
    net_balance_eur: float             # Recettes + économies - dépenses
    deficit_impact_pct_gdp: float      # Impact sur le déficit en points de PIB

    # Crédibilité
    avg_budget_feasibility: float      # Score moyen de faisabilité budgétaire
    unfunded_promises_count: int       # Promesses sans financement identifié
    unrealistic_funding_count: int     # Financements jugés irréalistes

    # Benchmark
    institut_montaigne_estimate: float | None  # Si disponible
    ifrap_estimate: float | None               # Si disponible
```

### Sous-étape 6c — Positionnement politique automatique

```python
POSITIONING_PROMPT = """Analyse l'ensemble des promesses de ce programme politique
et positionne-le sur 6 axes (score 0-100 pour chaque pôle).

PROMESSES DU PROGRAMME :
{all_promises_summary}

AXES :
1. ÉCONOMIQUE : Interventionnisme (0) ↔ Libéralisme (100)
   0 = nationalisation, planification, régulation forte
   100 = privatisation, dérégulation, libre marché

2. SOCIÉTAL : Progressisme (0) ↔ Conservatisme (100)
   0 = nouveaux droits sociétaux, diversité, inclusion
   100 = tradition, ordre moral, valeurs familiales

3. SOUVERAINETÉ : Internationalisme (0) ↔ Souverainisme (100)
   0 = intégration européenne, multilatéralisme
   100 = souveraineté nationale, protectionnisme

4. ÉCOLOGIE : Écologisme (0) ↔ Productivisme (100)
   0 = décroissance, sortie du nucléaire, zéro carbone
   100 = croissance d'abord, nucléaire, industrie

5. LIBERTÉ : Libertaire (0) ↔ Autoritaire (100)
   0 = libertés individuelles max, moins de contrôle
   100 = sécurité d'abord, surveillance, répression

6. REDISTRIBUTION : Égalitarisme (0) ↔ Méritocratie (100)
   0 = redistribution forte, services publics universels
   100 = responsabilité individuelle, récompense du mérite

Pour chaque axe, justifie en citant 2-3 promesses emblématiques.
"""
```

### Sous-étape 6d — Détection de contradictions

**Contradictions intra-programme :**

```python
CONTRADICTION_TYPES = {
    "budget_impossible": {
        "description": "Baisser les impôts ET augmenter les dépenses sans nouvelle dette",
        "detection": "sum(new_spending) > sum(new_revenue) + sum(savings) + budget_headroom"
    },
    "legal_conflict": {
        "description": "Deux promesses nécessitant des modifications législatives incompatibles",
        "detection": "LLM analysis of legal implications pairwise"
    },
    "timeline_conflict": {
        "description": "Trop de réformes lourdes pour le temps disponible",
        "detection": "sum(implementation_time) > mandate_duration * capacity_factor"
    },
    "policy_conflict": {
        "description": "Promesses aux effets opposés",
        "detection": "LLM semantic analysis + domain rules"
    },
}
```

```python
CONTRADICTION_PROMPT = """Examine ces deux promesses du même programme et détermine
si elles sont contradictoires, en tension, ou compatibles.

PROMESSE A : "{promise_a}"
PROMESSE B : "{promise_b}"

Types de contradiction :
1. BUDGET : A et B ensemble coûtent plus que le financement total disponible
2. JURIDIQUE : A et B nécessitent des changements légaux incompatibles
3. EFFET : A annule ou contredit l'effet de B
4. TIMELINE : A et B ne peuvent pas être menées en parallèle
5. AUCUNE : les promesses sont compatibles

Retourne :
- type: le type de contradiction (ou AUCUNE)
- severity: faible / modérée / forte
- explanation: explication en 2-3 phrases
"""
```

**Algorithme** : tester les paires de promesses au sein d'un même programme qui partagent des thèmes ou des ressources (budgétaires, administratives, législatives). Pas besoin de tester toutes les paires — filtrer d'abord par similarité thématique.

### Sous-étape 6e — Classement global

```python
class ProgramRanking(BaseModel):
    candidate: str
    party: str

    # Scores agrégés
    overall_feasibility: float              # Moyenne pondérée des promesses
    overall_feasibility_ci: tuple[float, float]  # IC 95%
    budget_credibility: float               # Score spécifique budget
    internal_coherence: float               # 1 - (contradictions / promesses)

    # Stats
    total_promises: int
    concrete_promises: int
    vague_promises: int
    avg_precision: float

    # Classement par thème
    theme_rankings: dict[str, float]        # Score par thème

    # Forces/faiblesses
    top_3_strengths: list[str]              # Promesses les plus faisables
    top_3_weaknesses: list[str]             # Promesses les moins faisables
```

---

## Estimation des coûts et performances

### Temps de traitement estimés

| Étape | Durée par programme | Durée pour 5 programmes |
|-------|-------------------|------------------------|
| 1. Ingestion | 1-2 min | 5-10 min |
| 2. Extraction NLP | 3-5 min (~100 appels LLM) | 15-25 min |
| 3. Enrichissement RAG | 2-3 min par promesse × ~50 promesses | 100-150 min |
| 4. Analyse multi-agents | 1 min par promesse × ~50 promesses × 5 agents | 50-250 min (parallélisable) |
| 5. Scoring MCDA | 10 sec par promesse | ~5 min |
| 6. Comparaison | 5 min | 5 min |
| **Total** | | **~3-6 heures** (avec parallélisation) |

### Coût API estimé (pour 5 programmes, ~250 promesses totales)

| Étape | Tokens in | Tokens out | Coût estimé (Claude Sonnet) |
|-------|-----------|------------|----------------------------|
| 2. Classification | ~500K | ~100K | ~$2 |
| 2. Extraction | ~300K | ~200K | ~$2 |
| 3. Query generation | ~200K | ~50K | ~$1 |
| 4. Agents (×5) | ~5M | ~1M | ~$20 |
| 6. Comparaison | ~500K | ~200K | ~$2 |
| **Total** | **~6.5M** | **~1.5M** | **~$27** |

### Optimisations possibles

1. **Cache agressif** : les requêtes RAG pour des promesses similaires entre programmes peuvent être mutualisées
2. **Batch API** : utiliser l'API batch de Claude pour les classifications (coût /2, latence +24h)
3. **Parallélisation** : les 5 agents sont indépendants → ×5 speedup sur l'étape 4
4. **Haiku pour classification** : utiliser Claude Haiku pour l'étape 2 (classification simple) → coût /10
5. **Incrémental** : si un programme est modifié, ne recalculer que les promesses changées
