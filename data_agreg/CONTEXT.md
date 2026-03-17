# PolitiScale — Contexte de reference

Ce fichier compile les donnees cles necessaires a l'analyse de faisabilite des programmes politiques francais. Toutes les donnees sont sourcees avec URLs verifiables.

Donnees completes dans `data_agreg/data/` (16 fichiers JSON, 280K).

---

## 1. Contexte macroeconomique France

Source: INSEE, AFT, Eurostat | Fichier: `data/economic/macro_indicators.json`

| Indicateur | Valeur | Date | Source |
|-----------|--------|------|--------|
| PIB nominal | 2 919.9 Md EUR | 2024 | INSEE Comptes de la Nation |
| Croissance PIB | +1.1% (2024), +0.9% (2025) | 2025 | INSEE |
| Dette publique | 3 305 Md EUR (113% PIB) | fin 2024 | INSEE |
| Deficit public | 5.8% du PIB | 2024 | INSEE |
| Chomage | 7.9% | T4 2025 | INSEE |
| Inflation | 0.9% | 2025 moyenne | INSEE |
| Population | 68.6 millions | jan 2025 | INSEE |
| Interets dette | 50.9 Md EUR (2024), 54.9 Md (2025 est.) | 2024-25 | AFT |
| Pression fiscale | 42.8% du PIB | 2024 | INSEE |
| Depenses publiques | 57.1% du PIB | 2024 | INSEE |
| SMIC | 1 801.80 EUR brut / 1 426.30 EUR net mensuel | 2025 | INSEE |
| Salaire median | 2 190 EUR net mensuel (prive) | 2024 | INSEE |
| Taux pauvrete | 15.4% | 2023 | INSEE |

## 2. Budget de l'Etat 2025

Source: budget.gouv.fr | Fichier: `data/economic/budget_structure.json`

**Recettes**: 308.4 Md EUR
- IR: 94.5 Md | IS: 53.0 Md | TVA: 101.4 Md | TICPE: 16.5 Md

**Depenses**: 445.0 Md EUR
- Education: 64.5 Md | Defense: 50.5 Md | Service de la dette: 54.9 Md | Solidarite: 31.6 Md | Ecologie: 29.8 Md | Recherche: 31.1 Md

**Budget Secu (LFSS 2025)**: 666 Md EUR de depenses, deficit -22.1 Md, ONDAM 265.9 Md

## 3. Contraintes fiscales UE

Source: Consilium, Commission europeenne | Fichier: `data/economic/fiscal_constraints.json`

- **Maastricht**: deficit < 3% PIB (France: 5.8%), dette < 60% PIB (France: 113%) → les deux depasses
- **Procedure deficit excessif**: lancee juillet 2024, correction d'ici 2029
- **Croissance depenses nettes plafonnee**: 0.8-1.2%/an
- **PSMT 2025-2029**: deficit sous 3% d'ici 2029, ajustement structurel primaire ~0.9 pt/an

## 4. Contraintes constitutionnelles

Source: Legifrance, Conseil constitutionnel | Fichier: `data/legal/constitutional_constraints.json`

| Article | Contrainte | Impact |
|---------|-----------|--------|
| Art. 34 | Domaine de la loi (impots, droits, organisation Etat) | Necessite loi votee au Parlement |
| Art. 40 | **Parlement ne peut augmenter depenses ni baisser recettes** | Bloque les initiatives parlementaires financieres |
| Art. 47 | Budget vote en 70 jours max | Calendrier contraint |
| Art. 49.3 | Engagement de responsabilite sans vote | Passage force mais risque de censure (289 voix) |
| Art. 89 | Revision constitutionnelle: 2 chambres identiques + 3/5 Congres | Quasi-impossible sans consensus |
| Art. 11 | Referendum sur organisation pouvoirs publics, reformes eco/sociales | Risque politique (cf. 2005) |
| Bloc constitutionnalite | CC censure lois contraires (egalite, liberte, propriete) | Taxe 75% censuree (2012), 32 art. loi immigration censures (2024) |

