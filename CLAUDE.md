# PolitiScale

Outil d'analyse comparative de faisabilite des programmes politiques francais.

## Commande

`/politiscale [mode] [args]`

| Mode | Usage | Effet |
|------|-------|-------|
| `agreg <election> [candidats]` | `/politiscale agreg Presidentielle 2027 Macron, Le Pen` | Collecte les donnees via MCP → MongoDB |
| `analyse` | `/politiscale analyse` | Analyse les programmes depuis MongoDB |
| *(sans argument)* | `/politiscale` | Pipeline complete: agreg si MongoDB vide, puis analyse |

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
├── .mcp.json                    # Config MCP → backend/mcp_server.py
├── backend/
│   ├── mcp_server.py            # Serveur MCP (store_*/get_* tools → MongoDB)
│   ├── adapters/mongodb/        # Adaptateur MongoDB (client + promises)
│   ├── adapters/                # Autres adaptateurs (CHES, CNCCFP, etc.)
│   ├── domain/                  # Modeles + services (clean architecture)
│   ├── infrastructure/api/      # FastAPI routes
│   └── scripts/
│       ├── seed_mongo.py        # Migration JSON → MongoDB
│       └── download_sources.py  # Telechargement CSV externes
├── data_agreg/
│   ├── output/
│   │   └── rapport_faisabilite.md  # Rapport lisible (fichier local)
│   └── CONTEXT.md               # Resume compile des donnees
├── docker-compose.yml           # backend + mongodb
├── PLAN.md                      # Architecture detaillee
└── PIPELINE.md                  # Specification technique
```

## Stockage des donnees

Les donnees transitent via **MongoDB** (et non plus des fichiers JSON).
Les agents utilisent le serveur MCP `politiscale` pour lire/ecrire.

| Collection | Contenu | Outils MCP |
|-----------|---------|------------|
| `programs` | Promesses par candidat | `store_program` / `get_programs` |
| `economic` | Macro INSEE, budget PLF, contraintes UE | `store_economic_data` / `get_economic_data` |
| `legal` | Constitution, droit UE, procedures | `store_legal_data` / `get_legal_data` |
| `precedents` | Reformes FR + internationales | `store_precedents` / `get_precedents` |
| `evaluations` | Inst. Montaigne, IFRAP, CdC | `store_evaluation` / `get_evaluations` |
| `results` | Resultats d'analyse (contrat d'interface) | `store_results` / `get_results` |

## Contrat d'interface

La collection `results` dans MongoDB est consommee par l'API backend.
Le schema est garanti et documente dans `.claude/commands/politiscale.md`.

Cles racine: `metadata`, `programs`, `comparison`.
Chaque promesse a: `id`, `raw_text`, `candidate_justification`, `theme`, `source_url`, `source_orientation`, `sources_croisees`, `funding_status`, `feasibility.overall`, `feasibility.dimensions`, `feasibility.ci_95`.

## Flux de donnees

```
Phase 1 (agreg)           Phase 1b (audit)           Phase 2 (analyse)          Phase 3 (rapport)
4 agents collecteurs      audit qualite              5 agents analystes         1 agent synthetiseur
WebSearch → MCP store_*   list_collections           MCP get_* → scoring MCDA   scores → store_results
        │                 ├─ ✓ OK → Phase 2          guard data quality                 │
        ▼                 └─ ⚠ → enrichissement             │                          ▼
    MongoDB                    agents enrichissement   evaluations par agent      MongoDB (results)
    (6 collections)            (candidate_justif,      (5 rapports/promesse)      + rapport_faisabilite.md
                                sources croisees,
                                funding_status)
```

## Conventions

- Toute donnee DOIT avoir une source URL verifiable
- Pas de donnee = pas d'inclusion (jamais inventer)
- Chaque score a un score (0-1) ET une confiance (0-1)
- Neutralite politique stricte
- **Diversite des sources**: au moins 2 orientations (liberal + gauche/institutionnel) par promesse
- **Guard fact-check**: `financement_non_capture` ≠ `financement_non_propose` — ne jamais penaliser pour un manque dans nos donnees
- **Audit des donnees existantes**: si MongoDB contient deja des programmes, les auditer et enrichir avant analyse
- Disclaimer obligatoire sur chaque rapport
- La collection `results` respecte toujours le schema garanti
