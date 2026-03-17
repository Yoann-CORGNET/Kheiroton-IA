# PolitiScale

Outil d'analyse comparative de faisabilite des programmes politiques francais.

## Commande

`/politiscale [mode] [args]`

| Mode | Usage | Effet |
|------|-------|-------|
| `agreg <election> [candidats]` | `/politiscale agreg Presidentielle 2027 Macron, Le Pen` | Collecte les donnees dans `data_agreg/data/` |
| `analyse` | `/politiscale analyse` | Analyse les programmes deja presents dans `data/` |
| *(sans argument)* | `/politiscale` | Pipeline complete: agreg si data/ vide, puis analyse |

## Architecture

```
politiscale/
├── .claude/
│   ├── commands/
│   │   └── politiscale.md      # Commande unique (agreg + analyse + rapport)
│   └── agents/                  # 6 agents specialises
│       ├── economiste.md        # Faisabilite budgetaire (25%)
│       ├── juriste.md           # Faisabilite juridique (15%)
│       ├── sociologue.md        # Acceptabilite sociale (10%) + impact (15%)
│       ├── factchecker.md       # Verification factuelle (transversal)
│       ├── historien.md         # Precedents (technique 15% + timeline 10%)
│       └── synthetiseur.md      # Agregation MCDA + rapport final
├── data_agreg/
│   ├── data/                    # Donnees sourcees (16 JSON)
│   │   ├── programs/            # Promesses par candidat (source_url obligatoire)
│   │   ├── economic/            # Macro INSEE, budget PLF, contraintes UE
│   │   ├── legal/               # Constitution, droit UE, procedures, arithmetique AN
│   │   ├── precedents/          # Reformes FR + internationales
│   │   └── evaluations/         # Inst. Montaigne, IFRAP, Cour des Comptes
│   ├── output/                  # Resultats generes
│   │   ├── resultats.json       # CONTRAT D'INTERFACE (schema garanti)
│   │   └── rapport_faisabilite.md
│   ├── pipeline/                # POC Python (scoring heuristique, backup)
│   └── CONTEXT.md               # Resume compile des donnees
├── PLAN.md                      # Architecture detaillee
└── PIPELINE.md                  # Specification technique
```

## Contrat d'interface

`data_agreg/output/resultats.json` est consomme par d'autres programmes.
Le schema est garanti et documente dans `.claude/commands/politiscale.md`.

Cles racine: `metadata`, `programs`, `comparison`.
Chaque promesse a: `id`, `raw_text`, `candidate_justification`, `theme`, `source_url`, `source_orientation`, `sources_croisees`, `funding_status`, `feasibility.overall`, `feasibility.dimensions`, `feasibility.ci_95`.

## Flux de donnees

```
Phase 1 (agreg)           Phase 1b (audit)           Phase 2 (analyse)          Phase 3 (rapport)
4 agents collecteurs      audit qualite              5 agents analystes         1 agent synthetiseur
WebSearch → JSON          donnees existantes?        JSON → scoring MCDA        scores → rapport + JSON
        │                 ├─ ✓ OK → Phase 2          guard data quality                 │
        ▼                 └─ ⚠ → enrichissement             │                          ▼
    data_agreg/data/         agents enrichissement   evaluations par agent      data_agreg/output/
    (16+ fichiers JSON)      (candidate_justif,      (5 rapports/promesse)      resultats.json ← contrat
                              sources croisees,                                 rapport_faisabilite.md
                              funding_status)
```

## Conventions

- Toute donnee DOIT avoir une source URL verifiable
- Pas de donnee = pas d'inclusion (jamais inventer)
- Chaque score a un score (0-1) ET une confiance (0-1)
- Neutralite politique stricte
- **Diversite des sources**: au moins 2 orientations (liberal + gauche/institutionnel) par promesse
- **Guard fact-check**: `financement_non_capture` ≠ `financement_non_propose` — ne jamais penaliser pour un manque dans nos donnees
- **Audit des donnees existantes**: si data/ contient deja des programmes, les auditer et enrichir avant analyse
- Disclaimer obligatoire sur chaque rapport
- `output/resultats.json` respecte toujours le schema garanti
