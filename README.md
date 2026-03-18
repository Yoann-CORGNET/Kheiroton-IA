# PolitiScale

Outil d'analyse comparative des partis politiques francais. Agregation de 6 sources de donnees ouvertes pour produire des profils riches de 10 partis, avec comparaison multi-partis.

## Sources de donnees

| Source | Type | Donnees |
|--------|------|---------|
| CHES 2024 | CSV | Positionnement ideologique (8 axes, 0-10) |
| CHES Trend 1999-2024 | CSV | Evolution historique du positionnement |
| ParlGov | CSV | Familles politiques |
| CNCCFP (data.gouv.fr) | CSV | Comptes financiers des partis (2024) |
| data.gouv.fr | CSV | Resultats legislatives 2024 (T1 + T2) |
| NosDeputes | API | Activite parlementaire (si disponible) |

## Architecture

```
politiscale/
├── backend/           # Python — architecture hexagonale
│   ├── domain/        # Modeles + ports (interfaces ABC)
│   ├── adapters/      # 6 adapters (CHES, ParlGov, data.gouv, CNCCFP, NosDeputes, JSON local)
│   ├── infrastructure/api/  # FastAPI (8 endpoints REST)
│   └── scripts/       # Telechargement sources + mapping partis
├── frontend/          # Next.js 16 + Tailwind + Recharts
│   ├── app/           # 3 pages (accueil, profil parti, comparaison)
│   └── components/    # 7 composants (radar, timeline, barres, camembert, tableau)
└── data_agreg/        # Pipeline existant d'analyse de promesses
```

## Setup

### Backend (Python 3.11+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pandas httpx pydantic

# Telecharger les sources de donnees
python scripts/download_sources.py

# Lancer l'API
PYTHONPATH=. uvicorn infrastructure.api.main:app --reload --port 8000
```

L'API est accessible sur `http://localhost:8000/api/`.

### Frontend (Node.js 18+)

```bash
cd frontend
npm install

# Lancer le dev server (le backend doit tourner sur :8000)
npm run dev
```

Le frontend est accessible sur `http://localhost:3000`.

## API Endpoints

```
GET /api/health                          Status
GET /api/parties                         Liste des 10 partis (resume)
GET /api/parties/{slug}                  Profil complet
GET /api/parties/{slug}/positioning      Positionnement CHES
GET /api/parties/{slug}/elections        Resultats electoraux
GET /api/parties/{slug}/finance          Donnees CNCCFP
GET /api/parties/{slug}/promises         Promesses (si dispo)
GET /api/parties/{slug}/parliamentary    Activite parlementaire (si dispo)
GET /api/compare?parties=rn,lfi,ps       Comparaison multi-partis
```

## 10 partis couverts

PS, LR, RN, Renaissance, LFI, EELV, PCF, MoDem, Horizons, Reconquete

Tries par axe gauche-droite (CHES `lrgen`, 0-10).
