# PolitiScale — Analyse comparative de faisabilite de programmes politiques

## Input

$ARGUMENTS

Modes:
- `agreg <election> [candidats]` — Phase 1 seule: collecter les donnees
- `analyse [programmes]` — Phase 2+3: analyser les programmes existants dans data/
- (sans argument) — Pipeline complete: agreg si data/ vide, puis analyse

## Structure des donnees

```
data_agreg/
├── data/                    # INPUT pour l'analyse, OUTPUT de l'agregation
│   ├── programs/            # 1 JSON par candidat (promesses sourcees)
│   ├── economic/            # macro INSEE, budget PLF, contraintes UE
│   ├── legal/               # Constitution, droit UE, procedures, arithmetique AN
│   ├── precedents/          # reformes FR + internationales
│   └── evaluations/         # chiffrages Inst. Montaigne, IFRAP, CdC
├── output/                  # OUTPUT de l'analyse
│   ├── resultats.json       # Donnees structurees completes (contrat d'interface)
│   └── rapport_faisabilite.md
└── CONTEXT.md               # Resume compile des donnees de reference
```

### Contrat d'interface: `output/resultats.json`

Ce fichier est consomme par d'autres programmes. Schema garanti:

```json
{
  "metadata": {
    "generated_at": "ISO8601",
    "pipeline_version": "string",
    "methodology": "string",
    "data_sources": ["liste des fichiers data/ utilises"]
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
Aucun — cette phase collecte tout depuis le web.

### Process

#### Etape 1.0 — Creer la structure si absente
```bash
mkdir -p data_agreg/data/{programs,economic,legal,precedents,evaluations}
mkdir -p data_agreg/output
```

#### Etape 1.1 — Lancer 4 agents collecteurs EN PARALLELE

**Agent Programmes** (1 par candidat si possible, sinon 1 pour tous):
- WebSearch: programmes officiels, chiffrages Institut Montaigne, IFRAP, presse
- Extraire 15-25 promesses concretes par candidat
- CHAQUE promesse DOIT avoir une `source_url` verifiable
- Ecrire `data/programs/{nom}.json`

**Agent Economie**:
- WebSearch: INSEE (api.insee.fr), budget.gouv.fr, AFT, Eurostat, HCFP
- Ecrire 3 fichiers: `macro_indicators.json`, `budget_structure.json`, `fiscal_constraints.json`
- CHAQUE indicateur DOIT avoir une `url` source

**Agent Legal**:
- WebSearch: legifrance.gouv.fr, assemblee-nationale.fr, vie-publique.fr, eur-lex.europa.eu
- Ecrire 4 fichiers: `constitutional_constraints.json`, `eu_legal_constraints.json`, `legislative_procedures.json`, `parliamentary_arithmetic.json`
- NOTE: cet agent peut etre bloque par les filtres de contenu. Si c'est le cas, ecrire manuellement avec URLs Legifrance.

**Agent Precedents + Evaluations**:
- WebSearch: ccomptes.fr, vie-publique.fr, OCDE, FMI
- Ecrire: `french_reforms.json`, `international_precedents.json`, `institut_montaigne_20XX.json`, `ifrap_20XX.json`, `cour_des_comptes_key_findings.json`
- CHAQUE reforme/evaluation DOIT avoir des `source_urls`

#### Etape 1.2 — Validation

```bash
# Verifier que tous les JSON sont valides
find data_agreg/data -name "*.json" -exec python3 -c "import json; json.load(open('{}'))" \;

# Compter les promesses sourcees
python3 -c "
import json, glob
for f in glob.glob('data_agreg/data/programs/*.json'):
    d = json.load(open(f))
    total = len(d['promises'])
    sourced = len([p for p in d['promises'] if p.get('source_url')])
    print(f'{f}: {sourced}/{total} sourcees')