## 5. Contraintes droit UE

Source: EUR-Lex | Fichier: `data/legal/eu_legal_constraints.json`

| Domaine | Contrainte | Severite |
|---------|-----------|----------|
| Budget/fiscal | Art. 121-126 TFUE, deficit excessif | Haute |
| Aides d'Etat | Art. 107-109 TFUE, subventions ciblees | Moyenne |
| Libre circulation | Art. 45-66 TFUE, pas de preference nationale emploi UE | Haute |
| Climat | Neutralite 2050, -55% en 2030 | Moyenne |
| Politique monetaire | BCE exclusive, pas de creation monetaire nationale | Tres haute |
| PAC | Budget et regles negocies au niveau UE | Moyenne |

## 6. Arithmetique parlementaire (post-2024)

Source: assemblee-nationale.fr | Fichier: `data/legal/parliamentary_arithmetic.json`

| Bloc | Partis | Sieges AN |
|------|--------|----------|
| Gauche (NFP) | LFI (72) + SOC (66) + EcoS (38) + GDR (17) | ~193 |
| Centre (Ensemble) | EPR (95) + Dem (36) + HOR (32) | ~163 |
| Droite nationale | RN (126) | ~126 |
| Droite republicaine | DR (47) | ~47 |
| Divers | LIOT + NI | ~48 |

**Majorite absolue: 289 sieges** — aucun bloc ne l'atteint seul.
**Motion de censure**: RN (126) + NFP (193) = 319 > 289 → peuvent renverser le gouvernement ensemble.
**Senat**: majorite LR/centre-droit → veto sur revisions constitutionnelles.

## 7. Procedures legislatives

Source: vie-publique.fr, assemblee-nationale.fr | Fichier: `data/legal/legislative_procedures.json`

| Type | Delai | Majorite | Difficulte |
|------|-------|----------|-----------|
| Decret | 1-3 mois | Aucune (executif) | Facile mais domaine limite |
| Loi ordinaire | 3-12 mois | Simple des votants (ou 49.3) | Possible mais instable |
| Ordonnance (Art. 38) | 2-6 mois | Simple pour habilitation | Contourne le debat |
| Loi organique | 4-18 mois | Absolue AN (289) si desaccord | Tres difficile |
| Revision constitutionnelle | 6-24 mois | 2 chambres + 3/5 Congres (555) | Quasi-impossible |
| Referendum (Art. 11) | 2-6 mois | Simple des suffrages | Risque politique majeur |

## 8. Precedents historiques

Source: Cour des Comptes, vie-publique.fr | Fichier: `data/precedents/french_reforms.json`

15 reformes documentees (2007-2023) avec source URLs, resultats et lecons:
- Retraites 2023 (49.3, opposition massive), 2010, 2014
- Loi travail El Khomri 2016, ordonnances travail 2017
- RGPP 2007, reforme territoriale 2015
- RSA 2009, France Travail 2023
- Climat et resilience 2021, separatisme 2021
- PACTE 2019, Parcoursup 2018, LRU 2007

10 precedents internationaux documentes (OCDE, FMI) dans `data/precedents/international_precedents.json`.

## 9. Evaluations d'experts

| Source | Fichier | Contenu |
|--------|---------|---------|
| Institut Montaigne | `evaluations/institut_montaigne_2022.json` | Chiffrages 5 candidats 2022, mesure par mesure |
| IFRAP | `evaluations/ifrap_2022.json` | Chiffrages 8 candidats 2022, comparaison |
| Cour des Comptes | `evaluations/cour_des_comptes_key_findings.json` | 25 evaluations recentes, economies identifiees |

## 10. Donnees programmes

4 programmes presidentielle 2022, 80 promesses totales, 100% sourcees:
- `programs/macron.json` — 20 promesses, Institut Montaigne sourced
- `programs/le_pen.json` — 20 promesses, Institut Montaigne sourced
- `programs/melenchon.json` — 20 promesses, Institut Montaigne sourced
- `programs/zemmour.json` — 20 promesses, Institut Montaigne sourced
