# PolitiScale — Analyse comparative de faisabilite de programmes politiques

## Input

$ARGUMENTS

Modes:
- `agreg <election> [candidats]` — Phase 1 seule: collecter les donnees
- `analyse [programmes]` — Phase 2+3: analyser les programmes existants dans MongoDB
- (sans argument) — Pipeline complete: agreg si MongoDB vide, puis analyse

## Stockage des donnees

Toutes les donnees sont stockees dans **MongoDB** via le serveur MCP `politiscale`.
Les agents utilisent les outils MCP pour lire et ecrire les donnees.

### Collections MongoDB

| Collection | Contenu | Outils MCP |
|-----------|---------|------------|
| `programs` | 1 doc par candidat (promesses sourcees) | `store_program` / `get_programs` |
| `economic` | macro INSEE, budget PLF, contraintes UE | `store_economic_data` / `get_economic_data` |
| `legal` | Constitution, droit UE, procedures, arithmetique AN | `store_legal_data` / `get_legal_data` |
| `precedents` | reformes FR + internationales | `store_precedents` / `get_precedents` |
| `evaluations` | chiffrages Inst. Montaigne, IFRAP, CdC | `store_evaluation` / `get_evaluations` |
| `results` | Donnees structurees completes (contrat d'interface) | `store_results` / `get_results` |

Utiliser `mcp__politiscale__list_collections()` pour verifier l'etat des donnees.

### Contrat d'interface: collection `results`

Ce document est consomme par l'API backend. Schema garanti:

```json
{
  "metadata": {
    "generated_at": "ISO8601",
    "pipeline_version": "string",
    "methodology": "string",
    "data_sources": ["liste des collections utilisees"]
  },
  "programs": {
    "<program_id>": {
      "candidate": "string",
      "party": "string",
      "stats": {
        "total_promises": "int",
        "concrete_promises": "int",
        "total_spending_eur": "float",
        "total_savings_eur": "float",
        "net_balance_eur": "float"
      },
      "promises": [
        {
          "id": "string",
          "raw_text": "string",
          "theme": "string (14 themes)",
          "action": "string",
          "cost_eur": "float|null",
          "classification": "PROMESSE_CONCRETE|PROMESSE_VAGUE",
          "source_url": "string URL",
          "source_type": "string",
          "feasibility": {
            "overall": "float 0-1",
            "label": "string",
            "ci_95": ["float", "float"],
            "dimensions": {
              "<dim>": {
                "score": "float 0-1",
                "confidence": "float 0-1",
                "justification": "string"
              }
            },
            "monte_carlo": {
              "mean": "float",
              "std": "float",
              "p5": "float",
              "p95": "float"
            }
          }
        }
      ]
    }
  },
  "comparison": {
    "theme_comparison": {},
    "budget_summary": {},
    "rankings": {
      "overall_feasibility": [["candidat", "score"]],
      "budget_credibility": [["candidat", "score"]],
      "by_theme": {},
      "top_5_most_feasible": [],
      "top_5_least_feasible": []
    },
    "contradictions": [],
    "political_positioning": {}
  }
}
```

Les 7 dimensions dans `feasibility.dimensions`:
- `budget` (poids 25%) — Agent Economiste
- `juridique` (poids 15%) — Agent Juriste
- `technique` (poids 15%) — derive(Economiste + Historien)
- `politique` (poids 10%) — derive(Juriste.vehicule + arithmetique)
- `timeline` (poids 10%) — derive(Historien.delai)
- `social` (poids 10%) — Agent Sociologue (acceptabilite)
- `impact` (poids 15%) — Agent Sociologue (impact)

Les 14 themes: economie, emploi, retraites, sante, education, securite, immigration, environnement, logement, institutions, international, culture, agriculture, numerique.

---

## PHASE 1 — Agregation des donnees (`agreg`)

### Prerequis
Aucun — cette phase collecte tout depuis le web et pousse vers MongoDB via MCP.
MongoDB doit etre accessible (verifier avec `mcp__politiscale__list_collections()`).

### Process

#### Etape 1.1 — Lancer 4 agents collecteurs EN PARALLELE

**Agent Programmes** (1 par candidat si possible, sinon 1 pour tous):
- WebSearch: programmes officiels, chiffrages Institut Montaigne, IFRAP, presse
- Extraire 15-25 promesses concretes par candidat
- CHAQUE promesse DOIT avoir une `source_url` verifiable
- Pousser via `mcp__politiscale__store_program(party_slug, candidate, party, election, source_urls, promises)`

**Agent Economie**:
- WebSearch: INSEE (api.insee.fr), budget.gouv.fr, AFT, Eurostat, HCFP
- Pousser 3 documents via:
  - `mcp__politiscale__store_economic_data(data_type="macro_indicators", data={...})`
  - `mcp__politiscale__store_economic_data(data_type="budget_structure", data={...})`
  - `mcp__politiscale__store_economic_data(data_type="fiscal_constraints", data={...})`
- CHAQUE indicateur DOIT avoir une `url` source

**Agent Legal**:
- WebSearch: legifrance.gouv.fr, assemblee-nationale.fr, vie-publique.fr, eur-lex.europa.eu
- Pousser 4 documents via:
  - `mcp__politiscale__store_legal_data(data_type="constitutional_constraints", data={...})`
  - `mcp__politiscale__store_legal_data(data_type="eu_legal_constraints", data={...})`
  - `mcp__politiscale__store_legal_data(data_type="legislative_procedures", data={...})`
  - `mcp__politiscale__store_legal_data(data_type="parliamentary_arithmetic", data={...})`
- NOTE: cet agent peut etre bloque par les filtres de contenu. Si c'est le cas, utiliser les outils MCP manuellement avec URLs Legifrance.

**Agent Precedents + Evaluations**:
- WebSearch: ccomptes.fr, vie-publique.fr, OCDE, FMI
- Pousser via:
  - `mcp__politiscale__store_precedents(data_type="french_reforms", data={...})`
  - `mcp__politiscale__store_precedents(data_type="international_precedents", data={...})`
  - `mcp__politiscale__store_evaluation(source="institut_montaigne", year=20XX, data={...})`
  - `mcp__politiscale__store_evaluation(source="ifrap", year=20XX, data={...})`
  - `mcp__politiscale__store_evaluation(source="cour_des_comptes", year=20XX, data={...})`
- CHAQUE reforme/evaluation DOIT avoir des `source_urls`

#### Etape 1.2 — Validation

Verifier les donnees poussees via MCP:

```
# Verifier le nombre de documents par collection
mcp__politiscale__list_collections()

# Verifier les promesses sourcees
mcp__politiscale__get_programs()
# Pour chaque programme, verifier que chaque promesse a une source_url
```

Si des promesses n'ont pas de `source_url`, les retirer et repousser le programme corrige.

#### Etape 1.3 — Compiler CONTEXT.md

Generer `data_agreg/CONTEXT.md` avec un resume des donnees collectees (voir le fichier existant comme modele). Ce fichier est utilise comme reference rapide. Les donnees sous-jacentes sont dans MongoDB.

---

## PHASE 2 — Analyse multi-agents (`analyse`)

### Prerequis

Verifier que MongoDB contient les donnees necessaires:

```
mcp__politiscale__list_collections()
# Verifier: programs >= 1, economic >= 1, legal >= 1, precedents >= 1
```

Si des collections sont vides: proposer de lancer la Phase 1 d'abord.

### Etape 2.0 — Charger le contexte

1. Appeler `mcp__politiscale__get_programs()` pour recuperer tous les programmes
2. Compter les promesses concretes a analyser
3. Les agents chargeront leurs donnees de reference directement via MCP (voir "Contexte a charger" dans chaque agent)

### Etape 2.1 — Preparer les prompts des agents

Pour chaque agent, lire son fichier `.claude/agents/{nom}.md` et y injecter:
- Les promesses a analyser (par batch thematique de 3-5)
- Les agents recupereront eux-memes les donnees de reference via les outils MCP

**Donnees recuperees par chaque agent via MCP:**

| Agent | Outils MCP utilises |
|-------|---------------------|
| Economiste | `get_economic_data`, `get_evaluations` |
| Juriste | `get_legal_data` |
| Sociologue | `get_precedents`, `get_economic_data` |
| Fact-checker | `get_economic_data`, `get_evaluations`, `get_programs` |
| Historien | `get_precedents` |

### Etape 2.2 — Lancer les agents EN PARALLELE

Pour chaque batch de promesses (groupees par theme, 3-5 par batch):

```
Agent(
  prompt="[contenu .claude/agents/economiste.md]\n\n## Promesses a analyser\n{batch_json}",
  description="Budget: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/juriste.md]\n\n## Promesses a analyser\n{batch_json}",
  description="Juridique: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/sociologue.md]\n\n## Promesses a analyser\n{batch_json}",
  description="Social: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/factchecker.md]\n\n## Promesses a analyser\n{batch_json}",
  description="Factcheck: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/historien.md]\n\n## Promesses a analyser\n{batch_json}",
  description="Precedents: {theme} {candidate}"
)
```

Les 5 agents retournent chacun un JSON par promesse (schema defini dans chaque `.claude/agents/*.md`).
Les agents chargent eux-memes les donnees de reference via les outils MCP PolitiScale.

### Etape 2.3 — Synthese (Agent Synthetiseur)

Pour chaque promesse, agreger les 5 rapports selon `.claude/agents/synthetiseur.md`:

```
Score global = 0.25 × budget + 0.15 × juridique + 0.15 × technique
             + 0.10 × politique + 0.10 × timeline + 0.10 × social + 0.15 × impact
```

Derivations:
- `technique` = moyenne(score_economiste, score_historien)
- `politique` = score derive du vehicule legislatif (juriste) + arithmetique AN
- `timeline` = score derive du delai realiste (historien)

Echelle:
| Score | Label |
|-------|-------|
| 0.80+ | Tres faisable |
| 0.60-0.79 | Faisable |
| 0.40-0.59 | Partiellement faisable |
| 0.20-0.39 | Difficilement faisable |
| <0.20 | Irrealiste |

---

## PHASE 3 — Comparaison et rapport

### Etape 3.1 — Comparaison cross-programmes

1. **Par theme**: matrice candidat × theme avec score moyen de faisabilite
2. **Bilan budgetaire**: depenses / economies / solde net par programme
3. **Contradictions intra-programme**: depenses >> economies, conflits de politique
4. **Positionnement politique** sur 6 axes (0-100):
   - Interventionnisme ↔ Liberalisme
   - Progressisme ↔ Conservatisme
   - Internationalisme ↔ Souverainisme
   - Ecologisme ↔ Productivisme
   - Libertaire ↔ Autoritaire
   - Egalitarisme ↔ Meritocratie
5. **Classement global**: par faisabilite moyenne

### Etape 3.2 — Generer les outputs

**Collection `results` (MongoDB)** — Pousser via `mcp__politiscale__store_results(metadata, programs, comparison)`.
Schema garanti (voir contrat d'interface ci-dessus). Ce document est la source de verite pour l'API backend.

**`data_agreg/output/rapport_faisabilite.md`** — Rapport lisible (fichier local):
1. Resume executif (classement, forces/faiblesses par candidat)
2. Comparaison par theme (14 themes)
3. Analyse budgetaire (depenses, economies, solde, credibilite)
4. Fiches par promesse (score 7 axes, justification, sources)
5. Positionnement politique
6. Contradictions et incoherences
7. Methodologie et limites
8. Disclaimer

### Etape 3.3 — Valider les outputs

```
# Verifier que les resultats sont bien stockes
mcp__politiscale__get_results()
# Verifier les cles requises: metadata, programs, comparison
# Pour chaque promesse: verifier source_url et feasibility
```

---

## Regles

- **SOURCER TOUT**: chaque affirmation cite une source (donnee MCP + URL d'origine)
- **DISTINGUER FAITS ET ESTIMATIONS**: ne jamais presenter une estimation comme un fait
- **DOCUMENTER L'INCERTITUDE**: chaque score a une confiance (0-1)
- **NEUTRALITE**: traiter tous les programmes avec la meme rigueur
- **CONTRAT D'INTERFACE**: la collection `results` respecte toujours le schema ci-dessus
- **DONNEES MANQUANTES**: si MongoDB est vide ou incomplet, proposer d'executer la phase agreg d'abord
- **DISCLAIMER**: toujours inclure en fin de rapport:

> Cette analyse est produite par un systeme automatise utilisant l'intelligence artificielle.
> Elle s'appuie sur des donnees publiques et des methodologies transparentes, mais ne remplace
> pas l'expertise humaine, le debat democratique ou le jugement citoyen.
> Les scores de faisabilite sont des estimations avec des marges d'incertitude.