"
```

Si des promesses n'ont pas de `source_url`, les SUPPRIMER.

#### Etape 1.3 — Compiler CONTEXT.md

Generer `data_agreg/CONTEXT.md` avec un resume des donnees collectees (voir le fichier existant comme modele). Ce fichier est utilise comme reference rapide par les agents d'analyse.

---

## PHASE 2 — Analyse multi-agents (`analyse`)

### Prerequis

Verifier que `data_agreg/data/` contient les donnees necessaires:

```python
required = [
    "data_agreg/data/programs/",        # au moins 1 fichier
    "data_agreg/data/economic/macro_indicators.json",
    "data_agreg/data/economic/budget_structure.json",
    "data_agreg/data/legal/constitutional_constraints.json",
    "data_agreg/data/legal/parliamentary_arithmetic.json",
    "data_agreg/data/precedents/french_reforms.json",
]
```

Si des fichiers manquent: proposer de lancer la Phase 1 d'abord.

### Etape 2.0 — Charger le contexte

1. Lire `data_agreg/CONTEXT.md` pour le resume
2. Lire TOUS les fichiers `data_agreg/data/programs/*.json`
3. Lire les fichiers de contexte pertinents pour les agents
4. Compter les promesses concretes a analyser

### Etape 2.1 — Preparer les prompts des agents

Pour chaque agent, lire son fichier `.claude/agents/{nom}.md` et y injecter:
- Les donnees de contexte lues depuis `data_agreg/data/`
- Les promesses a analyser (par batch thematique de 3-5)

**Donnees a injecter par agent:**

| Agent | Fichiers de contexte a lire et injecter |
|-------|-----------------------------------------|
| Economiste | `economic/macro_indicators.json`, `economic/budget_structure.json`, `economic/fiscal_constraints.json`, `evaluations/institut_montaigne_*.json`, `evaluations/ifrap_*.json` |
| Juriste | `legal/constitutional_constraints.json`, `legal/eu_legal_constraints.json`, `legal/legislative_procedures.json`, `legal/parliamentary_arithmetic.json` |
| Sociologue | `economic/macro_indicators.json` (chomage, SMIC, pauvrete), `precedents/french_reforms.json` (opposition sociale) |
| Fact-checker | `economic/macro_indicators.json`, `economic/budget_structure.json`, `evaluations/*.json`, programme complet du candidat |
| Historien | `precedents/french_reforms.json`, `precedents/international_precedents.json` |

### Etape 2.2 — Lancer les agents EN PARALLELE

Pour chaque batch de promesses (groupees par theme, 3-5 par batch):

```
Agent(
  prompt="[contenu .claude/agents/economiste.md]\n\n## Donnees\n{economic_data}\n\n## Promesses a analyser\n{batch_json}",
  description="Budget: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/juriste.md]\n\n## Donnees\n{legal_data}\n\n## Promesses a analyser\n{batch_json}",
  description="Juridique: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/sociologue.md]\n\n## Donnees\n{social_data}\n\n## Promesses a analyser\n{batch_json}",
  description="Social: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/factchecker.md]\n\n## Donnees\n{factcheck_data}\n\n## Promesses a analyser\n{batch_json}",
  description="Factcheck: {theme} {candidate}"
)
Agent(
  prompt="[contenu .claude/agents/historien.md]\n\n## Donnees\n{precedents_data}\n\n## Promesses a analyser\n{batch_json}",
  description="Precedents: {theme} {candidate}"
)
```

Les 5 agents retournent chacun un JSON par promesse (schema defini dans chaque `.claude/agents/*.md`).

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

**`output/resultats.json`** — Schema garanti (voir contrat d'interface ci-dessus). Ce fichier est la source de verite pour les programmes en aval.

**`output/rapport_faisabilite.md`** — Rapport lisible:
1. Resume executif (classement, forces/faiblesses par candidat)
2. Comparaison par theme (14 themes)
3. Analyse budgetaire (depenses, economies, solde, credibilite)
4. Fiches par promesse (score 7 axes, justification, sources)
5. Positionnement politique
6. Contradictions et incoherences
7. Methodologie et limites
8. Disclaimer

### Etape 3.3 — Valider les outputs

```bash
# Verifier que resultats.json est valide et contient les cles requises
python3 -c "
import json
d = json.load(open('data_agreg/output/resultats.json'))
assert 'metadata' in d
assert 'programs' in d
assert 'comparison' in d
for prog in d['programs'].values():
    for p in prog['promises']:
        assert p.get('source_url'), f'{p[\"id\"]} manque source_url'
        assert p.get('feasibility'), f'{p[\"id\"]} manque feasibility'
print(f'OK: {sum(len(p[\"promises\"]) for p in d[\"programs\"].values())} promesses analysees')
"
```

---

## Regles

- **SOURCER TOUT**: chaque affirmation cite une source (fichier JSON de reference ou URL)
- **DISTINGUER FAITS ET ESTIMATIONS**: ne jamais presenter une estimation comme un fait
- **DOCUMENTER L'INCERTITUDE**: chaque score a une confiance (0-1)
- **NEUTRALITE**: traiter tous les programmes avec la meme rigueur
- **CONTRAT D'INTERFACE**: `output/resultats.json` respecte toujours le schema ci-dessus
- **DONNEES MANQUANTES**: si data/ est vide ou incomplet, proposer d'executer la phase agreg d'abord
- **DISCLAIMER**: toujours inclure en fin de rapport:

> Cette analyse est produite par un systeme automatise utilisant l'intelligence artificielle.
> Elle s'appuie sur des donnees publiques et des methodologies transparentes, mais ne remplace
> pas l'expertise humaine, le debat democratique ou le jugement citoyen.
> Les scores de faisabilite sont des estimations avec des marges d'incertitude.
