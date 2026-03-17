# Recherche et agrégation des programmes politiques en France — Rapport exhaustif

## 1. Sources par échelle électorale

### 1.1 Commune (élections municipales)

**Sources officielles :**
- **programme-candidats.interieur.gouv.fr** : Plateforme officielle du Ministère de l'Intérieur publiant les professions de foi de tous les candidats. Pour les municipales 2026 : https://programme-candidats.interieur.gouv.fr/elections-municipales-2026/
- Les professions de foi sont mises en ligne deux semaines avant le scrutin, à l'ouverture de la campagne officielle
- **Formats** : PDF, version FALC (Facile à Lire et à Comprendre), version audio (ReadSpeaker) — obligation depuis le 1er janvier 2022
- **Préfectures** : Les sites des préfectures départementales relaient les listes candidates et professions de foi
- **vie-publique.fr** : Documentation officielle sur les élections municipales
- **Mémento du candidat** : Guide officiel publié par le Ministère

**Professions de foi — collecte et diffusion :**
- Collectées par les **commissions de propagande** (une par circonscription)
- Contrôle de conformité (dimensions, grammage du papier, mentions obligatoires)
- Envoyées par voie postale aux électeurs
- Numérisées et publiées sur programme-candidats.interieur.gouv.fr
- Accessibles par carte cliquable, moteur de recherche par commune, ou listes déroulantes par département

**Limites :**
- Communes < 1 000 habitants : pas d'envoi officiel de propagande électorale
- Professions de foi numérisées disponibles uniquement pour les communes de 2 500+ habitants

### 1.2 Intercommunalité (EPCI, Métropoles)

- Depuis 2014, les conseillers communautaires/métropolitains sont élus lors des municipales (scrutin fléché, communes > 1 000 hab.)
- **Pas d'élection distincte** pour les intercommunalités
- Programmes intercommunaux **intégrés dans les programmes municipaux**
- Le "3e tour" (élection des présidents/VP d'EPCI) se joue après le scrutin municipal
- **Aucune plateforme spécifique** n'agrège les programmes intercommunaux

**Sources :**
- vie-publique.fr — La coopération intercommunale et les EPCI
- AMRF — Municipales 2026 : bien préparer le 3e tour

### 1.3 Département (élections départementales/cantonales)

- **programme-candidats.interieur.gouv.fr** : Professions de foi des binômes (scrutin binominal paritaire depuis 2015)
- Navigation par carte, par canton, par département
- Disponible depuis les départementales 2015
- Dernières élections : 2021 (couplées avec les régionales)
- **FranceArchives** : Archives départementales numérisées (professions de foi, bulletins de vote par canton)

### 1.4 Région (élections régionales)

- **programme-candidats.interieur.gouv.fr** : Professions de foi des listes régionales (depuis 2015)
- **Préfectures de région** : relais des programmes
- **Comparateurs ponctuels** : Voxe.org, IFRAP, France 3 Régions (comparateurs locaux)

### 1.5 National

#### Élections législatives (Assemblée nationale)
- **programme-candidats.interieur.gouv.fr** : Professions de foi par circonscription (depuis 2017)
- **data.gouv.fr** : Listes des candidats et résultats en open data
- **Données parlementaires post-élection** :
  - data.assemblee-nationale.fr : amendements, scrutins, comptes-rendus (XML/JSON, licence Etalab)
  - NosDeputes.fr (Regards Citoyens) : API XML/JSON/CSV
  - Datan.fr : analyse des votes, scores de participation, loyauté, cohésion
- **Chiffrage des programmes** : Institut Montaigne, IFRAP

#### Sénat (élections sénatoriales)
- **Suffrage indirect** : élus par un collège de grands électeurs (95% de délégués des conseils municipaux)
- **Pas de professions de foi diffusées au grand public**
- senatoriales2023.senat.fr : listes des candidats
- data.senat.fr : dossiers législatifs depuis 1977, amendements depuis 2001, questions écrites depuis 1978
- NosSenateurs.fr (Regards Citoyens)

#### Élection présidentielle
- programme-candidats.interieur.gouv.fr
- Institut Montaigne : comparaison et chiffrage détaillé
- Voxe.org : comparateur neutre

### 1.6 Europe (élections européennes)

- **programme-candidats.interieur.gouv.fr** : 38 listes candidates aux européennes 2024
- **Touteleurope.eu** : guide complet (programmes, candidats, professions de foi, sites internet)
- **euandi (EU&I)** : VAA européenne, 30 déclarations politiques, 20+ langues, 1,28M utilisateurs en 2019
- **VoteMatch Europe** : comparateur européen multi-pays

---

## 2. Bases de données et sources open data

### Plateformes nationales

| Plateforme | URL | Contenu |
|---|---|---|
| data.gouv.fr | data.gouv.fr/pages/donnees-des-elections | Résultats agrégés de toutes les élections depuis 1958, par bureau de vote |
| data.gouv.fr (agrégées) | data.gouv.fr/datasets/donnees-des-elections-agregees | Fichiers CSV : résultats généraux + résultats par candidat |
| data.assemblee-nationale.fr | data.assemblee-nationale.fr | Députés, scrutins, amendements, comptes rendus (XML/JSON) |
| data.senat.fr | data.senat.fr | Dossiers législatifs, amendements, questions, séances |
| CNCCFP | data.gouv.fr/organizations/cnccfp | Comptes de campagne, financement des partis |
| HATVP | hatvp.fr/open-data | Déclarations de patrimoine et d'intérêts (CSV, XML) |

### Initiatives associatives et citoyennes

| Projet | URL | Description |
|---|---|---|
| NosDeputes.fr | nosdeputes.fr | Suivi activité parlementaire AN, API XML/JSON/CSV |
| NosSenateurs.fr | nossenateurs.fr | Équivalent pour le Sénat |
| NosFinancesLocales.fr | nosfinanceslocales.fr | Données comptables des communes |
| La Fabrique de la Loi | regardscitoyens.org/la-fabrique-de-la-loi | Suivi en temps réel de l'évolution des lois |
| Datan.fr | datan.fr | Analyse des votes des députés et groupes |
| DataClic | dataclic.fr/elections | Reformatage et consolidation des données électorales |
| Observatoire des Votes | observatoire-des-votes.geoclip.fr | Cartes interactives des résultats depuis 1995 |
| promesses.fr | promesses.fr | Archivage des professions de foi et programmes |

### Code source et API
- **Regards Citoyens** : github.com/regardscitoyens — Code source de NosDeputes.fr, NosSenateurs.fr, La Fabrique de la Loi
- **API NosDeputes/NosSenateurs** : accès en ajoutant /xml, /json ou /csv à l'URL. Dumps SQL complets sous licence CC BY-NC-SA
- **Open Source Politics** : github.com/opensourcepolitics — Déploiement de Decidim pour la démocratie participative

---

## 3. Projets de recherche académique

### CEVIPOF (Centre de recherches politiques de Sciences Po)
- 80+ chercheurs, référence pour l'étude des comportements électoraux
- Axes : attitudes, comportements et forces politiques ; pensée politique et histoire des idées
- Publications sur HAL : sciencespo.hal.science/CEVIPOF

### Projet Archelec (Archives Électorales)
- Depuis 2013, partenariat CEVIPOF + Bibliothèque de Sciences Po
- 40 000 documents électoraux numérisés (1958-2012) sur Internet Archive
- **Archelec 4** (CollEx-Persée) : 33 000 professions de foi des législatives 1958-1993, 18 400 candidats
- Interface de recherche avancée : archelec4.hypotheses.org

### Manifesto Project (MARPOR) — WZB Berlin
- manifestoproject.wzb.eu — Base de données de référence mondiale
- Analyse quantitative de contenu des programmes électoraux, 50+ pays depuis 1945
- Codage quasi-phrase par quasi-phrase selon un schéma thématique exhaustif
- 1 000+ partis, téléchargement gratuit

### Chapel Hill Expert Survey (CHES)
- chesdata.eu — Enquête auprès d'experts positionnant les partis européens
- 6 axes : gauche/droite général, économique, sociétal, intégration européenne, immigration, environnement
- 6 vagues (1999-2024), 279 partis dans 31 pays

### INRIA — Word embeddings politiques
- Analyse du changement sémantique dans les textes politiques français 1958-1993
- Word embeddings temporels

---

## 4. Outils d'agrégation et comparateurs

### Comparateurs de programmes

| Outil | URL | Description |
|---|---|---|
| Voxe.org | voxe.org | Comparateur neutre et international, depuis 2012 |
| Institut Montaigne | institutmontaigne.org | Chiffrage indépendant depuis 15 ans |
| IFRAP | ifrap.org | Chiffrage budgétaire des grandes forces politiques |

### Applications de positionnement politique (VAA)

| Application | Description |
|---|---|
| Elyze | "Tinder de la politique", 2M+ téléchargements (présidentielle 2022) |
| Boussole Électorale | Vote Compass, déployé en France, Canada, Australie, USA |
| Politest | Test de positionnement sur 3 axes |
| PolitiScales | 8 axes idéologiques, 117 questions |
| POLITEIA | Nouveau test politique français |
| euandi | VAA pour les européennes, 30 déclarations, 20+ langues |

---

## 5. Méthodes d'analyse textuelle

### Logiciels spécialisés
- **Iramuteq** : Logiciel libre (R + Python), Pierre Ratinaud (Toulouse 2). Classification hiérarchique descendante de Max Reinert
- **Alceste** : Logiciel commercial (depuis 1979, Max Reinert)
- **spaCy** (Python) : Tokenisation et traitement du français
- **Package themis** (R) : Analyse factorielle des correspondances

### Méthodes appliquées aux programmes
- **Analyse factorielle des correspondances (AFC)** : tradition française
- **Classification hiérarchique descendante (CHD)** : méthode Reinert (Alceste/Iramuteq)
- **Topic Modeling (LDA)** : modélisation thématique
- **Word Embeddings temporels** : changement sémantique (INRIA, 1958-1993)
- **Analyse de contenu quantitative** : méthode du Manifesto Project

---

## 6. Standards de catégorisation (APPROFONDI)

### 6.1 Manifesto Project (MARPOR/CMP) — Schéma de codage complet

**Présentation** : Plus ancien et plus vaste projet d'analyse systématique de programmes électoraux. Basé au WZB Berlin Social Science Center. 1 300+ partis, 67 pays, 5 continents, depuis 1945.
- Site : manifestoproject.wzb.eu
- Codebook v5 : manifesto-project.wzb.eu/coding_schemes/mp_v5
- Handbook v5 (PDF) : manifesto-project.wzb.eu/down/papers/handbook_2021_version_5.pdf

**Méthodologie de codage par quasi-phrases :**
- Unité d'analyse = **quasi-phrase** : expression verbale contenant exactement une idée ou un argument politique
- Une phrase naturelle = au minimum une quasi-phrase ; si plusieurs arguments, subdivisée
- Chaque quasi-phrase codée dans une seule des 56+ catégories (exclusivité mutuelle)
- Codage par codeurs humains formés, en double aveugle
- Résultat = pourcentage de quasi-phrases par catégorie / total quasi-phrases du manifeste

#### Domaine 1 : External Relations (Relations extérieures)
| Code | Catégorie |
|------|-----------|
| 101 | Foreign Special Relationships: Positive |
| 102 | Foreign Special Relationships: Negative |
| 103.1 | State Centred Anti-Imperialism |
| 103.2 | Foreign Financial Influence |
| 104 | Military: Positive |
| 105 | Military: Negative |
| 106 | Peace |
| 107 | Internationalism: Positive |
| 108 | European Community/Union or Latin America Integration: Positive |
| 109 | Internationalism: Negative |
| 110 | European Community/Union or Latin America Integration: Negative |

#### Domaine 2 : Freedom and Democracy (Liberté et démocratie)
| Code | Catégorie |
|------|-----------|
| 201.1 | Freedom |
| 201.2 | Human Rights |
| 202.1 | Democracy General: Positive |
| 202.2 | Democracy General: Negative |
| 202.3 | Representative Democracy: Positive |
| 202.4 | Direct Democracy: Positive |
| 203 | Constitutionalism: Positive |
| 204 | Constitutionalism: Negative |

#### Domaine 3 : Political System (Système politique)
| Code | Catégorie |
|------|-----------|
| 301 | Decentralisation: Positive |
| 302 | Centralisation: Positive |
| 303 | Governmental and Administrative Efficiency |
| 304 | Political Corruption |
| 305.1 | Political Authority: Party Competence |
| 305.2 | Political Authority: Personal Competence |
| 305.3 | Political Authority: Strong Government |
| 305.4 | Pre-Democratic Elites: Positive |
| 305.5 | Pre-Democratic Elites: Negative |
| 305.6 | Rehabilitation and Compensation |

#### Domaine 4 : Economy (Économie)
| Code | Catégorie |
|------|-----------|
| 401 | Free Market Economy |
| 402 | Incentives: Positive |
| 403 | Market Regulation |
| 404 | Economic Planning |
| 405 | Corporatism / Mixed Economy |
| 406 | Protectionism: Positive |
| 407 | Protectionism: Negative |
| 408 | Economic Goals |
| 409 | Keynesian Demand Management |
| 410 | Economic Growth: Positive |
| 411 | Technology and Infrastructure: Positive |
| 412 | Controlled Economy |
| 413 | Nationalisation |
| 414 | Economic Orthodoxy |
| 415 | Marxist Analysis: Positive |
| 416.1 | Anti-Growth Economy: Positive |
| 416.2 | Sustainability: Positive |

#### Domaine 5 : Welfare and Quality of Life (État-providence et qualité de vie)
| Code | Catégorie |
|------|-----------|
| 501 | Environmental Protection |
| 502 | Culture: Positive |
| 503 | Equality: Positive |
| 504 | Welfare State Expansion |
| 505 | Welfare State Limitation |
| 506 | Education Expansion |
| 507 | Education Limitation |

#### Domaine 6 : Fabric of Society (Tissu de la société)
| Code | Catégorie |
|------|-----------|
| 601.1 | National Way of Life: Positive (General) |
| 601.2 | National Way of Life: Positive (Immigration: Negative) |
| 602.1 | National Way of Life: Negative (General) |
| 602.2 | National Way of Life: Negative (Immigration: Positive) |
| 603 | Traditional Morality: Positive |
| 604 | Traditional Morality: Negative |
| 605.1 | Law and Order General: Positive |
| 605.2 | Law and Order General: Negative |
| 606.1 | Civic Mindedness: Positive (General) |
| 606.2 | Civic Mindedness: Positive (Bottom-Up Activism) |
| 607.1 | Multiculturalism: Positive (General) |
| 607.2 | Multiculturalism: Positive (Immigrant Integration: Diversity) |
| 607.3 | Multiculturalism: Positive (Indigenous Rights: Positive) |
| 608.1 | Multiculturalism: Negative (General) |
| 608.2 | Multiculturalism: Negative (Immigrant Integration: Assimilation) |
| 608.3 | Multiculturalism: Negative (Indigenous Rights: Negative) |

#### Domaine 7 : Social Groups (Groupes sociaux)
| Code | Catégorie |
|------|-----------|
| 701 | Labour Groups: Positive |
| 702 | Labour Groups: Negative |
| 703.1 | Agriculture and Farmers: Positive |
| 703.2 | Agriculture and Farmers: Negative |
| 704 | Middle Class and Professional Groups |
| 705 | Underprivileged Minority Groups |
| 706 | Non-economic Demographic Groups |

#### Code spécial
| Code | Catégorie |
|------|-----------|
| 000 | No meaningful category applies |

**Échelle RILE (Right-Left) :**
- Formule : RILE = (% catégories droite) − (% catégories gauche)
- 13 catégories de GAUCHE : 103, 105, 106, 107, 202, 403, 404, 406, 412, 413, 504, 506, 701
- 13 catégories de DROITE : 104, 201, 203, 305, 401, 402, 407, 414, 505, 601, 603, 605, 606
- 30 catégories restantes = neutres

**Critiques et limites :**
1. Validité transnationale : définition fixe gauche/droite pour tous les pays, alors que le contenu varie culturellement
2. Biais centriste : la masse de quasi-phrases neutres tire les estimations vers le centre
3. Volatilité temporelle : les manifestes sont des documents conjoncturels ("leapfrogging" idéologique paradoxal)
4. Fiabilité inter-codeurs imparfaite
5. Réductionnisme : l'échelle RILE ignore 30 des 56 catégories
6. Saillance vs. position : mesure ce dont les partis parlent (saillance), pas ce qu'ils proposent (position directionnelle)

**Données France :**
- Noyau historique du projet (démocraties d'Europe occidentale)
- Couverture : toutes les élections législatives depuis 1945/1946
- Partis codés : PCF, SFIO/PS, Radicaux, MRP/UDF/UDI, RPR/UMP/LR, FN/RN, LREM/Renaissance, EELV, LFI, etc.
- Accès via API et package R `manifestoR`

---

### 6.2 Chapel Hill Expert Survey (CHES) — Axes détaillés

**Présentation** : Enquête auprès d'experts en science politique, depuis 1999, Université de Caroline du Nord. Vague 2024 : 609 politologues, 279 partis, 31 pays.
- Site : chesdata.eu
- Codebook 2024 : ches-chapelhillexpertsurvey.squarespace.com/s/CHES-2024-Codebook.pdf

#### Dimensions idéologiques générales (échelles 0-10)
| Variable | Description | Échelle |
|----------|-------------|---------|
| **lrgen** | Position idéologique générale gauche-droite | 0 (extrême gauche) — 10 (extrême droite) |
| **lrecon** | Position sur l'axe économique | 0 (gauche : intervention, régulation, État-providence) — 10 (droite : marché libre, dérégulation) |
| **galtan** | Axe culturel GAL-TAN | 0 (Green/Alternative/Libertarian) — 10 (Traditional/Authoritarian/Nationalist) |

#### Intégration européenne
| Variable | Description | Échelle |
|----------|-------------|---------|
| **eu_position** | Position générale sur l'intégration européenne | 1 (fortement opposé) — 7 (fortement favorable) |
| **eu_salience** | Saillance relative de l'UE | 0 (pas important) — 10 (extrêmement important) |
| **eu_dissent** | Degré de dissensus interne sur l'UE | 0 (consensus total) — 10 (désaccord extrême) |
| **eu_blur** | Degré d'ambiguïté délibérée sur l'UE | Variable qualitative |

#### Positions sur les politiques publiques (échelles 0-10 ou 1-7)
| Variable | Description |
|----------|-------------|
| **immigrate_policy** | Position sur la politique d'immigration |
| **redistribute** | Position sur la redistribution des riches vers les pauvres |
| **spending_vs_taxes** | Améliorer les services publics vs. réduire les impôts |
| **deregulation** | Position sur la dérégulation des marchés |
| **environment** | Protection de l'environnement vs. croissance économique |
| **sociallifestyle** | Questions de société (avortement, mariage homosexuel, euthanasie) |
| **religious_principles** | Importance des principes religieux en politique |
| **ethnic_minorities** | Position sur les droits des minorités ethniques |
| **nationalism** | Cosmopolitisme vs. nationalisme |
| **urban_rural** | Intérêts urbains vs. ruraux |
| **regions** | Position sur la décentralisation |
| **antielite_salience** | Importance de la rhétorique anti-establishment |
| **people_vs_elite** | Démocratie directe vs. représentative |
| **corrupt_salience** | Importance de la lutte contre la corruption |

#### Nouveautés 2024
| Variable | Description |
|----------|-------------|
| **judicial_independence** | Indépendance judiciaire (0 = indépendant, 10 = gouvernement contrôle) |
| **checks_balances** | Soutien aux contre-pouvoirs institutionnels |

**Méthodologie** : enquête en ligne, ~20 experts par pays, moyenne des estimations = position du parti, écart-type = désaccord entre experts.

**Partis français couverts** : PS, PCF, LR/UMP/RPR, FN/RN, UDF/MoDem, EELV, LFI, Renaissance/LREM, etc. Données depuis 1999.

---

### 6.3 Nuances politiques du Ministère de l'Intérieur — Liste complète

**Principe** : Le "nuançage" est un dispositif par lequel les services préfectoraux attribuent à chaque candidat une nuance politique pour la présentation des résultats. Distincte de l'étiquette librement choisie par le candidat.

#### 26 nuances (Municipales 2026) regroupées en 6 blocs

**Bloc EXTRÊME GAUCHE**
| Code | Parti/Sensibilité |
|------|-------------------|
| EXG | Extrême gauche (NPA, LO, etc.) |
| FI | La France insoumise |

**Bloc GAUCHE**
| Code | Parti/Sensibilité |
|------|-------------------|
| COM | Parti communiste français |
| SOC | Parti socialiste |
| GEN | Génération.s |
| PLP | Place Publique |
| RDG | Parti radical de gauche |
| VEC | Les Écologistes |
| DVG | Divers gauche |

**Bloc DIVERS / CENTRE**
| Code | Parti/Sensibilité |
|------|-------------------|
| ECO | Écologiste (hors Les Écologistes) |
| REG | Régionalistes |
| ANM | Animaliste |
| DIV | Divers |
| REN | Renaissance |
| MDM | Mouvement démocrate (MoDem) |
| HOR | Horizons |
| PR | Parti radical |
| DVC | Divers centre |
| UDI | Union des Démocrates et Indépendants |

**Bloc DROITE**
| Code | Parti/Sensibilité |
|------|-------------------|
| LR | Les Républicains |
| DVD | Divers droite |
| DSV | Droite souverainiste |
| UDR | Union des droites pour la République |

**Bloc EXTRÊME DROITE**
| Code | Parti/Sensibilité |
|------|-------------------|
| RN | Rassemblement national |
| REC | Reconquête |
| EXD | Extrême droite |

**Nuances d'alliance (listes)** : LUG (Union de la gauche), LUD (Union de la droite), etc.

**Critères d'attribution** : investiture officielle, alliances de bloc, nuance de "sensibilité" discrétionnaire du préfet. Seuil : communes de 3 500+ habitants.

**Controverses :**
1. LFI classée extrême gauche pour la première fois en 2026 (recours CE rejeté le 27/02/2026)
2. UDR a également contesté sa classification
3. Critique du "nuançage d'office" par les maires de petites communes
4. Pouvoir discrétionnaire et opacité de l'attribution par les préfets

Sources : Circulaire Légifrance, Conseil d'État, vie-publique.fr

---

### 6.4 Taxonomies thématiques des politiques publiques

#### CAP — Comparative Agendas Project
Réseau international classifiant les activités politiques (lois, questions parlementaires, articles de presse, sondages, budgets) selon un schéma universel. 21 grands thèmes et 200+ sous-thèmes.

| Code | Thème |
|------|-------|
| 1 | Macroeconomics |
| 2 | Civil Rights, Minority Issues, Civil Liberties |
| 3 | Health |
| 4 | Agriculture |
| 5 | Labor, Employment |
| 6 | Education |
| 7 | Environment |
| 8 | Energy |
| 9 | Immigration |
| 10 | Transportation |
| 12 | Law, Crime, Family Issues |
| 13 | Social Welfare |
| 14 | Housing and Community Development |
| 15 | Domestic Commerce, Banking, Finance |
| 16 | Defense |
| 17 | Technology, Science, Communications |
| 18 | Foreign Trade |
| 19 | International Affairs, Foreign Aid |
| 20 | Government Operations |
| 21 | Public Lands, Water Management, Territorial Issues |
| 23 | Culture |

Exemple de sous-thèmes (Macroeconomics) : 100 General, 101 Interest Rates, 103 Unemployment Rate, 104 Monetary Policy, 105 National Budget, 107 Tax Code, 108 Industrial Policy, 110 Price Control.

Le CAP France est hébergé à Sciences Po et couvre les lois, questions au gouvernement, budgets et articles de presse depuis les années 1970.

Site : comparativeagendas.net — Codebook : comparativeagendas.net/pages/master-codebook

#### COFOG — Classification of the Functions of Government (ONU/OCDE)
Publiée en 1980, révisée en 1999. 3 niveaux : Divisions (2 chiffres), Groupes (3 chiffres), Classes (4 chiffres).

| Division | Intitulé | Groupes |
|----------|----------|---------|
| 01 | General Public Services | Organes exécutifs/législatifs, aide étrangère, services généraux, recherche fondamentale, dette publique, transferts entre niveaux |
| 02 | Defence | Défense militaire, défense civile, aide militaire étrangère |
| 03 | Public Order and Safety | Police, pompiers, tribunaux, prisons |
| 04 | Economic Affairs | Affaires éco. générales, agriculture, énergie, mines/industrie, transports, communication |
| 05 | Environmental Protection | Gestion des déchets, eaux usées, pollution, biodiversité |
| 06 | Housing and Community Amenities | Logement, développement communautaire, eau, éclairage public |
| 07 | Health | Produits médicaux, services ambulatoires, hôpitaux, santé publique |
| 08 | Recreation, Culture and Religion | Sport/loisirs, culture, médias, communautés religieuses |
| 09 | Education | Pré-primaire/primaire, secondaire, post-secondaire, tertiaire, services annexes |
| 10 | Social Protection | Maladie/invalidité, vieillesse, survivants, famille/enfants, chômage, logement, exclusion |

Source : unstats.un.org/unsd/classifications/Family/Detail/4

#### LOLF — Nomenclature budgétaire française
Loi organique relative aux lois de finances du 1er août 2001, en vigueur pour le PLF 2006.

3 niveaux :
1. **Mission** : politique publique de l'État, unité de vote du Parlement, peut être interministérielle (~32 missions)
2. **Programme** : cadre de mise en œuvre, enveloppe limitative de crédits, un seul ministère, objectifs et indicateurs de performance (~130 programmes)
3. **Action** : destination des crédits (informatif uniquement)

Source : performance-publique.budget.gouv.fr

#### Thèmes de vie-publique.fr
10 thèmes principaux :
1. Institutions de la République
2. Citoyenneté
3. Collectivités territoriales
4. Administration
5. Justice
6. Finances publiques
7. Protection sociale
8. Questions économiques et sociales
9. Relations internationales
10. Union européenne

---

### 6.5 Systèmes de positionnement multi-axes

#### PolitiScales — 8 axes (117 questions)
Créé par le collectif français "Radicalisé.e.s sur Internet", inspiré de 8values.

| Axe | Pôle gauche | Pôle droit |
|-----|------------|------------|
| 1 | **Constructivisme** (l'individu se construit par son environnement, caractéristiques acquises) | **Essentialisme** (l'individu est par nature ce qu'il est, caractéristiques innées) |
| 2 | **Justice réhabilitative** (réinsertion des délinquants) | **Justice punitive** (dissuasion par la punition) |
| 3 | **Progressisme** (évolution culturelle, changement social) | **Conservatisme** (traditions, valeurs établies) |
| 4 | **Internationalisme** (coopération, abolition des frontières) | **Nationalisme** (primauté du pays et de ses habitants) |
| 5 | **Communisme** (propriété publique des moyens de production) | **Capitalisme** (propriété privée des moyens de production) |
| 6 | **Régulationnisme** (intervention de l'État dans l'économie) | **Laissez-faire** (libre marché sans intervention) |
| 7 | **Écologisme** (protection de l'environnement prioritaire) | **Productivisme** (besoins humains et production prioritaires) |
| 8 | **Révolution** (action directe, hors légalité, remplacement radical) | **Réformisme** (action légale, réforme progressive) |

5 niveaux de réponse par affirmation. Résultats en barres horizontales avec pourcentages.
Code source : github.com/PhieF/politiscales

#### Politest — 3 axes
Test français en ligne depuis 2005, positionnement gauche-droite tridimensionnel.

| Axe | Pôle gauche | Pôle droit |
|-----|------------|------------|
| 1 — Économique et social | Interventionnisme | Libéralisme économique |
| 2 — Modes de vie | Progressisme sociétal (avortement, mariage pour tous, euthanasie, cannabis) | Conservatisme sociétal |
| 3 — Identité et responsabilité | Ouverture (droits des étrangers, diversité) | Autorité (identité nationale, sécurité) |

12 thèmes, ~4 questions par axe. Taux de satisfaction ~85%.
Site : politest.fr

#### 8values — 4 axes (70 affirmations)

| Axe | Pôles |
|-----|-------|
| Économique | Equality (redistribution, socialisme) vs. Markets (croissance, faibles impôts) |
| Diplomatique | Nation (patriotisme, armée forte) vs. Globe (coopération internationale) |
| Civil | Liberty (démocratie, vie privée) vs. Authority (pouvoir étatique fort, surveillance) |
| Sociétal | Tradition (valeurs traditionnelles, religion) vs. Progress (changement social, laïcité, écologie) |

Site : 8values.github.io

#### 9Axes — 9 axes bidirectionnels

| Axe | Pôles |
|-----|-------|
| 1 | Federal vs. Unitary |
| 2 | Democratic vs. Authoritarian |
| 3 | Globalist vs. Isolationist |
| 4 | Militarist vs. Pacifist |
| 5 | Security vs. Freedom |
| 6 | Equality vs. Markets |
| 7 | Secular vs. Religious |
| 8 | Progressive vs. Traditional |
| 9 | Assimilationist vs. Multiculturalist |

Site : 9axes.github.io

#### 12Axes — 12 axes en 4 catégories (216 ou 45 questions)

| Catégorie | Axes |
|-----------|------|
| Governmental | Federal/Unitary, Democratic/Autocratic, Security/Freedom |
| Diplomatic | Nationalism/Internationalism, Militarist/Pacifist, Assimilationist/Multiculturalist |
| Economic | Collectivize/Privatize, Planned/Laissez-Faire, Isolationism/Globalism |
| Societal | Irreligious/Religious, Progressive/Traditional, Acceleration/Bioconservative |

Site : politicaltests.github.io/12axes

#### Political Compass — 2 axes (62 propositions)
- Axe horizontal : **Economic Left-Right** (interventionnisme vs. libre marché)
- Axe vertical : **Social Authoritarian-Libertarian**

Fondé sur les travaux de Hans Eysenck (1954). Critique : biais libertarien de gauche attesté.
Site : politicalcompass.org

#### Nolan Chart (1969) — 2 axes
Créé par David Nolan (fondateur du Parti libertarien américain).
- Axe X : Liberté économique (0-100)
- Axe Y : Liberté personnelle (0-100)

Losange avec 5 zones : Libertarian, Authoritarian, Left/Liberal, Right/Conservative, Centrist.

#### Diagramme de Pournelle (1963) — 2 axes
- Axe X : Étatisme (de l'État comme mal ultime à gauche, au culte de l'État à droite)
- Axe Y : Rationalisme (croyance en la possibilité de progrès social planifié par la raison)

4 quadrants distincts du modèle gauche-droite classique.

#### Inglehart–Welzel Cultural Map (1997) — 2 axes
Basée sur les World Values Survey (WVS) et European Values Study (EVS).
- Axe vertical : Traditional vs. Secular-Rational values
- Axe horizontal : Survival vs. Self-Expression values

Explique 70%+ de la variance transnationale. Les pays sont positionnés selon les valeurs de leur population.

---

### 6.6 Catégorisations spécifiques françaises

#### Institut Montaigne — 14 thèmes
Pour la présidentielle 2022 et les municipales 2026 :
1. Compétitivité et Économie | 2. Éducation | 3. Emploi | 4. Environnement | 5. Europe et International | 6. Immigration | 7. Institutions | 8. Pouvoir d'achat | 9. Retraites | 10. Santé | 11. Sécurité et Justice | 12. Société | 13. Solidarités | 14. Territoires

#### IFRAP — 13 thèmes
Pour les législatives 2024 :
1. Immigration | 2. Sécurité intérieure & Justice | 3. Défense | 4. Finances publiques | 5. Politique familiale | 6. Énergies | 7. Logement | 8. Retraites | 9. Pouvoir d'achat & salaire | 10. Agriculture | 11. Santé | 12. Éducation | 13. Autres

#### Nos Services Publics — 9 thèmes (31 questions)
Comparateur par le collectif de fonctionnaires (législatives 2024) :
1. Éducation (5q) | 2. Santé (4q) | 3. Énergie (3q) | 4. Logement (4q) | 5. Transports (4q) | 6. Justice (2q) | 7. Sécurité (3q) | 8. Fiscalité (4q) | 9. Autonomie (2q)

Site : comparateur.nosservicespublics.fr

#### Baromètres des préoccupations (IPSOS, septembre 2025)
1. Délinquance/violence (36%) | 2. Inflation (30%) | 3. Hausse des impôts (28%) | 4. Pauvreté et inégalités (27%) | 5. Immigration (27%) | 6. Système de santé (26%) | 7. Changement climatique (18%) | 8. Conflits internationaux (15%) | 9. Chômage (11%)

#### Répartition des compétences par échelon territorial

| Domaine | Commune | Département | Région | État |
|---------|---------|-------------|--------|------|
| Éducation | Écoles primaires | Collèges | Lycées | Universités, programmes |
| Voirie | Voies communales | Routes départementales | — | Routes nationales, autoroutes |
| Action sociale | CCAS | RSA, APA, ASE, PMI | — | Politique nationale |
| Dév. économique | — | — | SRDEII | Politique nationale |
| Transports | Urbains | Interurbains (→ région) | TER, non urbains | SNCF national, aviation |
| Aménagement | PLU, permis de construire | — | SRADDET | Grandes infrastructures |
| Culture/sport/tourisme | Partagée | Partagée | Partagée | Musées nationaux |
| Sécurité | Police municipale | — | — | Police/Gendarmerie nationales |
| Urbanisme | PLU | — | — | Lois nationales |

Sources : vie-publique.fr, collectivites-locales.gouv.fr

---

### 6.7 Standards émergents / IA

#### Classification automatique par NLP
- **CAP Babel Machine** : système open source basé sur XLM-RoBERTa (270M paramètres, 100 langues), classifie automatiquement les textes politiques dans les catégories du CAP. Performance : weighted macro F1 > 0.75 pour 24 cas sur 41 testés. Site : manifestobabel.poltextlab.com
- **BERT/Transformers** : analyse de similarité de manifestes, topic modeling, analyse de sentiment
- **Political text scaling** : score sur échelle prédéfinie basé sur un corpus
- **Positionnement par LLM** : méthodes "Ask and Average" utilisant de grands modèles de langage

#### Ontologies sémantiques pour la politique
- **POWER** (Politics Ontology for Web Entity Retrieval) : suivi des politiciens et élections dans les médias
- **d2kg-OWL** : graphe de connaissances des décisions gouvernementales (vocabulaires UE : ELI, DCAT, SKOS)
- **LegisIntel** (Legislative Intelligence) : outils d'IA sémantique pour les parlements
- **PRoles** (Political Roles Ontology) : rôles politiques dans les archives

#### Données ouvertes structurées
- **Manifesto Corpus** : >1 800 documents machine-readable, codés à la quasi-phrase, disponible via API et HuggingFace
- **Party Facts** : base reliant les identifiants de partis entre jeux de données (MARPOR, CHES, ParlGov, etc.)
- **PolData** (GitHub - erikgahner) : répertoire de jeux de données politiques structurés
- **data.europa.eu** : données ouvertes européennes sur la politique

---

### 6.8 Synthèse comparative des systèmes

| Système | Type | Dimensions | Granularité | Couverture | Usage principal |
|---------|------|------------|-------------|------------|-----------------|
| MARPOR | Analyse de contenu | 7 domaines, 56+ catégories | Quasi-phrase | 67 pays, depuis 1945 | Recherche académique |
| CHES | Enquête d'experts | ~20 variables continues | Parti entier | 31 pays européens, depuis 1999 | Recherche comparative |
| Nuances MI | Classif. administrative | 26 nuances, 6 blocs | Candidat individuel | France uniquement | Présentation résultats électoraux |
| CAP | Codage thématique | 21 thèmes, 200+ sous-thèmes | Unité textuelle | ~20 pays, depuis 1970s | Étude des agendas |
| COFOG | Classif. fonctionnelle | 10 divisions, 69 groupes | Dépense publique | International (ONU/OCDE) | Comparaison budgétaire |
| PolitiScales | Quiz en ligne | 8 axes bipolaires | Individu | International (francophone) | Auto-positionnement citoyen |
| 8values | Quiz en ligne | 4 axes bipolaires | Individu | International (anglophone) | Auto-positionnement citoyen |
| Political Compass | Quiz en ligne | 2 axes | Individu | International (anglophone) | Vulgarisation |
| Inglehart-Welzel | Enquête population | 2 dimensions culturelles | Pays | Mondial (WVS) | Recherche sociologique |

---

## 7. Limites légales et réglementaires

### Code électoral — Propagande électorale
- **Articles L47A à L52-3** du Code électoral
- **Période de 6 mois** (Art. L52-1) : interdiction des campagnes de promotion publicitaire des réalisations des collectivités
- **Campagne officielle** : ouverte le 2e lundi précédant le scrutin, close la veille à 0h
- **Interdictions le jour du scrutin** : aucune distribution de bulletins, tracts, professions de foi
- **Commission de propagande** : contrôle la conformité des documents
- **Obligation FALC** depuis le 1er janvier 2022

### Période de réserve
- Réserve préfectorale dans les communications publiques
- Communication institutionnelle des collectivités : doit respecter neutralité, antériorité, régularité et identité

### Financement et comptes
- **CNCCFP** : contrôle des comptes de campagne (toutes élections depuis 2014) et des comptes des partis

---

## 8. Projets similaires à l'international

### Voting Advice Applications (VAA)
- **EU Profiler** (2009) : Premier VAA pan-européen (EUI + Smartvote)
- **euandi** (2014, 2019, 2024) : Successeur d'EU Profiler, 1,28M utilisateurs
- **VoteMatch Europe** : Comparaison multi-pays UE
- **Vote Compass** (Vox Pop Labs) : USA, Canada, Australie, NZ, France, Allemagne
- **StemWijzer / Kieskompas** (Pays-Bas) : Pionniers du concept VAA
- **Smartvote** (Suisse) : Modèle de référence
- **Wahl-O-Mat** (Allemagne) : VAA de la Bundeszentrale für politische Bildung

### Groupes de recherche
- **ECPR Standing Group on VAAs** : groupe de recherche académique
- **Garzia (2016)** : State of the Art and Future Directions — revue de littérature

---

## 9. Lacunes majeures identifiées

1. **Pas de base de données structurée des propositions** : les professions de foi sont des PDF, non des données exploitables programmatiquement
2. **Aucun outil multi-échelles** couvrant simultanément toutes les échelles électorales
3. **Intercommunalité quasi absente** des sources
4. **Sénatoriales** très peu visibles (scrutin indirect)
5. **Petites communes** exclues de la propagande officielle
6. **Pas de standard unifié** pour structurer les propositions politiques
7. **Historique fragmentaire** : archives numérisées couvrant partiellement les élections passées (Archelec : 1958-2012)

---

## Sources principales

- programme-candidats.interieur.gouv.fr
- data.gouv.fr/pages/donnees-des-elections
- data.assemblee-nationale.fr
- data.senat.fr
- nosdeputes.fr / nossenateurs.fr (Regards Citoyens)
- datan.fr
- dataclic.fr/elections
- manifestoproject.wzb.eu (Manifesto Project / MARPOR)
- chesdata.eu (Chapel Hill Expert Survey)
- sciencespo.fr/cevipof
- archelec4.hypotheses.org
- voxe.org
- institutmontaigne.org
- ifrap.org
- cnccfp.fr
- hatvp.fr/open-data
- legifrance.gouv.fr (Code électoral)
- vie-publique.fr
- euandi.eu
- politiscales.party
- politest.fr
